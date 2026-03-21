"use client";

/**
 * src/app/test/avatar/page.tsx  (v3 — RPM GLB avatar)
 * Route: http://localhost:3000/test/avatar
 */

import { useRef, useState, useCallback } from "react";
import SignAvatar, { type SignAvatarHandle } from "@/components/SignAvatar";
import { textToSignIds } from "@/lib/avatar/sign-animations";

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    label: "Greetings",
    signs: [
      { id: "hello",     emoji: "👋", name: "Hello" },
      { id: "thank_you", emoji: "🙏", name: "Thank You" },
      { id: "good",      emoji: "👍", name: "Good" },
      { id: "sorry",     emoji: "💙", name: "Sorry" },
    ],
  },
  {
    label: "Responses",
    signs: [
      { id: "yes",    emoji: "✅", name: "Yes" },
      { id: "no",     emoji: "🚫", name: "No" },
      { id: "stop",   emoji: "✋", name: "Stop" },
      { id: "please", emoji: "🤲", name: "Please" },
      { id: "help",   emoji: "🆘", name: "Help" },
    ],
  },
  {
    label: "Expressions",
    signs: [
      { id: "i_love_you", emoji: "🤟", name: "I Love You" },
    ],
  },
  {
    label: "Numbers",
    signs: [
      { id: "one",   emoji: "☝️",  name: "1" },
      { id: "two",   emoji: "✌️",  name: "2" },
      { id: "three", emoji: "🤟",  name: "3" },
      { id: "four",  emoji: "🖖",  name: "4" },
      { id: "five",  emoji: "🖐️", name: "5" },
    ],
  },
];

