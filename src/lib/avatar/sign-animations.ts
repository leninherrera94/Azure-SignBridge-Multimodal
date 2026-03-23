/**
 * src/lib/avatar/sign-animations.ts  (v9 — 4 calibrated reference poses)
 *
 * 4 reference poses confirmed visually correct:
 *
 *   HELLO:      shoulder:[22,63,10]  upperArm:[52,13,4]   forearm:[131,-180,35]  hand:[10,-14,5]
 *   FIST_CHEST: shoulder:[16,-20,-27] upperArm:[45,-5,0]  forearm:[-12,27,-133]  hand:[-5,61,5]
 *   I_LOVE_YOU: shoulder:[40,19,-32] upperArm:[36,68,-3]  forearm:[93,-39,-51]   hand:[-9,-113,0]
 *   REST right: shoulder:[27,3,-14]  upperArm:[41,0,0]    forearm:[10,59,-27]    hand:[5,35,-14]
 *   REST left:  shoulder:[27,3,10]   upperArm:[41,0,0]    forearm:[10,54,29]     hand:[-3,-54,-1]
 *
 * All 4 arm bones applied per frame: shoulder (RightShoulder), upperArm (RightArm),
 * forearm (RightForeArm), hand (RightHand).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FingerRotation {
  metacarpal: [number, number, number];
  proximal:   [number, number, number];
  distal:     [number, number, number];
}

export interface HandPose {
  thumb:  FingerRotation;
  index:  FingerRotation;
  middle: FingerRotation;
  ring:   FingerRotation;
  pinky:  FingerRotation;
  wrist?: [number, number, number];
}

export interface ArmPose {
  shoulder: [number, number, number]; // RightShoulder (clavicle)
  upperArm: [number, number, number]; // RightArm (glenohumeral)
  forearm:  [number, number, number]; // RightForeArm
  hand:     [number, number, number]; // RightHand (wrist)
}

export interface SignKeyframe {
  time:       number;
  rightArm?:  ArmPose;
  leftArm?:   ArmPose;
  rightHand?: HandPose;
  leftHand?:  HandPose;
}

export interface SignAnimation {
  id:        string;
  name:      string;
  duration:  number;
  keyframes: SignKeyframe[];
}

/** A single item in a mixed sign + fingerspell sequence. */
export type SignSequenceItem =
  | { type: "sign";  id: string; display: string }
  | { type: "spell"; word: string; display?: string };

export interface FilledKeyframe {
  time:      number;
  rightArm:  ArmPose;
  leftArm:   ArmPose;
  rightHand: HandPose;
  leftHand:  HandPose;
}

// ─── Finger helpers ───────────────────────────────────────────────────────────

function fc(deg: number): FingerRotation {
  return { metacarpal: [deg, 0, 0], proximal: [deg, 0, 0], distal: [deg, 0, 0] };
}

function hand(t: number, i: number, m: number, r: number, p: number): HandPose {
  return { thumb: fc(t), index: fc(i), middle: fc(m), ring: fc(r), pinky: fc(p) };
}

// ─── Named hand poses ─────────────────────────────────────────────────────────

export const OPEN_HAND    = hand( 0,  0,  0,  0,  0);
export const NATURAL_HAND = hand(10, 10, 10, 10, 10); // REST fingers
export const FIST         = hand(90, 90, 90, 90, 90);
export const ILY          = hand( 0,  0, 90, 90,  0); // 🤟

// ─── Rest arm poses (POSE REST — calibrated) ──────────────────────────────────

export const REST_ARM_R: ArmPose = {
  shoulder: [ 27,   3, -14],
  upperArm: [ 41,   0,   0],
  forearm:  [ 10,  59, -27],
  hand:     [  5,  35, -14],
};

export const REST_ARM_L: ArmPose = {
  shoulder: [ 27,   3,  10],
  upperArm: [ 41,   0,   0],
  forearm:  [ 10,  54,  29],
  hand:     [ -3, -54,  -1],
};

export const REST_ARM = REST_ARM_R; // backward-compat

// ─── Reference arm poses (calibrated) ────────────────────────────────────────

// POSE HELLO — wave beside face
const HELLO_ARM: ArmPose = {
  shoulder: [ 22,  63,  10],
  upperArm: [ 52,  13,   4],
  forearm:  [131,-180,  35],
  hand:     [ 10, -14,   5],
};

