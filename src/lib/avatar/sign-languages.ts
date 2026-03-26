import type { SupportedLanguageCode } from "@/lib/azure/speech";

export type SignLanguageCode = "ASL" | "LSC" | "LSB";

const UI_TO_SIGN_LANGUAGE: Partial<Record<SupportedLanguageCode, SignLanguageCode>> = {
  "en-US": "ASL",
  "es-CO": "LSC",
  "es-ES": "ASL",
  "pt-BR": "LSB",
};

export function resolveSignLanguageForUiLanguage(language: SupportedLanguageCode): SignLanguageCode {
  return UI_TO_SIGN_LANGUAGE[language] ?? "ASL";
}
