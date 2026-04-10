// Interview Controller - Phase 1
import Interview from '../models/Interview.js';
import User from '../models/User.js';
import { ApiResponse, ApiError, asyncHandler } from '../utils/apiResponse.js';
import {
  generateInitialQuestion,
  evaluateResponse,
  generateInterviewSummary,
  isResponseCompleteEnough,
} from '../services/gptService.js';
import {
  transcribeAudio,
  validateAudio,
} from '../services/deepgramService.js';
import { generateToken, getLiveKitUrl } from '../services/livekitService.js';
import { CREDIT_COSTS, DURATION_QUESTIONS } from '../services/paymentService.js';

/**
 * Start a new interview
 * @route POST /api/interview/start
 * @middleware verifyJWT
 * @body {interviewType, difficultyLevel}
 */
export const startInterview = asyncHandler(async (req, res) => {
  const { interviewType = 'fullstack', difficultyLevel = 'intermediate', duration = 'standard', analysisType = 'basic' } = req.body;
  const userId = req.user.userId;

  // Calculate credit cost
  const durationCost = CREDIT_COSTS.duration[duration] || 2;
  const analysisCost = CREDIT_COSTS.analysis[analysisType] || 0;
  const totalCredits = durationCost + analysisCost;

  // Validate user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check credits
  if ((user.credits || 0) < totalCredits) {
    throw new ApiError(403, `Not enough credits. This interview costs ${totalCredits} credits. You have ${user.credits || 0}.`);
  }

  // Create interview document
  const interview = await Interview.create({
    userId,
    interviewType,
    difficultyLevel,
    duration,
    analysisType,
    creditsUsed: totalCredits,
    status: 'in_progress',
    startedAt: new Date(),
  });

  // Generate first question
  let firstQuestion;
  try {
    firstQuestion = await generateInitialQuestion(interviewType, difficultyLevel);
  } catch (error) {
    interview.status = 'cancelled';
    await interview.save();
    throw error;
  }

  // Add first question to interview
  interview.questions.push({
    questionNumber: 1,
    questionText: firstQuestion,
    generatedAt: new Date(),
  });
  interview.totalQuestions = 1;
  await interview.save();

  // Update user interview count
  user.totalInterviews += 1;
  user.credits = (user.credits || 0) - totalCredits;
  await user.save();

  res.status(201).json(
    new ApiResponse(
      201,
      {
        interviewId: interview._id,
        questionNumber: 1,
        question: firstQuestion,
        status: interview.status,
        creditsUsed: totalCredits,
      },
      'Interview started successfully'
    )
  );
});

/**
 * Get interview details
 * @route GET /api/interview/:id
 * @middleware verifyJWT
 */
export const getInterview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const interview = await Interview.findById(id);

  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }

  // Check ownership
  if (interview.userId.toString() !== userId) {
    throw new ApiError(403, 'You do not have access to this interview');
  }

  res.json(
    new ApiResponse(
      200,
      interview,
      'Interview retrieved successfully'
    )
  );
});

/**
 * Process candidate audio response
 * @route POST /api/interview/:id/process-audio
 * @middleware verifyJWT
 * @body {audioBuffer} - binary audio data
 */
