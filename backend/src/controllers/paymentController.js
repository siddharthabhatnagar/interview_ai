// Payment Controller
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { ApiResponse, ApiError, asyncHandler } from '../utils/apiResponse.js';
import { createOrder, verifyPayment, PLANS } from '../services/paymentService.js';

/**
 * Get available plans
 * @route GET /api/payment/plans
 */
export const getPlans = asyncHandler(async (req, res) => {
  res.json(new ApiResponse(200, PLANS, 'Plans retrieved successfully'));
});

/**
 * Create a payment order
 * @route POST /api/payment/create-order
 * @middleware verifyJWT
 * @body {plan}
 */
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { plan, currency } = req.body;
  const userId = req.user.userId;

  if (!plan || !PLANS[plan]) {
    throw new ApiError(400, "Invalid plan. Choose 'test', 'starter', 'growth', or 'pro'.");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const order = await createOrder(plan, userId, currency);

  // Create pending payment record
  await Payment.create({
    userId,
    razorpayOrderId: order.orderId,
    transactionType: 'subscription',
    amount: order.amount / 100,
    currency: order.currency,
    subscriptionPlan: plan,
    subscriptionDuration: 1,
    status: 'pending',
    description: `${PLANS[plan].name} Plan Subscription`,
  });

  res.status(201).json(
    new ApiResponse(201, {
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan: order.plan,
    }, 'Order created successfully')
  );
});

/**
 * Verify payment and activate subscription
 * @route POST /api/payment/verify
 * @middleware verifyJWT
 * @body {razorpayOrderId, razorpayPaymentId, razorpaySignature}
 */
export const verifyPaymentHandler = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const userId = req.user.userId;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new ApiError(400, 'Missing payment verification details');
  }

  // Verify signature
  console.log('[Payment] Verifying:', { razorpayOrderId, razorpayPaymentId });
  const isValid = verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) {
    console.error('[Payment] Signature verification FAILED for order:', razorpayOrderId);
    // Update payment as failed
    await Payment.findOneAndUpdate(
      { razorpayOrderId },
      { status: 'failed' }
    );
    throw new ApiError(400, 'Payment verification failed');
  }

  // Update payment record
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId },
    {
      razorpayPaymentId,
      razorpaySignature,
      status: 'completed',
    },
    { new: true }
  );

  if (!payment) {
    throw new ApiError(404, 'Payment record not found');
  }

  // Activate user subscription
  const planDetails = PLANS[payment.subscriptionPlan];
  const user = await User.findById(userId);
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.subscriptionPlan = payment.subscriptionPlan;
  user.subscriptionActive = true;
  user.subscriptionEndDate = new Date(Date.now() + planDetails.duration * 24 * 60 * 60 * 1000);
  user.credits = (user.credits || 0) + planDetails.credits;
  await user.save();

  res.json(
    new ApiResponse(200, {
      payment: {
        id: payment._id,
        amount: payment.amount,
        plan: payment.subscriptionPlan,
        status: payment.status,
      },
      user: {
        subscriptionPlan: user.subscriptionPlan,
        credits: user.credits,
        subscriptionEndDate: user.subscriptionEndDate,
      },
    }, 'Payment verified and subscription activated')
  );
});

/**
 * Get user's payment history
 * @route GET /api/payment/history
 * @middleware verifyJWT
 */
export const getPaymentHistory = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const payments = await Payment.find({ userId })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json(new ApiResponse(200, payments, 'Payment history retrieved'));
});

export default {
  getPlans,
  createPaymentOrder,
  verifyPaymentHandler,
  getPaymentHistory,
};