// POSE FIST_CHEST — fist in front of chest
const FIST_CHEST: ArmPose = {
  shoulder: [ 16, -20, -27],
  upperArm: [ 45,  -5,   0],
  forearm:  [-12,  27,-133],
  hand:     [ -5,  61,   5],
};

// POSE I_LOVE_YOU — 🤟 raised front (palm faces camera)
const ILY_ARM: ArmPose = {
  shoulder: [ 40,  19, -32],
  upperArm: [ 36,  68,  -3],
  forearm:  [ 93, -39, -51],
  hand:     [ -9,-113,   0],
};

// ─── Fill keyframes ───────────────────────────────────────────────────────────
// Missing arms/hands propagate from previous keyframe (starting at REST).

export function fillKeyframes(kfs: SignKeyframe[]): FilledKeyframe[] {
  let rA: ArmPose  = REST_ARM_R;
  let lA: ArmPose  = REST_ARM_L;
  let rH: HandPose = NATURAL_HAND;
  let lH: HandPose = NATURAL_HAND;
  return kfs.map((kf) => {
    rA = kf.rightArm  ?? rA;
    lA = kf.leftArm   ?? lA;
    rH = kf.rightHand ?? rH;
    lH = kf.leftHand  ?? lH;
    return { time: kf.time, rightArm: rA, leftArm: lA, rightHand: rH, leftHand: lH };
  });
}

// ─── Interpolation ────────────────────────────────────────────────────────────

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function l3(a: [number,number,number], b: [number,number,number], et: number): [number,number,number] {
  return [a[0]+(b[0]-a[0])*et, a[1]+(b[1]-a[1])*et, a[2]+(b[2]-a[2])*et];
}

function lerpFinger(a: FingerRotation, b: FingerRotation, et: number): FingerRotation {
  return {
    metacarpal: l3(a.metacarpal, b.metacarpal, et),
    proximal:   l3(a.proximal,   b.proximal,   et),
    distal:     l3(a.distal,     b.distal,     et),
  };
}

export function lerpHandPose(a: HandPose, b: HandPose, t: number): HandPose {
  const et = easeInOut(t);
  return {
    thumb:  lerpFinger(a.thumb,  b.thumb,  et),
    index:  lerpFinger(a.index,  b.index,  et),
    middle: lerpFinger(a.middle, b.middle, et),
    ring:   lerpFinger(a.ring,   b.ring,   et),
    pinky:  lerpFinger(a.pinky,  b.pinky,  et),
    wrist: (a.wrist || b.wrist)
      ? l3(a.wrist ?? [0,0,0], b.wrist ?? [0,0,0], et)
      : undefined,
  };
}

export function lerpArmPose(a: ArmPose, b: ArmPose, t: number): ArmPose {
  const et = easeInOut(t);
  return {
    shoulder: l3(a.shoulder, b.shoulder, et),
    upperArm: l3(a.upperArm, b.upperArm, et),
    forearm:  l3(a.forearm,  b.forearm,  et),
    hand:     l3(a.hand,     b.hand,     et),
  };
}

export function interpolateFrame(frames: FilledKeyframe[], progress: number): FilledKeyframe {
  let fi = 0;
  for (let i = frames.length - 1; i >= 0; i--) {
    if (frames[i].time <= progress) { fi = i; break; }
  }
  const ti   = Math.min(fi + 1, frames.length - 1);
  const from = frames[fi];
  const to   = frames[ti];
  const span = to.time - from.time;
  const lt   = span > 0 ? (progress - from.time) / span : 1;
  return {
    time:      progress,
    rightArm:  lerpArmPose( from.rightArm,  to.rightArm,  lt),
    leftArm:   lerpArmPose( from.leftArm,   to.leftArm,   lt),
    rightHand: lerpHandPose(from.rightHand, to.rightHand, lt),
    leftHand:  lerpHandPose(from.leftHand,  to.leftHand,  lt),
  };
}

// NO sign arm — front at face level
const NO_ARM: ArmPose = {
  shoulder: [ 35,  30, -20],
  upperArm: [ 42,  50,  -2],
  forearm:  [ 95, -60, -50],
  hand:     [ -8,-100,   0],
};

