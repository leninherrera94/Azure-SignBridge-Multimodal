/**
 * src/lib/avatar/sign-db-loader.ts
 * Converts SignDefinition records from Cosmos DB into SignAnimation objects
 * that AvatarEngine can play. Call loadSignsFromDB() then pass the result
 * to AvatarEngine via registerAnimations() or replaceAnimations().
 */

import {
  REST_ARM_R,
  REST_ARM_L,
  NATURAL_HAND,
  type SignAnimation,
  type SignKeyframe,
  type ArmPose,
  type HandPose,
  type FingerRotation,
} from "./sign-animations";

import type { PoseData, PoseArm, PoseFingers } from "@/lib/azure/signs-db";

// ─── Type conversion helpers ──────────────────────────────────────────────────

function poseArmToArmPose(a: PoseArm): ArmPose {
  return {
    shoulder: a.shoulder,
    upperArm: a.upperArm,
    forearm:  a.forearm,
    hand:     a.hand,
  };
}

function curl(deg: number): FingerRotation {
  return {
    metacarpal: [deg, 0, 0],
    proximal:   [deg, 0, 0],
    distal:     [deg, 0, 0],
  };
}

function poseFingerToHandPose(f: PoseFingers): HandPose {
  return {
    thumb:  curl(f.thumb),
    index:  curl(f.index),
    middle: curl(f.middle),
    ring:   curl(f.ring),
    pinky:  curl(f.pinky),
  };
}

// ─── Converter ────────────────────────────────────────────────────────────────

function signDefToAnimation(sign: {
  id: string;
  name: string;
  type: "static" | "dynamic";
  duration: number;
  pose?: PoseData;
  poseStart?: PoseData;
  poseEnd?: PoseData;
}): SignAnimation {
  const restKf: SignKeyframe = {
    time:      0,
    rightArm:  REST_ARM_R,
    leftArm:   REST_ARM_L,
    rightHand: NATURAL_HAND,
    leftHand:  NATURAL_HAND,
  };

  if (sign.type === "static" && sign.pose) {
    const p = sign.pose;
    const midKf: SignKeyframe = {
      time:      0.2,
      rightArm:  poseArmToArmPose(p.rightArm),
      leftArm:   p.leftArm ? poseArmToArmPose(p.leftArm) : REST_ARM_L,
      rightHand: poseFingerToHandPose(p.rightFingers),
      leftHand:  p.leftFingers ? poseFingerToHandPose(p.leftFingers) : NATURAL_HAND,
    };
    return {
      id:       sign.id,
      name:     sign.name,
      duration: sign.duration,
      keyframes: [
        { ...restKf, time: 0 },
        midKf,
        { ...midKf, time: 0.8 },
        { ...restKf, time: 1 },
      ],
    };
  }

  // dynamic
  const start = sign.poseStart;
  const end   = sign.poseEnd;

  if (!start || !end) {
    return {
      id: sign.id, name: sign.name, duration: sign.duration,
      keyframes: [{ ...restKf, time: 0 }, { ...restKf, time: 1 }],
    };
  }

  const startKf: SignKeyframe = {
    time:      0.2,
    rightArm:  poseArmToArmPose(start.rightArm),
    leftArm:   start.leftArm ? poseArmToArmPose(start.leftArm) : REST_ARM_L,
    rightHand: poseFingerToHandPose(start.rightFingers),
    leftHand:  start.leftFingers ? poseFingerToHandPose(start.leftFingers) : NATURAL_HAND,
  };

  const endKf: SignKeyframe = {
    time:      0.7,
    rightArm:  poseArmToArmPose(end.rightArm),
    leftArm:   end.leftArm ? poseArmToArmPose(end.leftArm) : REST_ARM_L,
    rightHand: poseFingerToHandPose(end.rightFingers),
    leftHand:  end.leftFingers ? poseFingerToHandPose(end.leftFingers) : NATURAL_HAND,
  };

  return {
    id:       sign.id,
    name:     sign.name,
    duration: sign.duration,
    keyframes: [
      { ...restKf, time: 0 },
      startKf,
      endKf,
      { ...restKf, time: 1 },
    ],
  };
}

// ─── Public loader ────────────────────────────────────────────────────────────

export async function loadSignsFromDB(language = "ASL"): Promise<SignAnimation[]> {
  try {
    const res   = await fetch(`/api/signs?language=${language}`);
    if (!res.ok) return [];
    const signs = await res.json() as Array<{
      id: string; name: string; type: "static" | "dynamic"; duration: number;
      pose?: PoseData; poseStart?: PoseData; poseEnd?: PoseData;
    }>;
    return signs.map(signDefToAnimation);
  } catch (err) {
    console.warn("[sign-db-loader] Could not load signs from DB:", err);
    return [];
  }
}
