// Azure Cognitive Services Translator
// Handles language detection and translation to English
// before ASL sign mapping via GPT-4o.
// Fails open — returns original text if service is not configured.

const TRANSLATOR_ENDPOINT = "https://api.cognitive.microsofttranslator.com";

/**
 * Detect the language of a text snippet.
 * Returns an ISO 639-1 code (e.g. "en", "es", "pt").
 * Falls back to "en" on any error.
 */
export async function detectLanguage(text: string): Promise<string> {
  const key    = process.env.AZURE_TRANSLATOR_KEY;
  const region = process.env.AZURE_TRANSLATOR_REGION;
  if (!key || !region) return "en";

  try {
    const res = await fetch(`${TRANSLATOR_ENDPOINT}/detect?api-version=3.0`, {
      method:  "POST",
      headers: {
        "Ocp-Apim-Subscription-Key":    key,
        "Ocp-Apim-Subscription-Region": region,
        "Content-Type":                 "application/json",
      },
      body: JSON.stringify([{ text }]),
    });
    if (!res.ok) return "en";
    const data = (await res.json()) as Array<{ language: string }>;
    return data[0]?.language ?? "en";
  } catch {
    return "en";
  }
}

/**
 * Translate text to English.
 * If fromLanguage is "en" the text is returned as-is.
 * Falls back to the original text on any error.
 *
 * @param text         - Text to translate
 * @param fromLanguage - ISO 639-1 source language code (e.g. "es", "pt")
 */
export async function translateToEnglish(
  text:         string,
  fromLanguage: string
): Promise<string> {
  if (fromLanguage === "en" || !fromLanguage) return text;

  const key    = process.env.AZURE_TRANSLATOR_KEY;
  const region = process.env.AZURE_TRANSLATOR_REGION;
  if (!key || !region) return text;

  try {
    const url = `${TRANSLATOR_ENDPOINT}/translate?api-version=3.0&from=${fromLanguage}&to=en`;
    const res = await fetch(url, {
      method:  "POST",
      headers: {
        "Ocp-Apim-Subscription-Key":    key,
        "Ocp-Apim-Subscription-Region": region,
        "Content-Type":                 "application/json",
      },
      body: JSON.stringify([{ text }]),
    });
    if (!res.ok) return text;
    const data = (await res.json()) as Array<{
      translations: Array<{ text: string; to: string }>;
    }>;
    return data[0]?.translations?.[0]?.text ?? text;
  } catch {
    return text;
  }
}

// Re-export legacy stub signature for any existing callers
export async function translateText(
  _text: string,
  _from: string,
  _to:   string
): Promise<string> {
  return "";
}
