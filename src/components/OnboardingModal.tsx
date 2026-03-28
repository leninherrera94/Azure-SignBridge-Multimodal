"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UI_LANGUAGES } from "@/lib/azure/speech";
import type { SupportedLanguageCode } from "@/lib/azure/speech";

export type CommMode = "speak" | "sign" | "type";

interface OnboardingModalProps {
  onSelect: (mode: CommMode, language: SupportedLanguageCode) => void;
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
  const [step,     setStep]     = useState<"language" | "mode">("language");
  const [language, setLanguage] = useState<SupportedLanguageCode>("en-US");
  const [selected, setSelected] = useState<CommMode | null>(null);
  const [exiting,  setExiting]  = useState(false);

  function handleLanguageSelect(code: SupportedLanguageCode) {
    setLanguage(code);
    setStep("mode");
  }

  function handleModeSelect(mode: CommMode) {
    if (exiting) return;
    setSelected(mode);
    setExiting(true);
    setTimeout(() => onSelect(mode, language), 380);
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
              <p className="text-slate-400 text-sm">
                {step === "language" ? "Choose your language" : "Choose how you communicate today"}
              </p>
            </div>

            {/* ── STEP 1: Language ──────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              {step === "language" && (
                <motion.div
                  key="lang-step"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="flex rounded-xl overflow-hidden mb-3"
                    role="group"
                    aria-label="Choose your language"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {UI_LANGUAGES.map((lang, idx) => {
                      const isActive = language === lang.code;
                      return (
                        <button
                          key={lang.code}
                          onClick={() => setLanguage(lang.code)}
                          className="flex-1 flex flex-col items-center gap-1 py-4 text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                          style={{
                            background:  isActive ? "rgba(6,182,212,0.12)" : "transparent",
                            color:       isActive ? "#06b6d4" : "rgba(255,255,255,0.45)",
                            borderRight: idx < UI_LANGUAGES.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                          }}
                          aria-pressed={isActive}
                          aria-label={lang.name}
                        >
                          <span className="text-2xl" aria-hidden>{lang.flag}</span>
                          <span className="text-xs">{lang.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  <motion.button
                    onClick={() => handleLanguageSelect(language)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all mt-2"
                    style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)" }}
                  >
                    Continue →
                  </motion.button>
                </motion.div>
              )}

              {/* ── STEP 2: Mode ───────────────────────────────────────── */}
              {step === "mode" && (
                <motion.div
                  key="mode-step"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Selected language chip */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setStep("language")}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                      aria-label="Change language"
                    >
                      ← Change
                    </button>
                    <span
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", color: "#06b6d4" }}
                    >
                      {UI_LANGUAGES.find((l) => l.code === language)?.flag}{" "}
                      {UI_LANGUAGES.find((l) => l.code === language)?.name}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3" role="group" aria-label="Communication mode">
                    {OPTIONS.map((opt) => {
                      const isSelected = selected === opt.mode;
                      return (
                        <motion.button
                          key={opt.mode}
                          onClick={() => handleModeSelect(opt.mode)}
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
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-center text-xs text-slate-600 mt-6">
              Powered by Azure AI · WCAG 2.1 AA Compliant
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
