# IntervuAI LiveKit Agent - FIXED VERSION
# Real-time AI interviewer using LiveKit, Cerebras, and Deepgram

import os
import sys
import json
import asyncio
import aiohttp
from livekit import agents, rtc
from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions
from livekit.plugins import openai, silero, deepgram
from dotenv import load_dotenv
load_dotenv()

def check_environment_vars():
    required_vars = [
        "LIVEKIT_URL",
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET",
        "DEEPGRAM_API_KEY",
        "CEREBRAS_API_KEY",
    ]
    missing = [v for v in required_vars if not os.environ.get(v)]
    if missing:
        print("Missing required environment variables:", file=sys.stderr)
        for v in missing:
            print(f"  - {v}", file=sys.stderr)
        sys.exit(1)
    print("All required API keys loaded.")

# [QUESTION_BANKS and INTERVIEWER_PERSONAS remain exactly the same - keeping them for brevity]
QUESTION_BANKS = {
    # ... your existing QUESTION_BANKS dict ...
}

INTERVIEWER_PERSONAS = {
    # ... your existing INTERVIEWER_PERSONAS dict ...
}

def get_questions_for_interview(interview_type, difficulty_level):
    """Get the question bank for the given type and level."""
    type_questions = QUESTION_BANKS.get(interview_type, QUESTION_BANKS["fullstack"])
    return type_questions.get(difficulty_level, type_questions["intermediate"])


