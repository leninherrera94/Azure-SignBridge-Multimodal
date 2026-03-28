/**
 * src/lib/mediapipe/hand-tracker.ts
 *
 * Browser-only class that wraps MediaPipe Hands for live webcam landmark detection.
 *
 * Design choices:
 *  - Everything is dynamically imported so this module is safe to import from
 *    Next.js server components (the heavy WASM only loads in the browser).
 *  - Model files are loaded from the MediaPipe CDN via `locateFile` to avoid
 *    bundling the 8 MB WASM blobs into the Next.js bundle.
 *  - Canvas drawing uses plain Canvas2D so no @mediapipe/drawing_utils runtime
 *    dependency is needed (avoids a second CDN round-trip).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface HandsResult {
  /** Normalized (0-1) landmarks per detected hand, wrist-relative. */
  multiHandLandmarks: NormalizedLandmark[][];
  /** "Left" or "Right" per detected hand, from MediaPipe's perspective. */
  multiHandedness: Array<{ label: "Left" | "Right"; score: number }>;
}

export type ResultsCallback = (result: HandsResult) => void;

// ─── Landmark connections for drawing ────────────────────────────────────────
//
// Matches MediaPipe's HAND_CONNECTIONS constant exactly so the skeleton
// looks identical to the reference visualisation.

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],           // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],           // index
  [0, 9], [9, 10], [10, 11], [11, 12],       // middle
  [0, 13], [13, 14], [14, 15], [15, 16],     // ring
  [0, 17], [17, 18], [18, 19], [19, 20],     // pinky
  [5, 9], [9, 13], [13, 17],                 // palm arch
];

const FINGERTIP_INDICES = new Set([4, 8, 12, 16, 20]);

// ─── HandTracker class ────────────────────────────────────────────────────────

export class HandTracker {
  private handsInstance: unknown = null;
  private cameraInstance: { stop(): void } | null = null;
  private resultsCallback: ResultsCallback | null = null;
  private stopped = false;

  // FPS tracking — rolling average over last 10 frames
  private frameTimes: number[] = [];
  private lastFrameAt = 0;

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Register a callback that fires for every processed frame. */
  onResults(cb: ResultsCallback): void {
    this.resultsCallback = cb;
  }

  /**
   * Start hand tracking.
   *
   * @param video  - An HTMLVideoElement that will receive the webcam stream.
   * @param canvas - An HTMLCanvasElement for the landmark overlay (same size).
   */
  async start(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement
  ): Promise<void> {
    this.stopped = false;

    // Dynamic imports — runs only in the browser
    const [handsModule, cameraModule] = await Promise.all([
      import("@mediapipe/hands"),
      import("@mediapipe/camera_utils"),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const HandsClass = (handsModule as any).Hands;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CameraClass = (cameraModule as any).Camera;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D canvas context.");

    // ── Initialize MediaPipe Hands ──────────────────────────────────────────

    const hands = new HandsClass({
      // Load model + WASM from CDN — keeps the webpack bundle small
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`,
    });

    hands.setOptions({
      maxNumHands:             2,
      modelComplexity:         1,
      minDetectionConfidence:  0.7,
      minTrackingConfidence:   0.5,
    });

    hands.onResults((results: HandsResult) => {
      if (this.stopped) return;

      // FPS
      const now = performance.now();
      if (this.lastFrameAt > 0) {
        this.frameTimes.push(now - this.lastFrameAt);
        if (this.frameTimes.length > 10) this.frameTimes.shift();
      }
      this.lastFrameAt = now;

      // Draw overlay
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const landmarks of results.multiHandLandmarks ?? []) {
        this.drawConnections(ctx, landmarks, canvas.width, canvas.height);
        this.drawLandmarks(ctx, landmarks, canvas.width, canvas.height);
      }

      this.resultsCallback?.(results);
    });

    this.handsInstance = hands;

    // ── Camera loop ─────────────────────────────────────────────────────────

    const camera = new CameraClass(video, {
      onFrame: async () => {
        if (!this.stopped) {
          await hands.send({ image: video });
        }
      },
      width:  640,
      height: 480,
    });

    this.cameraInstance = camera;
    await camera.start();
  }

  /** Stop recognition and release the camera stream. */
  stop(): void {
    this.stopped = true;
    this.cameraInstance?.stop();
    (this.handsInstance as { close?(): void })?.close?.();
    this.handsInstance = null;
    this.cameraInstance = null;
    this.frameTimes = [];
  }

  /** Returns the smoothed FPS based on the last 10 inter-frame intervals. */
  getFPS(): number {
    if (this.frameTimes.length < 2) return 0;
    const avg = this.frameTimes.reduce((s, t) => s + t, 0) / this.frameTimes.length;
    return Math.round(1000 / avg);
  }

  // ── Canvas drawing ─────────────────────────────────────────────────────────

  private drawConnections(
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    w: number,
    h: number
  ): void {
    ctx.strokeStyle = "#06b6d4"; // cyan-400
    ctx.lineWidth   = 2;
    ctx.lineCap     = "round";

    for (const [a, b] of HAND_CONNECTIONS) {
      const la = landmarks[a];
      const lb = landmarks[b];
      if (!la || !lb) continue;
      ctx.beginPath();
      ctx.moveTo(la.x * w, la.y * h);
      ctx.lineTo(lb.x * w, lb.y * h);
      ctx.stroke();
    }
  }

  private drawLandmarks(
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    w: number,
    h: number
  ): void {
    for (let i = 0; i < landmarks.length; i++) {
      const lm   = landmarks[i];
      const isTip = FINGERTIP_INDICES.has(i);
      const r    = isTip ? 7 : 4;

      ctx.beginPath();
      ctx.arc(lm.x * w, lm.y * h, r, 0, 2 * Math.PI);
      // Finger tips: purple; knuckles/wrist: white with slight transparency
      ctx.fillStyle = isTip ? "#a78bfa" : "rgba(255,255,255,0.85)";
      ctx.fill();

      // Outline for contrast on varied backgrounds
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth   = 1;
      ctx.stroke();
    }
  }
}
