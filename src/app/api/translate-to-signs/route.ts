import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient }         from "@/lib/azure/openai";
import { checkContentSafety }      from "@/lib/azure/content-safety";
import { detectPII }               from "@/lib/azure/pii-detection";
import type { SignSequenceItem }   from "@/lib/avatar/sign-animations";
import type { SupportedLanguageCode } from "@/lib/azure/speech";
import { getKnownSignIds, getWordMap } from "@/lib/avatar/sign-loader";
import { resolveSignLanguageForUiLanguage, type SignLanguageCode } from "@/lib/avatar/sign-languages";

// ─── Known signs ──────────────────────────────────────────────────────────────

const KNOWN_SIGNS = new Set([
  "hello", "thank_you", "yes", "no", "please", "help",
  "sorry", "good", "i_love_you", "stop",
  "1", "2", "3", "4", "5",
]);

const SKIP_WORDS = new Set([
  "a","an","the","is","am","are","was","were","be","been",
  "i","it","this","that","do","did","does","to","of","and","in","at","on","for",
]);

// English synonym → sign ID mapping (used by local fallback on English text)
const KNOWN_SIGNS_MAP: Record<string, string> = {
  hello:"hello", hi:"hello", hey:"hello",
  thank:"thank_you", thanks:"thank_you",
  yes:"yes", yeah:"yes", yep:"yes",
  no:"no", nope:"no",
  please:"please",
  help:"help",
  sorry:"sorry",
  good:"good", great:"good", nice:"good", ok:"good", fine:"good",
  love:"i_love_you",
  stop:"stop", wait:"stop",
  "1":"1", one:"1",
  "2":"2", two:"2",
  "3":"3", three:"3",
  "4":"4", four:"4",
  "5":"5", five:"5",
};

// ─── Hardcoded word-level translation tables (fallback when Azure Translator is unavailable) ─

/** Maps a single non-English word to its English equivalent */
const WORD_TRANSLATION_FALLBACK: Record<string, string> = {
  // ── Portuguese ────────────────────────────────────────────────────────────
  olá:"hello", ola:"hello", oi:"hello",
  obrigado:"thank you", obrigada:"thank you",
  sim:"yes",
  "não":"no", nao:"no",
  "por":"please",   // "por favor"
  favor:"please",
  ajuda:"help", ajude:"help",
  desculpa:"sorry", desculpe:"sorry", desculpas:"sorry",
  bom:"good", boa:"good", "ótimo":"good", otimo:"good", "ótima":"good",
  parar:"stop", pare:"stop",
  "te":"i love you",
  amo:"i love you",
  amor:"i love you",
  preciso:"need", precisa:"need",
  quero:"want",
  isso:"this",
  // ── Spanish ───────────────────────────────────────────────────────────────
  hola:"hello",
  gracias:"thank you",
  "sí":"yes", si:"yes",
  "por favor":"please",
  ayuda:"help",
  "perdón":"sorry", perdon:"sorry", disculpa:"sorry",
  bien:"good", bueno:"good", genial:"good",
  espera:"wait",
  amo_es:"i love you",
};

/**
 * Word-level translation fallback.
 * Replaces known non-English words with English equivalents.
 * Used when Azure Translator is unavailable.
 */
function wordLevelTranslate(text: string): string {
  const words = text
    .toLowerCase()
    .replace(/[¿¡]/g, "")
    .split(/\s+/);

  const translated = words.map((w) => WORD_TRANSLATION_FALLBACK[w] ?? w);
  return translated.join(" ");
}

// ─── Azure Translator call ─────────────────────────────────────────────────────

