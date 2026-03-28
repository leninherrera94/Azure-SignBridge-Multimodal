/**
 * src/lib/azure/content-safety.ts
 * Azure AI Content Safety — analyzes every message before translation.
 * Severity scale: 0 = safe, 2 = low, 4 = medium, 6 = high.
 * Blocks when any category severity >= 2.
 * Fails OPEN: if service is unavailable, all content is allowed.
 */

export interface ContentSafetyResult {
  isAllowed:   boolean;
  categories:  { hate: number; sexual: number; violence: number; selfHarm: number };
  explanation: string;
}

export async function checkContentSafety(text: string): Promise<ContentSafetyResult> {
  const endpoint = process.env.AZURE_CONTENT_SAFETY_ENDPOINT?.replace(/\/$/, "");
  const key      = process.env.AZURE_CONTENT_SAFETY_KEY;

  const passthrough: ContentSafetyResult = {
    isAllowed:   true,
    categories:  { hate: 0, sexual: 0, violence: 0, selfHarm: 0 },
    explanation: "Content Safety not configured — all content allowed",
  };

  if (!endpoint || !key) return passthrough;

  try {
    const res = await fetch(
      `${endpoint}/contentsafety/text:analyze?api-version=2023-10-01`,
      {
        method:  "POST",
        headers: {
          "Content-Type":              "application/json",
          "Ocp-Apim-Subscription-Key": key,
        },
        body: JSON.stringify({
          text,
          categories: ["Hate", "Sexual", "Violence", "SelfHarm"],
          outputType: "FourSeverityLevels",
        }),
      }
    );

    if (!res.ok) {
      console.error(`[content-safety] HTTP ${res.status}:`, await res.text());
      return passthrough; // fail open
    }

    const data = (await res.json()) as {
      categoriesAnalysis: Array<{ category: string; severity: number }>;
    };

    const raw: Record<string, number> = {};
    for (const c of data.categoriesAnalysis ?? []) {
      raw[c.category.toLowerCase()] = c.severity;
    }

    const categories = {
      hate:     raw["hate"]     ?? 0,
      sexual:   raw["sexual"]   ?? 0,
      violence: raw["violence"] ?? 0,
      selfHarm: raw["selfharm"] ?? 0,
    };

    const maxSev     = Math.max(...Object.values(categories));
    const isAllowed  = maxSev < 2;
    const flagged    = Object.entries(categories).filter(([, v]) => v >= 2).map(([k]) => k);

    return {
      isAllowed,
      categories,
      explanation: isAllowed
        ? "Content passed all safety checks"
        : `Content flagged: ${flagged.join(", ")}`,
    };
  } catch (err) {
    console.error("[content-safety] Request failed:", err);
    return passthrough; // fail open on network error
  }
}
