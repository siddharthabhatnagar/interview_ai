// Interview model
import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Interview metadata
    title: String,
    description: String,
    interviewType: {
      type: String,
      enum: ['frontend', 'backend', 'fullstack', 'devops', 'data-science', 'ai_ml_engineer', 'gen_ai_engineer', 'mlops_engineer', 'data_engineer', 'data_scientist'],
      default: 'fullstack',
    },
    difficultyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    
    // Duration tier
    duration: {
      type: String,
      enum: ['quick', 'standard', 'deep'],
      default: 'standard',
    },
    
    // Analysis tier
    analysisType: {
      type: String,
      enum: ['basic', 'detailed', 'premium'],
      default: 'basic',
    },
    
    // Credits charged for this interview
    creditsUsed: {
      type: Number,
      default: 0,
    },
    
    // Interview status
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'cancelled'],
      default: 'not_started',
    },
    startedAt: Date,
    completedAt: Date,
    
    // Interview content
    questions: [
      {
        questionNumber: Number,
        questionText: String,
        generatedAt: Date,
        candidateResponse: String,
        responseReceivedAt: Date,
        aiEvaluation: {
          score: Number, // 0-100 weighted average
          technicalAccuracy: Number, // 0-100
          communicationClarity: Number, // 0-100
          problemSolving: Number, // 0-100
          depthOfKnowledge: Number, // 0-100
          practicalExperience: Number, // 0-100
          feedback: String,
          improvementTip: String,
          estimatedLevel: String,
          followUpQuestion: String,
        },
      },
    ],
    
    // Interview results
    totalQuestions: {
      type: Number,
      default: 0,
    },
    questionsAnswered: {
      type: Number,
      default: 0,
    },
    overallScore: Number,
    summary: String,
    
    // Audio & transcription
    audioRecordings: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        audioUrl: String,
        transcript: String,
      },
    ],
    
    // Payment & billing
    isPaid: {
      type: Boolean,
      default: false,
    },
    paymentId: String,
    amountPaid: Number,

    // Live interview (LiveKit)
    isLiveInterview: {
      type: Boolean,
      default: false,
    },
    liveTranscript: [
      {
        role: String,
        text: String,
        timestamp: Number,
      },
    ],

    // Focus & engagement analysis (from MediaPipe face tracking)
    focusAnalysis: {
      averageFocusScore: Number,
      totalDataPoints: Number,
      faceNotDetectedPercent: Number,
      lookAwayPercent: Number,
      attentionDrops: Number,
      focusTimeline: [
        {
          t: Number,
          s: Number,
        },
      ],
    },

    // Speech analytics (filler words, pace, silence)
    speechAnalytics: {
      totalWords: Number,
      totalFillers: Number,
      fillerRate: Number,
      topFillers: [
        {
          word: String,
          count: Number,
        },
      ],
      wordsPerMinute: Number,
      silenceGaps: Number,
      longPauses: Number,
      avgSilenceSec: Number,
      vocabularyRichness: Number,
      communicationScore: Number,
    },

    // AI-generated improvement roadmap
    improvementRoadmap: {
      generatedAt: Date,
      weeklyPlan: String,
      topWeaknesses: [String],
      resources: [
        {
          topic: String,
          resource: String,
          priority: String,
        },
      ],
    },

    // Coach mode flag
    coachMode: {
      type: Boolean,
      default: false,
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

interviewSchema.index({ userId: 1, createdAt: -1 });

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
