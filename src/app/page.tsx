"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Ear,
  Hand,
  FileText,
  ArrowRight,
  Shield,
  CheckCircle2,
  Users,
  Mic,
  Captions,
} from "lucide-react";

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.12 } },
};

// ─── Scroll-triggered section wrapper ────────────────────────────────────────

function Section({
  children,
  className = "",
  id,
  "aria-labelledby": labelledBy,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  "aria-labelledby"?: string;
}) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      id={id}
      aria-labelledby={labelledBy}
      role="region"
      className={className}
      variants={stagger}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

// ─── Sound-wave → Hand hero visual ───────────────────────────────────────────

const WAVE_HEIGHTS = ["h-4", "h-7", "h-10", "h-12", "h-10", "h-7", "h-4"];
const WAVE_DELAYS  = [0, 0.1, 0.2, 0.3, 0.2, 0.1, 0];

function WaveToHand() {
  return (
    <div
      className="flex items-center justify-center gap-8"
      aria-hidden="true"
      role="presentation"
    >
      {/* Animated sound-wave bars */}
      <div className="flex items-end gap-1 h-14">
        {WAVE_HEIGHTS.map((h, i) => (
          <span
            key={i}
            className={`wave-bar w-2 rounded-full bg-cyan-400 ${h}`}
            style={{ animationDelay: `${WAVE_DELAYS[i]}s` }}
          />
        ))}
      </div>

      <ArrowRight className="text-slate-500 w-6 h-6 shrink-0" aria-hidden="true" />

      {/* Animated signing hand */}
      <motion.div
        className="relative"
        animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", repeatDelay: 1.2 }}
      >
        <Hand className="w-14 h-14 text-purple-400" strokeWidth={1.5} />
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-15 bg-purple-500 scale-110"
          aria-hidden="true"
        />
      </motion.div>
    </div>
  );
}

