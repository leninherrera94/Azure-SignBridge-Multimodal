"use client";

/**
 * src/hooks/useSpeechRecognition.ts
 *
 * React hook for continuous Azure Speech-to-Text in the browser.
 *
 * Flow:
 *   1. On startListening() → GET /api/speech for a server-issued auth token.
 *   2. Dynamically import the Speech SDK (browser-only, ~2 MB).
 *   3. Build a SpeechRecognizer via speech.ts factory.
 *   4. Start continuous recognition; stream interim + final text to state.
 *   5. On stopListening() → flush final text, close recognizer cleanly.
 *
 * Token refresh: the token is cached in a ref and re-fetched automatically
 * when it is within 60 seconds of expiry (before the 10-minute Azure limit).
 */

import { useState, useRef, useCallback, useEffect } from "react";
import type {
  SpeechToken,
  SupportedLanguageCode,
} from "@/lib/azure/speech";
import {
  buildRecognizer,
  startRecognition,
  stopRecognition,
} from "@/lib/azure/speech";
import type * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpeechState {
  isListening:  boolean;
  isLoading:    boolean; // true while fetching token + loading SDK
  transcript:   string; // accumulated final text (all utterances)
  interimText:  string; // live partial hypothesis for the current utterance
  error:        string | null;
}

export interface UseSpeechRecognitionReturn extends SpeechState {
  startListening:  () => Promise<void>;
  stopListening:   () => Promise<void>;
  clearTranscript: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSpeechRecognition(
  language: SupportedLanguageCode = "en-US"
): UseSpeechRecognitionReturn {
  const [state, setState] = useState<SpeechState>({
    isListening:  false,
    isLoading:    false,
    transcript:   "",
    interimText:  "",
    error:        null,
  });

  // Refs so callbacks always see the latest values without re-registering
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const tokenRef      = useRef<SpeechToken | null>(null);
  const languageRef   = useRef<SupportedLanguageCode>(language);

  // Keep language ref in sync so it is available inside closures
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // ── Token management ────────────────────────────────────────────────────────

  const getToken = useCallback(async (): Promise<SpeechToken> => {
    const cached = tokenRef.current;
    // Re-use cached token if it has more than 60 s of life remaining
    if (cached && cached.expiresAt - Date.now() > 60_000) {
      return cached;
    }

    const res = await fetch("/api/speech", { cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        (body as { error?: string }).error ?? `Token fetch failed: HTTP ${res.status}`
      );
    }

    const data = (await res.json()) as SpeechToken;
    tokenRef.current = data;
    return data;
  }, []);

  // ── Start listening ─────────────────────────────────────────────────────────

  const startListening = useCallback(async (): Promise<void> => {
    // Guard: already running
    if (recognizerRef.current) return;

    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const { token, region } = await getToken();

      // Dynamic import — only runs in the browser; tree-shaken from SSR bundle
      const sdk = await import("microsoft-cognitiveservices-speech-sdk");

      const recognizer = buildRecognizer(
        sdk,
        token,
        region,
        languageRef.current,
        {
          onInterim: (text) =>
            setState((s) => ({ ...s, interimText: text })),

          onFinal: (text) =>
            setState((s) => ({
              ...s,
              interimText: "",
              transcript:
                s.transcript
                  ? `${s.transcript} ${text}`
                  : text,
            })),

          onError: (message) => {
            setState((s) => ({
              ...s,
              isListening:  false,
              isLoading:    false,
              interimText:  "",
              error:        message,
            }));
            recognizerRef.current = null;
          },

          onSessionEnd: () => {
            setState((s) => ({
              ...s,
              isListening: false,
              interimText: "",
            }));
            recognizerRef.current = null;
          },
        }
      );

      recognizerRef.current = recognizer;
      await startRecognition(recognizer);

      setState((s) => ({ ...s, isListening: true, isLoading: false }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start recognition.";
      setState((s) => ({
        ...s,
        isListening: false,
        isLoading:   false,
        error:       message,
      }));
      recognizerRef.current = null;
    }
  }, [getToken]);

  // ── Stop listening ──────────────────────────────────────────────────────────

  const stopListening = useCallback(async (): Promise<void> => {
    const recognizer = recognizerRef.current;
    if (!recognizer) return;

    try {
      await stopRecognition(recognizer);
      recognizer.close();
    } catch {
      // Best-effort — close even if stop fails
      recognizer.close();
    } finally {
      recognizerRef.current = null;
      setState((s) => ({ ...s, isListening: false, interimText: "" }));
    }
  }, []);

  // ── Clear accumulated transcript ────────────────────────────────────────────

  const clearTranscript = useCallback(() => {
    setState((s) => ({ ...s, transcript: "", interimText: "" }));
  }, []);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      const recognizer = recognizerRef.current;
      if (recognizer) {
        // Fire-and-forget — component is unmounting
        recognizer.stopContinuousRecognitionAsync(
          () => recognizer.close(),
          () => recognizer.close()
        );
      }
    };
  }, []);

  return {
    isListening:     state.isListening,
    isLoading:       state.isLoading,
    transcript:      state.transcript,
    interimText:     state.interimText,
    error:           state.error,
    startListening,
    stopListening,
    clearTranscript,
  };
}