// ─── Fingerspelling arm variants ─────────────────────────────────────────────

// Standard spell arm — palm faces camera (same as ILY_ARM)
const SPELL_ARM: ArmPose = ILY_ARM;

// Side variant — index points sideways (G, H)
const SPELL_ARM_SIDE: ArmPose = { ...ILY_ARM, hand: [-9, -60, 0] };

// Down variant — index points downward (P, Q)
const SPELL_ARM_DOWN: ArmPose = { ...ILY_ARM, hand: [-9, -113, 30] };

/** Create a fingerspelling letter animation (550 ms, 4-keyframe hold). */
function la(
  letter: string,
  t: number, i: number, m: number, r: number, p: number,
  arm: ArmPose = SPELL_ARM,
): SignAnimation {
  const h = hand(t, i, m, r, p);
  return {
    id: `letter_${letter}`,
    name: letter.toUpperCase(),
    duration: 550,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: h, leftHand: NATURAL_HAND },
      { time: 0.15, rightArm: arm, rightHand: h },
      { time: 0.85, rightArm: arm },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  };
}

// ─── Sign animations ──────────────────────────────────────────────────────────

export const SIGN_ANIMATIONS: SignAnimation[] = [

  // ── 1. Hello — wave beside face ───────────────────────────────────────────
  {
    id: "hello", name: "Hello", duration: 1800,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.15, rightArm: { ...HELLO_ARM, hand: [10, -14, 5] }, rightHand: OPEN_HAND },
      { time: 0.30, rightArm: { ...HELLO_ARM, hand: [10,  20, 5] } },
      { time: 0.48, rightArm: { ...HELLO_ARM, hand: [10, -40, 5] } },
      { time: 0.65, rightArm: { ...HELLO_ARM, hand: [10,  20, 5] } },
      { time: 0.82, rightArm: { ...HELLO_ARM, hand: [10, -40, 5] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 2. Thank You — flat hand chin → forward (CALIBRATED) ─────────────────
  {
    id: "thank_you", name: "Thank You", duration: 1500,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.28,
        rightArm:  { shoulder: [30,26,-34], upperArm: [47,35, 9], forearm: [110,-65,-44], hand: [0, 0,0] },
        leftArm:   { shoulder: [27,-47,-1], upperArm: [35,61,14], forearm: [  0,  0,  0], hand: [0, 0,0] },
        rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.65,
        rightArm:  { shoulder: [30,26,-34], upperArm: [47,44,17], forearm: [109, 34,-39], hand: [-1,-42,0] },
        leftArm:   { shoulder: [27,-47,-1], upperArm: [35,61,14], forearm: [ -4,  0,  0], hand: [ 0,  0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── 3. Yes — fist nods at chest ───────────────────────────────────────────
  {
    id: "yes", name: "Yes", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: FIST, leftHand: NATURAL_HAND },
      { time: 0.12, rightArm: { ...FIST_CHEST, hand: [ -5, 61, 5] } },
      { time: 0.30, rightArm: { ...FIST_CHEST, hand: [ 20, 61, 5] } },
      { time: 0.48, rightArm: { ...FIST_CHEST, hand: [-20, 61, 5] } },
      { time: 0.65, rightArm: { ...FIST_CHEST, hand: [ 20, 61, 5] } },
      { time: 0.80, rightArm: { ...FIST_CHEST, hand: [-20, 61, 5] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 4. No — index+middle snap at face level ───────────────────────────────
  {
    id: "no", name: "No", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: hand(60, 0, 0, 90, 90), leftHand: NATURAL_HAND },
      { time: 0.12, rightArm: NO_ARM },
      { time: 0.32, rightHand: hand(60, 75, 75, 90, 90) },
      { time: 0.52, rightHand: hand(60,  0,  0, 90, 90) },
      { time: 0.72, rightHand: hand(60, 75, 75, 90, 90) },
      { time: 0.88, rightHand: hand(60,  0,  0, 90, 90) },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 5. Please — flat hand circles chest ───────────────────────────────────
  {
    id: "please", name: "Please", duration: 1600,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.10, rightArm: { ...FIST_CHEST, hand: [-5, 50, 0] }, rightHand: OPEN_HAND },
      { time: 0.30, rightArm: { ...FIST_CHEST, shoulder: [21,-15,-27], hand: [-5, 50, 0] } },
      { time: 0.55, rightArm: { ...FIST_CHEST, shoulder: [11,-25,-27], hand: [-5, 50, 0] } },
      { time: 0.80, rightArm: { ...FIST_CHEST, shoulder: [21,-20,-27], hand: [-5, 50, 0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 6. Help — fist on open palm, both rise (CALIBRATED) ──────────────────
  {
    id: "help", name: "Help", duration: 1500,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: FIST, leftHand: OPEN_HAND },
      { time: 0.22,
        rightArm:  { shoulder: [30, 26,-34], upperArm: [47,44,17], forearm: [108, 36,-27], hand: [-1,-81,0] },
        leftArm:   { shoulder: [24,-43,  9], upperArm: [32,61,25], forearm: [ 21,  5, 70], hand: [ 2,-123,0] },
        rightHand: FIST, leftHand: OPEN_HAND },
      { time: 0.65,
        rightArm:  { shoulder: [30, 40,-46], upperArm: [46,44,17], forearm: [108, 36,-27], hand: [-1,-81,0] },
        leftArm:   { shoulder: [23,-61,  9], upperArm: [40,63,25], forearm: [ 21,  5, 70], hand: [ 2,-123,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── 7. I Love You — 🤟 raised front (CALIBRATED) ─────────────────────────
  {
    id: "i_love_you", name: "I Love You", duration: 1600,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: ILY, leftHand: NATURAL_HAND },
      { time: 0.22,
        rightArm:  ILY_ARM,
        leftArm:   { shoulder: [36,-8,4], upperArm: [25,20,12], forearm: [0,0,0], hand: [0,0,0] },
        rightHand: ILY, leftHand: NATURAL_HAND },
      { time: 0.72,
        rightArm:  ILY_ARM,
        leftArm:   { shoulder: [36,-8,4], upperArm: [25,20,12], forearm: [0,0,0], hand: [0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 8. Stop — palm faces camera (ILY arm + open hand) ────────────────────
  {
    id: "stop", name: "Stop", duration: 1100,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.22, rightArm: ILY_ARM, rightHand: OPEN_HAND },
      { time: 0.60, rightArm: ILY_ARM },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 9. Good — same motion as Thank You (CALIBRATED) ──────────────────────
  {
    id: "good", name: "Good", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.28,
        rightArm:  { shoulder: [30,26,-34], upperArm: [47,35, 9], forearm: [110,-65,-44], hand: [0, 0,0] },
        leftArm:   { shoulder: [27,-47,-1], upperArm: [35,61,14], forearm: [  0,  0,  0], hand: [0, 0,0] },
        rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.68,
        rightArm:  { shoulder: [30,26,-34], upperArm: [47,44,17], forearm: [109, 34,-39], hand: [-1,-42,0] },
        leftArm:   { shoulder: [27,-47,-1], upperArm: [35,61,14], forearm: [ -4,  0,  0], hand: [ 0,  0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── 10. Sorry — fist circles chest ────────────────────────────────────────
  {
    id: "sorry", name: "Sorry", duration: 1600,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: FIST, leftHand: NATURAL_HAND },
      { time: 0.10, rightArm: { ...FIST_CHEST, hand: [-5, 55, 0] } },
      { time: 0.30, rightArm: { ...FIST_CHEST, shoulder: [21,-15,-27], hand: [-5, 55, 0] } },
      { time: 0.55, rightArm: { ...FIST_CHEST, shoulder: [11,-25,-27], hand: [-5, 55, 0] } },
      { time: 0.80, rightArm: { ...FIST_CHEST, shoulder: [21,-20,-27], hand: [-5, 55, 0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 11–15. Numbers — ILY arm (palm faces camera clearly), fingers change ──
  {
    id: "one", name: "1", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: hand(70, 0, 90, 90, 90), leftHand: NATURAL_HAND },
      { time: 0.22, rightArm: ILY_ARM },
      { time: 0.75, rightArm: ILY_ARM },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },
  {
    id: "two", name: "2", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: hand(70, 0, 0, 90, 90), leftHand: NATURAL_HAND },
      { time: 0.22, rightArm: ILY_ARM },
      { time: 0.75, rightArm: ILY_ARM },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },
  {
    id: "three", name: "3", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: hand(0, 0, 0, 90, 90), leftHand: NATURAL_HAND },
      { time: 0.22, rightArm: ILY_ARM },
      { time: 0.75, rightArm: ILY_ARM },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },
  {
    id: "four", name: "4", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: hand(70, 0, 0, 0, 0), leftHand: NATURAL_HAND },
      { time: 0.22, rightArm: ILY_ARM },
      { time: 0.75, rightArm: ILY_ARM },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },
  {
    id: "five", name: "5", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.22, rightArm: ILY_ARM },
      { time: 0.75, rightArm: ILY_ARM },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 16. Want — pull back and curl fingers ─────────────────────────────────
  {
    id: "want", name: "Want", duration: 1500,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.30, 
        rightArm: { shoulder: [20,-10,-20], upperArm: [30,-10,0], forearm: [80, 0, -90], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,-10,20], upperArm: [30,-10,0], forearm: [80, 0, 90], hand: [0,0,0] }, 
        rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.60, 
        rightArm: { shoulder: [15,-20,-20], upperArm: [20,0,0], forearm: [100, 0, -90], hand: [0,0,0] }, 
        leftArm: { shoulder: [15,-20,20], upperArm: [20,0,0], forearm: [100, 0, 90], hand: [0,0,0] }, 
        rightHand: hand(30,50,50,50,50), leftHand: hand(30,50,50,50,50) },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },
  // ── 17. Eat — O hand to mouth ───────────────────────────────────────────────
  {
    id: "eat", name: "Eat", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: OPEN_HAND },
      { time: 0.25, rightArm: { shoulder: [22,63,10], upperArm: [60,0,0], forearm: [140,-180,35], hand: [0,0,0] }, rightHand: hand(40,60,60,60,60) },
      { time: 0.50, rightArm: { shoulder: [20,50,10], upperArm: [55,0,0], forearm: [130,-180,35], hand: [0,0,0] }, rightHand: hand(40,60,60,60,60) },
      { time: 0.70, rightArm: { shoulder: [22,63,10], upperArm: [60,0,0], forearm: [140,-180,35], hand: [0,0,0] }, rightHand: hand(40,60,60,60,60) },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ]
  },
  // ── 18. Water — W hand to chin ──────────────────────────────────────────────
  {
    id: "water", name: "Water", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: OPEN_HAND },
      { time: 0.30, rightArm: { shoulder: [22,63,10], upperArm: [60,0,0], forearm: [140,-180,35], hand: [0,0,0] }, rightHand: hand(70,0,0,0,90) },
      { time: 0.60, rightArm: { shoulder: [22,63,10], upperArm: [60,0,0], forearm: [140,-180,35], hand: [0,0,0] }, rightHand: hand(70,0,0,0,90) },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ]
  },
  // ── 19. Who — Index hook at chin ────────────────────────────────────────────
  {
    id: "who", name: "Who", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: OPEN_HAND },
      { time: 0.20, rightArm: { shoulder: [22,63,10], upperArm: [60,0,0], forearm: [140,-180,35], hand: [0,0,0] }, rightHand: hand(90,45,90,90,90) },
      { time: 0.40, rightHand: hand(90,90,90,90,90) },
      { time: 0.60, rightHand: hand(90,45,90,90,90) },
      { time: 0.80, rightHand: hand(90,90,90,90,90) },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ]
  },
  // ── 20. What — Palms up, side to side shake ──────────────────────────────────
  {
    id: "what", name: "What", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.20, 
        rightArm: { shoulder: [20,-10,-20], upperArm: [30,-10,0], forearm: [80, 0, -90], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,-10,20], upperArm: [30,-10,0], forearm: [80, 0, 90], hand: [0,0,0] }, 
        rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.40, 
        rightArm: { shoulder: [20,-20,-20], upperArm: [30,-10,0], forearm: [80, 0, -90], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,-20,20], upperArm: [30,-10,0], forearm: [80, 0, 90], hand: [0,0,0] } },
      { time: 0.60, 
        rightArm: { shoulder: [20,0,-20], upperArm: [30,-10,0], forearm: [80, 0, -90], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,0,20], upperArm: [30,-10,0], forearm: [80, 0, 90], hand: [0,0,0] } },
      { time: 0.80, 
        rightArm: { shoulder: [20,-10,-20], upperArm: [30,-10,0], forearm: [80, 0, -90], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,-10,20], upperArm: [30,-10,0], forearm: [80, 0, 90], hand: [0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ]
  },
  // ── 21. Where — Index up, shake left/right ───────────────────────────────────
  {
    id: "where", name: "Where", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: OPEN_HAND },
      { time: 0.20, rightArm: { shoulder: [20,20,-20], upperArm: [30,10,-10], forearm: [90,-90,-45], hand: [0,0,0] }, rightHand: hand(90,0,90,90,90) },
      { time: 0.40, rightArm: { shoulder: [20,20,-20], upperArm: [30,10,-10], forearm: [90,-120,-45], hand: [0,0,0] } },
      { time: 0.60, rightArm: { shoulder: [20,20,-20], upperArm: [30,10,-10], forearm: [90,-60,-45], hand: [0,0,0] } },
      { time: 0.80, rightArm: { shoulder: [20,20,-20], upperArm: [30,10,-10], forearm: [90,-120,-45], hand: [0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ]
  },
  // ── 22. When — Index circles index ───────────────────────────────────────────
  {
    id: "when", name: "When", duration: 1600,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.20, 
        rightArm: { shoulder: [20,20,-20], upperArm: [30,10,-10], forearm: [80,0,-45], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,20,20], upperArm: [30,10,-10], forearm: [80,0,45], hand: [0,0,0] }, 
        rightHand: hand(90,0,90,90,90), leftHand: hand(90,0,90,90,90) },
      { time: 0.50, rightArm: { shoulder: [20,30,-20], upperArm: [40,20,-10], forearm: [80,0,-60], hand: [0,0,0] } },
      { time: 0.80, rightArm: { shoulder: [20,20,-20], upperArm: [30,10,-10], forearm: [80,0,-45], hand: [0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ]
  },
  // ── 23. Why — Forehead to Y ──────────────────────────────────────────────────
  {
    id: "why", name: "Why", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, rightHand: OPEN_HAND },
      { time: 0.30, rightArm: { shoulder: [25,80,20], upperArm: [60,20,10], forearm: [150,-180,45], hand: [0,0,0] }, rightHand: OPEN_HAND },
      { time: 0.70, rightArm: { shoulder: [25,50,-10], upperArm: [40,0,0], forearm: [100,-90,20], hand: [0,0,0] }, rightHand: hand(0,90,90,90,0) },
      { time: 1.00, rightArm: REST_ARM_R, rightHand: NATURAL_HAND },
    ]
  },
  // ── 24. How — Roll curved hands ──────────────────────────────────────────────
  {
    id: "how", name: "How", duration: 1500,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.30, 
        rightArm: { shoulder: [20,0,-20], upperArm: [30,0,0], forearm: [80,90,-90], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,0,20], upperArm: [30,0,0], forearm: [80,-90,90], hand: [0,0,0] }, 
        rightHand: hand(30,45,45,45,45), leftHand: hand(30,45,45,45,45) },
      { time: 0.70, 
        rightArm: { shoulder: [20,0,-20], upperArm: [30,0,0], forearm: [80,0,-90], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,0,20], upperArm: [30,0,0], forearm: [80,0,90], hand: [0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ]
  },
  // ── 25. Go — Index fingers forward ───────────────────────────────────────────
  {
    id: "go", name: "Go", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.30, 
        rightArm: { shoulder: [20,30,-20], upperArm: [40,10,0], forearm: [80,-90,-45], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,30,20], upperArm: [40,10,0], forearm: [80,90,45], hand: [0,0,0] }, 
        rightHand: hand(90,0,90,90,90), leftHand: hand(90,0,90,90,90) },
      { time: 0.60, 
        rightArm: { shoulder: [20,10,-20], upperArm: [20,-10,0], forearm: [40,-90,-45], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,10,20], upperArm: [20,-10,0], forearm: [40,90,45], hand: [0,0,0] }, 
        rightHand: hand(90,0,90,90,90), leftHand: hand(90,0,90,90,90) },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ]
  },
  // ── 26. More — O-hands tap ───────────────────────────────────────────────────
  {
    id: "more", name: "More", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.30, 
        rightArm: { shoulder: [20,10,-10], upperArm: [30,0,0], forearm: [80,-90,-45], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,10,10], upperArm: [30,0,0], forearm: [80,90,45], hand: [0,0,0] }, 
        rightHand: hand(40,60,60,60,60), leftHand: hand(40,60,60,60,60) },
      { time: 0.50, 
        rightArm: { shoulder: [20,0,-5], upperArm: [30,0,0], forearm: [80,-90,-20], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,0,5], upperArm: [30,0,0], forearm: [80,90,20], hand: [0,0,0] } },
      { time: 0.70, 
        rightArm: { shoulder: [20,10,-10], upperArm: [30,0,0], forearm: [80,-90,-45], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,10,10], upperArm: [30,0,0], forearm: [80,90,45], hand: [0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ]
  },
  // ── 27. Finish — Palms out/down ──────────────────────────────────────────────
  {
    id: "finish", name: "Finish", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.25, 
        rightArm: { shoulder: [20,0,-15], upperArm: [30,0,0], forearm: [80,90,-90], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,0,15], upperArm: [30,0,0], forearm: [80,-90,90], hand: [0,0,0] }, 
        rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.60, 
        rightArm: { shoulder: [20,10,-30], upperArm: [40,10,0], forearm: [40,0,-90], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,10,30], upperArm: [40,10,0], forearm: [40,0,90], hand: [0,0,0] }, 
        rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ]
  },
  // ── 28. Play — Y-hands shake ─────────────────────────────────────────────────
  {
    id: "play", name: "Play", duration: 1500,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.20, 
        rightArm: { shoulder: [20,20,-30], upperArm: [30,0,0], forearm: [80,0,-90], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,20,30], upperArm: [30,0,0], forearm: [80,0,90], hand: [0,0,0] }, 
        rightHand: hand(0,90,90,90,0), leftHand: hand(0,90,90,90,0) },
      { time: 0.40, 
        rightArm: { shoulder: [20,20,-30], upperArm: [30,0,0], forearm: [80,90,-90], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,20,30], upperArm: [30,0,0], forearm: [80,-90,90], hand: [0,0,0] } },
      { time: 0.60, 
        rightArm: { shoulder: [20,20,-30], upperArm: [30,0,0], forearm: [80,-90,-90], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,20,30], upperArm: [30,0,0], forearm: [80,90,90], hand: [0,0,0] } },
      { time: 0.80, 
        rightArm: { shoulder: [20,20,-30], upperArm: [30,0,0], forearm: [80,90,-90], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,20,30], upperArm: [30,0,0], forearm: [80,-90,90], hand: [0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ]
  },
  // ── 29. Work — S-hands tap ───────────────────────────────────────────────────
  {
    id: "work", name: "Work", duration: 1500,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.30, 
        rightArm: { shoulder: [20,20,-10], upperArm: [30,0,0], forearm: [80,-90,-90], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,0,10], upperArm: [30,0,0], forearm: [80,90,-45], hand: [0,0,0] }, 
        rightHand: FIST, leftHand: FIST },
      { time: 0.50, rightArm: { shoulder: [20,10,-10], upperArm: [30,0,0], forearm: [80,-90,-45], hand: [0,0,0] } },
      { time: 0.70, rightArm: { shoulder: [20,20,-10], upperArm: [30,0,0], forearm: [80,-90,-90], hand: [0,0,0] } },
      { time: 0.90, rightArm: { shoulder: [20,10,-10], upperArm: [30,0,0], forearm: [80,-90,-45], hand: [0,0,0] } },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ]
  },
  // ── 30. Learn — Grab from flat hand ──────────────────────────────────────────
  {
    id: "learn", name: "Learn", duration: 1600,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.25, 
        rightArm: { shoulder: [20,0,-15], upperArm: [30,0,0], forearm: [80,0,-45], hand: [0,0,0] }, 
        leftArm: { shoulder: [20,0,15], upperArm: [30,0,0], forearm: [80,-90,45], hand: [0,0,0] }, 
        rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.60, 
        rightArm: { shoulder: [25,80,20], upperArm: [60,20,10], forearm: [150,-180,45], hand: [0,0,0] }, 
        rightHand: hand(30,45,45,45,45) },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ]
  },

  // ── 31–56. ASL Fingerspelling A–Z ─────────────────────────────────────────
  //   thumb, index, middle, ring, pinky  (0 = extended, 90 = fully curled)
  la("a",  10, 90, 90, 90, 90),              // A: fist, thumb at side
  la("b",  90,  0,  0,  0,  0),              // B: 4 fingers up, thumb folded
  la("c",  30, 45, 45, 45, 45),              // C: curved C shape
  la("d",  50,  0, 80, 80, 80),              // D: index up, others touch thumb
  la("e",  50, 70, 70, 70, 70),              // E: fingertips curl to thumb
  la("f",  50, 70,  0,  0,  0),              // F: thumb+index touch, others up
  la("g",   0,  0, 90, 90, 90, SPELL_ARM_SIDE), // G: index+thumb sideways
  la("h",  60,  0,  0, 90, 90, SPELL_ARM_SIDE), // H: index+middle sideways
  la("i",  70, 90, 90, 90,  0),              // I: pinky up
  la("j",  70, 90, 90, 90,  0),              // J: pinky up (static version)
  la("k",  30,  0,  0, 90, 90),              // K: index+middle V, thumb between
  la("l",   0,  0, 90, 90, 90),              // L: L-shape
  la("m",  80, 70, 70, 70, 90),              // M: thumb under 3 fingers
  la("n",  80, 70, 70, 90, 90),              // N: thumb under 2 fingers
  la("o",  40, 60, 60, 60, 60),              // O: all fingertips touch thumb
  la("p",  30,  0,  0, 90, 90, SPELL_ARM_DOWN), // P: K pointing down
  la("q",   0,  0, 90, 90, 90, SPELL_ARM_DOWN), // Q: G pointing down
  la("r",  70,  0,  0, 90, 90),              // R: index+middle together up
  la("s",  60, 90, 90, 90, 90),              // S: fist, thumb over fingers
  la("t",  50, 80, 90, 90, 90),              // T: thumb between index+middle
  la("u",  70,  0,  0, 90, 90),              // U: index+middle up together
  la("v",  70,  0,  0, 90, 90),              // V: index+middle up (spread)
  la("w",  70,  0,  0,  0, 90),              // W: three fingers up
  la("x",  70, 45, 90, 90, 90),              // X: index hooked
  la("y",   0, 90, 90, 90,  0),              // Y: thumb+pinky out
  la("z",  70,  0, 90, 90, 90),              // Z: index points (traces Z)
];

