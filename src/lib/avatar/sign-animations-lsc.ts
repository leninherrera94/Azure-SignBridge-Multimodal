import {
  NATURAL_HAND,
  OPEN_HAND,
  REST_ARM_L,
  REST_ARM_R,
  hand,
  type ArmPose,
  type SignAnimation,
} from "./sign-core";

// ─── QUÉ (What?) ──────────────────────────────────────────────────────────────
// Left "5" — palm facing center, fingertips forward (base hand).
// Right "1" — index tip slides inner→outer across left palm.

const QUE_LEFT_5: ArmPose = {
  shoulder: [ 23, -40,   8],
  upperArm: [ 33,  58,  20],
  forearm:  [ 18,   8,  68],
  hand:     [  0, -120,   0],
};

// Right "1" at inner (thumb-side) edge of left palm
const QUE_RIGHT_START: ArmPose = {
  shoulder: [ 30,  18, -25],
  upperArm: [ 43,  28,  -2],
  forearm:  [ 75, -10, -55],
  hand:     [ -5, -80,   8],
};

// Right "1" at outer (pinky-side) edge of left palm — arm shifts laterally
const QUE_RIGHT_END: ArmPose = {
  shoulder: [ 28,   8, -28],
  upperArm: [ 43,  22,  -2],
  forearm:  [ 75, -10, -55],
  hand:     [ -5, -80,   8],
};

// "1" handshape: index extended, thumb half-tucked, middle/ring/pinky curled
const HAND_1 = hand(60, 0, 90, 90, 90);

// ─── Animations ───────────────────────────────────────────────────────────────

export const LSC_SIGN_ANIMATIONS: SignAnimation[] = [

  // ── 1. Qué — right "1" slides across left "5" palm (inner → outer) ────────
  {
    id: "lsc_que", name: "Qué", duration: 1500,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,       leftArm: REST_ARM_L,  rightHand: HAND_1,   leftHand: OPEN_HAND },
      { time: 0.15, rightArm: QUE_RIGHT_START,  leftArm: QUE_LEFT_5,  rightHand: HAND_1,   leftHand: OPEN_HAND },
      { time: 0.55, rightArm: QUE_RIGHT_END },
      { time: 0.78, rightArm: QUE_RIGHT_END },
      { time: 1.00, rightArm: REST_ARM_R,        leftArm: REST_ARM_L,  rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

];

// ─── Word mapping ─────────────────────────────────────────────────────────────

export const WORD_TO_SIGN_LSC: Record<string, string> = {
  "qué":    "lsc_que",
  "que":    "lsc_que",
  "¿qué?":  "lsc_que",
  "¿qué":   "lsc_que",
  "qué?":   "lsc_que",
};

export function getSignAnimationLSC(id: string): SignAnimation | undefined {
  return LSC_SIGN_ANIMATIONS.find((sign) => sign.id === id);
}