// ─── 1. Hero ─────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <header
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden"
      style={{ background: "linear-gradient(160deg,#0f172a 0%,#0d1f3c 55%,#160f2a 100%)" }}
    >
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(#06b6d4 1px,transparent 1px),linear-gradient(90deg,#06b6d4 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10 blur-3xl pointer-events-none"
        aria-hidden="true"
        style={{ background: "radial-gradient(circle,#06b6d4 0%,#a78bfa 55%,transparent 100%)" }}
      />

      <div className="relative z-10 max-w-4xl mx-auto space-y-10">
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" aria-hidden="true" />
            AI-Powered Accessibility Platform
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          className="text-5xl sm:text-7xl font-extrabold tracking-tight"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <span className="gradient-text">SignBridge</span>{" "}
          <span className="text-white">AI</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto text-balance leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Breaking communication barriers with{" "}
          <strong className="text-white font-semibold">
            AI-powered sign language translation
          </strong>{" "}
          &mdash; real-time, inclusive, and built for everyone.
        </motion.p>

        {/* Wave-to-hand animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.32 }}
          aria-label="Illustration: sound wave transforms into a signing hand"
        >
          <WaveToHand />
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <Link
            href="/room/new"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-lg text-slate-900
              hover:scale-105 active:scale-95 transition-transform duration-150
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            style={{ background: "linear-gradient(135deg,#06b6d4,#a78bfa)" }}
            aria-label="Start a new SignBridge AI meeting room"
          >
            Start a Room
            <ArrowRight
              className="w-5 h-5 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>

          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl border border-slate-600 text-slate-300 font-medium text-lg
              hover:border-cyan-500/70 hover:text-cyan-300 transition-colors duration-200
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            See how it works
          </a>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        aria-hidden="true"
      >
        <span className="flex w-6 h-10 rounded-full border-2 border-slate-600 items-start justify-center pt-2">
          <span className="block w-1.5 h-3 rounded-full bg-slate-500" />
        </span>
      </motion.div>
    </header>
  );
}

// ─── 2. Features ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Ear,
    title: "Real-time Speech to Sign",
    description:
      "Azure Speech Services transcribes spoken words instantly and drives a 3D avatar that signs in ASL, BSL, or LSE \u2014 no lag, no barriers.",
    accent: "cyan",
  },
  {
    icon: Hand,
    title: "Sign to Speech Recognition",
    description:
      "MediaPipe tracks hand landmarks at 30 fps, GPT-4o converts sign sequences into natural speech, letting signers communicate effortlessly.",
    accent: "purple",
  },
  {
    icon: FileText,
    title: "Accessible Meeting Notes",
    description:
      "At session end, GPT-4o generates a structured summary \u2014 key decisions, action items, and a full captioned transcript for everyone.",
    accent: "cyan",
  },
] as const;

function FeaturesSection() {
  return (
    <Section
      id="features"
      aria-labelledby="features-heading"
      className="py-24 px-6 bg-slate-900/60"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        <motion.div variants={fadeUp} className="text-center space-y-4">
          <h2
            id="features-heading"
            className="text-3xl sm:text-4xl font-bold text-white"
          >
            Built for{" "}
            <span className="gradient-text">every communicator</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Three core capabilities that make every meeting truly inclusive.
          </p>
        </motion.div>

        <motion.ul
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 list-none p-0"
          aria-label="SignBridge AI features"
        >
          {FEATURES.map(({ icon: Icon, title, description, accent }) => (
            <motion.li
              key={title}
              variants={fadeUp}
              className="group relative p-8 rounded-2xl border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm
                hover:border-cyan-500/50 focus-within:border-cyan-400 transition-colors duration-300"
            >
              {/* Card glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                aria-hidden="true"
                style={{
                  background:
                    accent === "cyan"
                      ? "radial-gradient(circle at 30% 20%,rgba(6,182,212,.08) 0%,transparent 70%)"
                      : "radial-gradient(circle at 30% 20%,rgba(167,139,250,.08) 0%,transparent 70%)",
                }}
              />
              <div className="relative space-y-4">
                <span
                  className={`inline-flex p-3 rounded-xl ${
                    accent === "cyan"
                      ? "bg-cyan-500/15 text-cyan-400"
                      : "bg-purple-500/15 text-purple-400"
                  }`}
                  aria-hidden="true"
                >
                  <Icon className="w-7 h-7" strokeWidth={1.5} />
                </span>
                <h3 className="text-xl font-semibold text-white">{title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{description}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </Section>
  );
}

// ─── 3. How it Works ──────────────────────────────────────────────────────────

const STEPS = [
  {
    number: "01",
    icon: Users,
    title: "Join a Room",
    description:
      "Create or share a room link. Any participant \u2014 hearing or Deaf \u2014 joins instantly via browser. No app install needed.",
  },
  {
    number: "02",
    icon: Mic,
    title: "Speak or Sign",
    description:
      "Hearing participants speak; Deaf participants sign via webcam. SignBridge captures both modalities simultaneously.",
  },
  {
    number: "03",
    icon: Captions,
    title: "Everyone Understands",
    description:
      "Live captions, sign avatar, and real-time translation ensure zero communication gaps throughout the meeting.",
  },
] as const;

function HowItWorksSection() {
  return (
    <Section
      id="how-it-works"
      aria-labelledby="hiw-heading"
      className="py-24 px-6"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        <motion.div variants={fadeUp} className="text-center space-y-4">
          <h2
            id="hiw-heading"
            className="text-3xl sm:text-4xl font-bold text-white"
          >
            How it <span className="gradient-text">works</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Three simple steps to a fully accessible meeting.
          </p>
        </motion.div>

        <motion.ol
          variants={stagger}
          className="relative grid grid-cols-1 md:grid-cols-3 gap-12"
          aria-label="Steps to use SignBridge AI"
        >
          {/* Gradient connector line (desktop) */}
          <div
            className="hidden md:block absolute top-[3.25rem] left-[calc(16.66%+3.5rem)] right-[calc(16.66%+3.5rem)] h-px"
            aria-hidden="true"
            style={{ background: "linear-gradient(90deg,#06b6d4,#a78bfa)" }}
          />

          {STEPS.map(({ number, icon: Icon, title, description }) => (
            <motion.li
              key={number}
              variants={fadeUp}
              className="relative flex flex-col items-center text-center gap-6"
            >
              <div
                className="relative z-10 flex items-center justify-center w-28 h-28 rounded-full border-2 border-cyan-500/40 bg-slate-900"
                aria-hidden="true"
              >
                <span
                  className="absolute -top-3 -right-3 flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-slate-900 select-none"
                  style={{ background: "linear-gradient(135deg,#06b6d4,#a78bfa)" }}
                >
                  {number}
                </span>
                <Icon className="w-12 h-12 text-cyan-400" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
                  {description}
                </p>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </Section>
  );
}

// ─── 4. Powered by Azure ──────────────────────────────────────────────────────

const AZURE_SERVICES = [
  "Azure OpenAI \u2014 GPT-4o",
  "Azure Speech Services",
  "Azure Computer Vision",
  "Azure Translator",
  "Azure AI Content Safety",
  "Azure SignalR Service",
  "Azure Communication Services",
  "Azure Cosmos DB",
  "Azure Blob Storage",
  "Azure AI Foundry",
  "Microsoft Entra ID",
  "Azure Functions",
  "Azure Monitor",
  "Azure CDN",
  "Azure Key Vault",
];

function AzurePoweredSection() {
  return (
    <Section
      id="azure-powered"
      aria-labelledby="azure-heading"
      className="py-24 px-6 bg-slate-900/60"
    >
      <div className="max-w-5xl mx-auto space-y-14">
        <motion.div variants={fadeUp} className="text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-semibold">
            Enterprise-grade infrastructure
          </p>
          <h2
            id="azure-heading"
            className="text-3xl sm:text-4xl font-bold text-white"
          >
            Powered by{" "}
            <span className="gradient-text">Microsoft Azure</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            15 Azure AI and cloud services working in concert to deliver real-time,
            reliable, and responsible accessibility.
          </p>
        </motion.div>

        <motion.ul
          variants={stagger}
          className="flex flex-wrap justify-center gap-3 list-none p-0"
          aria-label="Azure services used by SignBridge AI"
        >
          {AZURE_SERVICES.map((service) => (
            <motion.li key={service} variants={fadeUp}>
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium cursor-default
                  border border-slate-700 bg-slate-800/60 text-slate-300
                  hover:border-cyan-500/60 hover:text-cyan-300 hover:bg-cyan-500/5
                  transition-all duration-200"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  aria-hidden="true"
                  style={{ background: "linear-gradient(135deg,#06b6d4,#a78bfa)" }}
                />
                {service}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </Section>
  );
}

// ─── 5. Footer ────────────────────────────────────────────────────────────────

function LandingFooter() {
  return (
    <footer
      className="border-t border-slate-800 py-10 px-6 bg-slate-950"
      role="contentinfo"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-slate-500">
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <span className="font-semibold text-slate-300">SignBridge AI</span>
          <span className="hidden sm:block text-slate-700" aria-hidden="true">
            &middot;
          </span>
          <span>Built for Microsoft Innovation Challenge 2026</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-700/50 bg-green-900/20 text-green-400 text-xs font-medium"
            role="status"
            aria-label="Responsible AI Compliant"
          >
            <Shield className="w-3.5 h-3.5" aria-hidden="true" />
            Responsible AI Compliant
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cyan-700/50 bg-cyan-900/20 text-cyan-400 text-xs font-medium"
            role="status"
            aria-label="WCAG 2.1 AA Compliant"
          >
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            WCAG 2.1 AA
          </span>
        </div>
      </div>
    </footer>
  );
}

// ─── Skip-to-content link (WCAG 2.4.1) ───────────────────────────────────────

function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50
        focus:px-4 focus:py-2 focus:rounded-lg focus:bg-cyan-400 focus:text-slate-900
        focus:font-semibold focus:shadow-lg focus:outline-none"
    >
      Skip to main content
    </a>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <SkipLink />
      <div id="main-content" className="min-h-screen bg-[#0f172a] text-white">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <AzurePoweredSection />
        <LandingFooter />
      </div>
    </>
  );
}
