"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import SignAvatar from "@/components/SignAvatar";
import OnboardingModal, { type CommMode } from "@/components/OnboardingModal";
import SessionSummary, { type ChatMessage, type AISummaryResult } from "@/components/SessionSummary";
import ResponsibleAIPanel, { type AIDecision } from "@/components/ResponsibleAIPanel";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSignRecognition } from "@/hooks/useSignRecognition";
import { useAcsCalling } from "@/hooks/useAcsCalling";
import { SUPPORTED_LANGUAGES } from "@/lib/azure/speech";
import type { SupportedLanguageCode } from "@/lib/azure/speech";
import type { SignAvatarHandle } from "@/components/SignAvatar";
import type { SignSequenceItem } from "@/lib/avatar/sign-animations";
import { getKnownSignIds, getWordMap } from "@/lib/avatar/sign-loader";
import { resolveSignLanguageForUiLanguage, type SignLanguageCode } from "@/lib/avatar/sign-languages";
import { VideoStreamRenderer, RemoteVideoStream } from "@azure/communication-calling";

export function RemoteParticipantVideo({ stream }: { stream: RemoteVideoStream }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let renderer: VideoStreamRenderer | null = null;
    let view: any = null;
    let mounted = true;
    async function render() {
      if (!containerRef.current) return;
      renderer = new VideoStreamRenderer(stream);
      view = await renderer.createView();
      if (mounted && containerRef.current) {
        containerRef.current.appendChild(view.target);
      }
    }
    render();
    return () => {
      mounted = false;
      view?.dispose();
      renderer?.dispose();
    };
  }, [stream]);
  return <div ref={containerRef} className="w-full h-full object-cover rounded-xl overflow-hidden" style={{ background: "#000" }} />;
}

// ─── Client-side local fallback ───────────────────────────────────────────────

const KNOWN_SIGN_IDS = new Set([
  "hello", "thank_you", "yes", "no", "please", "help",
  "sorry", "good", "i_love_you", "stop",
  "1", "2", "3", "4", "5",
  "want", "eat", "water", "who", "what", "where", "when",
  "why", "how", "go", "more", "finish", "play", "work", "learn",
  "the", "of", "and", "a", "to", "in", "is", "you", "that", "it",
  "he", "was", "for", "on", "are", "as", "with", "his", "they", "i",
  "at", "be", "this", "have", "from", "or", "had", "by", "word",
  "but", "all", "we", "your", "can", "said", "there", "use",
  "each", "which", "she", "their", "if",
  // Phase 3 vocabulary
  "will", "up", "other", "about", "out", "many", "then", "so",
  "some", "would", "make", "like", "into", "time", "look",
  // Phase 4 vocabulary
  "write", "see", "number", "way", "could", "people", "my", "than",
  "first", "been", "call", "oil", "its", "now", "find", "long",
  "down", "day", "did", "get", "come", "may", "part"
]);

const SKIP_WORDS_SET = new Set([
  // English
  "am","were","do","does",
  // Spanish
]);

