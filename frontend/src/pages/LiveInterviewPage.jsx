import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Room, RoomEvent, Track, ConnectionState } from 'livekit-client';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import apiClient from '../services/apiClient';
import { FocusAnalyzer } from '../utils/focusAnalyzer';
import { SpeechAnalyzer } from '../utils/speechAnalyzer';

export function LiveInterviewPage() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Connection state
  const [connectionState, setConnectionState] = useState('connecting'); // connecting | connected | disconnected | error
  const [errorMessage, setErrorMessage] = useState('');

  // Interview state
  const [interviewData, setInterviewData] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs
  const roomRef = useRef(null);
  const timerRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const focusAnalyzerRef = useRef(null);
  const speechAnalyzerRef = useRef(null);
  const localVideoRef = useRef(null);

  // Focus indicator state
  const [focusScore, setFocusScore] = useState(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Timer
  useEffect(() => {
    if (connectionState === 'connected') {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [connectionState]);

  // Format time as mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Connect to LiveKit room
  useEffect(() => {
    let cancelled = false;

    const connect = async () => {
      try {
        // Get LiveKit credentials from navigation state
        const livekitToken = location.state?.livekitToken;
        const livekitUrl = location.state?.livekitUrl;
        const interviewType = location.state?.interviewType;
        const difficultyLevel = location.state?.difficultyLevel;
        const analysisType = location.state?.analysisType || 'basic';
        const coachMode = Boolean(location.state?.coachMode);

        if (!livekitToken || !livekitUrl) {
          setErrorMessage('LiveKit connection info not available. Please start a new interview from the dashboard.');
          setConnectionState('error');
          return;
        }

        setInterviewData({ interviewType, difficultyLevel, analysisType, coachMode });

        // Create and connect to LiveKit room
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          audioCaptureDefaults: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        roomRef.current = room;

        // Event handlers
        room.on(RoomEvent.Connected, () => {
          if (!cancelled) setConnectionState('connected');
        });

        room.on(RoomEvent.Disconnected, () => {
          if (!cancelled) setConnectionState('disconnected');
        });

        room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track.kind === Track.Kind.Audio) {
            // Attach remote audio (agent's voice)
            const element = track.attach();
            element.id = 'agent-audio';
            document.body.appendChild(element);
          }
        });

        room.on(RoomEvent.TrackUnsubscribed, (track) => {
          track.detach().forEach((el) => el.remove());
        });

        room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
          const agentSpeaking = speakers.some(
            (s) => !s.isLocal
          );
          if (!cancelled) setIsAgentSpeaking(agentSpeaking);
        });

        // Listen for LiveKit transcription events (agent STT/TTS transcriptions)
        const pendingSegments = {};
        room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
          if (cancelled) return;
          segments.forEach((segment) => {
            const role = participant?.isLocal ? 'user' : 'interviewer';
            const segId = segment.id;

            if (segment.final) {
              // Finalized segment — add to transcript
              const text = segment.text?.trim();
              if (text) {
                const ts = Date.now();
                setTranscript((prev) => [
                  ...prev,
                  { role, text, timestamp: ts },
                ]);
                // Feed user speech to speech analyzer
                if (role === 'user' && speechAnalyzerRef.current) {
                  speechAnalyzerRef.current.addEntry(text, ts);
                }
              }
              delete pendingSegments[segId];
            } else {
              pendingSegments[segId] = { role, text: segment.text };
            }
          });
        });

        // Fallback: also listen for custom data messages
        room.on(RoomEvent.DataReceived, (payload, participant) => {
          try {
            const decoder = new TextDecoder();
            const message = JSON.parse(decoder.decode(payload));
            if (message.type === 'transcript' && !cancelled) {
              setTranscript((prev) => [
                ...prev,
                { role: message.role, text: message.text, timestamp: Date.now() },
              ]);
            } else if (message.type === 'interview_complete' && !cancelled) {
              handleInterviewEnd();
            }
          } catch (e) {
            // Ignore non-JSON data
          }
        });

        room.on(RoomEvent.ConnectionStateChanged, (state) => {
          if (state === ConnectionState.Disconnected && !cancelled) {
            setConnectionState('disconnected');
          }
        });

        // Connect
        await room.connect(livekitUrl, livekitToken);

        // Enable microphone
        await room.localParticipant.setMicrophoneEnabled(true);

        // Initialize speech analyzer
        speechAnalyzerRef.current = new SpeechAnalyzer();

        // Initialize focus analyzer with local camera
        try {
          await room.localParticipant.setCameraEnabled(true);
          const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
          if (camPub?.track) {
            const videoEl = document.createElement('video');
            videoEl.srcObject = new MediaStream([camPub.track.mediaStreamTrack]);
            videoEl.setAttribute('playsinline', '');
            videoEl.muted = true;
            await videoEl.play();
            localVideoRef.current = videoEl;

            const fa = new FocusAnalyzer();
            const ok = await fa.init(videoEl);
            if (ok) {
              fa.onScoreUpdate = (score) => {
                if (!cancelled) setFocusScore(score);
              };
              fa.start();
              focusAnalyzerRef.current = fa;
            }
          }
        } catch (camErr) {
          console.warn('Camera/FocusAnalyzer init skipped:', camErr.message);
        }

        // Set up audio level monitoring for visualizer
        const localTrack = room.localParticipant.getTrackPublication(Track.Source.Microphone);
        if (localTrack?.track) {
          setupAudioAnalyser(localTrack.track.mediaStreamTrack);
        }
      } catch (error) {
        console.error('Failed to connect to LiveKit:', error);
        if (!cancelled) {
          setErrorMessage(error.response?.data?.message || error.message || 'Failed to connect');
          setConnectionState('error');
        }
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (focusAnalyzerRef.current) {
        focusAnalyzerRef.current.destroy();
        focusAnalyzerRef.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.pause();
        localVideoRef.current.srcObject = null;
        localVideoRef.current = null;
      }
      // Clean up agent audio elements
      document.querySelectorAll('#agent-audio').forEach((el) => el.remove());
    };
  }, [interviewId]);

  // Audio level analyser for visualizer
  const setupAudioAnalyser = (mediaStreamTrack) => {
    try {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;

      const source = audioContext.createMediaStreamSource(
        new MediaStream([mediaStreamTrack])
      );
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(Math.min(avg / 128, 1));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (e) {
      // Audio analyser not critical
    }
  };

  const toggleMute = async () => {
    if (!roomRef.current) return;
    const newMuted = !isMuted;
    await roomRef.current.localParticipant.setMicrophoneEnabled(!newMuted);
    setIsMuted(newMuted);
  };

  const handleInterviewEnd = async () => {
    if (isEnding) return;
    setIsEnding(true);

    // Gather analytics before disconnecting
    const focusData = focusAnalyzerRef.current?.getSummary() || null;
    const speechData = speechAnalyzerRef.current?.getSummary() || null;

    // Stop analyzers
    if (focusAnalyzerRef.current) focusAnalyzerRef.current.destroy();
    if (localVideoRef.current) {
      localVideoRef.current.pause();
      localVideoRef.current.srcObject = null;
    }

    try {
      // Disconnect from LiveKit room
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }

      // Tell backend to complete and evaluate (include focus + speech data)
      await apiClient.post(`/interview/${interviewId}/complete-live`, {
        transcript: transcript.map((t) => ({
          role: t.role,
          text: t.text,
          timestamp: t.timestamp,
        })),
        focusData,
        speechData,
      });

      navigate(`/results/${interviewId}`);
    } catch (error) {
      console.error('Failed to complete interview:', error);
      navigate(`/results/${interviewId}`);
    }
  };

  // Loading / error states
  if (connectionState === 'error') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <Card>
            <div className="text-red-500 text-6xl mb-4">⚠</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connection Failed</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <Button onClick={() => navigate('/dashboard')} variant="primary" size="lg">
              Back to Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (connectionState === 'connecting') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
            <div className="absolute inset-3 border-4 border-purple-500/30 rounded-full" />
            <div className="absolute inset-3 border-4 border-purple-500 rounded-full border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connecting to Interview</h2>
          <p className="text-gray-400">Setting up your AI interviewer...</p>
        </div>
      </div>
    );
  }

  if (connectionState === 'disconnected' && !isEnding) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <Card>
            <div className="text-yellow-500 text-6xl mb-4">🔌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Disconnected</h2>
            <p className="text-gray-600 mb-6">
              The interview session has ended or the connection was lost.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate(`/results/${interviewId}`)} variant="primary" size="lg">
                View Results
              </Button>
              <Button onClick={() => navigate('/dashboard')} variant="secondary" size="lg">
                Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-white font-bold text-lg">IntervuAI</h1>
            <span className="text-gray-400 text-sm capitalize">
              {interviewData?.interviewType} • {interviewData?.difficultyLevel}
            </span>
            {interviewData?.coachMode && (
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                Coach Mode
              </span>
            )}
            {interviewData?.analysisType && (
              <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-300 capitalize">
                {interviewData.analysisType} Analysis
              </span>
            )}
          </div>

          <div className="flex items-center gap-6">
            {/* Timer */}
            <div className="flex items-center gap-2 text-gray-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
            </div>

            {/* Connection indicator */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm">Live</span>
            </div>

            {/* Focus indicator */}
            {focusScore !== null && (
              <div className="flex items-center gap-2" title={`Focus: ${focusScore}%`}>
                <div
                  className="w-2.5 h-2.5 rounded-full transition-colors duration-300"
                  style={{
                    backgroundColor:
                      focusScore >= 70 ? '#22c55e' : focusScore >= 40 ? '#eab308' : '#ef4444',
                  }}
                />
                <span
                  className="text-sm font-medium transition-colors duration-300"
                  style={{
                    color:
                      focusScore >= 70 ? '#4ade80' : focusScore >= 40 ? '#facc15' : '#f87171',
                  }}
                >
                  Focus {focusScore}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Interview Visualization */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            {/* AI Avatar / Audio Visualizer */}
            <div className="relative w-48 h-48 mx-auto mb-8">
              {/* Outer ring - agent speaking indicator */}
              <div
                className={`absolute inset-0 rounded-full transition-all duration-300 ${
                  isAgentSpeaking
                    ? 'bg-blue-500/20 ring-4 ring-blue-500/50 scale-110'
                    : 'bg-gray-700/50 ring-2 ring-gray-600/30'
                }`}
              />
              {/* Inner circle - AI avatar */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center shadow-2xl">
                <div className="text-center">
                  <div className="text-5xl mb-1">🤖</div>
                  <span className="text-white/80 text-xs font-medium">
                    {isAgentSpeaking ? 'Speaking...' : 'Listening'}
                  </span>
                </div>
              </div>
              {/* Pulse rings when speaking */}
              {isAgentSpeaking && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-blue-400/40 animate-ping" />
                  <div className="absolute -inset-4 rounded-full border border-blue-400/20 animate-ping" style={{ animationDelay: '0.5s' }} />
                </>
              )}
            </div>

            <h2 className="text-white text-xl font-semibold mb-2">AI Interviewer</h2>
            <p className="text-gray-400 text-sm">
              {isAgentSpeaking
                ? 'The interviewer is speaking...'
                : 'Listening to your response...'}
            </p>

            {/* User Audio Level */}
            <div className="mt-8 flex items-center justify-center gap-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full transition-all duration-75"
                  style={{
                    height: `${Math.max(4, (isMuted ? 0 : audioLevel) * Math.sin((i / 20) * Math.PI) * 40)}px`,
                    backgroundColor: isMuted
                      ? '#4B5563'
                      : audioLevel > 0.1
                      ? '#3B82F6'
                      : '#6B7280',
                  }}
                />
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-2">
              {isMuted ? '🔇 Microphone muted' : '🎤 Your microphone'}
            </p>
          </div>
        </div>

        {/* Right Panel - Live Transcript */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-700">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Live Transcript
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {transcript.length === 0 && (
              <div className="text-gray-500 text-center py-8">
                <p className="text-sm">Waiting for the interview to begin...</p>
                <p className="text-xs mt-2">The AI interviewer will start speaking shortly.</p>
              </div>
            )}

            {transcript.map((entry, idx) => (
              <div
                key={idx}
                className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    entry.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-gray-700 text-gray-100 rounded-bl-md'
                  }`}
                >
                  <p className="text-xs font-medium mb-1 opacity-70">
                    {entry.role === 'user' ? 'You' : 'Interviewer'}
                  </p>
                  <p className="text-sm leading-relaxed">{entry.text}</p>
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-6">
          {/* Mute/Unmute */}
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isMuted
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-2 ring-red-500/50'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* End Interview */}
          <button
            onClick={handleInterviewEnd}
            disabled={isEnding}
            className="h-14 px-8 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-all flex items-center gap-2"
          >
            {isEnding ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Ending...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
                End Interview
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
