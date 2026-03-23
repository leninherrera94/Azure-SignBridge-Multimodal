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
  "want", "eat", "water", "who", "what", "where", "when",
  "why", "how", "go", "more", "finish", "play", "work", "learn",
  "the", "of", "and", "a", "to", "in", "is", "you", "that", "it",
  "he", "was", "for", "on", "are", "as", "with", "his", "they", "i",
  "at", "be", "this", "have", "from", "or", "had", "by", "word",
  "but", "all", "we", "your", "can", "said", "there", "use",
  "each", "which", "she", "their", "if"
]);

const SKIP_WORDS = new Set([
  // English
  "am","were","been","do","did","does",
  // Spanish
  "hacer","hizo","hacen",
]);

const KNOWN_SIGNS_MAP: Record<string, string> = {
  // English
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
  want: "want", wants: "want", desire: "want",
  eat: "eat", eats: "eat", ate: "eat",
  water: "water", drink: "water",
  who: "who", whose: "who",
  what: "what",
  where: "where",
  when: "when",
  why: "why",
  how: "how",
  go: "go", goes: "go", went: "go",
  more: "more", extra: "more",
  finish: "finish", done: "finish", finished: "finish",
  play: "play", plays: "play", playing: "play",
  work: "work", works: "work", working: "work",
  learn: "learn", learns: "learn", learning: "learn",
  
  the: "the", of: "of", and: "and", a: "a", an: "a", to: "to", in: "in", is: "is", you: "you",
  that: "that", it: "it", he: "he", was: "was", for: "for", on: "on",
  are: "are", as: "as", with: "with", his: "his", they: "they", i: "i",
  at: "at", be: "be", "this": "this", have: "have", from: "from", or: "or", had: "had", by: "by", word: "word",
  
  not: "no",
  but: "but", all: "all", we: "we", your: "your", can: "can", said: "said",
  there: "there", use: "use", each: "each", which: "which", she: "she", their: "their", if: "if",

  // Spanish
  hola:"hello", buenas:"hello", saludos:"hello",
  gracias:"thank_you",
  sí:"yes", claro:"yes",
  // "no" is already handled by English
  favor:"please", // "por favor" handled by words
  ayuda:"help", auxiliar:"help",
  perdon:"sorry", perdón:"sorry", lo:"sorry", siento:"sorry", disculpa:"sorry",
  bien:"good", bueno:"good", genial:"good", excelente:"good",
  amo:"i_love_you", quiero:"want", quieres:"want", quiere:"want", queremos:"want", quieren:"want", deseo:"want",
  alto:"stop", para:"stop", detente:"stop", espera:"stop",
  uno:"1", dos:"2", tres:"3", cuatro:"4", cinco:"5",
  comer: "eat", como: "how", comes: "eat", come: "eat", comen: "eat", comemos: "eat",
  cómo: "how",
  agua: "water", beber: "water", tomar: "water",
  quien: "who", quién: "who", quienes: "who", quiénes: "who",
  que: "what", qué: "what",
  donde: "where", dónde: "where",
  cuando: "when", cuándo: "when",
  porque: "why", porqué: "why",
  ir: "go", voy: "go", vas: "go", va: "go", vamos: "go", van: "go",
  mas: "more", más: "more",
  terminar: "finish", terminado: "finish", fin: "finish", listo: "finish",
  jugar: "play", juego: "play", juegas: "play", juega: "play", jugamos: "play", juegan: "play",
  trabajo: "work", trabajar: "work", trabajas: "work", trabaja: "work", trabajamos: "work", trabajan: "work",
  aprender: "learn", aprendo: "learn", aprendes: "learn", aprende: "learn", aprendemos: "learn", aprenden: "learn",

  el: "the", la: "the", los: "the", las: "the",
  de: "of",
  y: "and",
  un: "a", una: "a", unos: "a", unas: "a",
  hacia: "to",
  en: "in", sobre: "on",
  es: "is",
  tu: "you", tú: "you", usted: "you", ustedes: "you",
  eso: "that",
  él: "he",
  fui: "was", fue: "was", fueron: "was",
  son: "are", eres: "are",
  con: "with",
  su: "his", sus: "his",
  ellos: "they", ellas: "they",
  yo: "i",
  
  ser: "be", estar: "be", sea: "be",
  este: "this", esta: "this", esto: "this",
  tener: "have", tengo: "have", tienes: "have", tiene: "have", tenemos: "have", tienen: "have",
  desde: "from",
  o: "or",
  tuve: "had", tenía: "had", tuvimos: "had", tuvieron: "had",
  por: "by",
  palabra: "word", palabras: "word",

  pero: "but", sino: "but",
  todo: "all", todos: "all", todas: "all",
  nosotros: "we", nosotras: "we",
  tuyo: "your", tuya: "your", tuyos: "your", tuyas: "your",
  puedo: "can", puedes: "can", puede: "can", podemos: "can", pueden: "can", poder: "can",
  dijo: "said", dije: "said", dijeron: "said", dijimos: "said", decir: "said",
  ahi: "there", ahí: "there", alli: "there", allí: "there", alla: "there", allá: "there",
  usar: "use", uso: "use", usas: "use", usa: "use", usamos: "use", usan: "use",
  cada: "each",
  cual: "which", cuál: "which", cuales: "which", cuáles: "which",
  ella: "she",
  suyo: "their", suya: "their", suyos: "their", suyas: "their",
  si: "if",
};

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an ASL (American Sign Language) translation assistant.

Given text in ANY language (e.g. English, Spanish), translate its meaning into a sequence of ASL signs and fingerspelling.

AVAILABLE SIGNS (use these when possible):
hello, thank_you, yes, no, please, help, sorry, good, i_love_you, stop, 1, 2, 3, 4, 5, want, eat, water, who, what, where, when, why, how, go, more, finish, play, work, learn, the, of, and, a, to, in, is, you, that, it, he, was, for, on, are, as, with, his, they, i, at, be, this, have, from, or, had, by, word, but, all, we, your, can, said, there, use, each, which, she, their, if

RULES:
1. Simplify text to ASL-friendly grammar (topic-comment structure) regardless of the input language.
2. Translate the concept to English first internally, then map to an available ASL SIGN when the meaning matches or is a synonym.
3. FINGERSPELL words (in their original language or English equivalent) that don't have a known sign (names, places, technical terms).
4. Map synonyms across languages: hi/hola→hello, thanks/gracias→thank_you, ok/bien→good, wait/para→stop, love/amo→i_love_you
5. Skip articles (a, the, el, la), skip "is/am/are/es/son" when possible
6. Proper nouns (names, places) — ALWAYS fingerspell them
7. Numbers 1–5 use the sign; larger numbers are fingerspelled
8. EVERY meaningful concept must appear as either a sign or fingerspelled

OUTPUT FORMAT (JSON only, no markdown):
{
  "sequence": [
    {"type":"sign","id":"hello","display":"Hello"},
    {"type":"spell","word":"Juan","display":"J-U-A-N"},
    {"type":"sign","id":"good","display":"Good"}
  ],
  "simplified": "Hello Juan good",
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
