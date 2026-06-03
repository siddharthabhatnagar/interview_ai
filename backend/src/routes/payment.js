// Payment Routes
import express from 'express';
import {
  getPlans,
  getFirestoreStatus,
  createPaymentOrder,
  verifyPaymentHandler,
  getPaymentHistory,
} from '../controllers/paymentController.js';
import verifyJWT from '../middleware/auth.js';
import verifyTermsAcceptance from '../middleware/termsAcceptance.js';

const router = express.Router();

// Public route - get plans
router.get('/plans', getPlans);

// Protected routes requiring terms acceptance
router.get('/firestore-status', getFirestoreStatus); // Public: read-only diagnostics, no sensitive data
router.post('/create-order', verifyJWT, verifyTermsAcceptance, createPaymentOrder);
router.post('/verify', verifyJWT, verifyTermsAcceptance, verifyPaymentHandler);
router.get('/history', verifyJWT, verifyTermsAcceptance, getPaymentHistory);

export default router;
