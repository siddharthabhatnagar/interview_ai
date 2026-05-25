// Interview Routes - Phase 1
import express from 'express';
import {
  startInterview,
  getInterview,
  processAudio,
  getInterviewHistory,
  getLiveAgentStatus,
  startLiveInterview,
  saveLiveResults,
  completeLiveInterview,
} from '../controllers/interviewController.js';
import verifyJWT from '../middleware/auth.js';
import verifyTermsAcceptance from '../middleware/termsAcceptance.js';

const router = express.Router();

// Agent callback route (no JWT - uses x-agent-api-key header)
router.post('/:id/save-live-results', saveLiveResults);

// All remaining interview routes require authentication and terms acceptance
router.use(verifyJWT);
router.use(verifyTermsAcceptance);

// Interview management
router.post('/start', startInterview);
router.post('/start-live', startLiveInterview);
router.get('/agent/status', getLiveAgentStatus);
router.get('/user/history', getInterviewHistory);
router.get('/:id', getInterview);
router.post('/:id/process-audio', processAudio);
router.post('/:id/complete-live', completeLiveInterview);

export default router;
