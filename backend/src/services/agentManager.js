// Agent Manager - auto-starts the Python LiveKit agent as a child process.
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let agentProcess = null;
let restartCount = 0;
const MAX_RESTARTS = 5;
const RESTART_DELAY = 3000;

const agentStatus = {
  running: false,
  pid: null,
  agentDir: null,
  pythonCommand: null,
  lastStartedAt: null,
  lastExit: null,
  lastError: null,
  restartCount: 0,
};

function resolveAgentDir() {
  const candidates = [
    process.env.AGENT_DIR,
    path.resolve(process.cwd(), 'agent'),
    path.resolve(process.cwd(), '..', 'agent'),
    path.resolve(__dirname, '..', '..', '..', 'agent'),
    '/app/agent',
    '/agent',
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(path.join(candidate, 'app.py'))) || null;
}

function getPythonCommand() {
  return process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
}

export function startAgent() {
  if (agentProcess) {
    console.log('Agent already running (PID:', agentProcess.pid, ')');
    return;
  }

  const agentDir = resolveAgentDir();
  if (!agentDir) {
    const message = 'Could not find LiveKit agent app.py. Set AGENT_DIR or copy the agent folder into the container.';
    agentStatus.running = false;
    agentStatus.pid = null;
    agentStatus.agentDir = null;
    agentStatus.lastError = message;
    console.error(message);
    return;
  }

  const agentScript = path.join(agentDir, 'app.py');
  const pythonCommand = getPythonCommand();
  agentStatus.agentDir = agentDir;
  agentStatus.pythonCommand = pythonCommand;
  agentStatus.lastStartedAt = new Date().toISOString();
  agentStatus.lastError = null;

  console.log(`Starting LiveKit Agent from ${agentDir}...`);

  try {
    agentProcess = spawn(pythonCommand, [agentScript, 'dev'], {
      cwd: agentDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
      shell: false,
    });

    agentProcess.stdout.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) console.log(`[Agent] ${msg}`);
    });

    agentProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) console.error(`[Agent] ${msg}`);
    });

    agentProcess.on('error', (err) => {
      agentStatus.running = false;
      agentStatus.pid = null;
      agentStatus.lastError = err.message;
      console.error('Failed to start agent process:', err.message);
      agentProcess = null;
    });

    agentProcess.on('exit', (code, signal) => {
      const pid = agentProcess?.pid;
      agentProcess = null;
      agentStatus.running = false;
      agentStatus.pid = null;
      agentStatus.lastExit = {
        code,
        signal,
        at: new Date().toISOString(),
      };

      if (signal === 'SIGTERM' || signal === 'SIGINT') {
        console.log(`Agent (PID: ${pid}) stopped gracefully.`);
        return;
      }

      console.warn(`Agent (PID: ${pid}) exited with code ${code}. Restart #${restartCount + 1}`);

      if (restartCount < MAX_RESTARTS) {
        restartCount++;
        agentStatus.restartCount = restartCount;
        setTimeout(() => {
          console.log(`Restarting agent (attempt ${restartCount}/${MAX_RESTARTS})...`);
          startAgent();
        }, RESTART_DELAY);
      } else {
        console.error(`Agent exceeded max restarts (${MAX_RESTARTS}). Not restarting.`);
      }
    });

    console.log(`Agent process started (PID: ${agentProcess.pid})`);
    agentStatus.running = true;
    agentStatus.pid = agentProcess.pid;
    restartCount = 0;
    agentStatus.restartCount = restartCount;
  } catch (err) {
    agentStatus.running = false;
    agentStatus.pid = null;
    agentStatus.lastError = err.message;
    console.error('Could not spawn agent process:', err.message);
    agentProcess = null;
  }
}

export function stopAgent() {
  if (agentProcess) {
    console.log(`Stopping agent (PID: ${agentProcess.pid})...`);
    agentProcess.kill('SIGTERM');
    agentProcess = null;
    agentStatus.running = false;
    agentStatus.pid = null;
  }
}

export function isAgentRunning() {
  return agentProcess !== null && !agentProcess.killed;
}

export function getAgentStatus() {
  return {
    ...agentStatus,
    running: isAgentRunning(),
    pid: agentProcess?.pid || null,
  };
}

process.on('exit', stopAgent);
process.on('SIGINT', () => { stopAgent(); process.exit(0); });
process.on('SIGTERM', () => { stopAgent(); process.exit(0); });

export default { startAgent, stopAgent, isAgentRunning, getAgentStatus };