class InterviewerAgent(Agent):
    def __init__(self, interview_type="fullstack", difficulty_level="intermediate",
                 interview_id=None, user_name="Candidate", max_questions=8,
                 resume_text="", job_description=""):
        self.interview_type = interview_type
        self.difficulty_level = difficulty_level
        self.interview_id = interview_id
        self.user_name = user_name
        self.conversation_log = []
        self.question_count = 0
        self.max_questions = max_questions

        questions = get_questions_for_interview(interview_type, difficulty_level)
        questions_text = json.dumps(questions, indent=2)

        llm = openai.LLM.with_cerebras(model="llama3.1-8b")
        stt = deepgram.STT()
        tts = deepgram.TTS()
        vad = silero.VAD.load()

        # Build context sections for resume and job description
        resume_section = ""
        if resume_text:
            resume_section = f"""

CANDIDATE'S RESUME:
{resume_text}

RESUME-AWARE INSTRUCTIONS:
- You have the candidate's resume above. Use it to personalize the interview significantly.
- Reference specific projects, companies, skills, and experiences from their resume.
- Ask targeted questions about technologies they have listed (e.g., "I see you worked with Kubernetes at Company X — tell me about that").
- Probe gaps or interesting transitions in their career timeline.
- Validate claims by asking for concrete examples and depth on listed skills.
- Compare their stated experience level with their resume to calibrate question difficulty.
- Do NOT read the resume back to them verbatim — use it as context to drive natural, personalized questions."""

        jd_section = ""
        if job_description:
            jd_section = f"""

TARGET JOB DESCRIPTION:
{job_description}

JOB-FOCUSED INSTRUCTIONS:
- The candidate is preparing for the role described above. Tailor your questions to match the job requirements.
- Prioritize topics and technologies mentioned in the job description.
- Ask scenario-based questions relevant to the role's day-to-day responsibilities.
- If the JD mentions specific tools, frameworks, or methodologies, include questions about them.
- Assess the candidate's fit for the role by probing relevant soft skills (teamwork, leadership, communication) mentioned in the JD.
- Frame questions in the context of the role (e.g., "In this role you'd be leading a team of 5 — how would you handle...")."""

        combined_context = ""
        if resume_text and job_description:
            combined_context = """

RESUME + JOB DESCRIPTION CROSS-ANALYSIS:
- You have BOTH the candidate's resume and the target job description. This is a powerful combination.
- Identify skill gaps: Where the JD requires skills not evident in the resume, ask questions to discover hidden competencies.
- Identify strengths: Where the resume strongly matches JD requirements, ask deeper questions to confirm expertise depth.
- Assess transferability: For experiences not directly matching the JD, explore how those skills translate to the target role.
- Focus 60% of questions on JD-relevant topics, 30% on resume-specific deep-dives, and 10% on general behavioral questions."""

        # Get field-specific persona
        persona_data = INTERVIEWER_PERSONAS.get(interview_type, INTERVIEWER_PERSONAS["fullstack"])

        instructions = f"""You are {persona_data['persona']}, conducting a technical interview for IntervuAI. You are NOT a generic AI — you are a domain expert with deep knowledge in {interview_type.replace('_', ' ')} who has real opinions and can challenge candidates meaningfully.

INTERVIEW DETAILS:
- Interview Type: {interview_type.replace('_', ' ').replace('-', ' ').title()}
- Difficulty Level: {difficulty_level.title()}
- Candidate Name: {user_name}

YOUR INTERVIEWER PERSONALITY:
- You have strong opinions about best practices in your field. Share them when relevant.
- You occasionally share brief anecdotes from "your experience" to make the conversation feel real.
- You push back respectfully when an answer is vague or incorrect — don't just accept everything.
- You sound impressed when a candidate gives a genuinely strong answer.
- You're evaluating: {persona_data['focus']}

WHAT YOU'RE LOOKING FOR:
{persona_data['eval_style']}

RED FLAGS TO PROBE:
{persona_data['red_flags']}

TECHNICAL QUESTION BANK (Use as inspiration, not a script — adapt based on the conversation):
{questions_text}
{resume_section}{jd_section}{combined_context}

INTERVIEW FLOW & RULES:
1. OPENING (Question 1): Warm greeting. Introduce yourself briefly with your role. Ask {user_name} to tell you about themselves — what they've been working on recently and what excites them technically.
2. EXPERIENCE DEEP-DIVE (Questions 2-3): Based on what they share, dig into THEIR specific experience. Ask about a project they mentioned. What was the hardest part? What would they do differently? This must feel personalized, not scripted.
3. ADAPTIVE DIFFICULTY: If they answer confidently and correctly, make the next question harder. If they struggle, offer a simpler angle or hint and note it. Never keep asking the same difficulty if the candidate is clearly above or below it.
4. TECHNICAL CORE (Questions 4-{self.max_questions - 2}): Use the question bank as a guide but adapt to the conversation. Create natural bridges like "That reminds me of something I wanted to ask about..." or "Since you mentioned X, how do you handle Y?"
5. CHALLENGE QUESTION (Question {self.max_questions - 1}): Give them one genuinely difficult scenario or design question. Let them think through it. Ask follow-up probing questions on their approach.
6. BEHAVIORAL + WRAP-UP (Question {self.max_questions}): Ask one behavioral question relevant to the role, then conclude warmly. Mention something specific you were impressed by.

CONVERSATIONAL RULES:
- React to every answer before asking the next question. Say things like "That's a really solid approach," or "Hmm, that's one way to do it — have you considered...?" or "I've seen teams struggle with exactly that."
- When a candidate gives a surface-level answer, probe deeper: "Can you walk me through that in more detail?" or "What trade-offs did you consider?"
- When a candidate gives a wrong or weak answer, gently challenge: "That's interesting — though I've seen some issues with that approach. What do you think about...?"
- NEVER just read questions sequentially. The conversation MUST flow naturally.
- Ask exactly ONE question at a time. Ask a total of {self.max_questions} questions.

SPEECH & FORMAT CONSTRAINTS:
- You are speaking via TTS. Absolutely NO markdown, bullet points, numbered lists, or code blocks.
- Keep each response under 25 seconds of speaking time — be concise and conversational.
- Use natural speech patterns — contractions, occasional pauses indicated by commas, and conversational tone.

CONCLUSION:
- Wrap up by mentioning one specific strength and one area to explore further.
- Tell them their detailed feedback with scores will be available on their dashboard shortly."""

        super().__init__(
            instructions=instructions,
            stt=stt, llm=llm, tts=tts, vad=vad
        )

    async def on_enter(self):
        self.session.generate_reply(
            user_input=f"Start the interview. Give a short friendly greeting, introduce yourself as the AI interviewer from IntervuAI for a {self.difficulty_level} level {self.interview_type} interview, and ask {self.user_name} to introduce themselves."
        )


async def save_interview_results(interview_id, transcript_data, backend_url, api_key):
    """Post interview results back to the Node.js backend."""
    if not interview_id or not backend_url:
        print("❌ No interview ID or backend URL, skipping save.")
        return

    url = f"{backend_url}/api/interview/{interview_id}/save-live-results"
    headers = {
        "Content-Type": "application/json",
        "x-agent-api-key": api_key or "",
    }

    print(f"📤 Sending transcript to backend: {url}")
    print(f"📊 Transcript entries: {len(transcript_data.get('transcript', []))}")

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=transcript_data, headers=headers, timeout=aiohttp.ClientTimeout(total=120)) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    print(f"✅ Interview results saved for {interview_id}")
                    print(f"✅ Backend response: {result}")
                else:
                    text = await resp.text()
                    print(f"❌ Failed to save results: {resp.status} - {text}")
    except asyncio.TimeoutError:
        print(f"❌ Timeout saving interview results (backend took >120s)")
    except Exception as e:
        print(f"❌ Error saving interview results: {e}")


