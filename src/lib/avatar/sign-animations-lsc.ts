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

// ─── DÍA (Day) ────────────────────────────────────────────────────────────────
// Right "1" — index tip touches upper cheek, slides DOWN along cheek, then
// curves slightly outward/upward at the finish.

// Index tip at upper cheek (start of slide)
const DIA_UPPER: ArmPose = {
  shoulder: [ 40,  28, -22],
  upperArm: [ 50,  42,  -3],
  forearm:  [130, -68, -32],
  hand:     [  5,  -8,   8],
};
// Index tip at lower cheek (end of downward slide)
const DIA_LOWER: ArmPose = {
  shoulder: [ 34,  25, -22],
  upperArm: [ 46,  40,  -3],
  forearm:  [118, -68, -35],
  hand:     [  5,  -8,   8],
};
// Wrist curls outward/upward — fingertip arcs away from face
const DIA_CURVE: ArmPose = {
  shoulder: [ 33,  24, -22],
  upperArm: [ 46,  38,  -3],
  forearm:  [115, -60, -38],
  hand:     [  5,  12,   8],
};

// ─── DECIR (To say / speak) ───────────────────────────────────────────────────
// Right "1", palm facing back — index tip touches chin, then arm moves forward.

// Index tip at chin, palm facing signer's body
const DECIR_CHIN: ArmPose = {
  shoulder: [ 32,  14, -18],
  upperArm: [ 44,  22,  -2],
  forearm:  [105, -52, -42],
  hand:     [ -5,  62,   8],
};
// Arm extends forward — finger pulls away from chin toward the front
const DECIR_FWD: ArmPose = {
  shoulder: [ 28,  24, -20],
  upperArm: [ 42,  26,  -2],
  forearm:  [ 92, -45, -50],
  hand:     [ -5,  60,   8],
};

// ─── ¿DÓNDE? (Where?) ────────────────────────────────────────────────────────
// Both "5" hands, palms UP — simultaneous short lateral sweep inward→outward.
// Shoulders slightly elevated (WH-question marker).

// Both hands centered in front, palms up
const DONDE_R_IN: ArmPose = {
  shoulder: [ 22,   5, -15],
  upperArm: [ 38,  12,  -2],
  forearm:  [ 45, -28, -88],
  hand:     [ -5, -32,   8],
};
const DONDE_L_IN: ArmPose = {
  shoulder: [ 22,   5,  15],
  upperArm: [ 38, -12,   2],
  forearm:  [ 45,  28,  88],
  hand:     [  5,  32,  -8],
};

// Both hands swept outward, shoulders raised for WH-question
const DONDE_R_OUT: ArmPose = {
  shoulder: [ 26,  20, -18],
  upperArm: [ 38,  20,  -2],
  forearm:  [ 45, -28, -88],
  hand:     [ -5, -32,   8],
};
const DONDE_L_OUT: ArmPose = {
  shoulder: [ 26,  20,  18],
  upperArm: [ 38, -20,   2],
  forearm:  [ 45,  28,  88],
  hand:     [  5,  32,  -8],
};

// ─── DOS (Two) ────────────────────────────────────────────────────────────────
// Right "2" / "V" — index + middle extended & spread, palm forward. Static hold.

const DOS_ARM: ArmPose = {
  shoulder: [ 28,  10, -20],
  upperArm: [ 42,  22,  -3],
  forearm:  [115, -72, -38],
  hand:     [  5, -75,  12],
};

// "2" handshape: index + middle extended, thumb/ring/pinky curled
const HAND_2 = hand(90, 0, 0, 90, 90);

// ─── GOBIERNO (Government) ────────────────────────────────────────────────────
// Right "1" approaches temple → handshape changes to "G" → index tip touches.

// Arm raised toward temple — "1" still forming (pre-contact)
const GOBIERNO_APPROACH: ArmPose = {
  shoulder: [ 40,  30, -24],
  upperArm: [ 50,  44,  -3],
  forearm:  [132, -70, -32],
  hand:     [  5,  -5,  10],
};
// Index tip at temple — "G" handshape makes contact
const GOBIERNO_TOUCH: ArmPose = {
  shoulder: [ 42,  32, -24],
  upperArm: [ 52,  46,  -3],
  forearm:  [138, -72, -30],
  hand:     [  5,  -5,  10],
};

// "G" handshape: thumb + index extended, middle/ring/pinky curled
const HAND_G = hand(0, 0, 90, 90, 90);

// ─── GRANDE (Big / Large) ─────────────────────────────────────────────────────
// Both "5" hands, palms facing each other (pinky-edge forward), close at chest
// center → sweep simultaneously outward to each side.

// Both hands at chest center, palms facing each other
const GRANDE_R_IN: ArmPose = {
  shoulder: [ 18,  -5, -18],
  upperArm: [ 40,   8,  -2],
  forearm:  [ 15,  32, -112],
  hand:     [ -5,  72,   5],
};
const GRANDE_L_IN: ArmPose = {
  shoulder: [ 18,  -5,  18],
  upperArm: [ 40,  -8,   2],
  forearm:  [ 15, -32,  112],
  hand:     [  5, -72,  -5],
};

// Both hands swept outward to sides, palms still facing each other
const GRANDE_R_OUT: ArmPose = {
  shoulder: [ 20,  15, -22],
  upperArm: [ 40,  20,  -2],
  forearm:  [ 15,  32, -112],
  hand:     [ -5,  72,   5],
};
const GRANDE_L_OUT: ArmPose = {
  shoulder: [ 20,  15,  22],
  upperArm: [ 40, -20,   2],
  forearm:  [ 15, -32,  112],
  hand:     [  5, -72,  -5],
};

// ─── HABER (There is / to have) ───────────────────────────────────────────────
// Right "Y", palm back — slight single outward movement.
// Non-manual: puffed cheek (not animatable in this rig).

// Y hand palm-back at chest-side, close to body
const HABER_START: ArmPose = {
  shoulder: [ 22,  10, -20],
  upperArm: [ 42,  18,  -2],
  forearm:  [ 38,  42, -115],
  hand:     [ -5,  80,   5],
};
// Slight outward/forward displacement
const HABER_OUT: ArmPose = {
  shoulder: [ 20,  16, -22],
  upperArm: [ 40,  22,  -2],
  forearm:  [ 32,  40, -118],
  hand:     [ -5,  80,   5],
};

// ─── HACER (To do / To make) ──────────────────────────────────────────────────
// Both "Q" hands (pinch up) — alternating forward circles, 180° out of phase.
// 4-point circle: 12-o'clock → 3 (forward) → 6 (bottom) → 9 (back) → 12.

