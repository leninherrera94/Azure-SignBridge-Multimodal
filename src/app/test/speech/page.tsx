"use client";

import { useState, useCallback } from "react";
import { Mic, MicOff, Trash2, Copy, CheckCheck, Loader2 } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { SUPPORTED_LANGUAGES } from "@/lib/azure/speech";
import type { SupportedLanguageCode } from "@/lib/azure/speech";

// ─── Wave bars ────────────────────────────────────────────────────────────────

const BAR_HEIGHTS = ["h-3", "h-5", "h-8", "h-10", "h-8", "h-5", "h-3"];
const BAR_DELAYS  = [0, 0.1, 0.2, 0.3, 0.2, 0.1, 0];

function WaveBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-10" aria-hidden="true">
      {BAR_HEIGHTS.map((h, i) => (
        <span
          key={i}
          className={`w-1.5 rounded-full transition-colors duration-300 ${h} ${
            active ? "wave-bar bg-red-400" : "bg-slate-600"
          }`}
          style={active ? { animationDelay: `${BAR_DELAYS[i]}s` } : undefined}
        />
      ))}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({
  isListening,
  isLoading,
}: {
  isListening: boolean;
  isLoading: boolean;
}) {
  const { text, color } = isLoading
    ? { text: "Connecting…", color: "text-yellow-400 border-yellow-700/50 bg-yellow-900/20" }
    : isListening
    ? { text: "Listening", color: "text-red-400 border-red-700/50 bg-red-900/20" }
    : { text: "Idle", color: "text-slate-400 border-slate-700 bg-slate-800/60" };

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${color}`}
      role="status"
      aria-live="polite"
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isLoading
            ? "bg-yellow-400 animate-pulse"
            : isListening
            ? "bg-red-400 animate-pulse"
            : "bg-slate-500"
        }`}
        aria-hidden="true"
      />
      {text}
    </span>
  );
}

// ─── Mic button ───────────────────────────────────────────────────────────────

