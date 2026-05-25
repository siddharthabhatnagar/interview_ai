/**
 * Speech Analytics — Analyzes transcript for filler words, speaking pace,
 * response times, and derives clarity/pace scores.
 */

const FILLER_WORDS = [
  'um', 'uh', 'like', 'you know', 'basically', 'actually',
  'literally', 'sort of', 'kind of', 'i mean', 'right',
  'so yeah', 'you see', 'well', 'okay so',
];

export function analyzeSpeechPatterns(transcript) {
  if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
    return null;
  }

  const userEntries = transcript.filter(
    (t) => t.role === 'user' || t.role === 'candidate'
  );

  if (userEntries.length === 0) return null;

  // Filler word analysis
  let totalFillers = 0;
  const fillerBreakdown = {};
  let totalWords = 0;

  userEntries.forEach((entry) => {
    const text = (entry.text || '').toLowerCase();
    const words = text.split(/\s+/).filter((w) => w);
    totalWords += words.length;

    FILLER_WORDS.forEach((filler) => {
      const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        totalFillers += matches.length;
        fillerBreakdown[filler] =
          (fillerBreakdown[filler] || 0) + matches.length;
      }
    });
  });

  // Speaking pace (WPM) — based on user speaking time
  let totalSpeakingMs = 0;
  if (userEntries.length >= 2) {
    for (let i = 0; i < userEntries.length - 1; i++) {
      const gap = userEntries[i + 1].timestamp - userEntries[i].timestamp;
      if (gap > 0 && gap < 60000) {
        totalSpeakingMs += gap;
      }
    }
  }
  // Fallback: use first to last timestamp
  if (totalSpeakingMs === 0 && userEntries.length >= 2) {
    totalSpeakingMs =
      userEntries[userEntries.length - 1].timestamp - userEntries[0].timestamp;
  }

  const totalSpeakingSeconds = totalSpeakingMs / 1000;
  const wordsPerMinute =
    totalSpeakingSeconds > 10
      ? Math.round((totalWords / totalSpeakingSeconds) * 60)
      : 0;

  // Response time analysis — time between interviewer finishing and user starting
  const pauses = [];
  for (let i = 0; i < transcript.length - 1; i++) {
    const curr = transcript[i];
    const next = transcript[i + 1];
    if (
      (curr.role === 'interviewer' || curr.role === 'agent') &&
      (next.role === 'user' || next.role === 'candidate')
    ) {
      const pauseMs = next.timestamp - curr.timestamp;
      if (pauseMs > 0 && pauseMs < 120000) {
        pauses.push(pauseMs);
      }
    }
  }

  const avgResponseTime =
    pauses.length > 0
      ? Math.round(pauses.reduce((a, b) => a + b, 0) / pauses.length / 1000)
      : 0;

  const longestPause =
    pauses.length > 0 ? Math.round(Math.max(...pauses) / 1000) : 0;

  // Clarity score (inverse of filler ratio, 0–100)
  const fillerRatio = totalWords > 0 ? totalFillers / totalWords : 0;
  const clarityScore = Math.max(
    0,
    Math.min(100, Math.round(100 - fillerRatio * 500))
  );

  // Pace score (ideal 120–150 WPM)
  let paceScore = 100;
  if (wordsPerMinute === 0) paceScore = 0;
  else if (wordsPerMinute < 80) paceScore = 50;
  else if (wordsPerMinute < 100) paceScore = 70;
  else if (wordsPerMinute < 120) paceScore = 85;
  else if (wordsPerMinute <= 160) paceScore = 100;
  else if (wordsPerMinute <= 180) paceScore = 80;
  else paceScore = 60;

  return {
    totalWords,
    totalFillers,
    fillerBreakdown,
    fillerRatio: Math.round(fillerRatio * 100) / 100,
    wordsPerMinute,
    avgResponseTime,
    longestPause,
    clarityScore,
    paceScore,
    overallSpeechScore: Math.round((clarityScore + paceScore) / 2),
  };
}
