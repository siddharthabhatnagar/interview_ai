import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import API_BASE_URL from '../services/apiBase';
import { useInterviewStore } from '../store/interviewStore';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';

export function InterviewRoomPage() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { currentInterview, getInterview, processAudio, loading } = useInterviewStore();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    getInterview(interviewId);
  }, [interviewId]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (recordedChunks.length === 0) {
      alert('Please record your answer first');
      return;
    }

    const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
    
    try {
      // Send audio as binary data
      const arrayBuffer = await audioBlob.arrayBuffer();
      const token = useAuthStore.getState().token;
      
      const response = await fetch(`${API_BASE_URL}/interview/${interviewId}/process-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'audio/webm',
        },
        body: arrayBuffer,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit answer');
      }

      const result = await response.json();
      const responseData = result.data;

      // Clear recorded chunks for next question
      setRecordedChunks([]);

      if (responseData.interviewStatus === 'completed') {
        navigate(`/results/${interviewId}`);
      } else {
        // Reload interview to get new question
        await getInterview(interviewId);
      }
    } catch (error) {
      alert(error.message || 'Failed to submit answer');
    }
  };

  if (loading || !currentInterview) {
    return <Loading />;
  }

  const currentQ = currentInterview.questions?.[currentInterview.questions.length - 1];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          {/* Question Section */}
          <div className="mb-8">
            <p className="text-gray-600 text-sm font-medium mb-2">
              Question {currentInterview.questions?.length || 1} of 10
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${((currentInterview.questions?.length || 1) / 10) * 100}%`,
                }}
              ></div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {currentQ?.questionText || 'Loading question...'}
            </h2>

            {currentQ?.aiEvaluation && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-semibold text-green-800 mb-2">Feedback:</p>
                <p className="text-gray-700">{currentQ.aiEvaluation.feedback}</p>
              </div>
            )}
          </div>

          {/* Recording Section */}
          <div className="border-t pt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Your Answer</h3>

            <div className="bg-gray-100 rounded-lg p-8 mb-6 text-center">
              {isRecording && (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                  <p className="text-gray-700 font-medium">Recording...</p>
                </div>
              )}
              {!isRecording && recordedChunks.length === 0 && (
                <p className="text-gray-600">Ready to record your answer</p>
              )}
              {!isRecording && recordedChunks.length > 0 && (
                <p className="text-green-600 font-medium">✓ Answer recorded</p>
              )}
            </div>

            <div className="flex gap-4">
              {!isRecording ? (
                <>
                  <Button
                    onClick={startRecording}
                    variant="primary"
                    size="lg"
                    className="flex-1"
                  >
                    🎤 Start Recording
                  </Button>
                  {recordedChunks.length > 0 && (
                    <Button
                      onClick={() => setRecordedChunks([])}
                      variant="secondary"
                      size="lg"
                    >
                      Clear
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  onClick={stopRecording}
                  variant="danger"
                  size="lg"
                  className="flex-1"
                >
                  ⏹ Stop Recording
                </Button>
              )}
            </div>

            {recordedChunks.length > 0 && (
              <Button
                onClick={handleSubmitAnswer}
                variant="success"
                size="lg"
                className="w-full mt-4"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Submit Answer & Next Question'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