const KNOWN_SIGNS_MAP: Record<string, string> = {
  // English
  hello: "hello", hi: "hello", hey: "hello",
  thank: "thank_you", thanks: "thank_you",
  yes: "yes", yeah: "yes", yep: "yes",
  no: "no", nope: "no", not: "no",
  please: "please",
  help: "help",
  sorry: "sorry",
  good: "good", great: "good", nice: "good", ok: "good", fine: "good",
  love: "i_love_you",
  stop: "stop", wait: "stop",
  "1": "1", one: "1",
  "2": "2", two: "2",
  "3": "3", three: "3",
  "4": "4", four: "4",
  "5": "5", five: "5",
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

  but: "but", all: "all", we: "we", your: "your", can: "can", said: "said",
  there: "there", use: "use", each: "each", which: "which", she: "she", their: "their", if: "if",

  // Phase 3 (English)
  will: "will",
  up: "up",
  other: "other",
  about: "about",
  out: "out", outside: "out",
  many: "many",
  then: "then",
  them: "they",
  these: "this",
  so: "so",
  some: "some",
  her: "she", hers: "she",
  would: "would",
  make: "make", makes: "make", made: "make", making: "make",
  like: "like", likes: "like", liked: "like", liking: "like",
  him: "he",
  into: "into",
  time: "time",
  has: "have",
  look: "look", looks: "look", looking: "look", looked: "look",

  // Spanish
  hola: "hello", buenas: "hello", saludos: "hello",
  gracias: "thank_you",
  sí: "yes", claro: "yes",
  // "no" is already handled by English "no"
  favor: "please", 
  ayuda: "help", auxiliar: "help",
  perdon: "sorry", perdón: "sorry", lo: "sorry", siento: "sorry", disculpa: "sorry",
  bien: "good", bueno: "good", genial: "good", excelente: "good",
  amo: "i_love_you", quiero: "want", quieres: "want", quiere: "want", queremos: "want", quieren: "want", deseo: "want",
  alto: "stop", para: "stop", detente: "stop", espera: "stop",
  uno: "1", dos: "2", tres: "3", cuatro: "4", cinco: "5",
  comer: "eat", como: "how", comen: "eat", comemos: "eat", // como can be how or eat. We'll map to how
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

  // Phase 3 (Spanish)
  voluntad: "will",
  arriba: "up",
  otro: "other", otra: "other", otros: "other", otras: "other",
  acerca: "about",
  fuera: "out", afuera: "out",
  muchos: "many", muchas: "many",
  entonces: "then", luego: "then",
  les: "they",
  estos: "this", estas: "this",
  asi: "so", así: "so", tan: "so",
  algunos: "some", algunas: "some", algo: "some",
  haría: "would",
  hacer: "make", hago: "make", haces: "make", hace: "make", hacemos: "make", hacen: "make", hizo: "make",
  gustar: "like", gusta: "like", gustan: "like",
  le: "he",
  adentro: "into", dentro: "into",
  tiempo: "time", hora: "time",
  ha: "have", han: "have",
  mirar: "look", mira: "look", miro: "look", miras: "look", miran: "look", miramos: "look",

  // Phase 4 (English)
  write: "write", writes: "write", wrote: "write", writing: "write",
  see: "see", sees: "see", saw: "see", seeing: "see",
  number: "number", numbers: "number",
  way: "way", ways: "way",
  could: "could",
  people: "people", person: "people",
  my: "my", mine: "my",
  than: "than",
  first: "first",
  been: "been",
  call: "call", calls: "call", called: "call", calling: "call",
  oil: "oil",
  its: "its",
  now: "now", currently: "now",
  find: "find", finds: "find", found: "find", finding: "find",
  long: "long",
  down: "down",
  day: "day", days: "day",
  did: "did",
  get: "get", gets: "get", got: "get", getting: "get",
  come: "come", comes: "come", came: "come", coming: "come",
  may: "may", maybe: "may",
  part: "part", parts: "part",

  // Phase 4 (Spanish)
  escribir: "write", escribo: "write", escribes: "write", escribe: "write", escribimos: "write", escriben: "write",
  ver: "see", veo: "see", ves: "see", ve: "see", vemos: "see", ven: "see", vi: "see",
  numero: "number", número: "number", numeros: "number", números: "number",
  camino: "way", manera: "way", forma: "way",
  podría: "could",
  gente: "people", personas: "people", persona: "people",
  mi: "my", mis: "my",
  primero: "first", primera: "first",
  sido: "been", estado: "been",
  llamar: "call", llamo: "call", llamas: "call", llama: "call", llamamos: "call", llaman: "call",
  aceite: "oil",
  ahora: "now", actualmente: "now", ya: "now",
  encontrar: "find", encuentro: "find", encuentras: "find", encuentra: "find", encontramos: "find", encuentran: "find",
  largo: "long", larga: "long",
  abajo: "down",
  dia: "day", día: "day", dias: "day", días: "day",
  hice: "did", hicimos: "did", hicieron: "did",
  obtener: "get", consigo: "get", consigues: "get", consigue: "get", conseguimos: "get", consiguen: "get",
  venir: "come", vengo: "come", vienes: "come", viene: "come", venimos: "come", vienen: "come",
  quizas: "may", quizás: "may", tal: "may", vez: "may",
  parte: "part", partes: "part",
};

function clientLocalFallback(text: string, signLanguage: SignLanguageCode): SignSequenceItem[] {
  const loadedWordMap = getWordMap(signLanguage);
  const loadedKnownSignIds = getKnownSignIds(signLanguage);
  const wordMap = signLanguage === "ASL" && Object.keys(loadedWordMap).length === 0 ? KNOWN_SIGNS_MAP : loadedWordMap;
  const knownSignIds = signLanguage === "ASL" && loadedKnownSignIds.size === 0 ? KNOWN_SIGN_IDS : loadedKnownSignIds;
  const words = text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter((w) => w.length > 0);
  const seq: SignSequenceItem[] = [];
  for (const word of words) {
    if (SKIP_WORDS_SET.has(word)) continue;
    const signId = wordMap[word];
    if (signId && knownSignIds.has(signId)) {
      seq.push({ type: "sign", id: signId, display: signId.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) });
    } else {
      seq.push({ type: "spell", word, display: word.toUpperCase().split("").join("-") });
    }
  }
  return seq;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type RoomTab = "avatar" | "chat" | "accessibility" | "ai";