const ALL_SIGNS = CATEGORIES.flatMap((c) => c.signs);
const DEMO_SEQUENCE = ["hello", "i_love_you", "thank_you"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AvatarTestPage() {
  const avatarRef = useRef<SignAvatarHandle>(null);

  const [activeSign,  setActiveSign]  = useState<string | null>(null);
  const [skinTone,    setSkinTone]    = useState<"light" | "medium" | "dark">("medium");
  const [speed,       setSpeed]       = useState(1);
  const [textInput,   setTextInput]   = useState("");
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [phrase,      setPhrase]      = useState<string[]>([]);   // full sign sequence
  const [phraseIdx,   setPhraseIdx]   = useState(-1);             // currently signing word
  const [statusMsg,   setStatusMsg]   = useState("");
  const [openCats,    setOpenCats]    = useState<Record<string, boolean>>({ Greetings: true, Responses: true, Expressions: true, Numbers: true });

  // ── Calibration tool state ─────────────────────────────────────────────────
  const [calOpen,     setCalOpen]     = useState(false);
  const [calJson,     setCalJson]     = useState("");
  const [calMsg,      setCalMsg]      = useState("");
  const [calSign,     setCalSign]     = useState("hello");

  const SIGN_IDS = ALL_SIGNS.map((s) => s.id);

  /** Parse COPY POSE JSON from debug page into engine-compatible pose */
  function parseCopyPose(raw: string) {
    try {
      const p = JSON.parse(raw);
      const fc = (deg: number) => ({ metacarpal: [deg,0,0] as [number,number,number], proximal: [deg,0,0] as [number,number,number], distal: [deg,0,0] as [number,number,number] });
      const fingers = (f: Record<string, number>) => ({
        thumb:  fc(f.thumb  ?? 0), index:  fc(f.index  ?? 0),
        middle: fc(f.middle ?? 0), ring:   fc(f.ring   ?? 0), pinky: fc(f.pinky ?? 0),
      });
      return {
        rightArm:  p.rightArm  ? { shoulder: p.rightArm.shoulder  as [number,number,number], upperArm: (p.rightArm.upperArm ?? [0,0,0]) as [number,number,number], forearm: p.rightArm.forearm  as [number,number,number], hand: p.rightArm.hand  as [number,number,number] } : undefined,
        leftArm:   p.leftArm   ? { shoulder: p.leftArm.shoulder   as [number,number,number], upperArm: (p.leftArm.upperArm  ?? [0,0,0]) as [number,number,number], forearm: p.leftArm.forearm   as [number,number,number], hand: p.leftArm.hand   as [number,number,number] } : undefined,
        rightHand: p.rightFingers ? fingers(p.rightFingers) : undefined,
        leftHand:  undefined,
      };
    } catch { return null; }
  }

  const handleApplyPose = () => {
    const pose = parseCopyPose(calJson);
    if (!pose) { setCalMsg("❌ Invalid JSON"); return; }
    avatarRef.current?.setStaticPose(pose);
    setCalMsg("✅ Pose applied");
  };

  const handleLoadFromDebug = () => {
    try {
      const raw = localStorage.getItem("signbridge-debug-pose");
      if (!raw) { setCalMsg("❌ Nothing in localStorage — use SEND TO AVATAR in /test/avatar-debug"); return; }
      setCalJson(raw);
      setCalMsg("✅ Loaded from debug");
    } catch { setCalMsg("❌ localStorage error"); }
  };

  const handleClearPose = () => {
    avatarRef.current?.clearStaticPose();
    setCalMsg("↩ Cleared — idle resumed");
  };

  const handleSaveKf = () => {
    const existing = JSON.parse(localStorage.getItem("signbridge-kf-store") ?? "{}");
    existing[calSign] = existing[calSign] ?? [];
    existing[calSign].push({ time: 0.5, json: calJson });
    localStorage.setItem("signbridge-kf-store", JSON.stringify(existing));
    setCalMsg(`✅ Saved keyframe for "${calSign}"`);
  };

  const play = useCallback(async (signId: string) => {
    if (isPlaying) return;
    setIsPlaying(true);
    setActiveSign(signId);
    await avatarRef.current?.playSign(signId);
    setActiveSign(null);
    setIsPlaying(false);
  }, [isPlaying]);

  const playDemo = useCallback(async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setPhrase(DEMO_SEQUENCE);
    for (let i = 0; i < DEMO_SEQUENCE.length; i++) {
      setActiveSign(DEMO_SEQUENCE[i]);
      setPhraseIdx(i);
      await avatarRef.current?.playSign(DEMO_SEQUENCE[i]);
      await new Promise<void>((r) => setTimeout(r, 150));
    }
    setActiveSign(null);
    setPhraseIdx(-1);
    setPhrase([]);
    setIsPlaying(false);
  }, [isPlaying]);

  const playText = useCallback(async () => {
    if (isPlaying || !textInput.trim()) return;
    const ids = textToSignIds(textInput);
    if (ids.length === 0) {
      setStatusMsg("No recognisable signs found — try: hello, thank you, yes, no, i love you…");
      return;
    }
    setIsPlaying(true);
    setStatusMsg("");
    setPhrase(ids);
    for (let i = 0; i < ids.length; i++) {
      setActiveSign(ids[i]);
      setPhraseIdx(i);
      await avatarRef.current?.playSign(ids[i]);
      await new Promise<void>((r) => setTimeout(r, 150));
    }
    setActiveSign(null);
    setPhraseIdx(-1);
    setPhrase([]);
    setIsPlaying(false);
  }, [isPlaying, textInput]);

  const handleSkinChange = (t: "light" | "medium" | "dark") => {
    setSkinTone(t);
    avatarRef.current?.setSkinTone(t);
  };

  const handleSpeedChange = (v: number) => {
    setSpeed(v);
    avatarRef.current?.setSpeed(v);
  };

  const toggleCat = (label: string) =>
    setOpenCats((p) => ({ ...p, [label]: !p[label] }));

  // Sign name for current activeSign
  const activeSignName = activeSign
    ? ALL_SIGNS.find((s) => s.id === activeSign)?.name ?? activeSign
    : null;

  return (
    <main
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(135deg, #09090f 0%, #0d1117 100%)" }}
    >
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-3 flex items-center gap-3">
        <span style={{ fontSize: "1.4rem" }}>🤟</span>
        <div>
          <h1 className="text-base font-bold tracking-wide" style={{ color: "#67e8f9" }}>
            SignBridge AI — 3D Avatar
          </h1>
          <p className="text-xs text-white/35">Ready Player Me · Full skeleton · ASL</p>
        </div>
        <div className="ml-auto flex gap-4 text-xs text-white/35">
          <a href="/test/avatar-debug" className="hover:text-white/70 transition-colors" style={{ color: "#f59e0b" }}>🦴 Debug</a>
          <a href="/test/sign" className="hover:text-white/70 transition-colors">Sign Detector</a>
          <a href="/test/speech" className="hover:text-white/70 transition-colors">Speech</a>
          <a href="/" className="hover:text-white/70 transition-colors">← Home</a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col lg:flex-row gap-5">

        {/* ── Left: Avatar + controls ── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Avatar */}
          <SignAvatar
            ref={avatarRef}
            skinTone={skinTone}
            speed={speed}
            className="w-full"
            style={{ height: 460 }}
            onSignStart={() => {}}
            onSignEnd={() => {}}
          />

          {/* Phrase display */}
          {phrase.length > 0 && (
            <div
              className="rounded-xl px-4 py-3 flex flex-wrap gap-1.5 items-center"
              style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)" }}
            >
              {phrase.map((id, i) => {
                const name   = ALL_SIGNS.find((s) => s.id === id)?.name ?? id;
                const active = i === phraseIdx;
                const past   = i < phraseIdx;
                // future = i > phraseIdx (default)
                return (
                  <span key={`${id}-${i}`} className="flex items-center gap-1.5"
                    style={{ animation: active ? "fadeIn 0.2s ease" : undefined }}>
                    {i > 0 && (
                      <span style={{
                        color: past ? "rgba(156,163,175,0.4)" : "rgba(255,255,255,0.2)",
                        fontSize: "0.75rem",
                      }}>▸</span>
                    )}
                    <span
                      style={{
                        background:  active ? "#06b6d4"                    : "transparent",
                        border:      active ? "1px solid #06b6d4"          : "1px solid transparent",
                        color:       active ? "#fff"
                                   : past   ? "rgba(156,163,175,0.6)"
                                            : "rgba(255,255,255,0.85)",
                        borderRadius: 9999,
                        padding:    active ? "0.2rem 0.85rem" : "0.2rem 0.5rem",
                        fontSize:   active ? "0.9rem"  : "0.82rem",
                        fontWeight: active ? 700 : past ? 400 : 500,
                        letterSpacing: active ? "0.04em" : "normal",
                        boxShadow:  active ? "0 0 14px rgba(6,182,212,0.5)" : "none",
                        transition: "all 0.25s ease",
                        textTransform: active ? "uppercase" as const : "none" as const,
                      }}
                    >
                      {name}
                    </span>
                  </span>
                );
              })}
            </div>
          )}
          <style>{`@keyframes fadeIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }`}</style>

          {/* Controls row */}
          <div
            className="rounded-xl p-4 grid gap-4 sm:grid-cols-2"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {/* Speed */}
            <div>
              <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider">
                Speed — {speed.toFixed(1)}×
              </label>
              <input
                type="range" min={0.5} max={2} step={0.1} value={speed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <div className="flex justify-between text-xs text-white/20 mt-1">
                <span>0.5×</span><span>2×</span>
              </div>
            </div>

            {/* Skin tone */}
            <div>
              <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider">
                Skin Tone
              </label>
              <div className="flex gap-3 items-center">
                {(["light", "medium", "dark"] as const).map((t) => {
                  const colors = { light: "#f5c5a3", medium: "#c68642", dark: "#4a2912" };
                  return (
                    <button
                      key={t}
                      title={t}
                      onClick={() => handleSkinChange(t)}
                      style={{
                        width: 30, height: 30, borderRadius: "50%",
                        background: colors[t],
                        border: skinTone === t ? "3px solid #67e8f9" : "2px solid rgba(255,255,255,0.2)",
                        transform: skinTone === t ? "scale(1.15)" : "scale(1)",
                        transition: "all 0.2s", cursor: "pointer",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Text-to-signs */}
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider">
              Type a phrase…
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && playText()}
                placeholder='e.g. "hello thank you i love you"'
                disabled={isPlaying}
                className="flex-1 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <button
                onClick={playText}
                disabled={isPlaying || !textInput.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 disabled:opacity-40 transition-all"
                style={{ background: "linear-gradient(135deg,#06b6d4,#7c3aed)", color: "#fff" }}
              >
                Sign It
              </button>
            </div>
            {statusMsg && <p className="mt-2 text-xs" style={{ color: "#f87171" }}>{statusMsg}</p>}
            <p className="mt-2 text-xs text-white/20">
              Recognises: hello, thank you, yes, no, please, help, sorry, good, i love you, stop, 1–5
            </p>
          </div>
        </div>

        {/* ── Right: Sign buttons ── */}
        <div className="w-full lg:w-72 flex flex-col gap-3 flex-shrink-0">

          {/* Demo */}
          <button
            onClick={playDemo}
            disabled={isPlaying}
            className="w-full py-3 rounded-xl text-sm font-semibold hover:brightness-110 disabled:opacity-40 transition-all"
            style={{
              background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
              color: "#fff", letterSpacing: "0.03em",
              boxShadow: "0 4px 20px rgba(124,58,237,0.25)",
            }}
          >
            ✨ Demo: Hello → I Love You → Thank You
          </button>

          {/* Categories */}
          {CATEGORIES.map((cat) => (
            <div
              key={cat.label}
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {/* Category header */}
              <button
                onClick={() => toggleCat(cat.label)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs uppercase tracking-widest hover:bg-white/5 transition-colors"
                style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)" }}
              >
                <span>{cat.label}</span>
                <span>{openCats[cat.label] ? "▲" : "▼"}</span>
              </button>

              {/* Signs grid */}
              {openCats[cat.label] && (
                <div className="p-2 grid grid-cols-2 gap-1.5">
                  {cat.signs.map((sign) => {
                    const active = activeSign === sign.id;
                    return (
                      <button
                        key={sign.id}
                        onClick={() => play(sign.id)}
                        disabled={isPlaying && !active}
                        aria-pressed={active}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: active
                            ? "linear-gradient(135deg,rgba(6,182,212,.22),rgba(124,58,237,.22))"
                            : "rgba(255,255,255,0.04)",
                          border:   active
                            ? "1px solid rgba(6,182,212,0.65)"
                            : "1px solid rgba(255,255,255,0.07)",
                          color:   active ? "#67e8f9" : "rgba(255,255,255,0.75)",
                          boxShadow: active ? "0 0 12px rgba(6,182,212,0.18)" : "none",
                          transform: active ? "scale(1.02)" : "scale(1)",
                          cursor: isPlaying && !active ? "not-allowed" : "pointer",
                        }}
                      >
                        <span style={{ fontSize: "1rem", flexShrink: 0 }}>{sign.emoji}</span>
                        <span className="truncate text-xs">{sign.name}</span>
                        {active && (
                          <span className="ml-auto flex-shrink-0" style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: "#06b6d4", boxShadow: "0 0 6px #06b6d4",
                          }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Setup hint */}
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <h3 className="text-xs uppercase tracking-widest text-white/25 mb-3">Setup</h3>
            <ol className="space-y-1.5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              <li>1. Run <code className="bg-white/10 px-1 rounded font-mono">npm run download-avatar</code></li>
              <li>2. Reload this page</li>
              <li>3. The avatar loads from <code className="bg-white/10 px-1 rounded font-mono">public/models/avatar/avatar.glb</code></li>
              <li>4. Use OrbitControls to rotate view</li>
            </ol>
          </div>

          {/* ── Pose Calibration Tool ── */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(251,191,36,0.25)" }}
          >
            <button
              onClick={() => setCalOpen((p) => !p)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs uppercase tracking-widest hover:bg-white/5 transition-colors"
              style={{ background: "rgba(251,191,36,0.06)", color: "rgba(251,191,36,0.7)" }}
            >
              <span>🎯 Pose Calibration Tool</span>
              <span>{calOpen ? "▲" : "▼"}</span>
            </button>

            {calOpen && (
              <div className="p-3 space-y-2.5" style={{ background: "rgba(0,0,0,0.2)" }}>
                {/* Textarea */}
                <label className="block text-xs text-white/30 mb-1">
                  Paste COPY POSE JSON here (or use Load from Debug):
                </label>
                <textarea
                  value={calJson}
                  onChange={(e) => setCalJson(e.target.value)}
                  rows={6}
                  placeholder={'{\n  "rightArm": { "shoulder": [x,y,z], ... },\n  "rightFingers": { "thumb": 0, ... }\n}'}
                  className="w-full text-xs font-mono rounded-lg px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-yellow-500/40 resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                />

                {/* Row 1: Apply / Load / Clear */}
                <div className="flex gap-2 flex-wrap">
                  <button onClick={handleApplyPose}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
                    style={{ background: "rgba(6,182,212,0.2)", border: "1px solid rgba(6,182,212,0.4)", color: "#67e8f9" }}>
                    Apply Pose
                  </button>
                  <button onClick={handleLoadFromDebug}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
                    style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.35)", color: "#fbbf24" }}>
                    Load from Debug
                  </button>
                  <button onClick={handleClearPose}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)" }}>
                    Clear / Resume
                  </button>
                </div>

                {/* Row 2: Sign selector + Save keyframe + Test */}
                <div className="flex gap-2 items-center flex-wrap">
                  <select
                    value={calSign}
                    onChange={(e) => setCalSign(e.target.value)}
                    className="rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                  >
                    {SIGN_IDS.map((id) => <option key={id} value={id}>{id}</option>)}
                  </select>
                  <button onClick={handleSaveKf}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
                    style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.35)", color: "#34d399" }}>
                    Save as Keyframe
                  </button>
                  <button
                    onClick={() => play(calSign)}
                    disabled={isPlaying}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 transition-all hover:brightness-110"
                    style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", color: "#a78bfa" }}>
                    Test Animation
                  </button>
                </div>

                {calMsg && (
                  <p className="text-xs" style={{ color: calMsg.startsWith("❌") ? "#f87171" : "#34d399" }}>
                    {calMsg}
                  </p>
                )}

                <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
                  Use <a href="/test/avatar-calibrate" className="underline hover:text-white/50">⚖️ Side-by-Side Calibrator</a> or <a href="/test/avatar-debug" className="underline hover:text-white/50">🦴 Debug</a> then SEND TO AVATAR.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
