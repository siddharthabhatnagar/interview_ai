import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useInterviewStore } from '../store/interviewStore';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { formatDate } from '../utils/formatters';

export function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { interviewHistory, totalInterviewCount, getHistory, loading } = useInterviewStore();
  const [selectedType, setSelectedType] = useState('frontend');
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [selectedDuration, setSelectedDuration] = useState('standard');
  const [selectedAnalysis, setSelectedAnalysis] = useState('basic');
  const [isStarting, setIsStarting] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [coachMode, setCoachMode] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [showJD, setShowJD] = useState(false);

  const DURATION_CREDITS = { quick: 1, standard: 2, deep: 3 };
  const ANALYSIS_CREDITS = { basic: 0, detailed: 1, premium: 2 };
  const totalCredits = DURATION_CREDITS[selectedDuration] + ANALYSIS_CREDITS[selectedAnalysis];

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    getHistory();
  }, [currentUser]);

  const handleStartInterview = async () => {
    if ((currentUser?.credits || 0) < totalCredits) {
      alert(`You need ${totalCredits} credits for this interview. Please upgrade your plan.`);
      return;
    }

    setIsStarting(true);
    try {
      const response = await useInterviewStore.getState().startLiveInterview(
        selectedType, selectedLevel, selectedDuration, selectedAnalysis,
        resumeText.trim(), jobDescription.trim(), coachMode
      );
      navigate(`/live-interview/${response.interviewId}`, {
        state: {
          livekitUrl: response.livekitUrl,
          livekitToken: response.token,
          interviewType: selectedType,
          difficultyLevel: selectedLevel,
        },
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to start interview');
      setIsStarting(false);
    }
  };

  if (!currentUser) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome, {currentUser.name}!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Ready to ace your next technical interview? Let's practice with IntervuAI.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Start Interview Section */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Start New Interview</h2>

              <div className="space-y-6">
                {/* Interview Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Interview Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'frontend', label: 'Frontend' },
                      { value: 'backend', label: 'Backend' },
                      { value: 'fullstack', label: 'Full Stack' },
                      { value: 'devops', label: 'DevOps' },
                      { value: 'ai_ml_engineer', label: 'AI/ML Engineer' },
                      { value: 'gen_ai_engineer', label: 'Gen AI Engineer' },
                      { value: 'mlops_engineer', label: 'MLOps Engineer' },
                      { value: 'data_engineer', label: 'Data Engineer' },
                      { value: 'data_scientist', label: 'Data Scientist' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setSelectedType(value)}
                        className={`p-3 rounded-lg border-2 font-semibold transition text-sm ${
                          selectedType === value
                            ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-500'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:border-gray-500'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['beginner', 'intermediate', 'advanced'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setSelectedLevel(level)}
                        className={`p-4 rounded-lg border-2 font-semibold capitalize transition ${
                          selectedLevel === level
                            ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-500'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:border-gray-500'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Tier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Interview Duration
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'quick', label: 'Quick', desc: '~8 min', cost: 1 },
                      { value: 'standard', label: 'Standard', desc: '~15 min', cost: 2 },
                      { value: 'deep', label: 'Deep Dive', desc: '~25 min', cost: 3 },
                    ].map(({ value, label, desc, cost }) => (
                      <button
                        key={value}
                        onClick={() => setSelectedDuration(value)}
                        className={`p-4 rounded-lg border-2 font-semibold transition text-center ${
                          selectedDuration === value
                            ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-500'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:border-gray-500'
                        }`}
                      >
                        <div>{label}</div>
                        <div className="text-xs font-normal mt-1 opacity-70">{desc}</div>
                        <div className="text-xs font-medium mt-1">{cost} credit{cost > 1 ? 's' : ''}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Analysis Tier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Feedback Analysis
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'basic', label: 'Basic', desc: 'Score & summary', cost: 0 },
                      { value: 'detailed', label: 'Detailed', desc: 'In-depth feedback', cost: 1 },
                      { value: 'premium', label: 'Premium', desc: 'Expert-level review', cost: 2 },
                    ].map(({ value, label, desc, cost }) => (
                      <button
                        key={value}
                        onClick={() => setSelectedAnalysis(value)}
                        className={`p-4 rounded-lg border-2 font-semibold transition text-center ${
                          selectedAnalysis === value
                            ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-500'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:border-gray-500'
                        }`}
                      >
                        <div>{label}</div>
                        <div className="text-xs font-normal mt-1 opacity-70">{desc}</div>
                        <div className="text-xs font-medium mt-1">{cost === 0 ? 'Free' : `+${cost} credit${cost > 1 ? 's' : ''}`}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resume Upload (Optional) */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowResume(!showResume)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showResume ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Resume / CV (Optional)
                    {resumeText && <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-2 py-0.5 rounded-full">Added</span>}
                  </button>
                  {showResume && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Paste your resume text below. The AI will tailor questions to your experience.
                      </p>
                      <textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Paste your resume content here..."
                        rows={5}
                        maxLength={5000}
                        className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-3 text-sm focus:border-blue-500 focus:outline-none resize-y placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400 dark:text-gray-500">{resumeText.length}/5000 characters</span>
                        {resumeText && (
                          <button onClick={() => setResumeText('')} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">Clear</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Job Description (Optional) */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowJD(!showJD)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showJD ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Target Job Description (Optional)
                    {jobDescription && <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-2 py-0.5 rounded-full">Added</span>}
                  </button>
                  {showJD && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Paste a job description to focus the interview on relevant skills and requirements.
                      </p>
                      <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description here..."
                        rows={5}
                        maxLength={5000}
                        className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-3 text-sm focus:border-blue-500 focus:outline-none resize-y placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400 dark:text-gray-500">{jobDescription.length}/5000 characters</span>
                        {jobDescription && (
                          <button onClick={() => setJobDescription('')} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">Clear</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Credit Cost Summary */}
                <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-emerald-900 dark:text-emerald-300">Coach Mode</p>
                      <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">
                        Practice mode adds short real-time tips after each answer before the next question.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCoachMode((prev) => !prev)}
                      className={`relative h-7 w-12 shrink-0 self-start rounded-full transition-colors ${
                        coachMode
                          ? 'bg-emerald-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      aria-pressed={coachMode}
                      aria-label="Toggle coach mode"
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                          coachMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 flex justify-between items-center">
                  <span className="text-blue-900 dark:text-blue-200 font-medium">Total cost for this interview</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalCredits} credit{totalCredits !== 1 ? 's' : ''}</span>
                </div>

                {/* Start Button */}
                <Button
                  onClick={handleStartInterview}
                  disabled={isStarting || (currentUser.credits || 0) < totalCredits}
                  className="w-full text-lg py-3"
                  size="lg"
                >
                  {isStarting ? 'Starting...' : `Start Interview (${totalCredits} credits)`}
                </Button>

                {(currentUser.credits || 0) < totalCredits && (
                  <div className="text-center space-y-3">
                    <p className="text-red-600 dark:text-red-400 font-semibold">
                      Not enough credits. You need {totalCredits} but have {currentUser.credits || 0}.
                    </p>
                    <Button
                      onClick={() => navigate('/pricing')}
                      variant="secondary"
                      size="md"
                    >
                      Buy Credits
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Your Stats</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Credits Available</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {currentUser.credits || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Total Interviews</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {totalInterviewCount}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Interviews */}
        {interviewHistory.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Interviews</h2>
            <div className="space-y-4">
              {interviewHistory.slice(0, 5).map((interview) => (
                <Card
                  key={interview._id}
                  className="cursor-pointer hover:shadow-lg transition"
                  onClick={() => navigate(`/results/${interview._id}`)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white capitalize">
                        {interview.interviewType} - {interview.difficultyLevel}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(interview.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      {interview.overallScore && (
                        <>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {interview.overallScore}%
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
