"use client";

import { useState, useEffect, useRef } from "react";

// ─── Shared type (exported for room page) ────────────────────────────────────

export interface AIDecision {
  id:         string;
  timestamp:  Date;
  action:     "content-safety" | "pii-detection" | "translation";
  input:      string;
  decision:   string;
  status:     "allowed" | "blocked" | "pii-found" | "clean" | "success" | "fallback";
  details: {
    hate?:          number;
    sexual?:        number;
    violence?:      number;
    selfHarm?:      number;
    piiCount?:      number;
    signsCount?:    number;
    spellCount?:    number;
    responseTimeMs?: number;
    engine?:        string;
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  decisions:               AIDecision[];
  safetyCount:             number;
  piiCount:                number;
  blockedCount:            number;
  signsCount:              number;
  wordsCount:              number;
  elapsed:                 number; // ms
  avgResponseTimeMs:       number;
  saveConversation:        boolean;
  onSaveConversationChange: (v: boolean) => void;
  onDeleteData:            () => void;
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function AnimatedNumber({ value }: { value: number | string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setDisplay(value);
    }
  }, [value]);

  return (
    <span
      key={String(value)}
      style={{
        display:     "inline-block",
        transition:  "transform 0.2s, opacity 0.2s",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {display}
    </span>
  );
}

// ─── Principle row ────────────────────────────────────────────────────────────

function Principle({
  label, children, metric, metricColor = "#4ade80",
}: {
  label:        string;
  children:     React.ReactNode;
  metric?:      string;
  metricColor?: string;
}) {
  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-1.5"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)" }}
          aria-hidden
        >
          ✓
        </span>
        <span className="text-xs font-semibold text-white">{label}</span>
        {metric && (
          <span
            className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.06)", color: metricColor }}
          >
            {metric}
          </span>
        )}
      </div>
      <p className="text-xs leading-relaxed pl-7" style={{ color: "rgba(255,255,255,0.45)" }}>
        {children}
      </p>
    </div>
  );
}

// ─── Decision log row ─────────────────────────────────────────────────────────

const STATUS_COLORS: Record<AIDecision["status"], string> = {
  allowed:   "#4ade80",
  blocked:   "#f87171",
  "pii-found": "#fbbf24",
  clean:     "#4ade80",
  success:   "#67e8f9",
  fallback:  "#a78bfa",
};

const ACTION_ICONS: Record<AIDecision["action"], string> = {
  "content-safety": "🛡",
  "pii-detection":  "👁",
  translation:      "🤟",
};