// Right hand circle positions
const HACER_R_12: ArmPose = { shoulder: [ 22,   8, -18], upperArm: [ 40,  14,  -2], forearm:  [ 50,  14, -92], hand: [ -5,  55,  5] };
const HACER_R_3:  ArmPose = { shoulder: [ 20,  16, -20], upperArm: [ 38,  18,  -2], forearm:  [ 42,   8, -98], hand: [ -5,  55,  5] };
const HACER_R_6:  ArmPose = { shoulder: [ 18,   8, -18], upperArm: [ 38,  12,  -2], forearm:  [ 34,  14, -95], hand: [ -5,  55,  5] };
const HACER_R_9:  ArmPose = { shoulder: [ 20,   2, -16], upperArm: [ 40,  10,  -2], forearm:  [ 48,  20, -88], hand: [ -5,  55,  5] };

// Left hand circle positions (mirror of right)
const HACER_L_12: ArmPose = { shoulder: [ 22,   8,  18], upperArm: [ 40, -14,   2], forearm:  [ 50, -14,  92], hand: [  5, -55, -5] };
const HACER_L_3:  ArmPose = { shoulder: [ 20,  16,  20], upperArm: [ 38, -18,   2], forearm:  [ 42,  -8,  98], hand: [  5, -55, -5] };
const HACER_L_6:  ArmPose = { shoulder: [ 18,   8,  18], upperArm: [ 38, -12,   2], forearm:  [ 34, -14,  95], hand: [  5, -55, -5] };
const HACER_L_9:  ArmPose = { shoulder: [ 20,   2,  16], upperArm: [ 40, -10,   2], forearm:  [ 48, -20,  88], hand: [  5, -55, -5] };

// ─── HASTA — tiempo (Until) ───────────────────────────────────────────────────
// Left hand: flat open palm as stationary base (palm facing right/up).
// Right hand: fingers forward, descends so pinky edge contacts left palm.

// Left hand base — flat palm, facing inward/upward as receiving surface
const HASTA_L_BASE: ArmPose = {
  shoulder: [ 16,  -8,  22],
  upperArm: [ 34,  -6,   3],
  forearm:  [ 32,  -8,  90],
  hand:     [  5, -50, -10],
};

// Right hand above left palm — fingers pointing forward, pinky edge down
const HASTA_R_ABOVE: ArmPose = {
  shoulder: [ 24,   8, -18],
  upperArm: [ 40,  14,  -2],
  forearm:  [ 48,  38, -75],
  hand:     [  5,  30,  15],
};
// Right hand descended — pinky edge rests on left palm
const HASTA_R_TOUCH: ArmPose = {
  shoulder: [ 22,   5, -18],
  upperArm: [ 38,  12,  -2],
  forearm:  [ 42,  36, -78],
  hand:     [  5,  30,  15],
};

// ─── MÁS (More / Plus) ────────────────────────────────────────────────────────
// Both "Q" hands, pinch up — left is stationary base; right moves inward until
// both pinch tips make contact at chest center.

// Left hand — stationary, pinch up, palm facing right
const MAS_L_BASE: ArmPose = {
  shoulder: [ 20,  -5,  20],
  upperArm: [ 38,  -8,   2],
  forearm:  [ 42, -18,  90],
  hand:     [  5, -60,  -5],
};

// Right hand start — separated to the right, pinch up, palm facing left
const MAS_R_START: ArmPose = {
  shoulder: [ 20,  12, -22],
  upperArm: [ 40,  20,  -2],
  forearm:  [ 42,  18, -90],
  hand:     [ -5,  60,   5],
};
// Right hand at contact — moved inward, pinch tips meet left hand tips
const MAS_R_TOUCH: ArmPose = {
  shoulder: [ 18,   0, -18],
  upperArm: [ 38,   5,  -2],
  forearm:  [ 40,  15, -95],
  hand:     [ -5,  60,   5],
};

// ─── MENOS (Less / Minus) ─────────────────────────────────────────────────────
// Left "5": palm inward, pinky-edge down (vertical paddle, stationary base).
// Right "B": palm down, fingers forward — thumb edge slides top→bottom along left palm.

// Left hand base — vertical, palm facing inward, pinky edge downward
const MENOS_L_BASE: ArmPose = {
  shoulder: [ 16,  -5,  22],
  upperArm: [ 35, -10,   3],
  forearm:  [ 30,  -5,  90],
  hand:     [  5,  60,  -8],
};

// Right "B" above left palm — palm down, fingers forward
const MENOS_R_ABOVE: ArmPose = {
  shoulder: [ 22,  -2, -18],
  upperArm: [ 40,   5,  -2],
  forearm:  [ 42,  30, -98],
  hand:     [ -5,  82,   8],
};
// Right hand slid downward — thumb edge traverses left palm
const MENOS_R_BELOW: ArmPose = {
  shoulder: [ 18,  -2, -18],
  upperArm: [ 38,   5,  -2],
  forearm:  [ 35,  30, -100],
  hand:     [ -5,  82,   8],
};

// "B" handshape: thumb tucked, four fingers extended together
const HAND_B = hand(90, 0, 0, 0, 0);

// ─── MISMO (Same / Itself) ────────────────────────────────────────────────────
// Left "5": palm up, stationary receiving surface.
// Right "Y": palm DOWN — back of fingers taps left palm 3×.

// Left hand — open palm facing up as receiving surface
const MISMO_L_BASE: ArmPose = {
  shoulder: [ 16,  -5,  20],
  upperArm: [ 34,  -6,   2],
  forearm:  [ 30,   5,  88],
  hand:     [  5, -30,  -8],
};

// Right Y-hand lifted above left palm (between taps)
const MISMO_R_UP: ArmPose = {
  shoulder: [ 22,   2, -18],
  upperArm: [ 40,   8,  -2],
  forearm:  [ 38,  28, -98],
  hand:     [ -5,  80,   5],
};
// Right Y-hand tapping down — back of fingers contacts left palm
const MISMO_R_DOWN: ArmPose = {
  shoulder: [ 20,   2, -18],
  upperArm: [ 38,   8,  -2],
  forearm:  [ 32,  26, -100],
  hand:     [ -5,  80,   5],
};

// ─── NO ───────────────────────────────────────────────────────────────────────
// Right "1", index pointing up — lateral wrist wag (hand.z ±18°), arm fixed.

// Arm raised, index up, neutral wrist
const NO_CENTER: ArmPose = {
  shoulder: [ 32,  14, -22],
  upperArm: [ 46,  28,  -3],
  forearm:  [110, -68, -40],
  hand:     [  5, -78,   0],
};
// Wrist tilted left
const NO_LEFT: ArmPose = {
  shoulder: [ 32,  14, -22],
  upperArm: [ 46,  28,  -3],
  forearm:  [110, -68, -40],
  hand:     [  5, -78, -18],
};
// Wrist tilted right
const NO_RIGHT: ArmPose = {
  shoulder: [ 32,  14, -22],
  upperArm: [ 46,  28,  -3],
  forearm:  [110, -68, -40],
  hand:     [  5, -78,  18],
};