async function translateToEnglishAzure(
  text:     string,
  fromLang: string   // ISO 639-1, e.g. "pt", "es"
): Promise<string> {
  const key    = process.env.AZURE_TRANSLATOR_KEY;
  const region = process.env.AZURE_TRANSLATOR_REGION;

  if (!key) {
    console.warn("[translate] AZURE_TRANSLATOR_KEY not set — using word-level fallback");
    return wordLevelTranslate(text);
  }

  try {
    const headers: Record<string, string> = {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type":              "application/json",
    };
    // Only add region header for NON-global resources
    // (global Translator resources reject this header)
    if (region && region !== "global") {
      headers["Ocp-Apim-Subscription-Region"] = region;
    }

    const url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${fromLang}&to=en`;
    const res = await fetch(url, {
      method:  "POST",
      headers,
      body:    JSON.stringify([{ text }]),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error(`[translate] Azure Translator error ${res.status}: ${err}`);
      return wordLevelTranslate(text);
    }

    const data = (await res.json()) as Array<{
      translations: Array<{ text: string; to: string }>;
    }>;

    const result = data[0]?.translations?.[0]?.text;
    if (!result) return wordLevelTranslate(text);

    console.log(`[translate] ${fromLang}→en: "${text}" → "${result}"`);
    return result;
  } catch (err) {
    console.error("[translate] Fetch error:", err);
    return wordLevelTranslate(text);
  }
}

// ─── System prompt ────────────────────────────────────────────────────────────

function getSystemPrompt(signLanguage: SignLanguageCode, knownSignIds: ReadonlySet<string>): string {
  const signLanguageLabel = signLanguage === "LSC"
    ? "LSC (Lengua de Señas Colombiana)"
    : "ASL (American Sign Language)";
  const availableSigns = Array.from(knownSignIds).join(", ");

  return `You are a ${signLanguageLabel} translation assistant.

Given text in ANY language (e.g. English, Spanish), translate its meaning into a sequence of ${signLanguageLabel} signs and fingerspelling.

AVAILABLE SIGNS (use these when possible):
${availableSigns}

RULES:
1. Simplify text to sign-language-friendly grammar (topic-comment structure) regardless of the input language.
2. Translate the concept to English first internally, then map to an available SIGN when the meaning matches or is a synonym.
3. FINGERSPELL words (in their original language or English equivalent) that don't have a known sign (names, places, technical terms).
4. Map synonyms across languages where possible.
5. Skip articles (a, the, el, la), skip "is/am/are/es/son" when possible.
6. Proper nouns (names, places) — ALWAYS fingerspell them.
7. Numbers 1–5 use the sign; larger numbers are fingerspelled.
8. EVERY meaningful concept must appear as either a sign or fingerspelled.

OUTPUT FORMAT (JSON only, no markdown):
{
  "sequence": [
    {"type":"sign","id":"hello","display":"Hello"},
    {"type":"spell","word":"John","display":"J-O-H-N"},
    {"type":"sign","id":"good","display":"Good"}
  ],
  "simplified": "Hello John good",
  "original": "the original text"
}`;
}

// ─── Local fallback (runs on English text) ─────────────────────────────────────

function localFallback(
  text: string,
  wordMap: Readonly<Record<string, string>>,
  knownSignIds: ReadonlySet<string>
): { sequence: SignSequenceItem[]; simplified: string } {
  const words = text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter((w) => w.length > 0);
  const sequence: SignSequenceItem[] = [];

  for (const word of words) {
    if (SKIP_WORDS.has(word)) continue;
    const signId = wordMap[word];
    if (signId && knownSignIds.has(signId)) {
      sequence.push({
        type:    "sign",
        id:      signId,
        display: signId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      });
    } else {
      sequence.push({
        type:    "spell",
        word,
        display: word.toUpperCase().split("").join("-"),
      });
    }
  }

  const simplified = sequence
    .map((s) => (s.type === "sign" ? s.display : (s.display ?? s.word)))
    .join(" ");

  return { sequence, simplified };
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { text?: string; language?: SupportedLanguageCode };
  const text = body.text?.trim() ?? "";
  const uiLanguage = body.language ?? "en-US";
  const signLanguage = resolveSignLanguageForUiLanguage(uiLanguage);
  const loadedKnownSignIds = getKnownSignIds(signLanguage);
  const loadedWordMap = getWordMap(signLanguage);
  const knownSignIds = signLanguage === "ASL" && loadedKnownSignIds.size === 0 ? KNOWN_SIGNS : loadedKnownSignIds;
  const wordMap = signLanguage === "ASL" && Object.keys(loadedWordMap).length === 0 ? KNOWN_SIGNS_MAP : loadedWordMap;
  const baseLang = uiLanguage.split("-")[0] ?? "en";

  if (!text) {
    return NextResponse.json({
      sequence: [], signs: [], simplified: "", original: "", translatedText: null,
      safetyCheck: { contentSafety: { passed: true, categories: { hate: 0, sexual: 0, violence: 0, selfHarm: 0 } }, pii: { found: false, count: 0 } },
    });
  }

  // ── PASO 1: Translate to English FIRST ────────────────────────────────────
  console.log("[step1] Original text:", text, "| lang:", uiLanguage, "| baseLang:", baseLang);

  let textForSigns = text;

  if (baseLang !== "en") {
    textForSigns = await translateToEnglishAzure(text, baseLang);
  }

  console.log("[step2] Translated text (en):", textForSigns);

  const translatedText = baseLang !== "en" ? textForSigns : null;

  // ── PASO 2: Content Safety (on English text) ──────────────────────────────
  const safety = await checkContentSafety(textForSigns);

  if (!safety.isAllowed) {
    return NextResponse.json({
      blocked:  true,
      reason:   safety.explanation,
      sequence: [],
      signs:    [],
      safetyCheck: {
        contentSafety: { passed: false, categories: safety.categories },
        pii:            { found: false, count: 0 },
      },
    });
  }

  // ── PASO 3: PII Detection (on English text) ───────────────────────────────
  const piiResult      = await detectPII(textForSigns);
  const textToTranslate = piiResult.redactedText;   // English, PII-scrubbed

  const safetyCheck = {
    contentSafety: { passed: true, categories: safety.categories },
    pii: {
      found:    piiResult.piiEntities.length > 0,
      count:    piiResult.piiEntities.length,
      entities: piiResult.piiEntities.map((e) => ({ category: e.category })),
    },
  };

  // ── PASO 4: GPT-4o → ASL sequence (English input) ────────────────────────
  console.log("[step3] Sending to GPT-4o:", textToTranslate);
  try {
    const client     = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model:       process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o",
      messages:    [
        { role: "system", content: getSystemPrompt(signLanguage, knownSignIds) },
        { role: "user",   content: textToTranslate },
      ],
      temperature: 0.1,
      max_tokens:  300,
    });

    const raw   = completion.choices[0]?.message?.content ?? "{}";
    const clean = raw.replace(/```json\n?/g, "").replace(/```/g, "").trim();

    let parsed: { sequence?: unknown[]; simplified?: string };
    try {
      parsed = JSON.parse(clean);
    } catch {
      const fb = localFallback(textToTranslate, wordMap, knownSignIds);
      return NextResponse.json({
        ...fb, original: text, translatedText,
        signs: fb.sequence.filter((s) => s.type === "sign").map((s) => (s as { id: string }).id),
        safetyCheck,
      });
    }

    const sequence: SignSequenceItem[] = (Array.isArray(parsed.sequence) ? parsed.sequence : [])
      .filter((item): item is SignSequenceItem => {
        if (!item || typeof item !== "object") return false;
        const it = item as Record<string, unknown>;
        if (it.type === "sign")  return typeof it.id === "string" && knownSignIds.has(it.id as string);
        if (it.type === "spell") return typeof it.word === "string" && (it.word as string).length > 0;
        return false;
      });

    const signs = sequence
      .filter((s) => s.type === "sign")
      .map((s) => (s as Extract<SignSequenceItem, { type: "sign" }>).id);

    console.log("[step4] Result sequence:", JSON.stringify(sequence));

    return NextResponse.json({
      sequence,
      signs,
      simplified:       parsed.simplified ?? "",
      original:         text,
      translatedText,
      detectedLanguage: baseLang,
      safetyCheck,
    });
  } catch (err) {
    console.error("[translate-to-signs] OpenAI error:", err);
    const fb = localFallback(textToTranslate, wordMap, knownSignIds);
    return NextResponse.json({
      ...fb,
      original:         text,
      translatedText,
      detectedLanguage: baseLang,
      signs: fb.sequence.filter((s) => s.type === "sign").map((s) => (s as { id: string }).id),
      safetyCheck,
    });
  }
}
