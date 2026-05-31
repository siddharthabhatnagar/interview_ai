// Main server entry point
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/database.js';
import env from './config/env.js';
import errorHandler from './middleware/errorHandler.js';
import { startAgent } from './services/agentManager.js';

// Import routes
import authRoutes from './routes/auth.js';
import interviewRoutes from './routes/interview.js';
import paymentRoutes from './routes/payment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

function maskConnectionString(value) {
  if (!value) return 'not configured';

  try {
    const url = new URL(value);
    if (url.username) url.username = '***';
    if (url.password) url.password = '***';
    return url.toString();
  } catch {
    return 'configured';
  }
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: env.isProduction ? undefined : false,
}));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean);

    // Also allow any *.vercel.app subdomain
    const isVercel = origin.endsWith('.vercel.app');
    const isAllowed = allowedOrigins.some(allowed =>
      allowed && origin.startsWith(allowed.replace(/\/$/, ''))
    );

    if (isVercel || isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({ limit: '16mb', extended: true }));
// Add raw binary parser for audio data
app.use(express.raw({ type: 'audio/*', limit: '16mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'IntervuAI Backend is running',
    revision: env.DEPLOY_REVISION,
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/payment', paymentRoutes);

// Serve frontend static files in production
if (env.isProduction) {
  const publicPath = path.join(__dirname, '..', 'public');
  app.use(express.static(publicPath));
  
  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start listening
    app.listen(env.PORT, env.HOST, () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🤖 IntervuAI Backend Server`);
      console.log(`${'='.repeat(60)}`);
      console.log(`✓ Server listening on ${env.HOST}:${env.PORT}`);
      console.log(`✓ Environment: ${env.NODE_ENV}`);
      console.log(`✓ Database: ${maskConnectionString(env.MONGODB_URI)}`);
      console.log(`✓ Frontend URL: ${env.FRONTEND_URL}`);
      console.log(`${'='.repeat(60)}\n`);

      // Auto-start the LiveKit Python agent when configured.
      if (env.AUTO_START_AGENT && env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET) {
        startAgent();
      } else if (env.AUTO_START_AGENT) {
        console.log('⚠️  LiveKit not configured, skipping agent auto-start.');
      } else {
        console.log('LiveKit agent auto-start disabled.');
      }
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('✗ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('✗ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

export default app;
