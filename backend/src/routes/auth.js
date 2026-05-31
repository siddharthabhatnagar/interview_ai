// Authentication Routes - Phase 1
import express from 'express';
import {
  register,
  login,
  getMe,
  refreshToken,
  googleAuth,
  acceptTerms,
  deleteAccount,
} from '../controllers/authController.js';
import verifyJWT from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);

// Protected routes
router.get('/me', verifyJWT, getMe);
router.post('/refresh', verifyJWT, refreshToken);
router.post('/accept-terms', verifyJWT, acceptTerms);
router.delete('/account', verifyJWT, deleteAccount);

export default router;
