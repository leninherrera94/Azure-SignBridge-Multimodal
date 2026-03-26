import type { SupportedLanguageCode } from "@/lib/azure/speech";

export type SignLanguageCode = "ASL" | "LSC";

const UI_TO_SIGN_LANGUAGE: Partial<Record<SupportedLanguageCode, SignLanguageCode>> = {
  "en-US": "ASL",
  "es-CO": "LSC",
  "es-ES": "ASL",
};

export function resolveSignLanguageForUiLanguage(language: SupportedLanguageCode): SignLanguageCode {
  return UI_TO_SIGN_LANGUAGE[language] ?? "ASL";
}
