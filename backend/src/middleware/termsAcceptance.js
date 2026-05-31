import { ApiError } from '../utils/apiResponse.js';
import User from '../models/User.js';

/**
 * Middleware to verify that user has accepted terms of service
 * Must be placed after verifyJWT middleware
 */
const verifyTermsAcceptance = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    const user = await User.findById(req.user.userId).select('termsAccepted isActive');
    if (!user || !user.isActive) {
      throw new ApiError(401, 'User account is not active');
    }

    if (!user.termsAccepted) {
      throw new ApiError(403, 'You must accept the Terms of Service before using this feature');
    }

    req.user.termsAccepted = true;

    next();
  } catch (error) {
    next(error);
  }
};

export default verifyTermsAcceptance;