async def entrypoint(ctx: JobContext):
    await ctx.connect()

    room = ctx.room
    metadata = {}

    # 1) Try room-level metadata first
    try:
        if room.metadata:
            metadata = json.loads(room.metadata)
    except (json.JSONDecodeError, TypeError):
        pass

    # 2) Fallback: read participant metadata (backend sets it on the user token)
    if not metadata:
        for participant in room.remote_participants.values():
            try:
                if participant.metadata:
                    metadata = json.loads(participant.metadata)
                    break
            except (json.JSONDecodeError, TypeError):
                continue

    # 3) If still empty, wait briefly for a participant to connect with metadata
    if not metadata:
        for _ in range(30):  # up to 15 seconds
            await asyncio.sleep(0.5)
            for participant in room.remote_participants.values():
                try:
                    if participant.metadata:
                        metadata = json.loads(participant.metadata)
                        break
                except (json.JSONDecodeError, TypeError):
                    continue
            if metadata:
                break

    interview_type = metadata.get("interviewType", "fullstack")
    difficulty_level = metadata.get("difficultyLevel", "intermediate")
    interview_id = metadata.get("interviewId", None)
    user_name = metadata.get("userName", "Candidate")
    max_questions = metadata.get("maxQuestions", 8)
    resume_text = metadata.get("resumeText", "")
    job_description = metadata.get("jobDescription", "")

    print(f"Starting interview: type={interview_type}, level={difficulty_level}, id={interview_id}, resume={'yes' if resume_text else 'no'}, jd={'yes' if job_description else 'no'}")

    agent = InterviewerAgent(
        interview_type=interview_type,
        difficulty_level=difficulty_level,
        interview_id=interview_id,
        user_name=user_name,
        max_questions=max_questions,
        resume_text=resume_text,
        job_description=job_description,
    )

    session = AgentSession()

    # 🔥 CRITICAL FIX: Collect transcript properly using AgentTranscriptionCollector
    transcript_entries = []

    # ✅ FIX #1: Capture agent speech properly
    @session.on("agent_speech_committed")
    def on_agent_speech(msg: agents.llm.LLMMessage):
        """Capture what the AI interviewer says"""
        text = msg.content if hasattr(msg, 'content') else str(msg)
        print(f"🤖 Agent said: {text[:100]}...")
        transcript_entries.append({
            "role": "agent",  # Changed from "interviewer" to match your backend
            "text": text,
            "timestamp": asyncio.get_event_loop().time(),
        })

    # ✅ FIX #2: Capture user speech properly
    @session.on("user_speech_committed")
    def on_user_speech(msg: agents.llm.LLMMessage):
        """Capture what the candidate says"""
        text = msg.content if hasattr(msg, 'content') else str(msg)
        print(f"👤 User said: {text[:100]}...")
        transcript_entries.append({
            "role": "user",  # Changed from "candidate" to match your backend
            "text": text,
            "timestamp": asyncio.get_event_loop().time(),
        })

    await session.start(room=room, agent=agent)

    # 🔥 CRITICAL FIX #3: Don't wait 20 minutes! Wait for disconnect event
    print("⏳ Waiting for participant to disconnect...")
    
    disconnect_event = asyncio.Event()
    
    @room.on("participant_disconnected")
    def on_participant_disconnected(participant: rtc.RemoteParticipant):
        """Immediately save when user disconnects"""
        print(f"👋 Participant disconnected: {participant.identity}")
        disconnect_event.set()
    
    try:
        # Wait for disconnect OR 30 minute timeout (whichever comes first)
        await asyncio.wait_for(disconnect_event.wait(), timeout=1800)
        print("✅ Participant disconnected, saving results...")
    except asyncio.TimeoutError:
        print("⏰ Interview timed out after 30 minutes")

    # 🔥 CRITICAL FIX #4: Save results IMMEDIATELY after disconnect
    backend_url = os.environ.get("BACKEND_URL", "http://localhost:3000")
    agent_api_key = os.environ.get("AGENT_API_KEY", "")

    if interview_id and transcript_entries:
        print(f"💾 Saving {len(transcript_entries)} transcript entries...")
        await save_interview_results(
            interview_id,
            {
                "transcript": transcript_entries,
                "interviewType": interview_type,
                "difficultyLevel": difficulty_level,
            },
            backend_url,
            agent_api_key,
        )
    else:
        print(f"⚠️ No transcript to save (ID: {interview_id}, Entries: {len(transcript_entries)})")


if __name__ == "__main__":
    check_environment_vars()
    opts = WorkerOptions(entrypoint_fnc=entrypoint)
    print("Starting IntervuAI Agent Worker...")
    agents.cli.run_app(opts)
