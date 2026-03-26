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
  shoulder: [number, number, number];
  upperArm: [number, number, number];
  forearm:  [number, number, number];
  hand:     [number, number, number];
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

export function fc(deg: number): FingerRotation {
  return { metacarpal: [deg, 0, 0], proximal: [deg, 0, 0], distal: [deg, 0, 0] };
}

export function hand(t: number, i: number, m: number, r: number, p: number): HandPose {
  return { thumb: fc(t), index: fc(i), middle: fc(m), ring: fc(r), pinky: fc(p) };
}

// ─── Named hand poses ─────────────────────────────────────────────────────────

export const OPEN_HAND    = hand( 0,  0,  0,  0,  0);
export const NATURAL_HAND = hand(10, 10, 10, 10, 10);
export const FIST         = hand(90, 90, 90, 90, 90);
export const ILY          = hand( 0,  0, 90, 90,  0);

// ─── Rest arm poses ───────────────────────────────────────────────────────────

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

export const REST_ARM = REST_ARM_R;

// ─── Fill keyframes ───────────────────────────────────────────────────────────

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
