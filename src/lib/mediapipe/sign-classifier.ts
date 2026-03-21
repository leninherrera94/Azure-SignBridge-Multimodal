/**
 * src/lib/mediapipe/sign-classifier.ts
 *
 * Rule-based ASL static sign classifier.
 *
 * Approach:
 *  - For each of the 4 non-thumb fingers, a finger is "extended" when
 *    distance(tip, wrist) > distance(pip, wrist) × EXTENSION_RATIO.
 *  - For the thumb, extension is measured from TIP to MCP (the larger
 *    segment) because the thumb moves differently from the other fingers.
 *  - Each supported sign is defined as a 5-element pattern
 *    [thumb, index, middle, ring, pinky] where true = extended, false = closed.
 *  - Confidence = number_of_fingers_matching / 5 (Hamming similarity).
 *  - A detection is emitted only if confidence ≥ CONFIDENCE_THRESHOLD
 *    and the sign with the highest confidence is unambiguous (next-best is
 *    at least 0.2 below).
 *
 * This module is pure TypeScript — no browser APIs — so it is safe to unit test
 * in Node.js and import from any context.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface ClassificationResult {
  sign:            string;
  emoji:           string;
  confidence:      number;
  /** The raw [thumb, index, middle, ring, pinky] extension state */
  extendedFingers: [boolean, boolean, boolean, boolean, boolean];
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** A finger is "extended" when tip-to-wrist distance exceeds pip-to-wrist × this ratio. */
const EXTENSION_RATIO = 1.1;
/** Thumb uses MCP (not PIP) as the pivot — it has a different range of motion. */
const THUMB_EXTENSION_RATIO = 1.15;
/** Minimum Hamming similarity (matching fingers / 5) to emit a detection. */
const CONFIDENCE_THRESHOLD = 0.80; // ≥ 4 out of 5 fingers must match

// ─── Landmark indices (MediaPipe Hands v0.4) ──────────────────────────────────

const LM = {
  WRIST:       0,
  THUMB_CMC:   1,  THUMB_MCP:   2,  THUMB_IP:    3,  THUMB_TIP:   4,
  INDEX_MCP:   5,  INDEX_PIP:   6,  INDEX_DIP:   7,  INDEX_TIP:   8,
  MIDDLE_MCP:  9,  MIDDLE_PIP: 10,  MIDDLE_DIP:  11, MIDDLE_TIP: 12,
  RING_MCP:   13,  RING_PIP:   14,  RING_DIP:    15, RING_TIP:   16,
  PINKY_MCP:  17,  PINKY_PIP:  18,  PINKY_DIP:   19, PINKY_TIP:  20,
} as const;

// ─── Supported signs ──────────────────────────────────────────────────────────
//
// Each entry's `pattern` must be UNIQUE across all signs to guarantee
// unambiguous classification.
//
// pattern = [thumb, index, middle, ring, pinky]

interface SignDefinition {
  name:        string;
  emoji:       string;
  description: string;
  pattern:     [boolean, boolean, boolean, boolean, boolean];
}

