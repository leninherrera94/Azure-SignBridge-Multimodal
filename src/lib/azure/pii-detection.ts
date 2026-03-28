/**
 * src/lib/azure/pii-detection.ts
 * Azure AI Language — PII Entity Recognition.
 * Detects and redacts names, phone numbers, emails, addresses, etc.
 * before the text is sent to GPT-4o for translation.
 * Fails OPEN: if service is unavailable, returns the original text unchanged.
 */

export interface PIIResult {
  redactedText: string;
  piiEntities:  Array<{ text: string; category: string; redacted: string }>;
}

export async function detectPII(text: string): Promise<PIIResult> {
  const endpoint = process.env.AZURE_LANGUAGE_ENDPOINT?.replace(/\/$/, "");
  const key      = process.env.AZURE_LANGUAGE_KEY;

  const passthrough: PIIResult = { redactedText: text, piiEntities: [] };
  if (!endpoint || !key) return passthrough;

  try {
    // Synchronous PII endpoint (v3.1)
    const res = await fetch(
      `${endpoint}/text/analytics/v3.1/entities/recognition/pii`,
      {
        method:  "POST",
        headers: {
          "Content-Type":              "application/json",
          "Ocp-Apim-Subscription-Key": key,
        },
        body: JSON.stringify({
          documents: [{ id: "1", language: "en", text }],
        }),
      }
    );

    if (!res.ok) {
      console.error(`[pii-detection] HTTP ${res.status}:`, await res.text());
      return passthrough; // fail open
    }

    const data = (await res.json()) as {
      documents?: Array<{
        redactedText: string;
        entities:     Array<{ text: string; category: string }>;
      }>;
      errors?: Array<{ id: string; error: { code: string; message: string } }>;
    };

    const doc = data.documents?.[0];
    if (!doc) return passthrough;

    return {
      redactedText: doc.redactedText ?? text,
      piiEntities:  (doc.entities ?? []).map((e) => ({
        text:     e.text,
        category: e.category,
        redacted: `[${e.category.toUpperCase()}]`,
      })),
    };
  } catch (err) {
    console.error("[pii-detection] Request failed:", err);
    return passthrough; // fail open on network error
  }
}
