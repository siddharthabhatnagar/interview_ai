/**
 * SpeechAnalyzer — Analyzes candidate speech patterns from live transcript.
 * Tracks filler words, speaking pace (WPM), silence gaps, and vocabulary richness.
 * Works entirely from transcript text — no audio processing needed.
 */

const FILLER_WORDS = [
  'um', 'uh', 'uhh', 'umm', 'hmm', 'hm',
  'like', 'basically', 'actually', 'literally',
  'you know', 'i mean', 'sort of', 'kind of',
  'right', 'okay so', 'so yeah', 'yeah so',
];

// Regex for each filler (word-boundary aware)
const FILLER_PATTERNS = FILLER_WORDS.map((f) => ({
  word: f,
  regex: new RegExp(`\\b${f.replace(/ /g, '\\s+')}\\b`, 'gi'),
}));

export class SpeechAnalyzer {
  constructor() {
    this.entries = []; // { text, timestamp, wordCount, fillers }
    this.silenceGaps = []; // { startTime, endTime, durationMs }
    this.lastSpeechTimestamp = null;
  }

  /**
   * Feed a new candidate transcript segment.
   * Call this every time a user speech segment is finalized.
   */
  addEntry(text, timestamp) {
    if (!text || typeof text !== 'string') return;

    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Detect silence gap since last speech
    if (this.lastSpeechTimestamp && timestamp) {
      const gap = timestamp - this.lastSpeechTimestamp;
      if (gap > 3000) {
        this.silenceGaps.push({
          startTime: this.lastSpeechTimestamp,
          endTime: timestamp,
          durationMs: gap,
        });
      }
    }
    if (timestamp) this.lastSpeechTimestamp = timestamp;

    // Count fillers in this segment
    const fillers = {};
    let totalFillers = 0;
    for (const { word, regex } of FILLER_PATTERNS) {
      const matches = text.match(regex);
      if (matches) {
        fillers[word] = matches.length;
        totalFillers += matches.length;
      }
    }

    this.entries.push({ text, timestamp, wordCount, fillers, totalFillers });
  }

  /**
   * Return full speech analytics summary.
   */
  getSummary() {
    if (this.entries.length === 0) return null;

    const totalWords = this.entries.reduce((s, e) => s + e.wordCount, 0);
    const totalFillers = this.entries.reduce((s, e) => s + e.totalFillers, 0);

    // Aggregate filler counts
    const fillerBreakdown = {};
    for (const entry of this.entries) {
      for (const [word, count] of Object.entries(entry.fillers)) {
        fillerBreakdown[word] = (fillerBreakdown[word] || 0) + count;
      }
    }

    // Top fillers sorted by frequency
    const topFillers = Object.entries(fillerBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }));

    // Calculate speaking duration from first to last entry
    const timestamps = this.entries.filter((e) => e.timestamp).map((e) => e.timestamp);
    let speakingDurationMin = 0;
    if (timestamps.length >= 2) {
      speakingDurationMin = (timestamps[timestamps.length - 1] - timestamps[0]) / 60000;
    }

    // Words per minute
    const wordsPerMinute =
      speakingDurationMin > 0.5 ? Math.round(totalWords / speakingDurationMin) : null;

    // Filler rate per 100 words
    const fillerRate = totalWords > 0 ? Math.round((totalFillers / totalWords) * 100 * 10) / 10 : 0;

    // Silence analysis
    const totalSilenceMs = this.silenceGaps.reduce((s, g) => s + g.durationMs, 0);
    const avgSilenceMs =
      this.silenceGaps.length > 0 ? Math.round(totalSilenceMs / this.silenceGaps.length) : 0;
    const longPauses = this.silenceGaps.filter((g) => g.durationMs > 8000).length;

    // Vocabulary richness — unique words / total words
    const allWords = this.entries
      .flatMap((e) => e.text.toLowerCase().split(/\s+/).filter(Boolean));
    const uniqueWords = new Set(allWords).size;
    const vocabularyRichness = totalWords > 0 ? Math.round((uniqueWords / totalWords) * 100) : 0;

    // Derive a communication score (0-100)
    let communicationScore = 80;
    if (fillerRate > 5) communicationScore -= 15;
    else if (fillerRate > 3) communicationScore -= 8;
    else if (fillerRate > 1.5) communicationScore -= 3;

    if (wordsPerMinute && (wordsPerMinute < 80 || wordsPerMinute > 200)) communicationScore -= 10;
    if (longPauses > 3) communicationScore -= 10;
    else if (longPauses > 1) communicationScore -= 5;

    if (vocabularyRichness > 50) communicationScore += 10;
    else if (vocabularyRichness < 25) communicationScore -= 5;

    communicationScore = Math.max(0, Math.min(100, communicationScore));

    return {
      totalWords,
      totalFillers,
      fillerRate,
      topFillers,
      wordsPerMinute,
      silenceGaps: this.silenceGaps.length,
      longPauses,
      avgSilenceSec: Math.round(avgSilenceMs / 1000),
      vocabularyRichness,
      communicationScore,
    };
  }

  reset() {
    this.entries = [];
    this.silenceGaps = [];
    this.lastSpeechTimestamp = null;
  }
}