const SIGN_DEFINITIONS: SignDefinition[] = [
  {
    name: "Fist / A",
    emoji: "✊",
    description: "All fingers closed (ASL A, 'Yes')",
    pattern: [false, false, false, false, false],
  },
  {
    name: "Thumbs Up",
    emoji: "👍",
    description: "Only thumb extended",
    pattern: [true, false, false, false, false],
  },
  {
    name: "1",
    emoji: "☝️",
    description: "Index finger only (ASL 1, D)",
    pattern: [false, true, false, false, false],
  },
  {
    name: "L",
    emoji: "👆",
    description: "Thumb + index (L-shape)",
    pattern: [true, true, false, false, false],
  },
  {
    name: "Peace / V / 2",
    emoji: "✌️",
    description: "Index + middle extended (ASL 2, V)",
    pattern: [false, true, true, false, false],
  },
  {
    name: "3",
    emoji: "3️⃣",
    description: "Thumb + index + middle (ASL 3)",
    pattern: [true, true, true, false, false],
  },
  {
    name: "4",
    emoji: "4️⃣",
    description: "Four fingers, thumb folded (ASL 4)",
    pattern: [false, true, true, true, true],
  },
  {
    name: "5 / Hello",
    emoji: "✋",
    description: "Open hand, all five fingers extended",
    pattern: [true, true, true, true, true],
  },
  {
    name: "Y / Hang Loose",
    emoji: "🤙",
    description: "Thumb + pinky only",
    pattern: [true, false, false, false, true],
  },
  {
    name: "I Love You",
    emoji: "🤟",
    description: "Thumb + index + pinky (ASL ILY)",
    pattern: [true, true, false, false, true],
  },
  {
    name: "B / Stop",
    emoji: "🖐️",
    description: "Four fingers up, thumb tucked (ASL B)",
    pattern: [false, true, true, true, false],
  },
  {
    name: "Pinky",
    emoji: "🤙",
    description: "Only pinky extended",
    pattern: [false, false, false, false, true],
  },
];

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function dist3(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function isFingerExtended(
  landmarks: NormalizedLandmark[],
  tipIdx: number,
  pipIdx: number
): boolean {
  const wrist = landmarks[LM.WRIST];
  return dist3(landmarks[tipIdx], wrist) > dist3(landmarks[pipIdx], wrist) * EXTENSION_RATIO;
}

function isThumbExtended(landmarks: NormalizedLandmark[]): boolean {
  const wrist = landmarks[LM.WRIST];
  // Compare tip-to-wrist vs mcp-to-wrist (larger segment for thumb)
  return (
    dist3(landmarks[LM.THUMB_TIP], wrist) >
    dist3(landmarks[LM.THUMB_MCP], wrist) * THUMB_EXTENSION_RATIO
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute the boolean extension state for all 5 fingers.
 * Exported so the hook can display finger state for debugging.
 */
export function getExtendedFingers(
  landmarks: NormalizedLandmark[]
): [boolean, boolean, boolean, boolean, boolean] {
  return [
    isThumbExtended(landmarks),
    isFingerExtended(landmarks, LM.INDEX_TIP,  LM.INDEX_PIP),
    isFingerExtended(landmarks, LM.MIDDLE_TIP, LM.MIDDLE_PIP),
    isFingerExtended(landmarks, LM.RING_TIP,   LM.RING_PIP),
    isFingerExtended(landmarks, LM.PINKY_TIP,  LM.PINKY_PIP),
  ];
}

/**
 * Classify a single hand's landmarks into an ASL sign.
 *
 * Returns null if no sign exceeds the confidence threshold.
 */
export function classifySign(
  landmarks: NormalizedLandmark[]
): ClassificationResult | null {
  if (!landmarks || landmarks.length < 21) return null;

  const extended = getExtendedFingers(landmarks);

  let bestSign: SignDefinition | null = null;
  let bestScore  = 0;
  let secondScore = 0;

  for (const sign of SIGN_DEFINITIONS) {
    let matches = 0;
    for (let i = 0; i < 5; i++) {
      if (extended[i] === sign.pattern[i]) matches++;
    }
    const score = matches / 5;

    if (score > bestScore) {
      secondScore = bestScore;
      bestScore   = score;
      bestSign    = sign;
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  // Reject if below threshold or too ambiguous (two signs within 0.2 of each other)
  if (
    !bestSign ||
    bestScore < CONFIDENCE_THRESHOLD ||
    bestScore - secondScore < 0.15
  ) {
    return null;
  }

  return {
    sign:           bestSign.name,
    emoji:          bestSign.emoji,
    confidence:     bestScore,
    extendedFingers: extended,
  };
}

/**
 * Returns the full catalogue of supported signs for display in a reference grid.
 */
export function getSupportedSigns(): ReadonlyArray<{
  name:        string;
  emoji:       string;
  description: string;
  pattern:     [boolean, boolean, boolean, boolean, boolean];
}> {
  return SIGN_DEFINITIONS;
}