// ─── OTRO (Other / Another) ───────────────────────────────────────────────────
// Right "V" — palm DOWN rotates to palm UP while arm moves outward.
// Same supination mechanics as lsc_despues; differs only in handshape (V vs 5).

// Start: V palm-down, arm lateral at waist-chest level
const OTRO_START: ArmPose = {
  shoulder: [ 18,  20, -18],
  upperArm: [ 38,  28,  -2],
  forearm:  [ 40,  48, -76],
  hand:     [ -5,  72,  12],
};
// End: V palm-up, arm shifted outward (forearm supinated)
const OTRO_END: ArmPose = {
  shoulder: [ 18,  28, -18],
  upperArm: [ 38,  28,  -2],
  forearm:  [ 40, -28, -76],
  hand:     [ -5, -25,  12],
};

// ─── PAÍS (Country / Nation) ──────────────────────────────────────────────────
// Right concave "claw" hand, palm forward — stops at 3 spatial locations
// (upper → mid → lower-right), representing geographic points in space.

const PAIS_POS1: ArmPose = {      // upper stop
  shoulder: [ 38,  25, -15],
  upperArm: [ 50,  38,  -3],
  forearm:  [100, -52, -38],
  hand:     [  5, -65,   8],
};
const PAIS_POS2: ArmPose = {      // mid stop
  shoulder: [ 30,  22, -20],
  upperArm: [ 44,  32,  -3],
  forearm:  [ 88, -48, -42],
  hand:     [  5, -65,   8],
};
const PAIS_POS3: ArmPose = {      // lower-right stop
  shoulder: [ 22,  28, -22],
  upperArm: [ 40,  38,  -3],
  forearm:  [ 72, -38, -45],
  hand:     [  5, -62,   8],
};

// Concave/cupped hand — all fingers moderately curled, palm faces forward
const HAND_CLAW = hand(20, 40, 40, 40, 40);

// ─── PARA (For / To) ──────────────────────────────────────────────────────────
// Right "1" — index tip rests on temple (palm inward), then arm moves outward
// while wrist rotates so palm ends facing forward.

// Index tip at temple, palm facing inward (toward head)
const PARA_TEMPLE: ArmPose = {
  shoulder: [ 40,  30, -24],
  upperArm: [ 50,  44,  -3],
  forearm:  [135, -70, -30],
  hand:     [  5,   5,  10],
};
// Arm extended outward from temple, palm now facing forward (rotated)
const PARA_OUT: ArmPose = {
  shoulder: [ 36,  28, -20],
  upperArm: [ 46,  38,  -3],
  forearm:  [108, -60, -36],
  hand:     [  5, -72,  10],
};

// ─── PERO (But) ───────────────────────────────────────────────────────────────
// Both "1" hands cross index fingers (X) at chest-center, then separate rapidly
// outward until both index fingers point upward.

// Right "1" crossing inward (index pointing left, arm crosses midline)
const PERO_R_CROSS: ArmPose = {
  shoulder: [ 16,  -8, -15],
  upperArm: [ 36,  -8,  -2],
  forearm:  [ 35,  10, -82],
  hand:     [ -5,   5,  -5],
};
// Left "1" crossing inward (index pointing right, arm crosses midline — mirror)
const PERO_L_CROSS: ArmPose = {
  shoulder: [ 16,  -8,  15],
  upperArm: [ 36,   8,   2],
  forearm:  [ 35, -10,  82],
  hand:     [  5,  -5,   5],
};

// After separation — right index pointing up (identical to NO_CENTER)
const PERO_R_UP: ArmPose = {
  shoulder: [ 32,  14, -22],
  upperArm: [ 46,  28,  -3],
  forearm:  [110, -68, -40],
  hand:     [  5, -78,   0],
};
// After separation — left index pointing up (mirror of PERO_R_UP)
const PERO_L_UP: ArmPose = {
  shoulder: [ 32,  14,  22],
  upperArm: [ 46, -28,   3],
  forearm:  [110,  68,  40],
  hand:     [ -5,  78,   0],
};

// ─── ¿POR QUÉ? (Why?) ────────────────────────────────────────────────────────
// Right "5" — middle finger touches forehead, then arm moves forward.
// Non-manual: furrowed brows (not animatable); shoulder.x +4° approximates shrug.

// Middle finger at forehead (arm highly bent, more central than temple)
const PORQUE_TOUCH: ArmPose = {
  shoulder: [ 44,  18, -20],
  upperArm: [ 52,  30,  -3],
  forearm:  [145, -62, -25],
  hand:     [  5,  -8,   8],
};
// Arm extended forward from forehead — shoulder slightly elevated (WH-question)
const PORQUE_FWD: ArmPose = {
  shoulder: [ 42,  26, -22],
  upperArm: [ 48,  36,  -3],
  forearm:  [118, -55, -32],
  hand:     [  5, -12,   8],
};

// ─── PODER (To be able to / Can) ──────────────────────────────────────────────
// Both FIST hands, palms forward, at shoulder height → flex wrists and lower
// arms energetically. (Palm-forward = hand.y ≈ ±72°, opposite of FIST_CHEST.)

// Both fists at shoulder height, palms facing forward
const PODER_R_HIGH: ArmPose = {
  shoulder: [ 25,   5, -20],
  upperArm: [ 44,  15,  -2],
  forearm:  [ 60,  -5, -70],
  hand:     [  5, -72,   8],
};
const PODER_L_HIGH: ArmPose = {
  shoulder: [ 25,   5,  20],
  upperArm: [ 44, -15,   2],
  forearm:  [ 60,   5,  70],
  hand:     [ -5,  72,  -8],
};

// Arms lowered energetically — wrist slightly flexed (hand.x +10°)
const PODER_R_LOW: ArmPose = {
  shoulder: [ 18,   2, -18],
  upperArm: [ 40,  12,  -2],
  forearm:  [ 40,  -2, -78],
  hand:     [ 10, -72,  12],
};
const PODER_L_LOW: ArmPose = {
  shoulder: [ 18,   2,  18],
  upperArm: [ 40, -12,   2],
  forearm:  [ 40,   2,  78],
  hand:     [-10,  72, -12],
};

// ─── SÍ (Yes) ─────────────────────────────────────────────────────────────────
// Right FIST, palm forward — wrist nods downward repeatedly (hand.x oscillates).
// Arm stays fixed; only wrist flexes.

// Fist at shoulder height, palm forward, wrist neutral
const SI_ARM: ArmPose = {
  shoulder: [ 26,   8, -20],
  upperArm: [ 44,  18,  -2],
  forearm:  [ 62,  -5, -68],
  hand:     [  5, -72,   8],
};
// Wrist flexed downward (knuckles tilt toward floor)
const SI_DOWN: ArmPose = {
  shoulder: [ 26,   8, -20],
  upperArm: [ 44,  18,  -2],
  forearm:  [ 62,  -5, -68],
  hand:     [ 18, -72,   8],
};