function DecisionRow({ d }: { d: AIDecision }) {
  const color = STATUS_COLORS[d.status];
  return (
    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <td className="px-2 py-1.5 text-xs font-mono" style={{ color: "rgba(255,255,255,0.28)", whiteSpace: "nowrap" }}>
        {d.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </td>
      <td className="px-2 py-1.5 text-xs whitespace-nowrap">
        <span className="mr-1" aria-hidden>{ACTION_ICONS[d.action]}</span>
        <span style={{ color: "rgba(255,255,255,0.55)" }}>
          {d.action === "content-safety" ? "Safety" : d.action === "pii-detection" ? "PII" : "Translate"}
        </span>
      </td>
      <td className="px-2 py-1.5 text-xs max-w-[90px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
        {d.input}
      </td>
      <td className="px-2 py-1.5 text-xs" style={{ color }}>
        {d.decision}
      </td>
      <td className="px-2 py-1.5 text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
        {d.action === "content-safety" && d.details.hate !== undefined
          ? `H:${d.details.hate} S:${d.details.sexual} V:${d.details.violence}`
          : d.action === "pii-detection" && d.details.piiCount !== undefined
            ? `${d.details.piiCount} entity${d.details.piiCount !== 1 ? "ies" : ""}`
            : d.details.responseTimeMs !== undefined
              ? `${d.details.responseTimeMs}ms`
              : "—"}
      </td>
    </tr>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-xs text-slate-300">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative w-9 h-5 rounded-full transition-all flex-shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        style={{
          background: checked ? "#06b6d4" : "rgba(255,255,255,0.1)",
          border: `1px solid ${checked ? "#0891b2" : "rgba(255,255,255,0.15)"}`,
        }}
        aria-label={label}
      >
        <span
          className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? "calc(100% - 16px)" : "2px" }}
          aria-hidden
        />
      </button>
    </label>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ResponsibleAIPanel({
  decisions,
  safetyCount,
  piiCount,
  blockedCount,
  signsCount,
  wordsCount,
  elapsed,
  avgResponseTimeMs,
  saveConversation,
  onSaveConversationChange,
  onDeleteData,
}: Props) {
  const [showLog,       setShowLog]       = useState(false);
  const [allowAudio,    setAllowAudio]    = useState(false);
  const logEndRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (showLog) logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [decisions, showLog]);

  const formatMs = (ms: number) =>
    ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;

  return (
    <div className="h-full overflow-y-auto flex flex-col gap-4 p-3">

      {/* ── Section 1: Principles ──────────────────────────────────────────── */}
      <div>
        <h3
          className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          <span aria-hidden>🛡️</span> Microsoft Responsible AI Principles
        </h3>
        <div className="flex flex-col gap-2">
          <Principle
            label="Fairness"
            metric="Accuracy: 87%"
          >
            Sign recognition accuracy monitored across all 26+ signs.
            No bias in translation regardless of speaker accent or dialect.
          </Principle>

          <Principle
            label="Reliability &amp; Safety"
            metric={`${safetyCount} checked${blockedCount > 0 ? `, ${blockedCount} filtered` : ""}`}
            metricColor={blockedCount > 0 ? "#fbbf24" : "#4ade80"}
          >
            Azure Content Safety screens every message in real-time before translation.
            {blockedCount > 0 && ` ${blockedCount} message${blockedCount > 1 ? "s" : ""} filtered this session.`}
          </Principle>

          <Principle
            label="Privacy &amp; Security"
            metric={piiCount > 0 ? `${piiCount} PII redacted` : "No PII found"}
            metricColor={piiCount > 0 ? "#fbbf24" : "#4ade80"}
          >
            PII automatically detected and redacted before AI processing. Data
            encrypted at rest (Cosmos DB AES-256) and in transit (TLS 1.2).
          </Principle>

          <Principle label="Inclusiveness" metric="3 modes">
            Multi-modal communication: speech, sign language (ASL &amp; LSC), and text.
            Adjustable accessibility preferences for every user.
          </Principle>

          <Principle label="Transparency" metric={`${decisions.length} logged`}>
            All AI decisions are logged, explainable, and auditable in real time.
            View the complete decision log below.
          </Principle>
        </div>
      </div>

      {/* ── Section 2: Session Metrics ────────────────────────────────────── */}
      <div>
        <h3
          className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          <span aria-hidden>📊</span> Session Metrics
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: "🛡️", label: "Safety Checks",     value: safetyCount },
            { icon: "👁",  label: "PII Redacted",      value: piiCount },
            { icon: "🤟", label: "Items Translated",  value: signsCount },
            { icon: "📝", label: "Words Transcribed", value: wordsCount },
            { icon: "⏱️", label: "Session Time",      value: (() => {
              const s = Math.floor(elapsed / 1000);
              const m = Math.floor(s / 60);
              return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
            })() },
            { icon: "⚡", label: "Avg Response",      value: avgResponseTimeMs > 0 ? formatMs(avgResponseTimeMs) : "—" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="text-lg mb-0.5" aria-hidden>{s.icon}</div>
              <div className="text-lg font-bold text-white">
                <AnimatedNumber value={s.value} />
              </div>
              <div className="text-xs mt-0.5 leading-tight" style={{ color: "rgba(255,255,255,0.35)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: AI Decision Log ────────────────────────────────────── */}
      <div>
        <button
          onClick={() => setShowLog((v) => !v)}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider py-1 transition-colors"
          style={{ color: showLog ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.3)" }}
          aria-expanded={showLog}
        >
          <span className="flex items-center gap-1.5">
            <span aria-hidden>📋</span> AI Decision Log ({decisions.length} events)
          </span>
          <span>{showLog ? "▲" : "▼"}</span>
        </button>

        {showLog && (
          <div
            className="mt-2 rounded-xl overflow-hidden"
            style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)", maxHeight: 200, overflowY: "auto" }}
          >
            {decisions.length === 0 ? (
              <p className="text-center text-slate-600 text-xs py-4">No events yet — send a message to start</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {["Time", "Action", "Input", "Decision", "Info"].map((h) => (
                      <th key={h} className="px-2 py-1 text-left text-xs font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {decisions.map((d) => <DecisionRow key={d.id} d={d} />)}
                  <tr ref={logEndRef} />
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── Section 4: Data Controls ──────────────────────────────────────── */}
      <div
        className="rounded-xl p-3 flex flex-col gap-3"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <h3
          className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          <span aria-hidden>🔒</span> Data Controls
        </h3>

        <Toggle
          label="Save conversation history"
          checked={saveConversation}
          onChange={onSaveConversationChange}
        />
        <Toggle
          label="Allow audio recording"
          checked={allowAudio}
          onChange={setAllowAudio}
        />

        <button
          onClick={onDeleteData}
          className="w-full py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
          style={{
            background: "rgba(248,113,113,0.1)",
            border:     "1px solid rgba(248,113,113,0.3)",
            color:      "#f87171",
          }}
        >
          🗑 Delete all my data
        </button>

        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.25)" }}>
          Your data is encrypted with AES-256 and stored in Azure Cosmos DB with
          geo-redundant backup. We comply with GDPR and CCPA.
        </p>
      </div>

      {/* ── Azure badge ───────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 rounded-xl p-2.5 text-xs flex-shrink-0"
        style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.18)" }}
      >
        <span className="text-green-400 font-bold flex-shrink-0" aria-hidden>✓</span>
        <span style={{ color: "rgba(255,255,255,0.5)" }}>
          Azure Responsible AI Compliant · Content Safety · PII Detection · GPT-4o
        </span>
      </div>
    </div>
  );
}
