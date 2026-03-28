"use client";

/**
 * src/app/test/sign/page.tsx
 *
 * Live test page for MediaPipe Hands + ASL sign classifier.
 * Visit http://localhost:3000/test/sign after `npm run dev`.
 *
 * Layout:
 *  - Left column: mirrored webcam video with landmark canvas overlay
 *  - Right column: current sign, history, stats, start/stop
 *  - Bottom: reference grid of all supported signs
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, CameraOff, Activity, Info } from "lucide-react";
import { useSignRecognition } from "@/hooks/useSignRecognition";

// ─── Finger indicator ─────────────────────────────────────────────────────────

function FingerDots({
  state,
}: {
  state: [boolean, boolean, boolean, boolean, boolean] | null;
}) {
  const labels = ["T", "I", "M", "R", "P"];
  return (
    <div className="flex items-center gap-2" aria-label="Extended finger state">
      {labels.map((label, i) => (
        <div key={label} className="flex flex-col items-center gap-1">
          <span
            className={`w-3 h-3 rounded-full border transition-colors duration-150 ${
              state?.[i]
                ? "bg-cyan-400 border-cyan-300"
                : "bg-slate-700 border-slate-600"
            }`}
            aria-label={`${label}: ${state?.[i] ? "extended" : "closed"}`}
          />
          <span className="text-[10px] text-slate-500">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Sign reference card ──────────────────────────────────────────────────────

function SignCard({
  emoji,
  name,
  pattern,
  active,
}: {
  emoji:   string;
  name:    string;
  pattern: [boolean, boolean, boolean, boolean, boolean];
  active:  boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
        active
          ? "border-cyan-400 bg-cyan-500/10 scale-105"
          : "border-slate-700/60 bg-slate-800/40 hover:border-slate-600"
      }`}
      aria-current={active ? "true" : undefined}
    >
      <span className="text-2xl" role="img" aria-label={name}>
        {emoji}
      </span>
      <span className="text-xs text-slate-300 font-medium text-center leading-tight">
        {name}
      </span>
      {/* Mini finger pattern indicator */}
      <div className="flex gap-0.5">
        {pattern.map((ext, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full ${ext ? "bg-cyan-400" : "bg-slate-700"}`}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

// ─── Sign history chip ────────────────────────────────────────────────────────

function HistoryChip({ sign, emoji }: { sign: string; emoji: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-700 bg-slate-800/60 text-slate-300">
      <span role="img" aria-label={sign}>{emoji}</span>
      {sign}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignTestPage() {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sign history: last 10 distinct detections
  const [history, setHistory] = useState<Array<{ sign: string; emoji: string }>>([]);
  const prevSignRef = useRef<string | null>(null);

  const {
    isDetecting,
    isLoading,
    currentSign,
    currentEmoji,
    confidence,
    handsDetected,
    fps,
    fingerState,
    error,
    supportedSigns,
    start,
    stop,
  } = useSignRecognition();

  // Update history when sign changes
  useEffect(() => {
    if (currentSign && currentEmoji && currentSign !== prevSignRef.current) {
      prevSignRef.current = currentSign;
      setHistory((prev) =>
        [{ sign: currentSign, emoji: currentEmoji }, ...prev].slice(0, 10)
      );
    }
    if (!currentSign) {
      prevSignRef.current = null;
    }
  }, [currentSign, currentEmoji]);

  const handleToggle = useCallback(async () => {
    if (isDetecting) {
      stop();
    } else {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas) await start(video, canvas);
    }
  }, [isDetecting, start, stop]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Skip link */}
      <a
        href="#sign-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50
          focus:px-4 focus:py-2 focus:rounded-lg focus:bg-cyan-400 focus:text-slate-900
          focus:font-semibold focus:outline-none"
      >
        Skip to main content
      </a>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-400 font-semibold mb-0.5">
              SignBridge AI &middot; Dev Tools
            </p>
            <h1 className="text-xl font-bold">
              Sign Language{" "}
              <span className="gradient-text">Live Test</span>
            </h1>
          </div>

          {/* Status badge */}
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${
              isLoading
                ? "text-yellow-400 border-yellow-700/50 bg-yellow-900/20"
                : isDetecting
                ? "text-green-400 border-green-700/50 bg-green-900/20"
                : "text-slate-400 border-slate-700 bg-slate-800/60"
            }`}
            role="status"
            aria-live="polite"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLoading
                  ? "bg-yellow-400 animate-pulse"
                  : isDetecting
                  ? "bg-green-400 animate-pulse"
                  : "bg-slate-500"
              }`}
              aria-hidden="true"
            />
            {isLoading ? "Loading…" : isDetecting ? "Detecting" : "Idle"}
          </span>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main id="sign-main" className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* ── Left: Camera ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div
              className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/60"
              style={{ aspectRatio: "4/3" }}
            >
              {/* Video — mirrored so it matches a mirror */}
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
                autoPlay
                playsInline
                muted
                aria-label="Webcam feed"
              />

              {/* Landmark canvas — also mirrored to match the video */}
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ transform: "scaleX(-1)" }}
                aria-hidden="true"
              />

              {/* Green border when hand(s) detected */}
              {handsDetected > 0 && (
                <div
                  className="absolute inset-0 rounded-2xl border-2 border-green-400 pointer-events-none"
                  aria-hidden="true"
                />
              )}

              {/* Idle overlay — shown when camera is off */}
              {!isDetecting && !isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/90">
                  <Camera className="w-12 h-12 text-slate-600" />
                  <p className="text-slate-400 text-sm">Camera is off</p>
                </div>
              )}

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/80">
                  <Activity className="w-10 h-10 text-cyan-400 animate-pulse" />
                  <p className="text-slate-300 text-sm">
                    Loading MediaPipe WASM &amp; opening camera…
                  </p>
                </div>
              )}

              {/* FPS counter */}
              {isDetecting && (
                <div
                  className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/50 text-xs text-slate-300 font-mono"
                  aria-label={`Tracking speed: ${fps} frames per second`}
                >
                  {fps} fps
                </div>
              )}

              {/* Hand count */}
              {isDetecting && (
                <div
                  className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-medium ${
                    handsDetected > 0
                      ? "bg-green-900/70 text-green-300"
                      : "bg-black/50 text-slate-400"
                  }`}
                  role="status"
                  aria-live="polite"
                  aria-label={`${handsDetected} hand${handsDetected !== 1 ? "s" : ""} detected`}
                >
                  {handsDetected === 0
                    ? "No hands"
                    : handsDetected === 1
                    ? "1 hand"
                    : "2 hands"}
                </div>
              )}
            </div>

            {/* Start / Stop button */}
            <button
              onClick={handleToggle}
              disabled={isLoading}
              aria-label={isDetecting ? "Stop sign recognition" : "Start sign recognition"}
              className={`w-full py-3 rounded-2xl font-semibold text-base transition-all duration-200
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                focus-visible:outline-cyan-400 disabled:cursor-wait disabled:opacity-60
                flex items-center justify-center gap-2
                ${
                  isDetecting
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "text-slate-900 hover:scale-[1.02] active:scale-95"
                }`}
              style={
                !isDetecting
                  ? { background: "linear-gradient(135deg,#06b6d4,#a78bfa)" }
                  : undefined
              }
            >
              {isDetecting ? (
                <>
                  <CameraOff className="w-5 h-5" aria-hidden="true" />
                  Stop Detection
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" aria-hidden="true" />
                  Start Detection
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-700/50 bg-red-900/20 px-4 py-3 text-sm text-red-300"
              >
                <span className="font-semibold text-red-400">Error:</span> {error}
              </div>
            )}
          </div>

          {/* ── Right: Detection panel ────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Current sign — big display */}
            <div
              className="rounded-2xl border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm p-8 text-center space-y-3"
              aria-live="polite"
              aria-atomic="true"
              aria-label={
                currentSign
                  ? `Current sign: ${currentSign}, confidence ${Math.round(confidence * 100)} percent`
                  : "No sign detected"
              }
            >
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                Detected Sign
              </p>

              {currentSign ? (
                <>
                  <p
                    className="text-7xl"
                    role="img"
                    aria-label={currentSign}
                  >
                    {currentEmoji}
                  </p>
                  <p className="text-2xl font-bold gradient-text">{currentSign}</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <div className="h-2 rounded-full bg-slate-700 flex-1 max-w-[120px] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-300"
                        style={{ width: `${Math.round(confidence * 100)}%` }}
                        role="meter"
                        aria-valuenow={Math.round(confidence * 100)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Confidence"
                      />
                    </div>
                    <span className="text-sm text-slate-400 tabular-nums">
                      {Math.round(confidence * 100)}%
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-slate-600 italic text-sm pt-4">
                  {isDetecting ? "Make a sign with your hand…" : "Start detection to begin."}
                </p>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-3 space-y-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Hands</p>
                <p className="text-2xl font-bold text-slate-200 tabular-nums">
                  {handsDetected}
                  <span className="text-slate-500 text-sm font-normal"> / 2</span>
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-3 space-y-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider">FPS</p>
                <p className="text-2xl font-bold text-slate-200 tabular-nums">
                  {fps}
                  <span className="text-slate-500 text-sm font-normal"> fps</span>
                </p>
              </div>
            </div>

            {/* Finger state debug */}
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider flex-1">
                  Finger State
                </p>
                <Info className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
              </div>
              <FingerDots state={fingerState} />
              <p className="text-[10px] text-slate-600">
                T=Thumb, I=Index, M=Middle, R=Ring, P=Pinky &mdash; cyan = extended
              </p>
            </div>

            {/* Sign history */}
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-3 space-y-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                History (last 10)
              </p>
              {history.length > 0 ? (
                <div
                  className="flex flex-wrap gap-2"
                  role="log"
                  aria-label="Sign detection history"
                >
                  {history.map((item, i) => (
                    <HistoryChip
                      key={`${item.sign}-${i}`}
                      sign={item.sign}
                      emoji={item.emoji}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 italic text-xs">
                  No signs detected yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Sign reference grid ─────────────────────────────────────────── */}
        <section aria-labelledby="ref-heading">
          <div className="mb-5">
            <h2
              id="ref-heading"
              className="text-lg font-semibold text-white"
            >
              Supported Signs
              <span className="ml-2 text-sm text-slate-400 font-normal">
                ({supportedSigns.length} signs &mdash; hold each for 500 ms to register)
              </span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              The coloured dots below each sign show which fingers must be extended
              [Thumb · Index · Middle · Ring · Pinky].
            </p>
          </div>

          <ul
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 list-none p-0"
            aria-label="Reference grid of supported ASL signs"
          >
            {supportedSigns.map((sign) => (
              <li key={sign.name}>
                <SignCard
                  emoji={sign.emoji}
                  name={sign.name}
                  pattern={sign.pattern}
                  active={currentSign === sign.name}
                />
              </li>
            ))}
          </ul>
        </section>

        {/* ── How-to ──────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="howto-sign"
          className="rounded-2xl border border-slate-700/40 bg-slate-800/20 px-5 py-5 space-y-3"
        >
          <h2
            id="howto-sign"
            className="text-sm font-semibold text-slate-300"
          >
            How it works
          </h2>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-400">
            <li>
              <span className="text-slate-300">WASM loading</span> &mdash; on
              first start, MediaPipe Hands (~8 MB) loads from the CDN. Subsequent
              starts are instant (browser cache).
            </li>
            <li>
              <span className="text-slate-300">Landmark detection</span> &mdash;
              MediaPipe tracks 21 3D landmarks per hand at up to 30 fps.
            </li>
            <li>
              <span className="text-slate-300">Rule-based classifier</span>
              &mdash; extension of each finger is determined by
              distance(tip, wrist) &gt; distance(pip, wrist) &times; 1.1. Each sign
              is a unique 5-finger pattern.
            </li>
            <li>
              <span className="text-slate-300">Stabilisation</span> &mdash; a
              sign must be held for 500 ms before it is emitted, preventing
              flickering as you transition between signs.
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}
