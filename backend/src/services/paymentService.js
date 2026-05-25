// Razorpay Payment Service
import Razorpay from 'razorpay';
import crypto from 'crypto';
import env from '../config/env.js';
import { ApiError } from '../utils/apiResponse.js';

let razorpayInstance = null;

function getRazorpay() {
  if (!razorpayInstance) {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      throw new ApiError(503, 'Payment service not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    }
    razorpayInstance = new Razorpay({
      key_id: (env.RAZORPAY_KEY_ID || '').trim(),
      key_secret: (env.RAZORPAY_KEY_SECRET || '').trim(),
    });
  }
  return razorpayInstance;
}

// Subscription plans configuration
export const PLANS = {
  starter: {
    name: 'Basic',
    priceINR: 199,
    priceUSD: 2.39,
    credits: 10,
    duration: 30, // days
    features: ['10 credits'],
  },
  growth: {
    name: 'Growth',
    priceINR: 499,
    priceUSD: 5.99,
    credits: 30,
    duration: 30,
    features: ['30 credits'],
  },
  pro: {
    name: 'Pro',
    priceINR: 999,
    priceUSD: 11.99,
    credits: 80,
    duration: 30,
    features: ['80 credits'],
  },
};

// Credit cost lookup
export const CREDIT_COSTS = {
  duration: {
    quick: 1,    // ~8 min interview
    standard: 2, // ~15 min interview
    deep: 3,     // ~25 min interview
  },
  analysis: {
    basic: 0,    // score + brief feedback (included)
    detailed: 1, // per-question feedback + tips
    premium: 2,  // detailed + improvement roadmap + model answers
  },
};

// Map duration tier to number of questions for the agent
export const DURATION_QUESTIONS = {
  quick: 6,
  standard: 9,
  deep: 14,
};

/**
 * Create a Razorpay order
 */
export const createOrder = async (plan, userId, currency = 'INR') => {
  const planDetails = PLANS[plan];
  if (!planDetails) {
    throw new ApiError(400, `Invalid plan: ${plan}. Choose 'starter', 'growth', or 'pro'.`);
  }

  const validCurrency = currency === 'USD' ? 'USD' : 'INR';
  const price = validCurrency === 'USD' ? planDetails.priceUSD : planDetails.priceINR;

  if (!price || price <= 0) {
    throw new ApiError(400, `Invalid price for plan '${plan}' with currency '${validCurrency}'`);
  }

  const razorpay = getRazorpay();
  console.log('[Payment] Creating order:', { plan, currency: validCurrency, amount: Math.round(price * 100) });

  const options = {
    amount: Math.round(price * 100), // Razorpay expects smallest unit (paise/cents)
    currency: validCurrency,
    receipt: `r_${String(userId).slice(-8)}_${Date.now().toString().slice(-10)}`,
    notes: {
      userId,
      plan,
      credits: planDetails.credits,
    },
  };

  try {
    const order = await razorpay.orders.create(options);
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: planDetails,
    };
  } catch (error) {
    console.error('Razorpay Order Creation Error:', JSON.stringify(error, null, 2));
    const razorpayMsg = error?.error?.description || error?.message || 'Unknown Razorpay error';
    throw new ApiError(500, `Failed to create payment order: ${razorpayMsg}`);
  }
};

/**
 * Verify Razorpay payment signature
 */
export const verifyPayment = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const secret = (env.RAZORPAY_KEY_SECRET || '').trim();
  if (!secret) {
    console.error('[Payment] RAZORPAY_KEY_SECRET is not set!');
    return false;
  }

  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  const isValid = expectedSignature === razorpaySignature;
  if (!isValid) {
    console.error('[Payment] Signature mismatch:', {
      orderId: razorpayOrderId,
      expected: expectedSignature.substring(0, 12) + '...',
      received: (razorpaySignature || '').substring(0, 12) + '...',
    });
  }
  return isValid;
};

/**
 * Get plan details
 */
export const getPlanDetails = (plan) => {
  return PLANS[plan] || null;
};

export default {
  createOrder,
  verifyPayment,
  getPlanDetails,
  PLANS,
  CREDIT_COSTS,
  DURATION_QUESTIONS,
};
