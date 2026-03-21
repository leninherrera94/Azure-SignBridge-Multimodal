import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient }         from "@/lib/azure/openai";
import { checkContentSafety }      from "@/lib/azure/content-safety";
import { detectPII }               from "@/lib/azure/pii-detection";
import type { SignSequenceItem }   from "@/lib/avatar/sign-animations";

// ─── Known signs ──────────────────────────────────────────────────────────────

const KNOWN_SIGNS = new Set([
  "hello", "thank_you", "yes", "no", "please", "help",
  "sorry", "good", "i_love_you", "stop",
  "1", "2", "3", "4", "5",
]);

const SKIP_WORDS = new Set([
  "a","an","the","is","am","are","was","were","be","been",
  "i","it","this","that","do","did","does","to","of","and","in","at","on",
]);

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

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an ASL (American Sign Language) translation assistant.

Given English text, translate it into a sequence of ASL signs and fingerspelling.

AVAILABLE SIGNS (use these when possible):
hello, thank_you, yes, no, please, help, sorry, good, i_love_you, stop, 1, 2, 3, 4, 5

RULES:
1. Simplify text to ASL-friendly grammar (topic-comment structure)
2. Use a known SIGN when a word matches or is a synonym
3. FINGERSPELL words that don't have a known sign (names, places, technical terms)
4. Map synonyms: hi/hey→hello, thanks→thank_you, ok/great/nice/fine→good, wait/halt→stop, love→i_love_you
5. Skip articles (a, an, the), skip "is/am/are" when possible
6. Proper nouns (names, places) — ALWAYS fingerspell them
7. Numbers 1–5 use the sign; larger numbers are fingerspelled
8. EVERY meaningful word must appear as either a sign or fingerspelled

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

// ─── Local fallback ───────────────────────────────────────────────────────────

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
        display: signId.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
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
  const body = await req.json().catch(() => ({})) as { text?: string };
  const text = body.text?.trim() ?? "";

  if (!text) {
    return NextResponse.json({
      sequence: [], signs: [], simplified: "", original: "",
      safetyCheck: { contentSafety: { passed: true, categories: { hate: 0, sexual: 0, violence: 0, selfHarm: 0 } }, pii: { found: false, count: 0 } },
    });
  }

  // ── PASO 1: Content Safety ─────────────────────────────────────────────────
  const safety = await checkContentSafety(text);

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

  // ── PASO 2: PII Detection ─────────────────────────────────────────────────
  const piiResult = await detectPII(text);
  const textToTranslate = piiResult.redactedText;

  const safetyCheck = {
    contentSafety: { passed: true, categories: safety.categories },
    pii: {
      found:    piiResult.piiEntities.length > 0,
      count:    piiResult.piiEntities.length,
      entities: piiResult.piiEntities.map((e) => ({ category: e.category })),
    },
  };

  // ── PASO 3: GPT-4o Translation ─────────────────────────────────────────────
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
      return NextResponse.json({ ...fb, original: text, signs: fb.sequence.filter((s) => s.type === "sign").map((s) => (s as { id: string }).id), safetyCheck });
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

    return NextResponse.json({
      sequence,
      signs,
      simplified: parsed.simplified ?? "",
      original:   text,
      safetyCheck,
    });
  } catch (err) {
    console.error("[translate-to-signs] OpenAI error:", err);
    const fb = localFallback(textToTranslate);
    return NextResponse.json({
      ...fb,
      original: text,
      signs: fb.sequence.filter((s) => s.type === "sign").map((s) => (s as { id: string }).id),
      safetyCheck,
    });
  }
}