export const processAudio = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  // Get interview
  const interview = await Interview.findById(id);
  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }

  // Check ownership
  if (interview.userId.toString() !== userId) {
    throw new ApiError(403, 'You do not have access to this interview');
  }

  // Get audio buffer from request
  const audioBuffer = req.body instanceof Buffer ? req.body : Buffer.from(req.body);

  // Validate audio
  const validation = validateAudio(audioBuffer);
  if (!validation.valid) {
    throw new ApiError(400, validation.error);
  }

  // Transcribe audio
  let transcription;
  try {
    transcription = await transcribeAudio(audioBuffer);
  } catch (error) {
    throw new ApiError(500, 'Failed to transcribe audio: ' + error.message);
  }

  const transcript = transcription.transcript;

  // Check if response is substantial enough
  if (!isResponseCompleteEnough(transcript)) {
    throw new ApiError(400, 'Response is too short. Please provide a more detailed answer');
  }

  // Get current question
  const lastQuestion = interview.questions[interview.questions.length - 1];
  if (!lastQuestion) {
    throw new ApiError(400, 'No current question found');
  }

  // Store candidate response
  lastQuestion.candidateResponse = transcript;
  lastQuestion.responseReceivedAt = new Date();

  // Evaluate response
  let evaluation;
  try {
    evaluation = await evaluateResponse(
      lastQuestion.questionText,
      transcript,
      {
        interviewType: interview.interviewType,
        difficultyLevel: interview.difficultyLevel,
        questionNumber: lastQuestion.questionNumber,
        analysisType: interview.analysisType || 'basic',
      }
    );
  } catch (error) {
    throw new ApiError(500, 'Failed to evaluate response: ' + error.message);
  }

  // Store evaluation
  lastQuestion.aiEvaluation = {
    score: evaluation.score,
    technicalAccuracy: evaluation.technicalAccuracy,
    communicationClarity: evaluation.communicationClarity,
    problemSolving: evaluation.problemSolving,
    depthOfKnowledge: evaluation.depthOfKnowledge,
    practicalExperience: evaluation.practicalExperience,
    feedback: evaluation.feedback,
    improvementTip: evaluation.improvementTip || '',
    estimatedLevel: evaluation.estimatedLevel || '',
    followUpQuestion: evaluation.followUpQuestion,
  };
  interview.questionsAnswered += 1;

  // Check if interview should continue
  const shouldContinue = interview.questionsAnswered < 10 && evaluation.score >= 30; // Continue if passing

  if (shouldContinue) {
    // Add next question
    interview.questions.push({
      questionNumber: interview.questionsAnswered + 1,
      questionText: evaluation.followUpQuestion,
      generatedAt: new Date(),
    });
    interview.totalQuestions += 1;
  } else {
    // Interview complete
    interview.status = 'completed';
    interview.completedAt = new Date();

    // Calculate overall score
    const scores = interview.questions
      .filter(q => q.aiEvaluation)
      .map(q => q.aiEvaluation.score);
    interview.overallScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    // Generate interview summary
    try {
      const questionsData = interview.questions
        .filter(q => q.aiEvaluation)
        .map(q => ({
          question: q.questionText,
          response: q.candidateResponse,
          score: q.aiEvaluation.score,
        }));
      interview.summary = await generateInterviewSummary(questionsData, {
        interviewType: interview.interviewType,
        difficultyLevel: interview.difficultyLevel,
      });
    } catch (summaryError) {
      console.error('Failed to generate summary:', summaryError.message);
      interview.summary = `Interview completed with an overall score of ${interview.overallScore}%.`;
    }
  }

  await interview.save();

  res.json(
    new ApiResponse(
      200,
      {
        transcript,
        confidence: transcription.confidence,
        evaluation,
        nextQuestion: shouldContinue ? evaluation.followUpQuestion : null,
        interviewStatus: interview.status,
        overallScore: interview.overallScore,
        questionsAnswered: interview.questionsAnswered,
      },
      'Audio processed successfully'
    )
  );
});

/**
 * Get user's interview history
 * @route GET /api/interview/user/history
 * @middleware verifyJWT
 */
export const getInterviewHistory = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { limit = 50, skip = 0 } = req.query;

  const interviews = await Interview.find({ userId })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

  const total = await Interview.countDocuments({ userId });

  res.json(
    new ApiResponse(
      200,
      {
        interviews,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
      'Interview history retrieved successfully'
    )
  );
});

export default {
  startInterview,
  getInterview,
  processAudio,
  getInterviewHistory,
};

/**
 * Start a LIVE real-time interview (LiveKit-based)
 * @route POST /api/interview/start-live
 * @middleware verifyJWT
 * @body {interviewType, difficultyLevel}
 */
export const startLiveInterview = asyncHandler(async (req, res) => {
  const { interviewType = 'fullstack', difficultyLevel = 'intermediate', duration = 'standard', analysisType = 'basic', resumeText = '', jobDescription = '' } = req.body;
  const userId = req.user.userId;

  // Calculate credit cost
  const durationCost = CREDIT_COSTS.duration[duration] || 2;
  const analysisCost = CREDIT_COSTS.analysis[analysisType] || 0;
  const totalCredits = durationCost + analysisCost;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check credits
  if ((user.credits || 0) < totalCredits) {
    throw new ApiError(403, `Not enough credits. This interview costs ${totalCredits} credits. You have ${user.credits || 0}.`);
  }

  // Determine max questions from duration
  const maxQuestions = DURATION_QUESTIONS[duration] || 8;

  // Create interview record
  const interview = await Interview.create({
    userId,
    interviewType,
    difficultyLevel,
    duration,
    analysisType,
    creditsUsed: totalCredits,
    status: 'in_progress',
    startedAt: new Date(),
    isLiveInterview: true,
  });

  // Deduct credits
  user.totalInterviews += 1;
  user.credits = (user.credits || 0) - totalCredits;
  await user.save();

  // Generate LiveKit room and token
  const roomName = `interview-${interview._id}`;
  const roomMetadata = {
    interviewId: interview._id.toString(),
    interviewType,
    difficultyLevel,
    maxQuestions,
    userName: user.name,
    userId: userId,
  };

  // Add optional resume/JD to metadata (truncate to prevent oversized tokens)
  if (resumeText) roomMetadata.resumeText = resumeText.slice(0, 5000);
  if (jobDescription) roomMetadata.jobDescription = jobDescription.slice(0, 5000);

  const token = await generateToken(
    roomName,
    `user-${userId}`,
    user.name,
    roomMetadata,
  );

  const livekitUrl = getLiveKitUrl();

  res.status(201).json(
    new ApiResponse(
      201,
      {
        interviewId: interview._id,
        livekitUrl,
        token,
        roomName,
        status: interview.status,
      },
      'Live interview started successfully'
    )
  );
});

