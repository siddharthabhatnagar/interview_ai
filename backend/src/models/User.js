// User model
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      minlength: 8,
      // Optional for Google/OAuth users
    },
    googleId: {
      type: String,
      sparse: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    profilePicture: String,
    
    // Subscription
    subscriptionPlan: {
      type: String,
      enum: ['free', 'starter', 'growth', 'pro'],
      default: 'free',
    },
    subscriptionActive: {
      type: Boolean,
      default: false,
    },
    subscriptionEndDate: Date,
    
    // Interview tracking
    totalInterviews: {
      type: Number,
      default: 0,
    },
    credits: {
      type: Number,
      default: 3, // Free tier: 3 credits
    },
    
    // Payment
    razorpayCustomerId: String,

    // Legal & Compliance
    termsAccepted: {
      type: Boolean,
      required: true,
      default: false,
    },
    termsAcceptedAt: {
      type: Date,
      default: null,
    },
    termsVersion: {
      type: String,
      default: '1.0',
    },
    termsAcceptanceIP: {
      type: String,
      default: null,
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.password);
};

// Method to get JWT token
userSchema.methods.getJWT = function () {
  return {
    userId: this._id,
    email: this.email,
    name: this.name,
    subscriptionPlan: this.subscriptionPlan,
  };
};

const User = mongoose.model('User', userSchema);
export default User;