// ─── SIEMPRE (Always) ─────────────────────────────────────────────────────────
// Right "F" (thumb+index pinch, others extended), palm inward — vertical
// up-down oscillation at chest level, 3 cycles.

// Three vertical positions — arm height varies via forearm.x; lateral fixed
const SIEMPRE_MID: ArmPose = {
  shoulder: [ 22,   5, -18],
  upperArm: [ 40,  12,  -2],
  forearm:  [ 52,  28, -88],
  hand:     [ -5,  65,   5],
};
const SIEMPRE_DOWN: ArmPose = {
  shoulder: [ 20,   5, -18],
  upperArm: [ 38,  12,  -2],
  forearm:  [ 44,  26, -90],
  hand:     [ -5,  65,   5],
};
const SIEMPRE_UP: ArmPose = {
  shoulder: [ 24,   5, -18],
  upperArm: [ 42,  12,  -2],
  forearm:  [ 60,  28, -86],
  hand:     [ -5,  65,   5],
};

// "F" handshape: thumb + index tips joined (pinch); middle/ring/pinky extended
const HAND_F = hand(45, 55, 0, 0, 0);

// ─── SOLO (Alone / Only) ──────────────────────────────────────────────────────
// Right "1", palm back — small lateral circles in the frontal plane, 2 cycles.
// 4-point orbit: forearm.x ±6° (height) + shoulder.y ±6° (lateral).

const SOLO_12: ArmPose = { shoulder: [ 26,   8, -20], upperArm: [ 44,  18,  -2], forearm: [ 78,   8, -68], hand: [ -5,  68,  5] };
const SOLO_3:  ArmPose = { shoulder: [ 26,  14, -20], upperArm: [ 44,  22,  -2], forearm: [ 72,   8, -68], hand: [ -5,  68,  5] };
const SOLO_6:  ArmPose = { shoulder: [ 26,   8, -20], upperArm: [ 44,  18,  -2], forearm: [ 66,   8, -68], hand: [ -5,  68,  5] };
const SOLO_9:  ArmPose = { shoulder: [ 26,   2, -20], upperArm: [ 44,  14,  -2], forearm: [ 72,   8, -68], hand: [ -5,  68,  5] };

// ─── TAMBIÉN (Also / Too) ─────────────────────────────────────────────────────
// Both "1" hands, palms forward — index UP simultaneously sweeps to index DOWN.
// Start poses reuse PERO_R_UP / PERO_L_UP values (same index-up / palm-fwd pos).

// Start: index pointing UP, palm forward (identical values to PERO_R/L_UP)
const TAMBIEN_R_UP: ArmPose = {
  shoulder: [ 32,  14, -22],
  upperArm: [ 46,  28,  -3],
  forearm:  [110, -68, -40],
  hand:     [  5, -78,   0],
};
const TAMBIEN_L_UP: ArmPose = {
  shoulder: [ 32,  14,  22],
  upperArm: [ 46, -28,   3],
  forearm:  [110,  68,  40],
  hand:     [ -5,  78,   0],
};

// End: index pointing DOWN, palm still forward (forearm.x negative = below elbow)
const TAMBIEN_R_DOWN: ArmPose = {
  shoulder: [ 15,  10, -18],
  upperArm: [ 35,  15,  -3],
  forearm:  [-25, -62, -35],
  hand:     [  5, -75,   5],
};
const TAMBIEN_L_DOWN: ArmPose = {
  shoulder: [ 15,  10,  18],
  upperArm: [ 35, -15,   3],
  forearm:  [-25,  62,  35],
  hand:     [ -5,  75,  -5],
};

// ─── TIEMPO (Time) ────────────────────────────────────────────────────────────
// Left FIST palm-down = stationary "watch wrist". Right "1" index taps top of
// left wrist twice.

// Left fist — palm down, presented as watch wrist at waist/lower-chest level
const TIEMPO_L_WRIST: ArmPose = {
  shoulder: [ 16,  -8,  20],
  upperArm: [ 35, -10,   2],
  forearm:  [ 30,  -5,  88],
  hand:     [  5,  62,  -8],
};

// Right index above left wrist (about to tap)
const TIEMPO_R_ABOVE: ArmPose = {
  shoulder: [ 20,  -8, -18],
  upperArm: [ 38,  -2,  -2],
  forearm:  [ 52,  20, -82],
  hand:     [  5,  15,   5],
};
// Right index touching top of left wrist
const TIEMPO_R_TOUCH: ArmPose = {
  shoulder: [ 18,  -8, -18],
  upperArm: [ 36,  -2,  -2],
  forearm:  [ 46,  18, -84],
  hand:     [  5,  15,   5],
};

// ─── TENER (To have) ──────────────────────────────────────────────────────────
// Right fist + thumb extended (thumbs-up) — thumb touches chest, palm-back.
// Arm position anchored on FIST_CHEST reference.

const TENER_TOUCH: ArmPose = {
  shoulder: [ 20, -15, -25],
  upperArm: [ 44,  -5,  -2],
  forearm:  [ 45,  20, -118],
  hand:     [ -5,  62,   8],
};

// ─── TODOS (All / Everyone) ───────────────────────────────────────────────────
// Left "5" stationary — fingertips pointing inward (toward center).
// Right "5" orbits around left: above → mid-arc → dorso contacts left palm (palm-up).

// Left hand base — horizontal, fingertips pointing inward, palm upward
const TODOS_L_BASE: ArmPose = {
  shoulder: [ 16,  -8,  22],
  upperArm: [ 34,  -6,   2],
  forearm:  [ 32,  -8,  90],
  hand:     [  5, -50, -10],
};

// Right hand above/behind left — palm forward, start of orbit
const TODOS_R_UP: ArmPose = {
  shoulder: [ 32,  12, -20],
  upperArm: [ 46,  20,  -3],
  forearm:  [ 95, -52, -38],
  hand:     [  5, -68,   8],
};
// Right hand mid-arc — coming around from above, arm level drops
const TODOS_R_OVER: ArmPose = {
  shoulder: [ 25,   5, -18],
  upperArm: [ 42,  15,  -3],
  forearm:  [ 65, -40, -52],
  hand:     [  5, -55,  10],
};
// Right hand at contact — dorso down / palm up, in front of left palm
const TODOS_R_CONTACT: ArmPose = {
  shoulder: [ 20,  -2, -18],
  upperArm: [ 38,  10,  -2],
  forearm:  [ 38, -28, -88],
  hand:     [  5, -32,  10],
};

// ─── TRES (Three) ─────────────────────────────────────────────────────────────
// Right "3" — index + middle + ring extended, thumb + pinky curled. Static hold.
// Arm position identical to DOS_ARM (numeral display height).

// "3" handshape: index/middle/ring extended, thumb/pinky curled
const HAND_3 = hand(90, 0, 0, 0, 90);

