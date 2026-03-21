"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type CommMode = "speak" | "sign" | "type";

interface OnboardingModalProps {
  onSelect: (mode: CommMode) => void;
}

const OPTIONS: Array<{
  mode:  CommMode;
  icon:  string;
  label: string;
  desc:  string;
  color: string;
  rgb:   string;
}> = [
  {
    mode:  "speak",
    icon:  "🎤",
    label: "I Speak",
    desc:  "Your voice will be transcribed and translated to sign language",
    color: "#06b6d4",
    rgb:   "6,182,212",
  },
  {
    mode:  "sign",
    icon:  "🤟",
    label: "I Sign",
    desc:  "Your sign language will be recognized and converted to text",
    color: "#a78bfa",
    rgb:   "167,139,250",
  },
  {
    mode:  "type",
    icon:  "⌨️",
    label: "I Type",
    desc:  "Type messages to be translated to sign language",
    color: "#34d399",
    rgb:   "52,211,153",
  },
];

export default function OnboardingModal({ onSelect }: OnboardingModalProps) {
  const [selected, setSelected] = useState<CommMode | null>(null);
  const [exiting,  setExiting]  = useState(false);

  function handleSelect(mode: CommMode) {
    if (exiting) return;
    setSelected(mode);
    setExiting(true);
    setTimeout(() => onSelect(mode), 380);
  }

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="onboarding-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.88)", backdropFilter: "blur(12px)" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="w-full max-w-md rounded-2xl p-8"
            style={{
              background:  "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
              border:      "1px solid rgba(255,255,255,0.1)",
              boxShadow:   "0 32px 80px rgba(0,0,0,0.55)",
            }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-4xl mb-3" aria-hidden>🤟</div>
              <h1 className="text-2xl font-bold text-white mb-1">Welcome to SignBridge AI</h1>
              <p className="text-slate-400 text-sm">Choose how you communicate today</p>
            </div>

            {/* Mode cards */}
            <div className="flex flex-col gap-3" role="group" aria-label="Communication mode">
              {OPTIONS.map((opt) => {
                const isSelected = selected === opt.mode;
                return (
                  <motion.button
                    key={opt.mode}
                    onClick={() => handleSelect(opt.mode)}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-4 p-4 rounded-xl text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                    style={{
                      background: isSelected
                        ? `rgba(${opt.rgb},0.12)`
                        : "rgba(255,255,255,0.04)",
                      border: `1px solid ${isSelected ? opt.color : "rgba(255,255,255,0.08)"}`,
                    }}
                    aria-label={`${opt.label}: ${opt.desc}`}
                    aria-pressed={isSelected}
                  >
                    <span className="text-3xl flex-shrink-0" aria-hidden>{opt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white mb-0.5">{opt.label}</p>
                      <p className="text-sm text-slate-400 leading-snug">{opt.desc}</p>
                    </div>
                    <div
                      className="w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all"
                      style={{
                        borderColor: isSelected ? opt.color : "rgba(255,255,255,0.2)",
                        background:  isSelected ? opt.color : "transparent",
                      }}
                      aria-hidden
                    />
                  </motion.button>
                );
              })}
            </div>

            <p className="text-center text-xs text-slate-600 mt-6">
              Powered by Azure AI · WCAG 2.1 AA Compliant
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