/**
 * Save live interview results (called by the Python agent)
 * @route POST /api/interview/:id/save-live-results
 * @header x-agent-api-key
 * @body {transcript, interviewType, difficultyLevel}
 */
export const saveLiveResults = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const agentKey = req.headers['x-agent-api-key'];
  const env = (await import('../config/env.js')).default;

  // Verify agent API key (simple shared secret)
  if (env.AGENT_API_KEY && agentKey !== env.AGENT_API_KEY) {
    throw new ApiError(401, 'Invalid agent API key');
  }

  const interview = await Interview.findById(id);
  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }

  const { transcript } = req.body;

  if (!transcript || !Array.isArray(transcript)) {
    throw new ApiError(400, 'Invalid transcript data');
  }

  // Parse transcript into questions and responses
  const questions = [];
  let currentQuestion = null;
  let questionNumber = 0;

  for (const entry of transcript) {
    if (entry.role === 'interviewer') {
      // If there's a pending question with response, save it
      if (currentQuestion && currentQuestion.candidateResponse) {
        questions.push(currentQuestion);
      }
      questionNumber++;
      currentQuestion = {
        questionNumber,
        questionText: entry.text,
        generatedAt: new Date(),
        candidateResponse: '',
        responseReceivedAt: null,
        aiEvaluation: null,
      };
    } else if (entry.role === 'candidate' && currentQuestion) {
      if (currentQuestion.candidateResponse) {
        currentQuestion.candidateResponse += ' ' + entry.text;
      } else {
        currentQuestion.candidateResponse = entry.text;
      }
      currentQuestion.responseReceivedAt = new Date();
    }
  }

  // Push the last question if it has a response
  if (currentQuestion && currentQuestion.candidateResponse) {
    questions.push(currentQuestion);
  }

  // Evaluate each Q&A pair using AI
  for (const q of questions) {
    if (q.candidateResponse && q.candidateResponse.trim().length > 10) {
      try {
        const evaluation = await evaluateResponse(
          q.questionText,
          q.candidateResponse,
          {
            interviewType: interview.interviewType,
            difficultyLevel: interview.difficultyLevel,
            questionNumber: q.questionNumber,
            analysisType: interview.analysisType || 'basic',
          }
        );
        q.aiEvaluation = {
          score: evaluation.score,
          technicalAccuracy: evaluation.technicalAccuracy,
          communicationClarity: evaluation.communicationClarity,
          problemSolving: evaluation.problemSolving,
          depthOfKnowledge: evaluation.depthOfKnowledge,
          practicalExperience: evaluation.practicalExperience,
          feedback: evaluation.feedback,
          improvementTip: evaluation.improvementTip || '',
          estimatedLevel: evaluation.estimatedLevel || '',
          followUpQuestion: evaluation.followUpQuestion || '',
        };
      } catch (error) {
        console.error(`Failed to evaluate Q${q.questionNumber}:`, error.message);
        q.aiEvaluation = {
          score: 50,
          feedback: 'Evaluation could not be completed.',
          followUpQuestion: '',
        };
      }
    }
  }

  // Update interview
  interview.questions = questions;
  interview.totalQuestions = questions.length;
  interview.questionsAnswered = questions.filter(q => q.candidateResponse).length;

  // Calculate overall score
  const scores = questions
    .filter(q => q.aiEvaluation?.score)
    .map(q => q.aiEvaluation.score);
  interview.overallScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  interview.status = 'completed';
  interview.completedAt = new Date();

  // Generate summary
  try {
    const questionsData = questions
      .filter(q => q.aiEvaluation)
      .map(q => ({
        question: q.questionText,
        response: q.candidateResponse,
        score: q.aiEvaluation.score,
      }));
    interview.summary = await generateInterviewSummary(questionsData, {
      interviewType: interview.interviewType,
      difficultyLevel: interview.difficultyLevel,
      analysisType: interview.analysisType || 'basic',
    });
  } catch (err) {
    interview.summary = `Live interview completed. Overall score: ${interview.overallScore}%.`;
  }

  // Store raw transcript
  interview.liveTranscript = transcript;

  await interview.save();

  res.json(
    new ApiResponse(200, { interviewId: id, overallScore: interview.overallScore }, 'Live interview results saved')
  );
});