// ─── VIDA (Life) ──────────────────────────────────────────────────────────────
// Both "W" hands (thumb+index+middle extended), palms back, waist height —
// slide thumbs upward along torso 3×.

// Both hands at waist (bottom of slide), palms back
const VIDA_R_LOW: ArmPose = {
  shoulder: [ 12, -15, -25],
  upperArm: [ 40,  -5,  -2],
  forearm:  [ 20,  28, -115],
  hand:     [ -5,  68,   5],
};
const VIDA_L_LOW: ArmPose = {
  shoulder: [ 12, -15,  25],
  upperArm: [ 40,   5,   2],
  forearm:  [ 20, -28,  115],
  hand:     [  5, -68,  -5],
};

// Both hands at chest (top of slide), palms back
const VIDA_R_HIGH: ArmPose = {
  shoulder: [ 18, -15, -22],
  upperArm: [ 42,  -5,  -2],
  forearm:  [ 38,  26, -110],
  hand:     [ -5,  68,   5],
};
const VIDA_L_HIGH: ArmPose = {
  shoulder: [ 18, -15,  22],
  upperArm: [ 42,   5,   2],
  forearm:  [ 38, -26,  110],
  hand:     [  5, -68,  -5],
};

// "W" handshape: thumb + index + middle extended, ring + pinky curled
const HAND_W = hand(0, 0, 0, 90, 90);

// ─── YA (Already) ─────────────────────────────────────────────────────────────
// Right "Y" at shoulder height — wrist rotates palm-back → palm-forward.
// Encoded as forearm.y + hand.y shift (same mechanics as lsc_despues supination).

// Y hand, palm facing back, shoulder height
const YA_START: ArmPose = {
  shoulder: [ 28,  10, -22],
  upperArm: [ 44,  20,  -3],
  forearm:  [ 72,  20, -60],
  hand:     [ -5,  75,   5],
};
// Y hand, palm facing forward, after wrist rotation
const YA_END: ArmPose = {
  shoulder: [ 28,  10, -22],
  upperArm: [ 44,  20,  -3],
  forearm:  [ 72, -25, -60],
  hand:     [ -5, -55,   5],
};

// ─── YO (I / Me) ──────────────────────────────────────────────────────────────
// Right "1", palm back — index tip touches chest. Single touch + hold.
// Anchored on DECIR_CHIN (palm-back index) shifted lower from chin to chest.

