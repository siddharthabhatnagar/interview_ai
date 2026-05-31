// Authentication Controller - Phase 1
import User from '../models/User.js';
import Interview from '../models/Interview.js';
import Payment from '../models/Payment.js';
import OTPVerification from '../models/OTPVerification.js';
import { ApiResponse, ApiError, asyncHandler } from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { OAuth2Client } from 'google-auth-library';

/**
 * Register a new user
 * @route POST /api/auth/register
 * @body {name, email, password}
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, termsAccepted, termsVersion } = req.body;

  // Validation
  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email, and password are required');
  }

  // Validate terms acceptance
  if (!termsAccepted) {
    throw new ApiError(400, 'You must accept the Terms of Service to create an account');
  }

  if (!termsVersion || termsVersion !== '1.0') {
    throw new ApiError(400, 'Please accept the latest Terms of Service');
  }

  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, 'Please enter a valid email address');
  }

  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  // Create user with terms acceptance data
  const user = await User.create({
    name,
    email,
    password,
    termsAccepted: true,
    termsAcceptedAt: new Date(),
    termsVersion: '1.0',
    termsAcceptanceIP: req.ip || req.connection.remoteAddress || null,
  });

  // Generate JWT token
  const token = jwt.sign(user.getJWT(), env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE,
  });

  res.status(201).json(
    new ApiResponse(201, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan,
        credits: user.credits,
        termsAccepted: user.termsAccepted,
      },
    }, 'User registered successfully')
  );
});

/**
 * Login user
 * @route POST /api/auth/login
 * @body {email, password}
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Google-only accounts cannot use password login
  if (user.googleId && !user.password) {
    throw new ApiError(401, 'This account uses Google sign-in. Please continue with Google.');
  }

  // Check password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Generate JWT token
  const token = jwt.sign(user.getJWT(), env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE,
  });

  res.json(
    new ApiResponse(200, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan,
        credits: user.credits,
        termsAccepted: user.termsAccepted,
      },
    }, 'Login successful')
  );
});

/**
 * Get current user
 * @route GET /api/auth/me
 * @middleware verifyJWT
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json(
    new ApiResponse(200, {
      id: user._id,
      name: user.name,
      email: user.email,
      subscriptionPlan: user.subscriptionPlan,
      totalInterviews: user.totalInterviews,
      credits: user.credits,
      termsAccepted: user.termsAccepted,
    }, 'User retrieved successfully')
  );
});

/**
 * Google OAuth sign-in / sign-up
 * @route POST /api/auth/google
 * @body {credential} - Google ID token
 */
export const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) throw new ApiError(400, 'Google credential is required');
  if (!env.GOOGLE_CLIENT_ID) throw new ApiError(503, 'Google OAuth not configured on server');

  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { sub: googleId, email, name, picture } = payload;

  // Find or create user
  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (!user) {
    user = await User.create({
      name,
      email,
      googleId,
      profilePicture: picture,
      password: `google_${googleId}_${Date.now()}`, // placeholder, never used
      termsAccepted: false, // OAuth users must accept terms separately
      termsAcceptedAt: null,
      termsVersion: null,
    });
  } else if (!user.googleId) {
    // Link Google ID to existing email account
    user.googleId = googleId;
    if (!user.profilePicture) user.profilePicture = picture;
    await user.save();
  }

  const token = jwt.sign(user.getJWT(), env.JWT_SECRET, { expiresIn: env.JWT_EXPIRE });

  res.json(
    new ApiResponse(200, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan,
        credits: user.credits,
        termsAccepted: user.termsAccepted, // Include this for frontend
      },
      requiresTermsAcceptance: !user.termsAccepted,
    }, 'Google sign-in successful')
  );
});

/**
 * Refresh JWT token
 * @route POST /api/auth/refresh
 * @middleware verifyJWT
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const token = jwt.sign(user.getJWT(), env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE,
  });

  res.json(
    new ApiResponse(200, { token }, 'Token refreshed successfully')
  );
});

/**
 * Accept terms of service (for OAuth users)
 * @route POST /api/auth/accept-terms
 * @middleware authenticate
 */
export const acceptTerms = asyncHandler(async (req, res) => {
  const { termsAccepted, termsVersion } = req.body;
  const userId = req.user.userId; // from auth middleware

  if (!termsAccepted) {
    throw new ApiError(400, 'Terms acceptance is required');
  }

  if (!termsVersion || termsVersion !== '1.0') {
    throw new ApiError(400, 'Invalid terms version');
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      termsVersion: '1.0',
      termsAcceptanceIP: req.ip || req.connection.remoteAddress || null,
    },
    { new: true }
  );

  const token = jwt.sign(user.getJWT(), env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE,
  });

  res.json(
    new ApiResponse(
      200,
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          subscriptionPlan: user.subscriptionPlan,
          credits: user.credits,
          termsAccepted: user.termsAccepted,
        },
      },
      'Terms accepted successfully'
    )
  );
});

/**
 * Delete current user account and associated application data.
 * @route DELETE /api/auth/account
 * @middleware verifyJWT
 * @body {currentPassword?, confirmation}
 */
export const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { currentPassword, confirmation } = req.body || {};

  if (confirmation !== 'DELETE') {
    throw new ApiError(400, 'Type DELETE to confirm account deletion');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.password && !user.googleId) {
    if (!currentPassword) {
      throw new ApiError(400, 'Current password is required to delete this account');
    }

    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      throw new ApiError(401, 'Current password is incorrect');
    }
  }

  await Promise.all([
    Interview.deleteMany({ userId }),
    Payment.deleteMany({ userId }),
    OTPVerification.deleteMany({ email: user.email }),
  ]);

  await User.findByIdAndDelete(userId);

  res.json(
    new ApiResponse(
      200,
      { deleted: true },
      'Account and associated data deleted successfully'
    )
  );
});