/**
 * Complete a live interview (called by the frontend when user ends the session)
 * @route POST /api/interview/:id/complete-live
 * @middleware verifyJWT
 * @body {transcript}
 * 
 * ✅ FIXED VERSION - Uses Promise.all() to wait for all evaluations
 */
export const completeLiveInterview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
 
  const interview = await Interview.findById(id);
  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }
 
  if (interview.userId.toString() !== userId) {
    throw new ApiError(403, 'You do not have access to this interview');
  }
 
  if (interview.status === 'completed') {
    return res.json(new ApiResponse(200, interview, 'Interview already completed'));
  }
 
  const { transcript } = req.body;
 
  if (transcript && Array.isArray(transcript) && transcript.length > 0) {
    // Parse transcript into questions
    const questions = [];
    let currentQuestion = null;
    let questionNumber = 0;
 
    for (const entry of transcript) {
      if (entry.role === 'interviewer' || entry.role === 'agent') {
        if (currentQuestion && currentQuestion.candidateResponse) {
          questions.push(currentQuestion);
        }
        questionNumber++;
        currentQuestion = {
          questionNumber,
          questionText: entry.text,
          generatedAt: new Date(),
          candidateResponse: '',
          responseReceivedAt: null,
          aiEvaluation: null,
        };
      } else if ((entry.role === 'candidate' || entry.role === 'user') && currentQuestion) {
        if (currentQuestion.candidateResponse) {
          currentQuestion.candidateResponse += ' ' + entry.text;
        } else {
          currentQuestion.candidateResponse = entry.text;
        }
        currentQuestion.responseReceivedAt = new Date();
      }
    }
 
    if (currentQuestion && currentQuestion.candidateResponse) {
      questions.push(currentQuestion);
    }
 
    // 🔥 CRITICAL FIX: Use Promise.all() to evaluate ALL questions in parallel
    // This ensures we wait for ALL evaluations to complete before saving
    const evaluationPromises = questions.map(async (q) => {
      if (q.candidateResponse && q.candidateResponse.trim().length > 10) {
        try {
          const evaluation = await evaluateResponse(
            q.questionText,
            q.candidateResponse,
            {
              interviewType: interview.interviewType,
              difficultyLevel: interview.difficultyLevel,
              questionNumber: q.questionNumber,
              analysisType: interview.analysisType || 'basic',
            }
          );
          
          q.aiEvaluation = {
            score: evaluation.score,
            technicalAccuracy: evaluation.technicalAccuracy,
            communicationClarity: evaluation.communicationClarity,
            problemSolving: evaluation.problemSolving,
            depthOfKnowledge: evaluation.depthOfKnowledge,
            practicalExperience: evaluation.practicalExperience,
            feedback: evaluation.feedback,
            improvementTip: evaluation.improvementTip || '',
            estimatedLevel: evaluation.estimatedLevel || '',
            followUpQuestion: evaluation.followUpQuestion || '',
          };
        } catch (error) {
          console.error(`Failed to evaluate Q${q.questionNumber}:`, error.message);
          q.aiEvaluation = { 
            score: 50, 
            feedback: 'Evaluation could not be completed.', 
            followUpQuestion: '' 
          };
        }
      }
      return q;
    });
 
    // ✅ WAIT for ALL evaluations to complete before proceeding
    await Promise.all(evaluationPromises);
 
    if (questions.length > 0) {
      interview.questions = questions;
      interview.totalQuestions = questions.length;
      interview.questionsAnswered = questions.filter(q => q.candidateResponse).length;
 
      // Calculate overall score from evaluated questions
      const scores = questions
        .filter(q => q.aiEvaluation?.score)
        .map(q => q.aiEvaluation.score);
      
      interview.overallScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
    }
 
    interview.liveTranscript = transcript;
  }
 
  interview.status = 'completed';
  interview.completedAt = new Date();
 
  // Generate summary if we have evaluated questions
  if (interview.questions.length > 0 && !interview.summary) {
    try {
      const questionsData = interview.questions
        .filter(q => q.aiEvaluation)
        .map(q => ({
          question: q.questionText,
          response: q.candidateResponse,
          score: q.aiEvaluation.score,
        }));
      
      if (questionsData.length > 0) {
        interview.summary = await generateInterviewSummary(questionsData, {
          interviewType: interview.interviewType,
          difficultyLevel: interview.difficultyLevel,
          analysisType: interview.analysisType || 'basic',
        });
      }
    } catch (err) {
      console.error('Failed to generate summary:', err.message);
      interview.summary = `Interview completed. Score: ${interview.overallScore || 0}%.`;
    }
  }
 
  // ✅ NOW save after ALL evaluations and summary are done
  await interview.save();
 
  res.json(new ApiResponse(200, interview, 'Live interview completed'));
});
