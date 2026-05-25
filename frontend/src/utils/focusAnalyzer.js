/**
 * FocusAnalyzer — Real-time face tracking for interview focus analysis
 * Uses MediaPipe FaceLandmarker to detect head pose, eye gaze, and face presence.
 * Computes a per-frame focus score (0–100) and aggregates over the interview.
 */

let FaceLandmarkerClass = null;
let FilesetResolverClass = null;

async function loadMediaPipe() {
  if (FaceLandmarkerClass) return true;
  try {
    const vision = await import('@mediapipe/tasks-vision');
    FaceLandmarkerClass = vision.FaceLandmarker;
    FilesetResolverClass = vision.FilesetResolver;
    return true;
  } catch (e) {
    console.warn('FocusAnalyzer: @mediapipe/tasks-vision not available', e);
    return false;
  }
}

export class FocusAnalyzer {
  constructor() {
    this.faceLandmarker = null;
    this.videoElement = null;
    this.intervalId = null;
    this.dataPoints = [];
    this.isRunning = false;
    this.lastScore = null;
    this.onScoreUpdate = null;
  }

  async init(videoElement) {
    this.videoElement = videoElement;
    try {
      const loaded = await loadMediaPipe();
      if (!loaded) return false;

      const vision = await FilesetResolverClass.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      );

      this.faceLandmarker = await FaceLandmarkerClass.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      });

      return true;
    } catch (error) {
      console.warn('FocusAnalyzer: Failed to initialize MediaPipe:', error);
      return false;
    }
  }

  start() {
    if (!this.faceLandmarker || !this.videoElement || this.isRunning) return;
    this.isRunning = true;
    this.intervalId = setInterval(() => this._analyzeFrame(), 500);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  _analyzeFrame() {
    if (!this.faceLandmarker || !this.videoElement) return;
    if (this.videoElement.readyState < 2) return;

    try {
      const result = this.faceLandmarker.detectForVideo(
        this.videoElement,
        performance.now()
      );

      let focusScore = 0;
      let facePresent = false;
      let lookingAway = false;

      if (result.faceLandmarks && result.faceLandmarks.length > 0) {
        facePresent = true;
        focusScore = 100;

        if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
          const shapes = result.faceBlendshapes[0].categories;
          const get = (name) =>
            shapes.find((s) => s.categoryName === name)?.score || 0;

          const gazeAway = Math.max(get('eyeLookOutLeft'), get('eyeLookOutRight'));
          const gazeUp = Math.max(get('eyeLookUpLeft'), get('eyeLookUpRight'));
          const gazeDown = Math.max(get('eyeLookDownLeft'), get('eyeLookDownRight'));

          // Head yaw from facial transformation matrix
          let headYaw = 0;
          if (result.facialTransformationMatrixes?.length > 0) {
            const m = result.facialTransformationMatrixes[0].data;
            headYaw =
              Math.abs(Math.asin(Math.max(-1, Math.min(1, m[8])))) *
              (180 / Math.PI);
          }

          if (gazeAway > 0.25) focusScore -= gazeAway * 45;
          if (gazeUp > 0.3) focusScore -= gazeUp * 30;
          if (gazeDown > 0.25) focusScore -= gazeDown * 20;
          if (headYaw > 15) focusScore -= (headYaw - 15) * 2;

          lookingAway = focusScore < 55;
        }

        focusScore = Math.max(0, Math.min(100, Math.round(focusScore)));
      }

      this.lastScore = focusScore;
      this.dataPoints.push({
        timestamp: Date.now(),
        focusScore,
        facePresent,
        lookingAway,
      });

      if (this.onScoreUpdate) {
        this.onScoreUpdate(focusScore, facePresent);
      }
    } catch (e) {
      // Silently fail individual frames
    }
  }

  getCurrentScore() {
    return this.lastScore;
  }

  getSummary() {
    if (this.dataPoints.length === 0) return null;

    const total = this.dataPoints.length;
    const avg = Math.round(
      this.dataPoints.reduce((s, d) => s + d.focusScore, 0) / total
    );
    const noFace = this.dataPoints.filter((d) => !d.facePresent).length;
    const away = this.dataPoints.filter((d) => d.lookingAway).length;

    let attentionDrops = 0;
    let consecutive = 0;
    for (const d of this.dataPoints) {
      if (d.focusScore < 40) {
        consecutive++;
        if (consecutive === 3) attentionDrops++;
      } else {
        consecutive = 0;
      }
    }

    // Downsample timeline to ~60 points max
    const step = Math.max(1, Math.floor(total / 60));
    const focusTimeline = this.dataPoints
      .filter((_, i) => i % step === 0)
      .map((d) => ({ t: d.timestamp, s: d.focusScore }));

    return {
      averageFocusScore: avg,
      totalDataPoints: total,
      faceNotDetectedPercent: Math.round((noFace / total) * 100),
      lookAwayPercent: Math.round((away / total) * 100),
      attentionDrops,
      focusTimeline,
    };
  }

  destroy() {
    this.stop();
    if (this.faceLandmarker) {
      this.faceLandmarker.close();
      this.faceLandmarker = null;
    }
    this.dataPoints = [];
  }
}