// ─── Utilities ────────────────────────────────────────────────────────────────

export function getSignAnimation(id: string): SignAnimation | undefined {
  return SIGN_ANIMATIONS.find((s) => s.id === id);
}

export const WORD_TO_SIGN: Record<string, string> = {
  hello: "hello", hi: "hello", hey: "hello",
  "thank you": "thank_you", thanks: "thank_you",
  yes: "yes", yeah: "yes",
  no: "no", nope: "no",
  please: "please",
  help: "help",
  sorry: "sorry",
  good: "good",
  "i love you": "i_love_you",
  stop: "stop",
  "1": "one",   one: "one",
  "2": "two",   two: "two",
  "3": "three", three: "three",
  "4": "four",  four: "four",
  "5": "five",  five: "five",

  // 15 New generated words
  want: "want",
  eat: "eat",
  water: "water",
  drink: "water",
  who: "who",
  what: "what",
  where: "where",
  when: "when",
  why: "why",
  how: "how",
  go: "go",
  more: "more",
  finish: "finish",
  done: "finish",
  play: "play",
  work: "work",
  learn: "learn",
};

export function textToSignIds(text: string): string[] {
  const lower = text.toLowerCase().trim();
  const phrases = Object.keys(WORD_TO_SIGN).sort((a, b) => b.length - a.length);
  const out: string[] = [];
  let rem = lower;
  while (rem.length > 0) {
    let matched = false;
    for (const p of phrases) {
      if (rem.startsWith(p)) {
        out.push(WORD_TO_SIGN[p]);
        rem = rem.slice(p.length).trimStart();
        matched = true;
        break;
      }
    }
    if (!matched) {
      const si = rem.indexOf(" ");
      rem = si === -1 ? "" : rem.slice(si + 1);
    }
  }
  return out;
}
