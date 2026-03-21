/**
 * src/lib/azure/speech.ts
 *
 * Browser-only factory for Azure Speech recognizer.
 *
 * Uses `import type` so this file adds ZERO runtime weight on the server.
 * The hook dynamically imports the SDK on the client and passes the module
 * reference into `buildRecognizer`, keeping Next.js SSR happy while
 * giving full TypeScript type coverage.
 */

import type * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface SpeechToken {
  /** Azure-issued 10-minute auth token */
  token: string;
  /** Azure region, e.g. "eastus2" */
  region: string;
  /** Unix ms after which the token must be refreshed (issued time + 9 min) */
  expiresAt: number;
}

export interface RecognizerCallbacks {
  /** Continuous partial hypothesis while the user is still speaking */
  onInterim: (text: string) => void;
  /** Finalized utterance at each natural speech boundary */
  onFinal: (text: string) => void;
  /** Network error, mic permission denied, or auth failure */
  onError: (message: string, reasonCode?: number) => void;
  /** Clean session end after stopContinuousRecognitionAsync */
  onSessionEnd: () => void;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates a configured Azure SpeechRecognizer ready for continuous recognition.
 *
 * @param sdk      - The dynamically-imported SDK namespace
 * @param token    - Auth token from /api/speech (never a raw key)
 * @param region   - Azure region returned by /api/speech
 * @param language - BCP-47 locale string, e.g. "en-US" or "es-ES"
 * @param callbacks - Handlers for interim text, final text, errors
 */
export function buildRecognizer(
  sdk: typeof SpeechSDK,
  token: string,
  region: string,
  language: string,
  callbacks: RecognizerCallbacks
): SpeechSDK.SpeechRecognizer {
  // Auth via token — the raw key never leaves the server
  const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token, region);
  speechConfig.speechRecognitionLanguage = language;
  // Request word-level timing in the detailed output (useful for captions)
  speechConfig.requestWordLevelTimestamps();

  // Default microphone — triggers browser permission prompt on first call
  const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  // Fires rapidly with partial text while speech is in progress
  recognizer.recognizing = (_sender, event) => {
    callbacks.onInterim(event.result.text);
  };

  // Fires once per utterance when recognition is committed
  recognizer.recognized = (_sender, event) => {
    if (
      event.result.reason === sdk.ResultReason.RecognizedSpeech &&
      event.result.text.trim()
    ) {
      callbacks.onFinal(event.result.text.trim());
    }
  };

  // Network drop, invalid token, or microphone access denied
  recognizer.canceled = (_sender, event) => {
    const message =
      event.errorDetails ??
      `Recognition canceled (reason code: ${event.reason})`;
    callbacks.onError(message, event.reason);
    recognizer.close();
  };

  // Called after stopContinuousRecognitionAsync completes
  recognizer.sessionStopped = (_sender, _event) => {
    callbacks.onSessionEnd();
  };

  return recognizer;
}

// ─── Promise wrappers ─────────────────────────────────────────────────────────

/** Wraps the callback-based startContinuousRecognitionAsync in a Promise. */
export function startRecognition(
  recognizer: SpeechSDK.SpeechRecognizer
): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    recognizer.startContinuousRecognitionAsync(resolve, reject)
  );
}

/** Wraps the callback-based stopContinuousRecognitionAsync in a Promise. */
export function stopRecognition(
  recognizer: SpeechSDK.SpeechRecognizer
): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    recognizer.stopContinuousRecognitionAsync(resolve, reject)
  );
}

// ─── Language catalogue ───────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = [
  { code: "en-US", label: "English (US)" },
  { code: "es-ES", label: "Español (ES)" },
  { code: "fr-FR", label: "Français (FR)" },
  { code: "de-DE", label: "Deutsch (DE)" },
  { code: "pt-BR", label: "Português (BR)" },
  { code: "ja-JP", label: "日本語" },
  { code: "zh-CN", label: "中文 (简体)" },
] as const;

export type SupportedLanguageCode =
  (typeof SUPPORTED_LANGUAGES)[number]["code"];
