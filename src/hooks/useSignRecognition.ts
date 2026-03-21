"use client";

/**
 * src/hooks/useSignRecognition.ts
 *
 * React hook for live ASL sign recognition via MediaPipe Hands.
 *
 * Flow:
 *   1. Caller passes a <video> and <canvas> ref to `start()`.
 *   2. HandTracker opens the webcam (via @mediapipe/camera_utils Camera class).
 *   3. On every frame, MediaPipe emits landmark data.
 *   4. classifySign() maps landmarks → sign name + confidence.
 *   5. A 500 ms debounce filter ("stabilisation") prevents flickering —
 *      only emitting a sign once it has been held continuously for 500 ms.
 *
 * Cleanup: stopping tracking or unmounting the component closes the camera
 * stream and releases MediaPipe resources.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { HandTracker }     from "@/lib/mediapipe/hand-tracker";
import { classifySign, getSupportedSigns } from "@/lib/mediapipe/sign-classifier";
import type { NormalizedLandmark } from "@/lib/mediapipe/hand-tracker";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseSignRecognitionReturn {
  /** True while the webcam and MediaPipe are active */
  isDetecting:    boolean;
  /** True while start() is initialising (WASM loading, camera permission) */
  isLoading:      boolean;
  /** The stabilised sign name, or null if no sign is held */
  currentSign:    string | null;
  /** Emoji for currentSign */
  currentEmoji:   string | null;
  /** Confidence score 0–1 for currentSign */
  confidence:     number;
  /** Number of hands currently visible in the frame */
  handsDetected:  number;
  /** Smoothed FPS of the MediaPipe tracking loop */
  fps:            number;
  /** Raw extension state [thumb, index, middle, ring, pinky] for debugging */
  fingerState:    [boolean, boolean, boolean, boolean, boolean] | null;
  /** Error message if camera or WASM initialisation failed */
  error:          string | null;
  /** Catalogue of all supported signs (for reference UI) */
  supportedSigns: ReturnType<typeof getSupportedSigns>;
  /** Start detection — requires video + canvas elements */
  start: (video: HTMLVideoElement, canvas: HTMLCanvasElement) => Promise<void>;
  /** Stop detection and release resources */
  stop:  () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const STABILISE_MS = 500; // sign must be held this long before being emitted

export function useSignRecognition(): UseSignRecognitionReturn {
  const [isDetecting,   setIsDetecting]   = useState(false);
  const [isLoading,     setIsLoading]     = useState(false);
  const [currentSign,   setCurrentSign]   = useState<string | null>(null);
  const [currentEmoji,  setCurrentEmoji]  = useState<string | null>(null);
  const [confidence,    setConfidence]    = useState(0);
  const [handsDetected, setHandsDetected] = useState(0);
  const [fps,           setFps]           = useState(0);
  const [fingerState,   setFingerState]   = useState<
    [boolean, boolean, boolean, boolean, boolean] | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const trackerRef    = useRef<HandTracker | null>(null);
  const fpsTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stabilisation state: pending candidate sign + when it was first seen
  const pendingRef    = useRef<{
    sign:       string;
    emoji:      string;
    confidence: number;
    since:      number;
  } | null>(null);

  // ── Frame handler ───────────────────────────────────────────────────────────

  const handleResults = useCallback(
    (result: {
      multiHandLandmarks: NormalizedLandmark[][];
      multiHandedness: Array<{ label: string; score: number }>;
    }) => {
      const hands = result.multiHandLandmarks ?? [];
      setHandsDetected(hands.length);

      if (hands.length === 0) {
        // No hands → clear pending candidate and emitted sign
        pendingRef.current = null;
        setCurrentSign(null);
        setCurrentEmoji(null);
        setConfidence(0);
        setFingerState(null);
        return;
      }

      // Use the first detected hand for classification
      const landmarks  = hands[0];
      const detection  = classifySign(landmarks);

      // Always update raw finger state for debugging overlay
      if (detection) {
        setFingerState(detection.extendedFingers);
      }

      if (!detection) {
        pendingRef.current = null;
        return;
      }

      const now = Date.now();

      if (pendingRef.current?.sign === detection.sign) {
        // Same sign is being held — check if it has been stable long enough
        if (now - pendingRef.current.since >= STABILISE_MS) {
          setCurrentSign(detection.sign);
          setCurrentEmoji(detection.emoji);
          setConfidence(detection.confidence);
        }
      } else {
        // New candidate — reset the stabilisation clock
        pendingRef.current = {
          sign:       detection.sign,
          emoji:      detection.emoji,
          confidence: detection.confidence,
          since:      now,
        };
      }
    },
    []
  );

  // ── start ───────────────────────────────────────────────────────────────────

  const start = useCallback(
    async (video: HTMLVideoElement, canvas: HTMLCanvasElement): Promise<void> => {
      if (trackerRef.current) return; // already running

      setIsLoading(true);
      setError(null);

      try {
        const tracker = new HandTracker();
        tracker.onResults(handleResults);
        trackerRef.current = tracker;

        await tracker.start(video, canvas);

        setIsDetecting(true);
        setIsLoading(false);

        // Poll FPS every 500 ms — avoids calling getFPS() on every frame
        fpsTimerRef.current = setInterval(() => {
          setFps(trackerRef.current?.getFPS() ?? 0);
        }, 500);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to start recognition.";
        setError(msg);
        setIsLoading(false);
        trackerRef.current?.stop();
        trackerRef.current = null;
      }
    },
    [handleResults]
  );

  // ── stop ────────────────────────────────────────────────────────────────────

  const stop = useCallback((): void => {
    trackerRef.current?.stop();
    trackerRef.current = null;

    if (fpsTimerRef.current) {
      clearInterval(fpsTimerRef.current);
      fpsTimerRef.current = null;
    }

    pendingRef.current = null;
    setIsDetecting(false);
    setIsLoading(false);
    setCurrentSign(null);
    setCurrentEmoji(null);
    setConfidence(0);
    setHandsDetected(0);
    setFps(0);
    setFingerState(null);
  }, []);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      trackerRef.current?.stop();
      if (fpsTimerRef.current) clearInterval(fpsTimerRef.current);
    };
  }, []);

  return {
    isDetecting,
    isLoading,
    currentSign,
    currentEmoji,
    confidence,
    handsDetected,
    fps,
    fingerState,
    error,
    supportedSigns: getSupportedSigns(),
    start,
    stop,
  };
}
