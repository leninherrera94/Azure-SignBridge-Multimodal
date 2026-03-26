import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient }        from "@/lib/azure/openai";
import { checkContentSafety }     from "@/lib/azure/content-safety";
import { detectPII }              from "@/lib/azure/pii-detection";
import type { SignSequenceItem }  from "@/lib/avatar/sign-animations";

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

const SYSTEM_PROMPT = `You are an ASL (American Sign Language) translation assistant.

The input text may be in English, Spanish, or Portuguese. Understand the meaning regardless of language.

Translate it into a sequence of ASL signs and fingerspelling.

AVAILABLE SIGNS (use these when possible):
hello, thank_you, yes, no, please, help, sorry, good, i_love_you, stop, 1, 2, 3, 4, 5

RULES:
1. Simplify text to ASL-friendly grammar (topic-comment structure)
2. Use a known SIGN when a word or phrase matches its meaning in any language:
   - hello/hi/hey/hola/olá/oi → hello
   - thank you/thanks/gracias/obrigado/obrigada → thank_you
   - yes/yeah/sí/sim → yes
   - no/nope/não → no
   - please/por favor → please
   - help/ayuda/ajuda → help
   - sorry/perdón/desculpa → sorry
   - good/great/ok/bien/bueno/bom/ótimo → good
   - stop/wait/pare/espera → stop
   - love/i love you/te amo/te quiero/te amo → i_love_you
3. FINGERSPELL proper nouns (names, places) and unknown words
4. Skip articles and auxiliary verbs when possible
5. EVERY meaningful word must appear as either a sign or fingerspelled

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

// ─── Local fallback (runs on English text) ─────────────────────────────────────

function localFallback(text: string): { sequence: SignSequenceItem[]; simplified: string } {
  const words = text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter((w) => w.length > 0);
  const sequence: SignSequenceItem[] = [];

  for (const word of words) {
    if (SKIP_WORDS.has(word)) continue;
    const signId = KNOWN_SIGNS_MAP[word];
    if (signId) {
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
  const body = await req.json().catch(() => ({})) as { text?: string; language?: string };
  const originalText = body.text?.trim() ?? "";
  const langCode     = body.language ?? "en-US";          // e.g. "pt-BR"
  const baseLang     = langCode.split("-")[0] ?? "en";    // e.g. "pt"

  if (!originalText) {
    return NextResponse.json({
      sequence: [], signs: [], simplified: "", original: "", translatedText: null,
      safetyCheck: { contentSafety: { passed: true, categories: { hate: 0, sexual: 0, violence: 0, selfHarm: 0 } }, pii: { found: false, count: 0 } },
    });
  }

  // ── PASO 1: Translate to English FIRST ────────────────────────────────────
  console.log("[step1] Original text:", originalText, "| lang:", langCode, "| baseLang:", baseLang);

  let textForSigns = originalText;

  if (baseLang !== "en") {
    textForSigns = await translateToEnglishAzure(originalText, baseLang);
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
        { role: "system", content: SYSTEM_PROMPT },
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
      const fb = localFallback(textToTranslate);
      return NextResponse.json({
        ...fb, original: originalText, translatedText,
        signs: fb.sequence.filter((s) => s.type === "sign").map((s) => (s as { id: string }).id),
        safetyCheck,
      });
    }

    const sequence: SignSequenceItem[] = (Array.isArray(parsed.sequence) ? parsed.sequence : [])
      .filter((item): item is SignSequenceItem => {
        if (!item || typeof item !== "object") return false;
        const it = item as Record<string, unknown>;
        if (it.type === "sign")  return typeof it.id === "string" && KNOWN_SIGNS.has(it.id as string);
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
      original:         originalText,
      translatedText,
      detectedLanguage: baseLang,
      safetyCheck,
    });
  } catch (err) {
    console.error("[translate-to-signs] OpenAI error — using local fallback on:", textToTranslate, err);
    const fb = localFallback(textToTranslate);
    return NextResponse.json({
      ...fb,
      original:         originalText,
      translatedText,
      detectedLanguage: baseLang,
      signs: fb.sequence.filter((s) => s.type === "sign").map((s) => (s as { id: string }).id),
      safetyCheck,
    });
  }
}
