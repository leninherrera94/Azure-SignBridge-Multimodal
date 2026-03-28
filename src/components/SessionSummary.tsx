"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CommMode } from "./OnboardingModal";

// ─── Shared type (imported by the room page) ──────────────────────────────────

export interface ChatMessage {
  id:        string;
  text:      string;
  mode:      CommMode;
  timestamp: Date;
  signs?:    string[];
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AISummaryResult {
  summary:     string;
  topics:      string[];
  actionItems: string[];
  tone:        string;
}

interface SessionSummaryProps {
  messages:     ChatMessage[];
  signsCount:   number;
  wordsCount:   number;
  safetyCount:  number;
  piiCount?:    number;
  sessionStart: Date;
  aiSummary?:   AISummaryResult | null;
  summaryLoading?: boolean;
  onClose:      () => void;
  onNewSession: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function modeIcon(mode: CommMode) {
  return mode === "speak" ? "🎤" : mode === "sign" ? "🤟" : "⌨️";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SessionSummary({
  messages,
  signsCount,
  wordsCount,
  safetyCount,
  piiCount = 0,
  sessionStart,
  aiSummary,
  summaryLoading,
  onClose,
  onNewSession,
}: SessionSummaryProps) {
  const [showHistory, setShowHistory] = useState(false);
  const duration = Date.now() - sessionStart.getTime();

  function handleDownload() {
    const lines = [
      "SignBridge AI — Session Summary",
      `Date: ${sessionStart.toLocaleString()}`,
      `Duration: ${formatDuration(duration)}`,
      `Messages: ${messages.length}`,
      `Signs Translated: ${signsCount}`,
      `Words Transcribed: ${wordsCount}`,
      `Safety Checks: ${safetyCount}`,
      "",
      "=== CONVERSATION ===",
      ...messages.map(
        (m) =>
          `[${m.timestamp.toLocaleTimeString()}] ${modeIcon(m.mode)} ${m.text}` +
          (m.signs?.length ? ` → [${m.signs.join(", ")}]` : "")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `signbridge-${sessionStart.toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const stats = [
    { label: "Duration",  value: formatDuration(duration), icon: "⏱️" },
    { label: "Messages",  value: messages.length,           icon: "💬" },
    { label: "Signs",     value: signsCount,                icon: "🤟" },
    { label: "Safety ✓",  value: safetyCount,               icon: "🛡️" },
    { label: "PII Redacted", value: piiCount,               icon: "👁" },
    { label: "Words",     value: wordsCount,                 icon: "📝" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(15,23,42,0.9)", backdropFilter: "blur(12px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{    opacity: 0,         scale: 0.96 }}
          transition={{ duration: 0.28 }}
          className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            border:     "1px solid rgba(255,255,255,0.1)",
            boxShadow:  "0 32px 80px rgba(0,0,0,0.55)",
            maxHeight:  "90vh",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="summary-title"
        >
          {/* Header */}
          <div className="flex-none p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="flex items-start justify-between">
              <div>
                <h2 id="summary-title" className="text-xl font-bold text-white">Session Complete</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  {sessionStart.toLocaleDateString()} · {sessionStart.toLocaleTimeString()}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)" }}
                aria-hidden
              >
                🤟
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div
            className="flex-none grid grid-cols-3 gap-2 p-5 border-b"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-3 text-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="text-xl mb-0.5" aria-hidden>{s.icon}</div>
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>

          {/* AI Summary */}
          {(summaryLoading || aiSummary) && (
            <div
              className="flex-none px-6 py-4 border-b"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                <span aria-hidden>🧠</span> AI-Generated Summary
              </p>
              {summaryLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                  Generating summary with GPT-4o…
                </div>
              ) : aiSummary ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-slate-200 leading-relaxed">{aiSummary.summary}</p>
                  {aiSummary.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {aiSummary.topics.map((t, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: "#67e8f9" }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {aiSummary.actionItems.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Action items:</p>
                      <ul className="flex flex-col gap-0.5">
                        {aiSummary.actionItems.map((a, i) => (
                          <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                            <span className="text-cyan-400 flex-shrink-0">→</span>{a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Chat history */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              aria-expanded={showHistory}
            >
              <span>Conversation History ({messages.length} messages)</span>
              <span className="text-slate-600 text-xs">{showHistory ? "▲ hide" : "▼ show"}</span>
            </button>

            {showHistory && (
              <div className="px-6 pb-4 flex flex-col gap-2 max-h-60 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-sm text-slate-600">No messages recorded.</p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className="flex gap-2 items-start">
                      <span className="text-base flex-shrink-0 mt-0.5" aria-hidden>{modeIcon(m.mode)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 break-words">{m.text}</p>
                        {m.signs && m.signs.length > 0 && (
                          <p className="text-xs mt-0.5" style={{ color: "#67e8f9" }}>
                            → {m.signs.join(", ")}
                          </p>
                        )}
                        <p className="text-xs text-slate-600 mt-0.5">
                          {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div
            className="flex-none p-6 flex gap-3 border-t"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <button
              onClick={handleDownload}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              ⬇ Download Summary
            </button>
            <button
              onClick={onNewSession}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}
            >
              New Session
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
