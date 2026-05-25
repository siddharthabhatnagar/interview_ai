// Environment configuration
import dotenv from 'dotenv';

dotenv.config();

const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3000,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',

  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/intervuai',

  // AI Services
  CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,

  // Deepgram
  DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,

  // ElevenLabs
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID || 'default',

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,

  // LiveKit
  LIVEKIT_URL: process.env.LIVEKIT_URL,
  LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
  AGENT_API_KEY: process.env.AGENT_API_KEY || '',
  AUTO_START_AGENT: process.env.AUTO_START_AGENT !== 'false',
  DEPLOY_REVISION: 'railway-healthcheck-cmd',

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,

  // Email (OTP)
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',

  // Validation
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
];

// Warn about optional but recommended variables
const recommendedEnvVars = [
  'CEREBRAS_API_KEY',
  'DEEPGRAM_API_KEY',
];

for (const varName of requiredEnvVars) {
  if (!env[varName]) {
    console.error(`❌ Missing REQUIRED environment variable: ${varName}`);
    process.exit(1);
  }
}

for (const varName of recommendedEnvVars) {
  if (!env[varName]) {
    console.warn(`⚠️  Missing recommended environment variable: ${varName} (AI features may use fallbacks)`);
  }
}

export default env;