interface PageProps {
  params: { id: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

const FONT_SIZES: Record<"S" | "M" | "L" | "XL", string> = {
  S: "text-xs", M: "text-sm", L: "text-base", XL: "text-lg",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RoomPage({ params }: PageProps) {
  const roomId = params.id;

  // ── Navigation ──────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<CommMode | null>(null);
  const [tab,  setTab]  = useState<RoomTab>("avatar");
  const [language, setLanguage] = useState<SupportedLanguageCode>("en-US");
  const activeSignLang = resolveSignLanguageForUiLanguage(language);

  // ── Session ──────────────────────────────────────────────────────────────────
  const [sessionStart] = useState(() => new Date());
  const [showSummary,  setShowSummary]  = useState(false);
  const [elapsed,      setElapsed]      = useState(0);
  const [copied,       setCopied]       = useState(false);

  // ── Messages ─────────────────────────────────────────────────────────────────
  const [messages,      setMessages]      = useState<ChatMessage[]>([]);
  const [chatInput,     setChatInput]     = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  // ── Avatar playback ──────────────────────────────────────────────────────────
  const [currentSequence, setCurrentSequence] = useState<SignSequenceItem[]>([]);
  const [activeItemIdx,   setActiveItemIdx]   = useState(-1);
  const [activeLetterIdx, setActiveLetterIdx] = useState(-1);

  // ── Stats & Responsible AI ───────────────────────────────────────────────────
  const [signsCount,        setSignsCount]        = useState(0);
  const [wordsCount,        setWordsCount]        = useState(0);
  const [safetyCount,       setSafetyCount]       = useState(0);
  const [piiCount,          setPiiCount]          = useState(0);
  const [blockedCount,      setBlockedCount]      = useState(0);
  const [aiDecisions,       setAiDecisions]       = useState<AIDecision[]>([]);
  const [totalResponseMs,   setTotalResponseMs]   = useState(0);
  const [responseCallCount, setResponseCallCount] = useState(0);
  const [saveConversation,  setSaveConversation]  = useState(false);
  const [blockedToast,      setBlockedToast]      = useState<string | null>(null);
  const [aiSummary,         setAiSummary]         = useState<AISummaryResult | null>(null);
  const [summaryLoading,    setSummaryLoading]    = useState(false);

  // ── Accessibility ─────────────────────────────────────────────────────────────
  const [highContrast,      setHighContrast]      = useState(false);
  const [fontSize,          setFontSize]          = useState<"S" | "M" | "L" | "XL">("M");
  const [showAvatarPanel,   setShowAvatarPanel]   = useState(true);
  const [showTranscription, setShowTranscription] = useState(true);
  const [avatarSpeed,       setAvatarSpeed]       = useState(1);
  const [reduceMotion,      setReduceMotion]       = useState(false);

  // ── Cam / mic toggles ────────────────────────────────────────────────────────
  const [micMuted, setMicMuted] = useState(false);
  const [camOff,   setCamOff]   = useState(false);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const avatarRef      = useRef<SignAvatarHandle>(null);
  const videoRef       = useRef<HTMLVideoElement>(null);
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const chatEndRef     = useRef<HTMLDivElement>(null);
  const streamRef      = useRef<MediaStream | null>(null);
  const prevTranscript = useRef("");
  const seqQueue       = useRef<SignSequenceItem[][]>([]);
  const playingRef     = useRef(false);
  const lastSignRef    = useRef<string | null>(null);

  // ── Hooks ─────────────────────────────────────────────────────────────────────
  const speech  = useSpeechRecognition(language);
  const signRec = useSignRecognition();

  // ── Elapsed timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - sessionStart.getTime()), 1000);
    return () => clearInterval(t);
  }, [sessionStart]);

  // ── Restore accessibility settings ────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem("signbridge-a11y");
      if (!raw) return;
      const p = JSON.parse(raw) as Record<string, unknown>;
      if (typeof p.highContrast      === "boolean") setHighContrast(p.highContrast);
      if (typeof p.fontSize          === "string")  setFontSize(p.fontSize as "S" | "M" | "L" | "XL");
      if (typeof p.showAvatar        === "boolean") setShowAvatarPanel(p.showAvatar);
      if (typeof p.showTranscription === "boolean") setShowTranscription(p.showTranscription);
      if (typeof p.avatarSpeed       === "number")  setAvatarSpeed(p.avatarSpeed);
      if (typeof p.reduceMotion      === "boolean") setReduceMotion(p.reduceMotion);
    } catch { /* ignore */ }
  }, []);

  // ── Sync sign language to avatar engine ──────────────────────────────────────
  useEffect(() => {
    avatarRef.current?.setSignLanguage(activeSignLang);
  }, [activeSignLang]);

  function saveA11y(update: Record<string, unknown>) {
    try {
      const current = JSON.parse(localStorage.getItem("signbridge-a11y") ?? "{}") as Record<string, unknown>;
      localStorage.setItem("signbridge-a11y", JSON.stringify({ ...current, ...update }));
    } catch { /* ignore */ }
  }

  // ── Webcam stream ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Only start the webcam if the user has selected a mode and hasn't toggled off the camera manually
    if (!mode || camOff || !videoRef.current) return;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => { /* permission denied — video stays blank */ });

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camOff, mode]);

  // ── Mode selection ────────────────────────────────────────────────────────────
  function handleModeSelect(selected: CommMode) {
    setMode(selected);
    if (selected === "speak") speech.startListening();
  }

  // ── Sign recognition lifecycle ────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "sign") return;
    if (videoRef.current && canvasRef.current) {
      signRec.start(videoRef.current, canvasRef.current);
    }
    return () => signRec.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // New sign detected → add to chat
  useEffect(() => {
    if (mode !== "sign" || !signRec.currentSign) return;
    if (signRec.currentSign === lastSignRef.current) return;
    lastSignRef.current = signRec.currentSign;
    addMessage({ text: signRec.currentSign, mode: "sign" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signRec.currentSign, mode]);

  // ── Speech transcript → translate → avatar ─────────────────────────────────
  useEffect(() => {
    const { transcript } = speech;
    if (!transcript || transcript.length <= prevTranscript.current.length) return;
    const newText = transcript.slice(prevTranscript.current.length).trim();
    prevTranscript.current = transcript;
    if (newText) handleNewUtterance(newText);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.transcript]);

  // ── Message helper ────────────────────────────────────────────────────────────
  const addMessage = useCallback(
    (opts: { text: string; mode: CommMode; signs?: string[] }): ChatMessage => {
      const msg: ChatMessage = {
        id:        crypto.randomUUID(),
        text:      opts.text,
        mode:      opts.mode,
        timestamp: new Date(),
        signs:     opts.signs,
      };
      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    []
  );

  // ── AI decision log helper ────────────────────────────────────────────────────
  const addDecision = useCallback(
    (opts: Omit<AIDecision, "id" | "timestamp">) => {
      setAiDecisions((prev) => [
        ...prev,
        { ...opts, id: crypto.randomUUID(), timestamp: new Date() },
      ]);
    },
    []
  );

  // ── Auto-scroll chat ──────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Sign queue drain ──────────────────────────────────────────────────────────
  const drainQueue = useCallback(async () => {
    if (playingRef.current) return;
    playingRef.current = true;
    while (seqQueue.current.length > 0) {
      const seq = seqQueue.current.shift()!;
      setCurrentSequence(seq);
      setTab("avatar");
      await avatarRef.current?.playMixedSequence(seq, (idx, _item, letterIdx) => {
        setActiveItemIdx(idx);
        setActiveLetterIdx(letterIdx ?? -1);
      });
      setCurrentSequence([]);
      setActiveItemIdx(-1);
      setActiveLetterIdx(-1);
    }
    playingRef.current = false;
  }, []);

  // ── ACS Data Channel ──────────────────────────────────────────────────────────
  const handleDataChannelMessage = useCallback((payload: any) => {
    if (payload.type === "chat") {
      addMessage({ text: payload.text, mode: payload.mode, signs: payload.signs });
      if (payload.sequence && payload.sequence.length > 0) {
        setSignsCount((n: number) => n + payload.sequence.length);
        seqQueue.current.push(payload.sequence);
        drainQueue();
      }
    }
  }, [addMessage, drainQueue]);

  const { remoteStreams, error: acsError, toggleMic: txMic, toggleCam: txCam, sendData } = useAcsCalling(roomId, !!mode, handleDataChannelMessage);

  // ── Translate & enqueue ───────────────────────────────────────────────────────
  const handleNewUtterance = useCallback(
    async (text: string) => {
      const t0 = Date.now();
      setWordsCount((n) => n + text.trim().split(/\s+/).length);
      setIsTranslating(true);

      let sequence: SignSequenceItem[] = [];
      let blocked = false;

      type TranslateResponse = {
        blocked?: boolean;
        reason?:  string;
        sequence?: SignSequenceItem[];
        simplified?: string;
        safetyCheck?: {
          contentSafety: { passed: boolean; categories: { hate: number; sexual: number; violence: number; selfHarm: number } };
          pii:            { found: boolean; count: number; entities?: Array<{ category: string }> };
        };
      };

      try {
        const res = await Promise.race([
          fetch("/api/translate-to-signs", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ text, language }),
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 3000)
          ),
        ]);
        const data = (await res.json()) as TranslateResponse;
        const responseMs = Date.now() - t0;

        // ── Content Safety result ──────────────────────────────────────────────
        if (data.safetyCheck) {
          setSafetyCount((n) => n + 1);
          const cs = data.safetyCheck.contentSafety;
          addDecision({
            action:   "content-safety",
            input:    text.slice(0, 40),
            decision: cs.passed ? "Allowed" : "Blocked",
            status:   cs.passed ? "allowed" : "blocked",
            details:  {
              hate:          cs.categories.hate,
              sexual:        cs.categories.sexual,
              violence:      cs.categories.violence,
              selfHarm:      cs.categories.selfHarm,
              responseTimeMs: responseMs,
            },
          });

          // ── PII result ────────────────────────────────────────────────────────
          const pii = data.safetyCheck.pii;
          if (pii.found) {
            setPiiCount((n) => n + pii.count);
            addDecision({
              action:   "pii-detection",
              input:    text.slice(0, 40),
              decision: `${pii.count} PII entity${pii.count !== 1 ? "ies" : ""} redacted`,
              status:   "pii-found",
              details:  { piiCount: pii.count },
            });
          } else {
            addDecision({
              action:   "pii-detection",
              input:    text.slice(0, 40),
              decision: "No PII detected",
              status:   "clean",
              details:  { piiCount: 0 },
            });
          }
        }

        if (data.blocked) {
          blocked = true;
          setBlockedCount((n) => n + 1);
          setBlockedToast(data.reason ?? "Content filtered for safety");
          setTimeout(() => setBlockedToast(null), 5000);
        } else {
          sequence = data.sequence ?? [];
          const simplified = data.simplified ?? "";

          // ── Translation result ─────────────────────────────────────────────
          const nSigns = sequence.filter((s) => s.type === "sign").length;
          const nSpell = sequence.filter((s) => s.type === "spell").length;
          addDecision({
            action:   "translation",
            input:    text.slice(0, 40),
            decision: `${nSigns} sign${nSigns !== 1 ? "s" : ""} + ${nSpell} spell${nSpell !== 1 ? "s" : ""}`,
            status:   "success",
            details:  {
              signsCount:     nSigns,
              spellCount:     nSpell,
              responseTimeMs: responseMs,
              engine:         "GPT-4o",
            },
          });

          setTotalResponseMs((n) => n + responseMs);
          setResponseCallCount((n) => n + 1);

          if (simplified) {
            // keep simplified for potential future use
            void simplified;
          }
        }
      } catch {
        // Timeout or network error → local fallback
        sequence = clientLocalFallback(text, activeSignLang);
        const responseMs = Date.now() - t0;
        addDecision({
          action:   "translation",
          input:    text.slice(0, 40),
          decision: "Local fallback (API timeout)",
          status:   "fallback",
          details:  { responseTimeMs: responseMs },
        });
        console.info("[room] using local fallback for:", text);
      } finally {
        setIsTranslating(false);
      }

      if (blocked) return;

      const signIds = sequence
        .filter((s): s is Extract<SignSequenceItem, { type: "sign" }> => s.type === "sign")
        .map((s) => s.id);

      addMessage({ text, mode: mode ?? "speak", signs: signIds });

      if (sequence.length > 0) {
        setSignsCount((n) => n + sequence.length);
        seqQueue.current.push(sequence);
        drainQueue();
      }

      // Broadcast to other peers via DataChannel
      sendData({
        type: "chat",
        text,
        mode: mode ?? "speak",
        signs: signIds,
        sequence
      });
    },
    [mode, language, activeSignLang, addMessage, addDecision, drainQueue, sendData]
  );

  // ── Chat input submit (used in type mode and chat tab) ────────────────────────
  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    setChatInput("");
    await handleNewUtterance(text);
  }

  // ── Mic toggle ────────────────────────────────────────────────────────────────
  function toggleMic() {
    if (mode !== "speak") return;
    if (micMuted) { speech.startListening(); setMicMuted(false); txMic(false); }
    else          { speech.stopListening();  setMicMuted(true);  txMic(true);  }
  }

  // ── Cam toggle ────────────────────────────────────────────────────────────────
  function toggleCam() {
    if (!camOff) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      txCam(true);
    } else {
      txCam(false);
    }
    setCamOff((v) => !v);
  }

  // ── Copy room ID ──────────────────────────────────────────────────────────────
  function copyRoomId() {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  // ── End session ───────────────────────────────────────────────────────────────
  async function handleEndSession() {
    speech.stopListening();
    signRec.stop();
    setShowSummary(true);
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/summary", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          conversationLog:  messages.map((m) => ({ text: m.text, mode: m.mode, timestamp: m.timestamp })),
          sessionDuration:  elapsed,
          signsCount,
          wordsCount,
          safetyCount,
          piiCount,
        }),
      });
      const data = await res.json() as AISummaryResult;
      setAiSummary(data);
    } catch {
      /* summary is optional — don't fail the session end */
    } finally {
      setSummaryLoading(false);
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────────
  const fontClass        = FONT_SIZES[fontSize];
  const modeLabel        = mode === "speak" ? "Speaking" : mode === "sign" ? "Signing" : "Typing";
  const modeEmoji        = mode === "speak" ? "🎤" : mode === "sign" ? "🤟" : "⌨️";
  const avgResponseTimeMs = responseCallCount > 0 ? Math.round(totalResponseMs / responseCallCount) : 0;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className={`h-screen flex flex-col overflow-hidden ${fontClass}`}
      style={{ background: highContrast ? "#000" : "#0f172a", color: "#fff" }}
    >
      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <header
        className="flex-none h-14 flex items-center justify-between px-4 gap-4 z-10"
        style={{
          borderBottom:   "1px solid rgba(255,255,255,0.08)",
          background:     "rgba(15,23,42,0.95)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xl" aria-hidden>🤟</span>
          <span className="font-bold text-sm hidden sm:block" style={{ color: "#06b6d4" }}>
            SignBridge AI
          </span>
        </div>

        {/* Room ID */}
        <button
          onClick={copyRoomId}
          title="Click to copy Room ID"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors hover:bg-white/5"
          style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
        >
          <span className="hidden sm:inline text-slate-500">Room</span>
          <span className="text-slate-300">{roomId}</span>
          <span>{copied ? "✓" : "⧉"}</span>
        </button>

        {/* Right: status + timer + end */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e" }}
              aria-hidden
            />
            <span className="text-slate-400 hidden sm:inline">Live</span>
          </div>
          <span className="text-xs text-slate-600 font-mono hidden sm:inline">
            {formatDuration(elapsed)}
          </span>
          <button
            onClick={handleEndSession}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)" }}
          >
            End Session
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

        {/* ── LEFT: VIDEO + CONTROLS ──────────────────────────────────────────── */}
        <div className="flex flex-col md:w-[65%] min-h-0 p-3 gap-2">

          {/* Video area */}
          <div
            className={`relative flex-1 min-h-0 grid gap-2 ${remoteStreams.length > 0 ? "grid-cols-2" : "grid-cols-1"}`}
          >
            <div
              className="relative w-full h-full rounded-xl overflow-hidden"
              style={{
                background: "#000",
                border: highContrast ? "2px solid #fff" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)", display: camOff ? "none" : "block" }}
              aria-label="Your camera feed"
            />

            {camOff && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-600">
                <span className="text-5xl" aria-hidden>📷</span>
                <span className="text-sm">Camera is off</span>
              </div>
            )}

            {/* Sign detection canvas overlay */}
            {mode === "sign" && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                aria-hidden
              />
            )}

            {/* Mode badge */}
            {mode && (
              <div
                className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full bg-red-500"
                  style={{ animation: "pulse 2s infinite" }}
                  aria-hidden
                />
                {modeEmoji} {modeLabel}
              </div>
            )}

            <div
              className="absolute top-3 left-36 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: "rgba(167,139,250,0.18)", border: "1px solid rgba(167,139,250,0.4)", color: "#ddd6fe" }}
            >
              🤟 {activeSignLang}
            </div>

            {/* Translating badge */}
            {isTranslating && (
              <div
                className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                style={{ background: "rgba(6,182,212,0.18)", border: "1px solid rgba(6,182,212,0.4)", color: "#67e8f9" }}
                aria-live="polite"
              >
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                Translating…
              </div>
            )}

            {/* Transcription overlay */}
            {showTranscription && mode && (
              <div
                className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)" }}
              >
                {mode === "speak" && (
                  <p className="text-white font-medium leading-snug" aria-live="polite">
                    {speech.interimText ? (
                      <>
                        <span className="text-slate-300">
                          {speech.transcript.split(" ").slice(-8).join(" ")}{" "}
                        </span>
                        <span className="text-slate-500 italic">{speech.interimText}</span>
                      </>
                    ) : speech.transcript ? (
                      speech.transcript.split(" ").slice(-12).join(" ")
                    ) : (
                      <span className="text-slate-500 italic">
                        {speech.isLoading ? "Starting microphone…" : "Listening… speak now"}
                      </span>
                    )}
                  </p>
                )}

                {mode === "sign" && (
                  <p className="font-medium" aria-live="polite">
                    {signRec.currentSign ? (
                      <>
                        <span style={{ color: "#67e8f9" }}>
                          {signRec.currentEmoji} {signRec.currentSign}
                        </span>
                        <span className="text-slate-400 text-xs ml-2">
                          {Math.round(signRec.confidence * 100)}%
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-500 italic">
                        {signRec.isLoading ? "Loading MediaPipe…" : "Show your hands to the camera"}
                      </span>
                    )}
                  </p>
                )}

                {mode === "type" && (
                  <p className="text-slate-500 text-sm italic">Type a message in the field below to translate to signs</p>
                )}
              </div>
            )}
            </div>

            {remoteStreams.map((rs) => (
              <RemoteParticipantVideo key={rs.userId} stream={rs.stream} />
            ))}
          </div>

          {/* Controls row */}
          <div className="flex-none flex items-center gap-2">
            <ControlBtn
              onClick={toggleMic}
              active={!micMuted && mode === "speak"}
              disabled={mode !== "speak"}
              title={micMuted ? "Unmute microphone" : "Mute microphone"}
              icon={micMuted ? "🔇" : "🎤"}
            />
            <ControlBtn
              onClick={toggleCam}
              active={!camOff}
              title={camOff ? "Turn on camera" : "Turn off camera"}
              icon={camOff ? "📷" : "📹"}
            />

            <div className="flex-1 text-center text-xs" aria-live="polite">
              {mode === "speak" && speech.isListening && !micMuted && (
                <span className="flex items-center justify-center gap-1.5" style={{ color: "#4ade80" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ animation: "pulse 2s infinite" }} aria-hidden />
                  Listening
                </span>
              )}
              {mode === "speak" && speech.error && (
                <span className="text-red-400">{speech.error}</span>
              )}
              {mode === "sign" && signRec.isLoading && (
                <span style={{ color: "#67e8f9" }}>Loading sign recognition…</span>
              )}
              {mode === "sign" && signRec.isDetecting && (
                <span style={{ color: "#c4b5fd" }}>
                  🖐 {signRec.handsDetected} hand{signRec.handsDetected !== 1 ? "s" : ""} · {Math.round(signRec.fps)} fps
                </span>
              )}
            </div>

            <select
              className="text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer"
              style={{
                background:  "#1e293b",
                border:      "1px solid rgba(255,255,255,0.1)",
                color:       "rgba(255,255,255,0.7)",
                colorScheme: "dark",
              }}
              value={language}
              onChange={(e) => {
                const newLang = e.target.value as SupportedLanguageCode;
                if (speech.isListening) {
                  speech.stopListening().then(() => setLanguage(newLang));
                } else {
                  setLanguage(newLang);
                }
              }}
              disabled={speech.isListening || speech.isLoading}
              aria-label="Language"
            >
              {SUPPORTED_LANGUAGES.map(({ code, label }) => (
                <option key={code} value={code}>
                  {code === "en-US" ? "🇺🇸 " : code === "es-ES" ? "🇪🇸 " : code === "es-CO" ? "🇨🇴 " : ""}
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Type-mode input (shown under video for quick access) */}
          {mode === "type" && (
            <form onSubmit={handleChatSubmit} className="flex-none flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message to translate to signs…"
                autoFocus
                className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border:     "1px solid rgba(255,255,255,0.12)",
                  color:      "#fff",
                }}
                aria-label="Message to translate"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isTranslating}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)" }}
              >
                Send
              </button>
            </form>
          )}
        </div>

        {/* ── RIGHT: PANEL ────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:w-[35%] min-h-0 p-3 md:pl-0 gap-2">

          {/* Tab nav */}
          <div
            className="flex-none flex rounded-xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            role="tablist"
          >
            {(["avatar", "chat", "accessibility", "ai"] as RoomTab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className="flex-1 py-2.5 text-xs font-medium transition-all"
                style={{
                  color:        tab === t ? "#06b6d4" : "rgba(255,255,255,0.38)",
                  background:   tab === t ? "rgba(6,182,212,0.1)" : "transparent",
                  borderBottom: `2px solid ${tab === t ? "#06b6d4" : "transparent"}`,
                }}
              >
                {t === "avatar" ? "🤟 Avatar"
                  : t === "chat" ? "💬 Chat"
                  : t === "accessibility" ? "♿ Access"
                  : "🧠 AI"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div
            className="flex-1 rounded-xl overflow-hidden min-h-0"
            style={{
              background: highContrast ? "#111" : "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
            role="tabpanel"
          >

            {/* ── AVATAR TAB ───────────────────────────────────────────────── */}
            {tab === "avatar" && (
              <div className="h-full flex flex-col">
                {showAvatarPanel ? (
                  <>
                    <div className="flex-1 min-h-0 p-3">
                      <SignAvatar
                        ref={avatarRef}
                        speed={avatarSpeed}
                        className="w-full h-full"
                        style={{ minHeight: 240 }}
                      />
                    </div>

                    {/* Sign phrase strip */}
                    <div
                      className="flex-none px-3 py-2 border-t min-h-[48px] flex items-center justify-center"
                      style={{ borderColor: "rgba(255,255,255,0.07)" }}
                    >
                      {currentSequence.length > 0 ? (
                        <div
                          className="flex gap-1.5 flex-wrap justify-center"
                          aria-live="polite"
                          aria-label="Signs being performed"
                        >
                          {currentSequence.map((item, i) => {
                            const isActive = i === activeItemIdx;
                            const isDone   = i < activeItemIdx;
                            return item.type === "sign" ? (
                              <span
                                key={`${item.id}-${i}`}
                                className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase transition-all"
                                style={{
                                  background: isActive ? "rgba(6,182,212,0.22)" : isDone ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)",
                                  border:     `1px solid ${isActive ? "rgba(6,182,212,0.6)" : "rgba(255,255,255,0.08)"}`,
                                  color:      isActive ? "#67e8f9" : isDone ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.5)",
                                  transform:  isActive ? "scale(1.08)" : "scale(1)",
                                }}
                              >
                                {item.display.replace(/_/g, " ")}
                              </span>
                            ) : (() => {
                              // Fingerspell item — show each letter individually
                              const letters = item.word.toUpperCase().replace(/[^A-Z]/g, "").split("");
                              return (
                                <span
                                  key={`spell-${item.word}-${i}`}
                                  className="flex items-center gap-0.5 px-2 py-0.5 rounded-xl text-xs font-mono font-bold transition-all"
                                  style={{
                                    background: isActive ? "rgba(124,58,237,0.18)" : isDone ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.05)",
                                    border:     `1px solid ${isActive ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.07)"}`,
                                    transform:  isActive ? "scale(1.05)" : "scale(1)",
                                  }}
                                >
                                  {letters.map((letter, li) => {
                                    const isCurrent = isActive && li === activeLetterIdx;
                                    const isLetterDone = isActive
                                      ? li < activeLetterIdx
                                      : isDone;
                                    return (
                                      <span key={li} style={{ display: "flex", alignItems: "center", gap: "1px" }}>
                                        <span
                                          style={{
                                            color: isCurrent
                                              ? "#c4b5fd"
                                              : isLetterDone
                                                ? "rgba(255,255,255,0.2)"
                                                : isActive
                                                  ? "rgba(167,139,250,0.6)"
                                                  : isDone
                                                    ? "rgba(255,255,255,0.18)"
                                                    : "rgba(255,255,255,0.45)",
                                            fontWeight: isCurrent ? 900 : 600,
                                            textShadow: isCurrent ? "0 0 8px rgba(167,139,250,0.9)" : "none",
                                            fontSize:   isCurrent ? "0.8rem" : "0.7rem",
                                            transition: "all 0.1s",
                                          }}
                                        >
                                          {letter}
                                        </span>
                                        {li < letters.length - 1 && (
                                          <span style={{ color: "rgba(255,255,255,0.12)", fontSize: "0.55rem" }}>·</span>
                                        )}
                                      </span>
                                    );
                                  })}
                                </span>
                              );
                            })();
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600">
                          {mode === "speak"
                            ? "Avatar will sign your speech"
                            : mode === "type"
                              ? "Avatar will sign your typed messages"
                              : mode === "sign"
                                ? "Detected signs appear here"
                                : "Select a mode to begin"}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-600 text-sm text-center p-6">
                    Avatar is hidden.
                    <br />
                    Enable it in the Accessibility tab.
                  </div>
                )}
              </div>
            )}

            {/* ── CHAT TAB ─────────────────────────────────────────────────── */}
            {tab === "chat" && (
              <div className="h-full flex flex-col">
                {/* Message list */}
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0">
                  {messages.length === 0 && (
                    <p className="text-center text-slate-600 text-sm mt-10">
                      No messages yet
                    </p>
                  )}
                  {messages.map((m) => (
                    <div key={m.id} className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span aria-hidden>
                          {m.mode === "speak" ? "🎤" : m.mode === "sign" ? "🤟" : "⌨️"}
                        </span>
                        <span>You</span>
                        <span className="ml-auto">
                          {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div
                        className="rounded-xl px-3 py-2 text-sm self-start max-w-full break-words"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border:     "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {m.text}
                      </div>
                      {m.signs && m.signs.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {m.signs.map((s, i) => (
                            <span
                              key={i}
                              className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{
                                background: "rgba(6,182,212,0.1)",
                                border:     "1px solid rgba(6,182,212,0.2)",
                                color:      "#67e8f9",
                              }}
                            >
                              {s.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat input */}
                <form
                  onSubmit={handleChatSubmit}
                  className="flex-none flex gap-2 p-3 border-t"
                  style={{ borderColor: "rgba(255,255,255,0.07)" }}
                >
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type to translate to signs…"
                    className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border:     "1px solid rgba(255,255,255,0.1)",
                      color:      "#fff",
                    }}
                    aria-label="Type a message"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isTranslating}
                    className="px-3 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)" }}
                    aria-label="Send message"
                  >
                    ↑
                  </button>
                </form>
              </div>
            )}

            {/* ── ACCESSIBILITY TAB ────────────────────────────────────────── */}
            {tab === "accessibility" && (
              <div className="h-full overflow-y-auto p-4 flex flex-col gap-5">
                <A11yToggle
                  label="High Contrast Mode"
                  checked={highContrast}
                  onChange={(v) => { setHighContrast(v); saveA11y({ highContrast: v }); }}
                />

                <div>
                  <p className="text-xs text-slate-400 mb-2">Font Size</p>
                  <div className="flex gap-2">
                    {(["S", "M", "L", "XL"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => { setFontSize(s); saveA11y({ fontSize: s }); }}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: fontSize === s ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.05)",
                          border:     `1px solid ${fontSize === s ? "rgba(6,182,212,0.5)" : "rgba(255,255,255,0.1)"}`,
                          color:      fontSize === s ? "#06b6d4" : "rgba(255,255,255,0.45)",
                        }}
                        aria-pressed={fontSize === s}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <A11yToggle
                  label="Show Sign Avatar"
                  checked={showAvatarPanel}
                  onChange={(v) => { setShowAvatarPanel(v); saveA11y({ showAvatar: v }); }}
                />
                <A11yToggle
                  label="Show Transcription"
                  checked={showTranscription}
                  onChange={(v) => { setShowTranscription(v); saveA11y({ showTranscription: v }); }}
                />

                <div>
                  <p className="text-xs text-slate-400 mb-2">
                    Avatar Speed: <span style={{ color: "#06b6d4" }}>{avatarSpeed}×</span>
                  </p>
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.25}
                    value={avatarSpeed}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setAvatarSpeed(v);
                      saveA11y({ avatarSpeed: v });
                    }}
                    className="w-full"
                    style={{ accentColor: "#06b6d4" }}
                    aria-label="Avatar animation speed"
                  />
                  <div className="flex justify-between text-xs text-slate-600 mt-1">
                    <span>0.5×</span><span>2×</span>
                  </div>
                </div>

                <A11yToggle
                  label="Reduce Motion"
                  checked={reduceMotion}
                  onChange={(v) => { setReduceMotion(v); saveA11y({ reduceMotion: v }); }}
                />
              </div>
            )}

            {/* ── AI INSIGHTS TAB ──────────────────────────────────────────── */}
            {tab === "ai" && (
              <ResponsibleAIPanel
                decisions={aiDecisions}
                safetyCount={safetyCount}
                piiCount={piiCount}
                blockedCount={blockedCount}
                signsCount={signsCount}
                wordsCount={wordsCount}
                elapsed={elapsed}
                avgResponseTimeMs={avgResponseTimeMs}
                saveConversation={saveConversation}
                onSaveConversationChange={setSaveConversation}
                onDeleteData={() => {
                  setMessages([]);
                  setAiDecisions([]);
                  setSignsCount(0);
                  setWordsCount(0);
                  setSafetyCount(0);
                  setPiiCount(0);
                  setBlockedCount(0);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── BLOCKED TOAST ───────────────────────────────────────────────────── */}
      {blockedToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-xl"
          style={{
            background:  "rgba(30,0,0,0.95)",
            border:      "1px solid rgba(248,113,113,0.5)",
            color:       "#f87171",
            backdropFilter: "blur(8px)",
            animation:   "slideUp 0.3s ease",
          }}
          role="alert"
          aria-live="assertive"
        >
          <span aria-hidden>⚠️</span>
          <span>Message filtered by Content Safety</span>
          <button
            onClick={() => setBlockedToast(null)}
            className="ml-2 text-xs opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── MODALS ──────────────────────────────────────────────────────────── */}
      {!mode && <OnboardingModal onSelect={handleModeSelect} />}

      {showSummary && (
        <SessionSummary
          messages={messages}
          signsCount={signsCount}
          wordsCount={wordsCount}
          safetyCount={safetyCount}
          piiCount={piiCount}
          sessionStart={sessionStart}
          aiSummary={aiSummary}
          summaryLoading={summaryLoading}
          onClose={() => setShowSummary(false)}
          onNewSession={() => window.location.reload()}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ControlBtn({
  onClick,
  active,
  disabled,
  title,
  icon,
}: {
  onClick:   () => void;
  active?:   boolean;
  disabled?: boolean;
  title:     string;
  icon:      string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all disabled:opacity-30 hover:opacity-80"
      style={{
        background: active ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.05)",
        border:     `1px solid ${active ? "rgba(6,182,212,0.4)" : "rgba(255,255,255,0.1)"}`,
      }}
    >
      {icon}
    </button>
  );
}

function A11yToggle({
  label,
  checked,
  onChange,
}: {
  label:    string;
  checked:  boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-sm text-slate-300">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative w-10 h-5 rounded-full transition-all flex-shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
        style={{
          background: checked ? "#06b6d4" : "rgba(255,255,255,0.1)",
          border:     `1px solid ${checked ? "#0891b2" : "rgba(255,255,255,0.15)"}`,
        }}
        aria-label={label}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? "calc(100% - 18px)" : "2px" }}
          aria-hidden
        />
      </button>
    </label>
  );
}
