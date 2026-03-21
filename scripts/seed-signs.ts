/**
 * scripts/seed-signs.ts
 * Seeds the Cosmos DB "signs" container with the current hardcoded ASL animations.
 * Run with:  npm run seed-signs
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createSign, getSign } from "../src/lib/azure/signs-db";
import type { SignDefinition, PoseArm, PoseFingers, PoseData } from "../src/lib/azure/signs-db";

// ─── REST arms (ground truth) ─────────────────────────────────────────────────

const REST_R: PoseArm = { shoulder: [27,3,-14], upperArm: [41,0,0], forearm: [10,59,-27], hand: [5,35,-14] };
const REST_L: PoseArm = { shoulder: [27,3,10],  upperArm: [41,0,0], forearm: [10,54,29],  hand: [-3,-54,-1] };

// ─── Reference arm poses ──────────────────────────────────────────────────────

const HELLO_ARM: PoseArm  = { shoulder: [22,63,10],    upperArm: [52,13,4],   forearm: [131,-180,35], hand: [10,-14,5] };
const FIST_CHEST: PoseArm = { shoulder: [16,-20,-27],  upperArm: [45,-5,0],   forearm: [-12,27,-133], hand: [-5,61,5] };
const ILY_ARM: PoseArm    = { shoulder: [40,19,-32],   upperArm: [36,68,-3],  forearm: [93,-39,-51],  hand: [-9,-113,0] };
const NO_ARM: PoseArm     = { shoulder: [35,30,-20],   upperArm: [42,50,-2],  forearm: [95,-60,-50],  hand: [-8,-100,0] };

// ─── Finger shorthand ─────────────────────────────────────────────────────────

function fingers(t: number, i: number, m: number, r: number, p: number): PoseFingers {
  return { thumb: t, index: i, middle: m, ring: r, pinky: p };
}

const OPEN:    PoseFingers = fingers(0,  0,  0,  0,  0);
const NATURAL: PoseFingers = fingers(10, 10, 10, 10, 10);
const FIST_F:  PoseFingers = fingers(90, 90, 90, 90, 90);
const ILY_F:   PoseFingers = fingers(0,  0,  90, 90, 0);

// ─── Pose builder ─────────────────────────────────────────────────────────────

function pose(rArm: PoseArm, rFing: PoseFingers, lArm?: PoseArm, lFing?: PoseFingers): PoseData {
  return {
    rightArm:     rArm,
    leftArm:      lArm,
    rightFingers: rFing,
    leftFingers:  lFing,
  };
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const now = new Date().toISOString();

const SIGNS: SignDefinition[] = [
  // ── Greetings ────────────────────────────────────────────────────────────
  {
    id: "hello", name: "Hello", language: "ASL", category: "greeting",
    type: "dynamic", duration: 1800,
    poseStart: pose(HELLO_ARM, OPEN),
    poseEnd:   pose({ ...HELLO_ARM, hand: [10, 20, 5] }, OPEN),
    keywords:  ["hello", "hi", "hey", "greetings", "howdy"],
    description: "Wave open hand beside face with a smile.",
    createdAt: now, updatedAt: now,
  },

  // ── Responses ────────────────────────────────────────────────────────────
  {
    id: "thank_you", name: "Thank You", language: "ASL", category: "response",
    type: "dynamic", duration: 1500,
    poseStart: pose(
      { shoulder: [30,26,-34], upperArm: [47,35,9],  forearm: [110,-65,-44], hand: [0,0,0] }, OPEN,
      { shoulder: [27,-47,-1], upperArm: [35,61,14], forearm: [0,0,0],       hand: [0,0,0] }, NATURAL
    ),
    poseEnd: pose(
      { shoulder: [30,26,-34], upperArm: [47,44,17], forearm: [109,34,-39],  hand: [-1,-42,0] }, OPEN,
      { shoulder: [27,-47,-1], upperArm: [35,61,14], forearm: [-4,0,0],      hand: [0,0,0] }, NATURAL
    ),
    keywords:  ["thank", "thanks", "thank you", "grateful", "appreciate"],
    description: "Flat hand at chin sweeps forward.",
    createdAt: now, updatedAt: now,
  },
  {
    id: "yes", name: "Yes", language: "ASL", category: "response",
    type: "dynamic", duration: 1300,
    poseStart: pose({ ...FIST_CHEST, hand: [-5, 61, 5] }, FIST_F, REST_L, NATURAL),
    poseEnd:   pose({ ...FIST_CHEST, hand: [ 20, 61, 5] }, FIST_F, REST_L, NATURAL),
    keywords:  ["yes", "yeah", "yep", "correct", "right", "affirmative", "ok", "okay"],
    description: "Fist nods at chest level.",
    createdAt: now, updatedAt: now,
  },
  {
    id: "no", name: "No", language: "ASL", category: "response",
    type: "dynamic", duration: 1300,
    poseStart: pose(NO_ARM, fingers(60,  0,  0, 90, 90), REST_L, NATURAL),
    poseEnd:   pose(NO_ARM, fingers(60, 75, 75, 90, 90), REST_L, NATURAL),
    keywords:  ["no", "nope", "not", "negative", "disagree", "never"],
    description: "Index and middle fingers snap closed at face level.",
    createdAt: now, updatedAt: now,
  },

  // ── Expressions ──────────────────────────────────────────────────────────
  {
    id: "please", name: "Please", language: "ASL", category: "expression",
    type: "dynamic", duration: 1600,
    poseStart: pose({ ...FIST_CHEST, shoulder: [21,-15,-27] }, OPEN, REST_L, NATURAL),
    poseEnd:   pose({ ...FIST_CHEST, shoulder: [11,-25,-27] }, OPEN, REST_L, NATURAL),
    keywords:  ["please", "kindly"],
    description: "Flat hand circles clockwise on chest.",
    createdAt: now, updatedAt: now,
  },
  {
    id: "help", name: "Help", language: "ASL", category: "expression",
    type: "dynamic", duration: 1500,
    poseStart: pose(
      { shoulder: [30,26,-34], upperArm: [47,44,17], forearm: [108,36,-27], hand: [-1,-81,0] }, FIST_F,
      { shoulder: [24,-43,9],  upperArm: [32,61,25], forearm: [21,5,70],    hand: [2,-123,0] }, OPEN
    ),
    poseEnd: pose(
      { shoulder: [30,40,-46], upperArm: [46,44,17], forearm: [108,36,-27], hand: [-1,-81,0] }, FIST_F,
      { shoulder: [23,-61,9],  upperArm: [40,63,25], forearm: [21,5,70],    hand: [2,-123,0] }, OPEN
    ),
    keywords:  ["help", "assist", "aid", "support", "assistance"],
    description: "Fist resting on open palm — both hands rise upward.",
    createdAt: now, updatedAt: now,
  },
  {
    id: "sorry", name: "Sorry", language: "ASL", category: "expression",
    type: "dynamic", duration: 1600,
    poseStart: pose({ ...FIST_CHEST, shoulder: [21,-15,-27], hand: [-5,55,0] }, FIST_F, REST_L, NATURAL),
    poseEnd:   pose({ ...FIST_CHEST, shoulder: [11,-25,-27], hand: [-5,55,0] }, FIST_F, REST_L, NATURAL),
    keywords:  ["sorry", "apologize", "my bad", "excuse", "pardon", "apology"],
    description: "Fist circles clockwise on chest.",
    createdAt: now, updatedAt: now,
  },
  {
    id: "good", name: "Good", language: "ASL", category: "expression",
    type: "dynamic", duration: 1400,
    poseStart: pose(
      { shoulder: [30,26,-34], upperArm: [47,35,9],  forearm: [110,-65,-44], hand: [0,0,0] }, OPEN,
      { shoulder: [27,-47,-1], upperArm: [35,61,14], forearm: [0,0,0],       hand: [0,0,0] }, NATURAL
    ),
    poseEnd: pose(
      { shoulder: [30,26,-34], upperArm: [47,44,17], forearm: [109,34,-39], hand: [-1,-42,0] }, OPEN,
      { shoulder: [27,-47,-1], upperArm: [35,61,14], forearm: [-4,0,0],     hand: [0,0,0] }, NATURAL
    ),
    keywords:  ["good", "great", "nice", "excellent", "wonderful", "awesome", "perfect", "fine", "well"],
    description: "Flat hand sweeps from chin forward (same as Thank You).",
    createdAt: now, updatedAt: now,
  },
  {
    id: "i_love_you", name: "I Love You", language: "ASL", category: "expression",
    type: "static", duration: 1600,
    pose: pose(ILY_ARM, ILY_F, { shoulder:[36,-8,4], upperArm:[25,20,12], forearm:[0,0,0], hand:[0,0,0] }, NATURAL),
    keywords:  ["i love you", "love you", "love", "ily"],
    description: "🤟 — thumb, index, and pinky extended facing camera.",
    createdAt: now, updatedAt: now,
  },
  {
    id: "stop", name: "Stop", language: "ASL", category: "expression",
    type: "static", duration: 1100,
    pose: pose(ILY_ARM, OPEN, REST_L, NATURAL),
    keywords:  ["stop", "halt", "wait", "pause", "enough", "cease"],
    description: "Open palm raised and facing the viewer.",
    createdAt: now, updatedAt: now,
  },

  // ── Numbers ───────────────────────────────────────────────────────────────
  {
    id: "1", name: "1", language: "ASL", category: "number",
    type: "static", duration: 1300,
    pose: pose(ILY_ARM, fingers(70, 0, 90, 90, 90), REST_L, NATURAL),
    keywords:  ["1", "one"],
    description: "Index finger extended upward, other fingers closed.",
    createdAt: now, updatedAt: now,
  },
  {
    id: "2", name: "2", language: "ASL", category: "number",
    type: "static", duration: 1300,
    pose: pose(ILY_ARM, fingers(70, 0, 0, 90, 90), REST_L, NATURAL),
    keywords:  ["2", "two"],
    description: "Index and middle fingers extended, others closed.",
    createdAt: now, updatedAt: now,
  },
  {
    id: "3", name: "3", language: "ASL", category: "number",
    type: "static", duration: 1300,
    pose: pose(ILY_ARM, fingers(0, 0, 0, 90, 90), REST_L, NATURAL),
    keywords:  ["3", "three"],
    description: "Thumb, index, and middle extended.",
    createdAt: now, updatedAt: now,
  },
  {
    id: "4", name: "4", language: "ASL", category: "number",
    type: "static", duration: 1300,
    pose: pose(ILY_ARM, fingers(70, 0, 0, 0, 0), REST_L, NATURAL),
    keywords:  ["4", "four"],
    description: "Four fingers extended, thumb closed.",
    createdAt: now, updatedAt: now,
  },
  {
    id: "5", name: "5", language: "ASL", category: "number",
    type: "static", duration: 1300,
    pose: pose(ILY_ARM, OPEN, REST_L, NATURAL),
    keywords:  ["5", "five"],
    description: "All five fingers open — open hand.",
    createdAt: now, updatedAt: now,
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🌱 Seeding ${SIGNS.length} signs to Cosmos DB...\n`);
  let created = 0;
  let skipped = 0;

  for (const sign of SIGNS) {
    const existing = await getSign(sign.id);
    if (existing) {
      console.log(`  ⏭  ${sign.id} (already exists)`);
      skipped++;
      continue;
    }
    await createSign(sign);
    console.log(`  ✅  ${sign.id} — ${sign.name}`);
    created++;
  }

  console.log(`\n✔ Done: ${created} created, ${skipped} skipped.\n`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
