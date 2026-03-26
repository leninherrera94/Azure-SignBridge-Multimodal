import {
  FIST,
  HAND_Y,
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

// ─── AHORA (Now) ──────────────────────────────────────────────────────────────
// Both hands "Y", palms backward — descend from chest to waist simultaneously.

const AHORA_RIGHT_START: ArmPose = {
  shoulder: [ 18,  -5, -25],
  upperArm: [ 44,   0,   0],
  forearm:  [  5,  40, -140],
  hand:     [ -5,  85,   0],
};
const AHORA_RIGHT_END: ArmPose = {
  shoulder: [ 12,  -5, -20],
  upperArm: [ 40,   0,   0],
  forearm:  [ 15,  35, -120],
  hand:     [ -5,  85,   0],
};
const AHORA_LEFT_START: ArmPose = {
  shoulder: [ 18,  -5,  25],
  upperArm: [ 44,   0,   0],
  forearm:  [  5, -40,  140],
  hand:     [  5, -85,   0],
};
const AHORA_LEFT_END: ArmPose = {
  shoulder: [ 12,  -5,  20],
  upperArm: [ 40,   0,   0],
  forearm:  [ 15, -35,  120],
  hand:     [  5, -85,   0],
};

// ─── DESPUÉS (After / Later) ──────────────────────────────────────────────────
// Right "5" — palm down/pinky-forward → moves forward + supinates to palm-up.

// Start: arm extended laterally at waist level, palm down, pinky-edge forward
const DESPUES_START: ArmPose = {
  shoulder: [ 18,  22, -18],
  upperArm: [ 38,  28,  -2],
  forearm:  [ 40,  50, -75],
  hand:     [ -5,  72,  18],
};
// End: same arm path, forearm supinated → palm up (arc forward + rotate)
const DESPUES_END: ArmPose = {
  shoulder: [ 18,  30, -18],
  upperArm: [ 38,  28,  -2],
  forearm:  [ 40, -28, -75],
  hand:     [ -5, -25,  18],
};

// ─── ¿CUÁNDO? (When?) ─────────────────────────────────────────────────────────
// Right "5" (fingers together), fingertip pads tap cheek softly 3×.

// Hand touching cheek — fingertips make contact
const CUANDO_TOUCH: ArmPose = {
  shoulder: [ 38,  28, -22],
  upperArm: [ 48,  40,  -3],
  forearm:  [128, -70, -35],
  hand:     [  5,  -5,   8],
};
// Hand pulled slightly away between taps
const CUANDO_OFF: ArmPose = {
  shoulder: [ 36,  25, -22],
  upperArm: [ 48,  40,  -3],
  forearm:  [122, -68, -38],
  hand:     [  5,  -5,   8],
};

// ─── ¿CÓMO? (How?) ────────────────────────────────────────────────────────────
// Both "5" hands — bilateral forearm supination: palms-back/fingers-down
// → palms-up/fingers-forward. Shoulders + eyebrows raised (WH-question).

// Both arms low-front, palms facing back, fingers down (pronated)
const COMO_R_START: ArmPose = {
  shoulder: [ 18,   5, -18],
  upperArm: [ 36,  15,  -2],
  forearm:  [ 28,  55, -95],
  hand:     [ -5,  75,  10],
};
const COMO_L_START: ArmPose = {
  shoulder: [ 18,   5,  18],
  upperArm: [ 36, -15,   2],
  forearm:  [ 28, -55,  95],
  hand:     [  5, -75, -10],
};

// Same arm level, forearms supinated: palms up, fingers forward
const COMO_R_END: ArmPose = {
  shoulder: [ 20,   8, -18],
  upperArm: [ 36,  15,  -2],
  forearm:  [ 28, -25, -95],
  hand:     [ -5, -30,  10],
};
const COMO_L_END: ArmPose = {
  shoulder: [ 20,   8,  18],
  upperArm: [ 36, -15,   2],
  forearm:  [ 28,  25,  95],
  hand:     [  5,  30, -10],
};

// ─── COMER / COMIDA (Eat / Food) ──────────────────────────────────────────────
// Right "Q" (thumb+index pinch), palm backward — 2 short back→forward cycles
// very close to the mouth.

// Hand at mouth level — starting position (slightly pulled back)
const COMER_FAR: ArmPose = {
  shoulder: [ 34,  22, -20],
  upperArm: [ 46,  38,  -3],
  forearm:  [110, -52, -42],
  hand:     [  5, -15,   8],
};
// Hand at mouth level — forward position (near mouth)
const COMER_NEAR: ArmPose = {
  shoulder: [ 34,  22, -20],
  upperArm: [ 46,  38,  -3],
  forearm:  [118, -55, -38],
  hand:     [  5, -15,   8],
};

// "Q" handshape: thumb + index curled toward each other (loose pinch), others curled
const HAND_Q = hand(35, 50, 90, 90, 90);

// ─── BIEN (Good / Well) ───────────────────────────────────────────────────────
// Right "thumbs-up" — pinky-edge down, thumb tip forward — short down-up bounce.

const BIEN_ARM: ArmPose = {
  shoulder: [ 28,  12, -22],
  upperArm: [ 40,  25,  -3],
  forearm:  [ 88, -35, -48],
  hand:     [ -5, -75,  18],
};
// Slight downward nudge for the bounce
const BIEN_ARM_DIP: ArmPose = {
  shoulder: [ 26,  12, -22],
  upperArm: [ 40,  25,  -3],
  forearm:  [ 82, -35, -48],
  hand:     [ -5, -75,  18],
};

// "Thumbs-up" handshape: thumb extended, all fingers curled
const HAND_THUMB_UP = hand(0, 90, 90, 90, 90);

// ─── AÑO (Year) ───────────────────────────────────────────────────────────────
// Both fists, palms back, pinky-edge down.
// Left = stationary "sun" at chest center.
// Right = "earth" — full orbit: TOP → FWD → DOWN → BACK → TOP + tap.

// Left fist stationary — chest center, palm back (mirrored from FIST_CHEST)
const ANIO_LEFT: ArmPose = {
  shoulder: [ 16, -18,  22],
  upperArm: [ 45,   5,   0],
  forearm:  [-10, -25, 130],
  hand:     [ -5, -62,   5],
};

// Right orbit positions (palm-back throughout)
// 12 o'clock — on top of left fist
const ANIO_R_TOP: ArmPose = {
  shoulder: [ 20, -16, -26], upperArm: [ 45,  -5,   0],
  forearm:  [-16,  26, -136], hand:     [ -5,  63,   5],
};
// 3 o'clock — hand forward
const ANIO_R_FWD: ArmPose = {
  shoulder: [ 22,  -8, -22], upperArm: [ 43,  -5,   0],
  forearm:  [ 25,  20, -110], hand:     [ -5,  60,   5],
};
// 6 o'clock — hand below left fist
const ANIO_R_DOWN: ArmPose = {
  shoulder: [ 20, -12, -22], upperArm: [ 43,  -5,   0],
  forearm:  [ 44,  25,  -85], hand:     [ -5,  60,   5],
};
// 9 o'clock — hand behind left fist
const ANIO_R_BACK: ArmPose = {
  shoulder: [ 18, -22, -28], upperArm: [ 45,  -5,   0],
  forearm:  [ -5,  28, -155], hand:     [ -5,  65,   5],
};
// tap — forearm.x lowered 4° to simulate knock on left fist
const ANIO_R_TAP: ArmPose = {
  shoulder: [ 20, -16, -26], upperArm: [ 45,  -5,   0],
  forearm:  [-20,  26, -136], hand:     [ -5,  63,   5],
};

// ─── ÉL / ELLA (He / She) ─────────────────────────────────────────────────────
// Right "1", palm down — single extension outward to the side, pointing at a
// third-person referent located to the side of the signer.

// Arm fully extended outward at mid-height, palm facing down
const EL_ELLA_ARM: ArmPose = {
  shoulder: [ 25,  42, -10],
  upperArm: [ 40,  50,  -3],
  forearm:  [ 88, -42, -36],
  hand:     [  5, -55,  22],
};

// ─── Animations ───────────────────────────────────────────────────────────────

export const LSC_SIGN_ANIMATIONS: SignAnimation[] = [

  // ── 1. Después — right "5" moves forward + supinates palm-down → palm-up ─────
  {
    id: "lsc_despues", name: "Después", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,     leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.15, rightArm: DESPUES_START },
      { time: 0.65, rightArm: DESPUES_END },
      { time: 0.82, rightArm: DESPUES_END },
      { time: 1.00, rightArm: REST_ARM_R,     leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 2. ¿Cuándo? — right "5" fingertips tap cheek 3× ─────────────────────────
  {
    id: "lsc_cuando", name: "¿Cuándo?", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,    leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.12, rightArm: CUANDO_TOUCH },
      { time: 0.27, rightArm: CUANDO_OFF },
      { time: 0.42, rightArm: CUANDO_TOUCH },
      { time: 0.57, rightArm: CUANDO_OFF },
      { time: 0.72, rightArm: CUANDO_TOUCH },
      { time: 0.85, rightArm: CUANDO_TOUCH },
      { time: 1.00, rightArm: REST_ARM_R,    leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 3. ¿Cómo? — bilateral "5" forearm supination: palms-back → palms-up ──────
  {
    id: "lsc_como", name: "¿Cómo?", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,    leftArm: REST_ARM_L,    rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.15, rightArm: COMO_R_START,  leftArm: COMO_L_START },
      { time: 0.55, rightArm: COMO_R_END,    leftArm: COMO_L_END },
      { time: 0.78, rightArm: COMO_R_END,    leftArm: COMO_L_END },
      { time: 1.00, rightArm: REST_ARM_R,    leftArm: REST_ARM_L,    rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── 4. Comer/Comida — right "Q" pinch, 2 back→forward cycles near mouth ──────
  {
    id: "lsc_comer", name: "Comer/Comida", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,  leftArm: REST_ARM_L, rightHand: HAND_Q, leftHand: NATURAL_HAND },
      { time: 0.12, rightArm: COMER_FAR },
      { time: 0.27, rightArm: COMER_NEAR },
      { time: 0.42, rightArm: COMER_FAR },
      { time: 0.57, rightArm: COMER_NEAR },
      { time: 0.72, rightArm: COMER_FAR },
      { time: 0.85, rightArm: COMER_NEAR },
      { time: 1.00, rightArm: REST_ARM_R,  leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 5. Bien — right thumbs-up with short down-up bounce ──────────────────────
  {
    id: "lsc_bien", name: "Bien", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,   leftArm: REST_ARM_L, rightHand: HAND_THUMB_UP, leftHand: NATURAL_HAND },
      { time: 0.18, rightArm: BIEN_ARM },
      { time: 0.45, rightArm: BIEN_ARM_DIP },
      { time: 0.62, rightArm: BIEN_ARM },
      { time: 0.80, rightArm: BIEN_ARM },
      { time: 1.00, rightArm: REST_ARM_R,   leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 6. Año — right "earth" fist orbits once around left "sun" fist + tap ─────
  {
    id: "lsc_anio", name: "Año", duration: 1800,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,   leftArm: REST_ARM_L,  rightHand: FIST, leftHand: FIST },
      { time: 0.12, rightArm: ANIO_R_TOP,   leftArm: ANIO_LEFT },
      { time: 0.29, rightArm: ANIO_R_FWD },
      { time: 0.46, rightArm: ANIO_R_DOWN },
      { time: 0.63, rightArm: ANIO_R_BACK },
      { time: 0.78, rightArm: ANIO_R_TOP },
      { time: 0.87, rightArm: ANIO_R_TAP },
      { time: 1.00, rightArm: REST_ARM_R,   leftArm: REST_ARM_L,  rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── 7. Ahora — both "Y" hands descend chest → waist, palms facing back ───────
  {
    id: "lsc_ahora", name: "Ahora", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,          leftArm: REST_ARM_L,         rightHand: HAND_Y,       leftHand: HAND_Y },
      { time: 0.15, rightArm: AHORA_RIGHT_START,   leftArm: AHORA_LEFT_START,   rightHand: HAND_Y,       leftHand: HAND_Y },
      { time: 0.60, rightArm: AHORA_RIGHT_END,     leftArm: AHORA_LEFT_END },
      { time: 0.80, rightArm: AHORA_RIGHT_END,     leftArm: AHORA_LEFT_END },
      { time: 1.00, rightArm: REST_ARM_R,           leftArm: REST_ARM_L,         rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── 8. Él / Ella — right "1" palm-down extends outward (third-person point) ─
  {
    id: "lsc_el_ella", name: "Él/Ella", duration: 1100,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,  leftArm: REST_ARM_L, rightHand: HAND_1, leftHand: NATURAL_HAND },
      { time: 0.22, rightArm: EL_ELLA_ARM, leftArm: REST_ARM_L, rightHand: HAND_1 },
      { time: 0.72, rightArm: EL_ELLA_ARM },
      { time: 1.00, rightArm: REST_ARM_R,  leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 9. Qué — right "1" slides across left "5" palm (inner → outer) ──────────
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
  // Después
  "después": "lsc_despues",
  "despues": "lsc_despues",
  "luego":   "lsc_despues",
  // ¿Cuándo?
  "cuándo":   "lsc_cuando",
  "cuando":   "lsc_cuando",
  "¿cuándo?": "lsc_cuando",
  "¿cuándo":  "lsc_cuando",
  "cuándo?":  "lsc_cuando",
  // ¿Cómo?
  "cómo":   "lsc_como",
  "¿cómo?": "lsc_como",
  "¿cómo":  "lsc_como",
  "cómo?":  "lsc_como",
  // Comer / Comida
  "comer":   "lsc_comer",
  "comida":  "lsc_comer",
  "como":    "lsc_comer",
  "come":    "lsc_comer",
  "comes":   "lsc_comer",
  "almuerzo":"lsc_comer",
  // Bien
  "bien":   "lsc_bien",
  "bueno":  "lsc_bien",
  "buena":  "lsc_bien",
  // Año
  "año":    "lsc_anio",
  "años":   "lsc_anio",
  // Ahora
  "ahora":  "lsc_ahora",
  "ya":     "lsc_ahora",
  // Él / Ella
  "él":       "lsc_el_ella",
  "ella":     "lsc_el_ella",
  "el":       "lsc_el_ella",
  "él/ella":  "lsc_el_ella",
  "él/Ella":  "lsc_el_ella",
  // Qué
  "qué":    "lsc_que",
  "que":    "lsc_que",
  "¿qué?":  "lsc_que",
  "¿qué":   "lsc_que",
  "qué?":   "lsc_que",
};

export function getSignAnimationLSC(id: string): SignAnimation | undefined {
  return LSC_SIGN_ANIMATIONS.find((sign) => sign.id === id);
}