function MicButton({
  isListening,
  isLoading,
  onClick,
}: {
  isListening: boolean;
  isLoading: boolean;
  onClick: () => void;
}) {
  const label = isLoading
    ? "Connecting…"
    : isListening
    ? "Stop listening"
    : "Start listening";

  return (
    <div className="relative flex items-center justify-center">
      {isListening && (
        <>
          <span
            className="pulse-ring absolute w-32 h-32 rounded-full border-2 border-red-500/50"
            aria-hidden="true"
            style={{ animationDelay: "0s" }}
          />
          <span
            className="pulse-ring absolute w-32 h-32 rounded-full border-2 border-red-500/30"
            aria-hidden="true"
            style={{ animationDelay: "0.5s" }}
          />
        </>
      )}
      <button
        onClick={onClick}
        disabled={isLoading}
        aria-label={label}
        aria-pressed={isListening}
        className={`relative z-10 flex items-center justify-center w-24 h-24 rounded-full
          text-white transition-all duration-200
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4
          focus-visible:outline-cyan-400 disabled:cursor-wait
          ${
            isListening
              ? "bg-red-600 hover:bg-red-700 scale-105"
              : "hover:scale-105 active:scale-95"
          }`}
        style={
          !isListening
            ? { background: "linear-gradient(135deg,#06b6d4,#a78bfa)" }
            : undefined
        }
      >
        {isLoading ? (
          <Loader2 className="w-9 h-9 animate-spin" aria-hidden="true" />
        ) : isListening ? (
          <MicOff className="w-9 h-9" aria-hidden="true" />
        ) : (
          <Mic className="w-9 h-9" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={copy}
      disabled={!text}
      aria-label={copied ? "Copied!" : "Copy transcript to clipboard"}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
        border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500
        disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
    >
      {copied ? (
        <>
          <CheckCheck className="w-3.5 h-3.5 text-green-400" aria-hidden="true" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
          Copy
        </>
      )}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SpeechTestPage() {
  const [language, setLanguage] = useState<SupportedLanguageCode>("en-US");

  const {
    isListening,
    isLoading,
    transcript,
    interimText,
    error,
    startListening,
    stopListening,
    clearTranscript,
  } = useSpeechRecognition(language);

  const handleToggle = useCallback(async () => {
    if (isListening) await stopListening();
    else await startListening();
  }, [isListening, startListening, stopListening]);

  const handleLanguageChange = useCallback(
    (lang: SupportedLanguageCode) => {
      if (isListening) stopListening().then(() => setLanguage(lang));
      else setLanguage(lang);
    },
    [isListening, stopListening]
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50
          focus:px-4 focus:py-2 focus:rounded-lg focus:bg-cyan-400 focus:text-slate-900
          focus:font-semibold focus:outline-none"
      >
        Skip to main content
      </a>

      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-400 font-semibold mb-0.5">
              SignBridge AI &middot; Dev Tools
            </p>
            <h1 className="text-xl font-bold">
              Speech-to-Text <span className="gradient-text">Live Test</span>
            </h1>
          </div>
          <StatusBadge isListening={isListening} isLoading={isLoading} />
        </div>
      </header>

      <main id="main" className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        <section aria-label="Recognition controls" className="flex flex-col items-center gap-8">
          <WaveBars active={isListening} />
          <MicButton isListening={isListening} isLoading={isLoading} onClick={handleToggle} />
          <p className="text-sm text-slate-400 text-center max-w-xs">
            {isLoading
              ? "Connecting to Azure Speech Services…"
              : isListening
              ? "Speak clearly. Interim text appears in grey as you talk."
              : "Click the microphone to start continuous recognition."}
          </p>

          <div className="flex items-center gap-3">
            <label htmlFor="lang-select" className="text-sm font-medium text-slate-400">
              Language
            </label>
            <select
              id="lang-select"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguageCode)}
              disabled={isListening || isLoading}
              className="rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-sm
                px-3 py-2 focus-visible:outline focus-visible:outline-2
                focus-visible:outline-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {SUPPORTED_LANGUAGES.map(({ code, label }) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>
        </section>

        <section
          aria-label="Live transcription output"
          className="rounded-2xl border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/60">
            <h2 className="text-sm font-semibold text-slate-300">Transcript</h2>
            <div className="flex items-center gap-2">
              <CopyButton text={transcript} />
              <button
                onClick={clearTranscript}
                disabled={!transcript && !interimText}
                aria-label="Clear transcript"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500
                  disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                Clear
              </button>
            </div>
          </div>

          <div
            className="min-h-[220px] max-h-[400px] overflow-y-auto p-5"
            role="log"
            aria-live="polite"
            aria-atomic="false"
            aria-label="Transcription log"
          >
            {transcript || interimText ? (
              <p className="text-base leading-relaxed">
                {transcript && (
                  <span className="text-white font-medium">{transcript}</span>
                )}
                {transcript && interimText && " "}
                {interimText && (
                  <span
                    className="text-slate-400 italic"
                    aria-label={`Partial: ${interimText}`}
                  >
                    {interimText}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-slate-600 italic text-sm text-center pt-10">
                {isListening ? "Waiting for speech…" : "Transcription will appear here."}
              </p>
            )}
          </div>
        </section>

        {error && (
          <section
            role="alert"
            aria-live="assertive"
            className="rounded-2xl border border-red-700/50 bg-red-900/20 px-5 py-4 space-y-1"
          >
            <p className="text-sm font-semibold text-red-400">Recognition Error</p>
            <p className="text-sm text-red-300/90">{error}</p>
            <p className="text-xs text-slate-500 mt-1">
              Common causes: microphone permission denied, expired credentials, or network interruption.
            </p>
          </section>
        )}

        <section
          aria-labelledby="howto-heading"
          className="rounded-2xl border border-slate-700/40 bg-slate-800/20 px-5 py-5 space-y-3"
        >
          <h2 id="howto-heading" className="text-sm font-semibold text-slate-300">
            How it works
          </h2>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-400">
            <li>
              <span className="text-slate-300">Token fetch</span> &mdash; browser calls{" "}
              <code className="text-cyan-400 text-xs">/api/speech</code> which issues a
              10-minute Azure STS token server-side (key never reaches the browser).
            </li>
            <li>
              <span className="text-slate-300">SDK load</span> &mdash; the 2 MB Azure Speech
              SDK is dynamically imported once, client-only.
            </li>
            <li>
              <span className="text-slate-300">Continuous recognition</span> &mdash; interim
              results stream in real-time; final results commit at each natural speech pause.
            </li>
            <li>
              <span className="text-slate-300">Token refresh</span> &mdash; the hook
              auto-refreshes before the 10-minute Azure expiry.
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}