const YO_TOUCH: ArmPose = {
  shoulder: [ 22, -10, -24],
  upperArm: [ 42,  -2,  -2],
  forearm:  [ 62,  22, -108],
  hand:     [ -5,  62,   8],
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

  // ── 9. Yo — right "1" palm-back, index tip touches chest, single hold ────────
  {
    id: "lsc_yo", name: "Yo", duration: 1000,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,  leftArm: REST_ARM_L, rightHand: HAND_1, leftHand: NATURAL_HAND },
      { time: 0.20, rightArm: YO_TOUCH },
      { time: 0.65, rightArm: YO_TOUCH },
      { time: 1.00, rightArm: REST_ARM_R,  leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 10. Ya — right "Y" at shoulder height, wrist rotates palm-back → palm-fwd ─
  {
    id: "lsc_ya", name: "Ya", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: HAND_Y, leftHand: NATURAL_HAND },
      { time: 0.18, rightArm: YA_START },
      { time: 0.65, rightArm: YA_END },
      { time: 0.82, rightArm: YA_END },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 10. Vida — both "W" palms-back slide upward along torso 3× ──────────────
  {
    id: "lsc_vida", name: "Vida", duration: 1500,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,   leftArm: REST_ARM_L,   rightHand: HAND_W, leftHand: HAND_W },
      { time: 0.10, rightArm: VIDA_R_LOW,   leftArm: VIDA_L_LOW },
      { time: 0.28, rightArm: VIDA_R_HIGH,  leftArm: VIDA_L_HIGH },
      { time: 0.43, rightArm: VIDA_R_LOW,   leftArm: VIDA_L_LOW },
      { time: 0.58, rightArm: VIDA_R_HIGH,  leftArm: VIDA_L_HIGH },
      { time: 0.73, rightArm: VIDA_R_LOW,   leftArm: VIDA_L_LOW },
      { time: 0.85, rightArm: VIDA_R_HIGH,  leftArm: VIDA_L_HIGH },
      { time: 0.93, rightArm: VIDA_R_HIGH,  leftArm: VIDA_L_HIGH },
      { time: 1.00, rightArm: REST_ARM_R,   leftArm: REST_ARM_L,   rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── 10. Uno — right "1" palm-forward, static hold (same arm as DOS/TRES) ─────
  {
    id: "lsc_uno", name: "Uno", duration: 1000,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: HAND_1, leftHand: NATURAL_HAND },
      { time: 0.20, rightArm: DOS_ARM },
      { time: 0.70, rightArm: DOS_ARM },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 10. Tres — right "3" palm-forward, static hold (same arm as DOS) ─────────
  {
    id: "lsc_tres", name: "Tres", duration: 1000,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: HAND_3, leftHand: NATURAL_HAND },
      { time: 0.20, rightArm: DOS_ARM },
      { time: 0.70, rightArm: DOS_ARM },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 10. Todos — right "5" orbits left "5" base, dorso contacts left palm ──────
  {
    id: "lsc_todos", name: "Todos", duration: 1500,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,       leftArm: REST_ARM_L,      rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.12, rightArm: TODOS_R_UP,       leftArm: TODOS_L_BASE },
      { time: 0.42, rightArm: TODOS_R_OVER },
      { time: 0.65, rightArm: TODOS_R_CONTACT },
      { time: 0.80, rightArm: TODOS_R_CONTACT },
      { time: 1.00, rightArm: REST_ARM_R,       leftArm: REST_ARM_L,      rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── 10. Tener — right thumbs-up touches chest, palm-back, single hold ────────
  {
    id: "lsc_tener", name: "Tener", duration: 1100,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,    leftArm: REST_ARM_L, rightHand: HAND_THUMB_UP, leftHand: NATURAL_HAND },
      { time: 0.20, rightArm: TENER_TOUCH },
      { time: 0.65, rightArm: TENER_TOUCH },
      { time: 1.00, rightArm: REST_ARM_R,    leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 10. Tiempo — right "1" taps top of left FIST (watch wrist) twice ─────────
  {
    id: "lsc_tiempo", name: "Tiempo", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,      leftArm: REST_ARM_L,      rightHand: HAND_1, leftHand: FIST },
      { time: 0.15, rightArm: TIEMPO_R_ABOVE,  leftArm: TIEMPO_L_WRIST },
      { time: 0.30, rightArm: TIEMPO_R_TOUCH },
      { time: 0.45, rightArm: TIEMPO_R_ABOVE },
      { time: 0.60, rightArm: TIEMPO_R_TOUCH },
      { time: 0.75, rightArm: TIEMPO_R_TOUCH },
      { time: 1.00, rightArm: REST_ARM_R,      leftArm: REST_ARM_L,      rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── 10. También — both "1" palm-fwd sweep index UP → index DOWN bilaterally ──
  {
    id: "lsc_tambien", name: "También", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,       leftArm: REST_ARM_L,       rightHand: HAND_1, leftHand: HAND_1 },
      { time: 0.15, rightArm: TAMBIEN_R_UP,     leftArm: TAMBIEN_L_UP },
      { time: 0.30, rightArm: TAMBIEN_R_UP,     leftArm: TAMBIEN_L_UP },
      { time: 0.65, rightArm: TAMBIEN_R_DOWN,   leftArm: TAMBIEN_L_DOWN },
      { time: 0.80, rightArm: TAMBIEN_R_DOWN,   leftArm: TAMBIEN_L_DOWN },
      { time: 1.00, rightArm: REST_ARM_R,       leftArm: REST_ARM_L,       rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── 10. Solo — right "1" palm-back, lateral frontal-plane circles, 2 cycles ──
  {
    id: "lsc_solo", name: "Solo", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: HAND_1, leftHand: NATURAL_HAND },
      { time: 0.08, rightArm: SOLO_12 },
      { time: 0.19, rightArm: SOLO_3 },
      { time: 0.27, rightArm: SOLO_6 },
      { time: 0.35, rightArm: SOLO_9 },
      { time: 0.43, rightArm: SOLO_12 },
      { time: 0.54, rightArm: SOLO_3 },
      { time: 0.62, rightArm: SOLO_6 },
      { time: 0.70, rightArm: SOLO_9 },
      { time: 0.78, rightArm: SOLO_12 },
      { time: 0.88, rightArm: SOLO_12 },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 10. Siempre — right "F" palm-inward, vertical up-down oscillation 3× ─────
  {
    id: "lsc_siempre", name: "Siempre", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,      leftArm: REST_ARM_L, rightHand: HAND_F, leftHand: NATURAL_HAND },
      { time: 0.10, rightArm: SIEMPRE_MID },
      { time: 0.23, rightArm: SIEMPRE_DOWN },
      { time: 0.36, rightArm: SIEMPRE_UP },
      { time: 0.49, rightArm: SIEMPRE_DOWN },
      { time: 0.62, rightArm: SIEMPRE_UP },
      { time: 0.75, rightArm: SIEMPRE_DOWN },
      { time: 0.85, rightArm: SIEMPRE_MID },
      { time: 1.00, rightArm: REST_ARM_R,      leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 10. Sí — right FIST palm-forward, wrist nods downward 3× ────────────────
  {
    id: "lsc_si", name: "Sí", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: FIST, leftHand: NATURAL_HAND },
      { time: 0.10, rightArm: SI_ARM },
      { time: 0.22, rightArm: SI_DOWN },
      { time: 0.34, rightArm: SI_ARM },
      { time: 0.46, rightArm: SI_DOWN },
      { time: 0.58, rightArm: SI_ARM },
      { time: 0.70, rightArm: SI_DOWN },
      { time: 0.82, rightArm: SI_DOWN },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 10. Poder — both fists palm-forward at shoulder, flex wrists + lower arms ─
  {
    id: "lsc_poder", name: "Poder", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,      leftArm: REST_ARM_L,      rightHand: FIST, leftHand: FIST },
      { time: 0.15, rightArm: PODER_R_HIGH,    leftArm: PODER_L_HIGH },
      { time: 0.32, rightArm: PODER_R_HIGH,    leftArm: PODER_L_HIGH },
      { time: 0.65, rightArm: PODER_R_LOW,     leftArm: PODER_L_LOW },
      { time: 0.80, rightArm: PODER_R_LOW,     leftArm: PODER_L_LOW },
      { time: 1.00, rightArm: REST_ARM_R,      leftArm: REST_ARM_L,      rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── 10. ¿Por qué? — right "5" middle-finger touches forehead, moves forward ──
  {
    id: "lsc_porque", name: "¿Por qué?", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,     leftArm: REST_ARM_L, rightHand: OPEN_HAND, leftHand: NATURAL_HAND },
      { time: 0.15, rightArm: PORQUE_TOUCH },
      { time: 0.28, rightArm: PORQUE_TOUCH },
      { time: 0.65, rightArm: PORQUE_FWD },
      { time: 0.82, rightArm: PORQUE_FWD },
      { time: 1.00, rightArm: REST_ARM_R,     leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 10. Pero — both "1" cross X at center, then rapidly separate fingers-up ──
  {
    id: "lsc_pero", name: "Pero", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,      leftArm: REST_ARM_L,      rightHand: HAND_1, leftHand: HAND_1 },
      { time: 0.15, rightArm: PERO_R_CROSS,    leftArm: PERO_L_CROSS },
      { time: 0.30, rightArm: PERO_R_CROSS,    leftArm: PERO_L_CROSS },
      { time: 0.65, rightArm: PERO_R_UP,       leftArm: PERO_L_UP },
      { time: 0.80, rightArm: PERO_R_UP,       leftArm: PERO_L_UP },
      { time: 1.00, rightArm: REST_ARM_R,      leftArm: REST_ARM_L,      rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── 10. Para — right "1" touches temple (palm-in), rotates outward palm-fwd ──
  {
    id: "lsc_para", name: "Para", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,    leftArm: REST_ARM_L, rightHand: HAND_1, leftHand: NATURAL_HAND },
      { time: 0.18, rightArm: PARA_TEMPLE },
      { time: 0.28, rightArm: PARA_TEMPLE },
      { time: 0.65, rightArm: PARA_OUT },
      { time: 0.82, rightArm: PARA_OUT },
      { time: 1.00, rightArm: REST_ARM_R,    leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 10. País — right concave hand palm-forward stops at 3 spatial points ─────
  {
    id: "lsc_pais", name: "País", duration: 1500,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,  leftArm: REST_ARM_L, rightHand: HAND_CLAW, leftHand: NATURAL_HAND },
      { time: 0.12, rightArm: PAIS_POS1 },
      { time: 0.28, rightArm: PAIS_POS1 },
      { time: 0.45, rightArm: PAIS_POS2 },
      { time: 0.58, rightArm: PAIS_POS2 },
      { time: 0.72, rightArm: PAIS_POS3 },
      { time: 0.85, rightArm: PAIS_POS3 },
      { time: 1.00, rightArm: REST_ARM_R,  leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 10. Otro — right "V" palm-down supinates to palm-up, moves outward ───────
  {
    id: "lsc_otro", name: "Otro", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,   leftArm: REST_ARM_L, rightHand: HAND_2, leftHand: NATURAL_HAND },
      { time: 0.15, rightArm: OTRO_START },
      { time: 0.65, rightArm: OTRO_END },
      { time: 0.82, rightArm: OTRO_END },
      { time: 1.00, rightArm: REST_ARM_R,   leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 10. No — right "1" index-up lateral wrist wag, 2 full cycles ─────────────
  {
    id: "lsc_no", name: "No", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,  leftArm: REST_ARM_L, rightHand: HAND_1, leftHand: NATURAL_HAND },
      { time: 0.10, rightArm: NO_CENTER },
      { time: 0.24, rightArm: NO_LEFT },
      { time: 0.38, rightArm: NO_RIGHT },
      { time: 0.52, rightArm: NO_LEFT },
      { time: 0.66, rightArm: NO_RIGHT },
      { time: 0.78, rightArm: NO_CENTER },
      { time: 1.00, rightArm: REST_ARM_R,  leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 10. Mismo — right "Y" palm-down taps back-of-fingers on left "5" palm 3× ─
  {
    id: "lsc_mismo", name: "Mismo", duration: 1500,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,    leftArm: REST_ARM_L,    rightHand: HAND_Y, leftHand: OPEN_HAND },
      { time: 0.10, rightArm: MISMO_R_UP,    leftArm: MISMO_L_BASE },
      { time: 0.25, rightArm: MISMO_R_DOWN },
      { time: 0.40, rightArm: MISMO_R_UP },
      { time: 0.55, rightArm: MISMO_R_DOWN },
      { time: 0.70, rightArm: MISMO_R_UP },
      { time: 0.82, rightArm: MISMO_R_DOWN },
      { time: 0.92, rightArm: MISMO_R_DOWN },
      { time: 1.00, rightArm: REST_ARM_R,    leftArm: REST_ARM_L,    rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── 10. Menos — right "B" palm-down slides thumb-edge down left "5" palm ─────
  {
    id: "lsc_menos", name: "Menos", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,      leftArm: REST_ARM_L,      rightHand: HAND_B,    leftHand: OPEN_HAND },
      { time: 0.15, rightArm: MENOS_R_ABOVE,   leftArm: MENOS_L_BASE },
      { time: 0.55, rightArm: MENOS_R_BELOW },
      { time: 0.75, rightArm: MENOS_R_BELOW },
      { time: 1.00, rightArm: REST_ARM_R,      leftArm: REST_ARM_L,      rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── 10. Más — right "Q" sweeps inward to meet stationary left "Q" tips ───────
  {
    id: "lsc_mas", name: "Más", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,    leftArm: REST_ARM_L,    rightHand: HAND_Q, leftHand: HAND_Q },
      { time: 0.15, rightArm: MAS_R_START,   leftArm: MAS_L_BASE },
      { time: 0.55, rightArm: MAS_R_TOUCH },
      { time: 0.75, rightArm: MAS_R_TOUCH },
      { time: 1.00, rightArm: REST_ARM_R,    leftArm: REST_ARM_L,    rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── 10. Hasta (tiempo) — right pinky-edge descends onto left open palm ───────
  {
    id: "lsc_hasta", name: "Hasta", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,      leftArm: REST_ARM_L,      rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.18, rightArm: HASTA_R_ABOVE,   leftArm: HASTA_L_BASE },
      { time: 0.55, rightArm: HASTA_R_TOUCH },
      { time: 0.75, rightArm: HASTA_R_TOUCH },
      { time: 1.00, rightArm: REST_ARM_R,      leftArm: REST_ARM_L,      rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── 10. Hacer — both "Q" alternating forward circles, 180° antiphase ─────────
  {
    id: "lsc_hacer", name: "Hacer", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,  leftArm: REST_ARM_L,  rightHand: HAND_Q, leftHand: HAND_Q },
      { time: 0.10, rightArm: HACER_R_12,  leftArm: HACER_L_6 },
      { time: 0.28, rightArm: HACER_R_3,   leftArm: HACER_L_9 },
      { time: 0.46, rightArm: HACER_R_6,   leftArm: HACER_L_12 },
      { time: 0.64, rightArm: HACER_R_9,   leftArm: HACER_L_3 },
      { time: 0.78, rightArm: HACER_R_12,  leftArm: HACER_L_6 },
      { time: 0.88, rightArm: HACER_R_12,  leftArm: HACER_L_6 },
      { time: 1.00, rightArm: REST_ARM_R,  leftArm: REST_ARM_L,  rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── 10. Haber — right "Y" palm-back, slight outward movement ─────────────────
  {
    id: "lsc_haber", name: "Haber", duration: 1100,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,    leftArm: REST_ARM_L, rightHand: HAND_Y, leftHand: NATURAL_HAND },
      { time: 0.18, rightArm: HABER_START },
      { time: 0.55, rightArm: HABER_OUT },
      { time: 0.78, rightArm: HABER_OUT },
      { time: 1.00, rightArm: REST_ARM_R,    leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 10. Grande — both "5" palms-facing sweep outward from chest center ───────
  {
    id: "lsc_grande", name: "Grande", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,      leftArm: REST_ARM_L,      rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.15, rightArm: GRANDE_R_IN,     leftArm: GRANDE_L_IN },
      { time: 0.55, rightArm: GRANDE_R_OUT,    leftArm: GRANDE_L_OUT },
      { time: 0.75, rightArm: GRANDE_R_OUT,    leftArm: GRANDE_L_OUT },
      { time: 1.00, rightArm: REST_ARM_R,      leftArm: REST_ARM_L,      rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── 10. Gobierno — right "1" approaches temple, changes to "G", touches ──────
  {
    id: "lsc_gobierno", name: "Gobierno", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,          leftArm: REST_ARM_L, rightHand: HAND_1,    leftHand: NATURAL_HAND },
      { time: 0.18, rightArm: GOBIERNO_APPROACH,                        rightHand: HAND_1 },
      { time: 0.55, rightArm: GOBIERNO_TOUCH,                           rightHand: HAND_G },
      { time: 0.78, rightArm: GOBIERNO_TOUCH },
      { time: 1.00, rightArm: REST_ARM_R,          leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 10. Dos — right "2" / "V" palm-forward, static hold ─────────────────────
  {
    id: "lsc_dos", name: "Dos", duration: 1000,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: HAND_2, leftHand: NATURAL_HAND },
      { time: 0.20, rightArm: DOS_ARM },
      { time: 0.70, rightArm: DOS_ARM },
      { time: 1.00, rightArm: REST_ARM_R, leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 10. ¿Dónde? — both "5" palms-up sweep inward→outward, shoulders raised ──
  {
    id: "lsc_donde", name: "¿Dónde?", duration: 1400,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,    leftArm: REST_ARM_L,    rightHand: OPEN_HAND, leftHand: OPEN_HAND },
      { time: 0.15, rightArm: DONDE_R_IN,    leftArm: DONDE_L_IN },
      { time: 0.50, rightArm: DONDE_R_OUT,   leftArm: DONDE_L_OUT },
      { time: 0.75, rightArm: DONDE_R_OUT,   leftArm: DONDE_L_OUT },
      { time: 1.00, rightArm: REST_ARM_R,    leftArm: REST_ARM_L,    rightHand: NATURAL_HAND, leftHand: NATURAL_HAND },
    ],
  },

  // ── 10. Decir — right "1" palm-back touches chin then moves forward ──────────
  {
    id: "lsc_decir", name: "Decir", duration: 1200,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,    leftArm: REST_ARM_L, rightHand: HAND_1, leftHand: NATURAL_HAND },
      { time: 0.18, rightArm: DECIR_CHIN },
      { time: 0.55, rightArm: DECIR_FWD },
      { time: 0.78, rightArm: DECIR_FWD },
      { time: 1.00, rightArm: REST_ARM_R,    leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 10. Día — right "1" slides down cheek, curves outward/up at end ──────────
  {
    id: "lsc_dia", name: "Día", duration: 1300,
    keyframes: [
      { time: 0.00, rightArm: REST_ARM_R,  leftArm: REST_ARM_L, rightHand: HAND_1, leftHand: NATURAL_HAND },
      { time: 0.15, rightArm: DIA_UPPER },
      { time: 0.55, rightArm: DIA_LOWER },
      { time: 0.75, rightArm: DIA_CURVE },
      { time: 0.88, rightArm: DIA_CURVE },
      { time: 1.00, rightArm: REST_ARM_R,  leftArm: REST_ARM_L, rightHand: NATURAL_HAND },
    ],
  },

  // ── 10. Qué — right "1" slides across left "5" palm (inner → outer) ─────────
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
  // Él / Ella
  "él":       "lsc_el_ella",
  "ella":     "lsc_el_ella",
  "el":       "lsc_el_ella",
  "él/ella":  "lsc_el_ella",
  "él/Ella":  "lsc_el_ella",
  // Yo
  "yo":  "lsc_yo",
  "mí":  "lsc_yo",
  // Ya
  "ya":  "lsc_ya",
  // Vida
  "vida":   "lsc_vida",
  "vivir":  "lsc_vida",
  "vivo":   "lsc_vida",
  "vive":   "lsc_vida",
  "viven":  "lsc_vida",
  // Uno
  "uno":      "lsc_uno",
  "una":      "lsc_uno",
  "1":        "lsc_uno",
  "primero":  "lsc_uno",
  "primera":  "lsc_uno",
  // Tres
  "tres":     "lsc_tres",
  "3":        "lsc_tres",
  "tercero":  "lsc_tres",
  "tercera":  "lsc_tres",
  // Todos
  "todos":  "lsc_todos",
  "todas":  "lsc_todos",
  "todo":   "lsc_todos",
  "toda":   "lsc_todos",
  // Tener
  "tener":  "lsc_tener",
  "tengo":  "lsc_tener",
  "tiene":  "lsc_tener",
  "tienes": "lsc_tener",
  "tienen": "lsc_tener",
  "tuve":   "lsc_tener",
  "tenía":  "lsc_tener",
  "tenia":  "lsc_tener",
  // Tiempo
  "tiempo": "lsc_tiempo",
  "hora":   "lsc_tiempo",
  "reloj":  "lsc_tiempo",
  // También
  "también":    "lsc_tambien",
  "tambien":    "lsc_tambien",
  "igualmente": "lsc_tambien",
  // Solo
  "solo":   "lsc_solo",
  "sola":   "lsc_solo",
  "solos":  "lsc_solo",
  "solas":  "lsc_solo",
  "único":  "lsc_solo",
  "unico":  "lsc_solo",
  // Siempre
  "siempre": "lsc_siempre",
  // Sí
  "sí": "lsc_si",
  "si": "lsc_si",
  // Poder
  "poder":   "lsc_poder",
  "puedo":   "lsc_poder",
  "puede":   "lsc_poder",
  "puedes":  "lsc_poder",
  "pueden":  "lsc_poder",
  "podría":  "lsc_poder",
  "podria":  "lsc_poder",
  // ¿Por qué?
  "¿por qué?": "lsc_porque",
  "por qué":   "lsc_porque",
  "¿por qué":  "lsc_porque",
  "por que":   "lsc_porque",
  "porqué":    "lsc_porque",
  // Pero
  "pero":  "lsc_pero",
  // Para
  "para":  "lsc_para",
  // País
  "país":    "lsc_pais",
  "pais":    "lsc_pais",
  "países":  "lsc_pais",
  "paises":  "lsc_pais",
  "nación":  "lsc_pais",
  "nacion":  "lsc_pais",
  // Otro
  "otro":   "lsc_otro",
  "otra":   "lsc_otro",
  "otros":  "lsc_otro",
  "otras":  "lsc_otro",
  // No
  "no":  "lsc_no",
  // Mismo
  "mismo":  "lsc_mismo",
  "misma":  "lsc_mismo",
  "mismos": "lsc_mismo",
  "mismas": "lsc_mismo",
  "igual":  "lsc_mismo",
  // Menos
  "menos":  "lsc_menos",
  "restar": "lsc_menos",
  "menor":  "lsc_menos",
  // Más
  "más":    "lsc_mas",
  "mas":    "lsc_mas",
  "extra":  "lsc_mas",
  // Hasta
  "hasta":   "lsc_hasta",
  // Hacer
  "hacer":   "lsc_hacer",
  "hago":    "lsc_hacer",
  "hace":    "lsc_hacer",
  "hacen":   "lsc_hacer",
  "haces":   "lsc_hacer",
  "hizo":    "lsc_hacer",
  // Haber
  "haber":   "lsc_haber",
  "hay":     "lsc_haber",
  "había":   "lsc_haber",
  "habia":   "lsc_haber",
  "hubo":    "lsc_haber",
  "habría":  "lsc_haber",
  "habria":  "lsc_haber",
  // Grande
  "grande":  "lsc_grande",
  "grandes": "lsc_grande",
  "gran":    "lsc_grande",
  "enorme":  "lsc_grande",
  // Gobierno
  "gobierno":  "lsc_gobierno",
  // Dos
  "dos":  "lsc_dos",
  "2":    "lsc_dos",
  // ¿Dónde?
  "dónde":   "lsc_donde",
  "donde":   "lsc_donde",
  "¿dónde?": "lsc_donde",
  "¿dónde":  "lsc_donde",
  "dónde?":  "lsc_donde",
  // Decir
  "decir":   "lsc_decir",
  "dice":    "lsc_decir",
  "digo":    "lsc_decir",
  "dices":   "lsc_decir",
  "dijo":    "lsc_decir",
  "dicho":   "lsc_decir",
  // Día
  "día":    "lsc_dia",
  "dia":    "lsc_dia",
  "días":   "lsc_dia",
  "dias":   "lsc_dia",
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
