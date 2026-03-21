"use client";

/**
 * src/components/SignAvatar.tsx  (v3 — RPM GLB avatar)
 *
 * React wrapper for AvatarEngine v3.
 * Shows a loading progress bar while the GLB downloads,
 * a helpful error if the file is missing, and the 3D avatar once ready.
 */

import {
  useEffect, useRef, useState, useCallback,
  forwardRef, useImperativeHandle,
} from "react";

// ─── Handle ──────────────────────────────────────────────────────────────────

export interface SignAvatarHandle {
  playSign(signId: string):        Promise<void>;
  playSequence(signIds: string[]): Promise<void>;
  fingerspell(word: string):       Promise<void>;
  playMixedSequence(
    items: import("../lib/avatar/sign-animations").SignSequenceItem[],
    onProgress?: (index: number, item: import("../lib/avatar/sign-animations").SignSequenceItem, letterIndex?: number) => void,
  ): Promise<void>;
  setSkinTone(tone: "light" | "medium" | "dark"): void;
  setSpeed(mult: number):          void;
  setRestPose():                   void;
  setStaticPose(pose: {
    rightArm?:  import("../lib/avatar/sign-animations").ArmPose;
    leftArm?:   import("../lib/avatar/sign-animations").ArmPose;
    rightHand?: import("../lib/avatar/sign-animations").HandPose;
    leftHand?:  import("../lib/avatar/sign-animations").HandPose;
  }): void;
  clearStaticPose(): void;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SignAvatarProps {
  skinTone?:    "light" | "medium" | "dark";
  speed?:       number;
  className?:   string;
  style?:       React.CSSProperties;
  onSignStart?: (name: string) => void;
  onSignEnd?:   ()             => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const SignAvatar = forwardRef<SignAvatarHandle, SignAvatarProps>(
  ({ skinTone = "medium", speed = 1, className = "", style, onSignStart, onSignEnd }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef    = useRef<import("../lib/avatar/avatar-engine").AvatarEngine | null>(null);

    const [loadPct,    setLoadPct]    = useState(0);
    const [loaded,     setLoaded]     = useState(false);
    const [error,      setError]      = useState<string | null>(null);
    const [signLabel,  setSignLabel]  = useState<string | null>(null);
    const [showLabel,  setShowLabel]  = useState(false);
    const [animating,  setAnimating]  = useState(false);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useImperativeHandle(ref, () => ({
      playSign:          (id)            => engineRef.current?.playSign(id)                    ?? Promise.resolve(),
      playSequence:      (ids)           => engineRef.current?.playSequence(ids)               ?? Promise.resolve(),
      fingerspell:       (word)          => engineRef.current?.fingerspell(word)               ?? Promise.resolve(),
      playMixedSequence: (items, onProg) => engineRef.current?.playMixedSequence(items, onProg) ?? Promise.resolve(),
      setSkinTone:       (t)             => engineRef.current?.setSkinTone(t),
      setSpeed:          (m)             => engineRef.current?.setSpeed(m),
      setRestPose:       ()              => engineRef.current?.setRestPose(),
      setStaticPose:     (pose)          => engineRef.current?.setStaticPose(pose),
      clearStaticPose:   ()              => engineRef.current?.clearStaticPose(),
    }));

    const handleSignStart = useCallback((name: string) => {
      setSignLabel(name);
      setShowLabel(true);
      setAnimating(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      onSignStart?.(name);
    }, [onSignStart]);

    const handleSignEnd = useCallback(() => {
      setAnimating(false);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setShowLabel(false), 1000);
      onSignEnd?.();
    }, [onSignEnd]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      let engine: import("../lib/avatar/avatar-engine").AvatarEngine;
      let dead = false;

      import("../lib/avatar/avatar-engine").then(({ AvatarEngine }) => {
        if (dead) return;
        engine = new AvatarEngine(container, { skinTone, speed });
        engine.onProgress  = (pct) => !dead && setLoadPct(pct);
        engine.onLoad      = ()    => !dead && setLoaded(true);
        engine.onError     = (msg) => !dead && setError(msg);
        engine.onSignStart = handleSignStart;
        engine.onSignEnd   = handleSignEnd;
        engineRef.current  = engine;
      });

      return () => {
        dead = true;
        engine?.dispose();
        engineRef.current = null;
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { engineRef.current?.setSkinTone(skinTone); }, [skinTone]);
    useEffect(() => { engineRef.current?.setSpeed(speed); },      [speed]);
    useEffect(() => {
      if (!engineRef.current) return;
      engineRef.current.onSignStart = handleSignStart;
      engineRef.current.onSignEnd   = handleSignEnd;
    }, [handleSignStart, handleSignEnd]);

    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{
          background: "radial-gradient(ellipse at 50% 80%, #1e293b 0%, #0f172a 100%)",
          borderRadius: "1rem",
          border: animating
            ? "2px solid rgba(6,182,212,0.6)"
            : "2px solid rgba(255,255,255,0.07)",
          boxShadow: animating
            ? "0 0 28px rgba(6,182,212,0.18), inset 0 0 40px rgba(6,182,212,0.05)"
            : "none",
          transition: "border 0.3s, box-shadow 0.3s",
          ...style,
        }}
      >
        {/* Three.js mounts here */}
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

        {/* ── Loading overlay ── */}
        {!loaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
            <div style={{ color: "#67e8f9", fontSize: "2rem" }}>🤟</div>
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
              Loading 3D Avatar…
            </p>
            {/* Progress bar */}
            <div style={{ width: 180, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 9999 }}>
              <div
                style={{
                  width: `${loadPct}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #06b6d4, #7c3aed)",
                  borderRadius: 9999,
                  transition: "width 0.3s",
                }}
              />
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{loadPct}%</p>
          </div>
        )}

        {/* ── Error overlay ── */}
        {error && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 z-10 text-center"
            style={{ background: "rgba(15,23,42,0.95)" }}
          >
            <div style={{ fontSize: "2rem" }}>⚠️</div>
            <p className="text-sm font-semibold" style={{ color: "#f87171" }}>
              Avatar model not found
            </p>
            <p className="text-xs leading-relaxed max-w-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              Run <code className="font-mono bg-white/10 px-1 rounded">npm run download-avatar</code>{" "}
              in your terminal, then reload this page.
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              Or place a Ready Player Me GLB at{" "}
              <code className="font-mono bg-white/10 px-1 rounded">public/models/avatar/avatar.glb</code>
            </p>
          </div>
        )}

        {/* ── Sign label ── */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-20"
          style={{ transition: "opacity 0.3s", opacity: showLabel ? 1 : 0 }}
        >
          <span
            style={{
              background:     "rgba(6,182,212,0.12)",
              border:         "1px solid rgba(6,182,212,0.45)",
              backdropFilter: "blur(8px)",
              borderRadius:   "9999px",
              padding:        "0.3rem 1.2rem",
              color:          "#67e8f9",
              fontSize:       "1.05rem",
              fontWeight:     600,
              letterSpacing:  "0.05em",
              textShadow:     "0 0 10px rgba(6,182,212,0.4)",
            }}
          >
            {signLabel ?? ""}
          </span>
        </div>

        {/* Idle indicator */}
        {loaded && !animating && (
          <div
            className="absolute top-3 right-3 text-xs pointer-events-none z-20"
            style={{ color: "rgba(103,232,249,0.25)" }}
          >
            idle
          </div>
        )}
      </div>
    );
  }
);

SignAvatar.displayName = "SignAvatar";
export default SignAvatar;
