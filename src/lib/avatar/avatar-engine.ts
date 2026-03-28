/**
 * src/lib/avatar/avatar-engine.ts  (v3 — Ready Player Me GLB + real skeleton)
 *
 * Loads a Ready Player Me avatar GLB and drives its bones to perform
 * ASL sign animations. Only run in browser context (dynamic import).
 *
 * Bone name convention (standard RPM rig):
 *   Body:   Hips, Spine, Spine1, Spine2, Neck, Head
 *   Arms:   RightShoulder, RightArm, RightForeArm, RightHand
 *           LeftShoulder,  LeftArm,  LeftForeArm,  LeftHand
 *   Fingers: RightHandThumb1-3, RightHandIndex1-3, etc.
 */

import * as THREE from "three";
import { GLTFLoader }    from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import {
  SIGN_ANIMATIONS,
  fillKeyframes,
  interpolateFrame,
  easeInOut,
  lerpArmPose,
  lerpHandPose,
  REST_ARM_R,
  REST_ARM_L,
  NATURAL_HAND,
  type SignAnimation,
  type SignSequenceItem,
  type ArmPose,
  type HandPose,
  type FilledKeyframe,
  type FingerRotation,
} from "./sign-animations";
import { getSignAnimation, LETTER_PREFIX } from "./sign-loader";
import type { SignLanguageCode } from "./sign-languages";

// ─── Bone name maps ───────────────────────────────────────────────────────────

const DEG = Math.PI / 180;

// Maps finger name → [bone1, bone2, bone3] for each side
const FINGER_BONES = {
  right: {
    thumb:  ["RightHandThumb1",  "RightHandThumb2",  "RightHandThumb3"],
    index:  ["RightHandIndex1",  "RightHandIndex2",  "RightHandIndex3"],
    middle: ["RightHandMiddle1", "RightHandMiddle2", "RightHandMiddle3"],
    ring:   ["RightHandRing1",   "RightHandRing2",   "RightHandRing3"],
    pinky:  ["RightHandPinky1",  "RightHandPinky2",  "RightHandPinky3"],
  },
  left: {
    thumb:  ["LeftHandThumb1",   "LeftHandThumb2",   "LeftHandThumb3"],
    index:  ["LeftHandIndex1",   "LeftHandIndex2",   "LeftHandIndex3"],
    middle: ["LeftHandMiddle1",  "LeftHandMiddle2",  "LeftHandMiddle3"],
    ring:   ["LeftHandRing1",    "LeftHandRing2",    "LeftHandRing3"],
    pinky:  ["LeftHandPinky1",   "LeftHandPinky2",   "LeftHandPinky3"],
  },
} as const;

// All 4 arm bones now controlled — matches calibrate page's 4-slider export
const ARM_BONES = {
  right: { shoulder: "RightShoulder", upperArm: "RightArm", forearm: "RightForeArm", hand: "RightHand" },
  left:  { shoulder: "LeftShoulder",  upperArm: "LeftArm",  forearm: "LeftForeArm",  hand: "LeftHand"  },
} as const;

// Fallback alternative bone names — mirrors debug page ARM_BONE_DEFS exactly
const BONE_ALIASES: Record<string, string[]> = {
  RightShoulder: ["mixamorigRightShoulder", "Bip01_R_Clavicle"],
  RightArm:      ["mixamorigRightArm",      "Bip01_R_UpperArm"],
  RightForeArm:  ["mixamorigRightForeArm",  "Bip01_R_Forearm"],
  RightHand:     ["mixamorigRightHand",     "Bip01_R_Hand"],
  LeftShoulder:  ["mixamorigLeftShoulder",  "Bip01_L_Clavicle"],
  LeftArm:       ["mixamorigLeftArm",       "Bip01_L_UpperArm"],
  LeftForeArm:   ["mixamorigLeftForeArm",   "Bip01_L_Forearm"],
  LeftHand:      ["mixamorigLeftHand",      "Bip01_L_Hand"],
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AvatarEngineOptions {
  modelUrl?: string;      // default: /models/avatar/avatar.glb
  skinTone?: "light" | "medium" | "dark";
  speed?:    number;
}

interface BlinkTarget {
  mesh:      THREE.SkinnedMesh;
  leftIdx:   number;
  rightIdx:  number;
}

// ─── AvatarEngine ─────────────────────────────────────────────────────────────

export class AvatarEngine {
  private renderer:   THREE.WebGLRenderer;
  private scene:      THREE.Scene;
  private camera:     THREE.PerspectiveCamera;
  private controls:   OrbitControls;
  private clock       = new THREE.Clock();
  private rafId:      number | null = null;

  private bones       = new Map<string, THREE.Bone>();
  private restPose    = new Map<string, THREE.Quaternion>();
  private blinkTarget: BlinkTarget | null = null;

  // Animation
  private playingAnim:  SignAnimation | null = null;
  private filledFrames: FilledKeyframe[] = [];
  private animStart     = 0;
  private speedMult     = 1;
  private isReturning   = false;
  private returnStart   = 0;
  private returnDurSec  = 0;
  private returnFromR:  { arm: ArmPose; hand: HandPose } | null = null;
  private returnFromL:  { arm: ArmPose; hand: HandPose } | null = null;
  private queue:        Array<{ id: string; resolve: () => void }> = [];

  // Static pose
  private staticPoseActive = false;

  // Idle
  private nextBlink    = 3.5;
  private isBlinking   = false;
  private blinkStart   = 0;

  // Skin tone
  private skinTint = new THREE.Color(1, 1, 1);

  // Sign language (determines fingerspelling prefix)
  signLanguage: SignLanguageCode = "ASL";

  // Callbacks
  onProgress?:  (pct: number)   => void;
  onLoad?:      ()              => void;
  onError?:     (msg: string)   => void;
  onSignStart?: (name: string)  => void;
  onSignEnd?:   ()              => void;

  constructor(container: HTMLElement, options: AvatarEngineOptions = {}) {
    const modelUrl = options.modelUrl ?? "/models/avatar/avatar.glb";
    this.speedMult = options.speed ?? 1;

    // ── Canvas ──
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
    container.appendChild(canvas);

    // ── Renderer ──
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping      = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

    // ── Scene ──
    this.scene = new THREE.Scene();

    // ── Camera ──
    this.camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 50);
    this.camera.position.set(0, 1.3, 2.2);
    this.camera.lookAt(0, 1.1, 0);

    // ── Lights ──
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0x8888ff, 0.3);
    fill.position.set(-3, 3, -2);
    this.scene.add(fill);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.4));

    // ── OrbitControls ──
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan     = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.minDistance   = 0.8;
    this.controls.maxDistance   = 2.5;
    this.controls.minPolarAngle = Math.PI / 3.5;
    this.controls.maxPolarAngle = Math.PI / 2.3;
    this.controls.target.set(0, 1.1, 0);
    this.controls.update();

    // ── ResizeObserver ──
    new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }).observe(container);

    // ── Skin tone ──
    if (options.skinTone) this.applySkinTint(options.skinTone);

    // ── Load model ──
    this.loadModel(modelUrl);
  }

  // ── Model loading ──────────────────────────────────────────────────────────

  private loadModel(url: string): void {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => this.onModelLoaded(gltf),
      (progress) => {
        if (progress.total > 0) {
          this.onProgress?.(Math.round(progress.loaded / progress.total * 100));
        }
      },
      (err) => {
        console.error("[AvatarEngine] Load failed:", err);
        this.onError?.(
          "Could not load avatar.glb. Run `npm run download-avatar` or place the file in public/models/avatar/avatar.glb"
        );
        // Start render loop anyway (shows empty scene)
        this.loop();
      }
    );
  }

  private onModelLoaded(gltf: { scene: THREE.Group }): void {
    const model = gltf.scene;

    // Center + scale model
    const box    = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    model.position.y = 0;                         // stand on floor

    // Enable shadows
    model.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        (node as THREE.Mesh).castShadow    = true;
        (node as THREE.Mesh).receiveShadow = true;
      }
    });

    this.scene.add(model);

    // Build bone map
    model.traverse((node) => {
      if ((node as THREE.Bone).isBone) {
        this.bones.set(node.name, node as THREE.Bone);
      }
    });

    // Log found bones in dev mode for debugging
    if (process.env.NODE_ENV !== "production") {
      const boneNames = Array.from(this.bones.keys()).join(", ");
      console.log("[AvatarEngine] Bones found:", boneNames);
    }

    // Save rest pose
    this.bones.forEach((bone, name) => {
      this.restPose.set(name, bone.quaternion.clone());
    });

    // Find blink morph targets
    model.traverse((node) => {
      const mesh = node as THREE.SkinnedMesh;
      if (mesh.isSkinnedMesh && mesh.morphTargetDictionary) {
        const dict = mesh.morphTargetDictionary;
        if ("eyeBlinkLeft" in dict) {
          this.blinkTarget = {
            mesh,
            leftIdx:  dict["eyeBlinkLeft"],
            rightIdx: dict["eyeBlinkRight"] ?? dict["eyeBlinkLeft"],
          };
        }
      }
    });

    // Apply natural rest pose immediately — prevents one-frame T-pose flash
    this.applyArmPose("right", REST_ARM_R);
    this.applyArmPose("left",  REST_ARM_L);
    this.applyHandPose("right", NATURAL_HAND);
    this.applyHandPose("left",  NATURAL_HAND);

    this.onProgress?.(100);
    this.onLoad?.();
    this.loop();
  }

  // ── Bone utilities ─────────────────────────────────────────────────────────

  private getBone(name: string): THREE.Bone | undefined {
    if (this.bones.has(name)) return this.bones.get(name);
    const aliases = BONE_ALIASES[name];
    if (aliases) {
      for (const alias of aliases) {
        if (this.bones.has(alias)) return this.bones.get(alias);
      }
    }
    return undefined;
  }

  /** Set bone rotation relative to its rest (T-pose) quaternion. */
  private setBoneEuler(boneName: string, x: number, y: number, z: number): void {
    const bone = this.getBone(boneName);
    const rest = this.restPose.get(bone?.name ?? boneName);
    if (!bone || !rest) return;

    const delta = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(x * DEG, y * DEG, z * DEG)
    );
    bone.quaternion.copy(rest).multiply(delta);
  }

  /** Apply FingerRotation to three bones (metacarpal, proximal, distal). */
  private applyFinger(bones: readonly [string, string, string], fr: FingerRotation): void {
    const [mc, px, dx] = bones;
    this.setBoneEuler(mc, ...fr.metacarpal);
    this.setBoneEuler(px, ...fr.proximal);
    this.setBoneEuler(dx, ...fr.distal);
  }

  // ── Pose application ───────────────────────────────────────────────────────

  private applyHandPose(side: "right" | "left", pose: HandPose): void {
    const fb = FINGER_BONES[side];
    this.applyFinger(fb.thumb  as [string,string,string], pose.thumb);
    this.applyFinger(fb.index  as [string,string,string], pose.index);
    this.applyFinger(fb.middle as [string,string,string], pose.middle);
    this.applyFinger(fb.ring   as [string,string,string], pose.ring);
    this.applyFinger(fb.pinky  as [string,string,string], pose.pinky);
    if (pose.wrist) {
      const wristBone = ARM_BONES[side].hand;
      this.setBoneEuler(wristBone, ...pose.wrist);
    }
  }

  private applyArmPose(side: "right" | "left", pose: ArmPose): void {
    const ab = ARM_BONES[side];
    this.setBoneEuler(ab.shoulder, ...pose.shoulder);
    this.setBoneEuler(ab.upperArm, ...pose.upperArm);
    this.setBoneEuler(ab.forearm,  ...pose.forearm);
    this.setBoneEuler(ab.hand,     ...pose.hand);
  }

  private applyFrame(frame: FilledKeyframe): void {
    this.applyArmPose("right", frame.rightArm);
    this.applyArmPose("left",  frame.leftArm);
    this.applyHandPose("right", frame.rightHand);
    this.applyHandPose("left",  frame.leftHand);
  }

  // ── Render loop ────────────────────────────────────────────────────────────

  private loop = (): void => {
    this.rafId = requestAnimationFrame(this.loop);
    const t = this.clock.getElapsedTime();
    this.controls.update();

    if (this.playingAnim)                              this.tickAnim(t);
    else if (this.isReturning)                         this.tickReturn(t);
    else if (!this.staticPoseActive && this.bones.size) this.tickIdle(t);

    this.tickBlink(t);
    this.renderer.render(this.scene, this.camera);
  };

  // ── Idle animation ─────────────────────────────────────────────────────────

  private tickIdle(t: number): void {
    // Breathing: ±0.01 rad on Spine1, 3.5s cycle
    const breath = Math.sin(t * (Math.PI * 2) / 3.5) * (0.01 * 180 / Math.PI);
    this.setBoneEuler("Spine1", breath, 0, 0);
    this.setBoneEuler("Spine2", breath * 0.4, 0, 0);

    // Apply rest arms
    this.applyArmPose("right", REST_ARM_R);
    this.applyArmPose("left",  REST_ARM_L);

    // Finger micro-oscillation: ±2° around rest (10°), 4s cycle
    const fo = Math.sin(t * (Math.PI * 2) / 4) * 2;
    const idleHand: import("./sign-animations").HandPose = {
      thumb:  { metacarpal: [10 + fo, 0, 0], proximal: [10 + fo, 0, 0], distal: [10 + fo, 0, 0] },
      index:  { metacarpal: [10 + fo, 0, 0], proximal: [10 + fo, 0, 0], distal: [10 + fo, 0, 0] },
      middle: { metacarpal: [10 + fo, 0, 0], proximal: [10 + fo, 0, 0], distal: [10 + fo, 0, 0] },
      ring:   { metacarpal: [10 + fo, 0, 0], proximal: [10 + fo, 0, 0], distal: [10 + fo, 0, 0] },
      pinky:  { metacarpal: [10 + fo, 0, 0], proximal: [10 + fo, 0, 0], distal: [10 + fo, 0, 0] },
    };
    this.applyHandPose("right", idleHand);
    this.applyHandPose("left",  idleHand);
  }

  // ── Blink ──────────────────────────────────────────────────────────────────

  private tickBlink(t: number): void {
    if (!this.blinkTarget) return;
    if (!this.isBlinking && t > this.nextBlink) {
      this.isBlinking = true;
      this.blinkStart = t;
      this.nextBlink  = t + 3 + Math.random() * 4;
    }
    if (this.isBlinking) {
      const bt    = t - this.blinkStart;
      const half  = 0.06;
      const val   = bt < half ? bt / half : Math.max(0, 1 - (bt - half) / half);
      const { mesh, leftIdx, rightIdx } = this.blinkTarget;
      if (mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences[leftIdx]  = val;
        mesh.morphTargetInfluences[rightIdx] = val;
      }
      if (bt > half * 2) this.isBlinking = false;
    }
  }

  // ── Sign animation ─────────────────────────────────────────────────────────

  private tickAnim(t: number): void {
    const anim     = this.playingAnim!;
    const elapsed  = (t - this.animStart) * 1000 * this.speedMult;
    const progress = Math.min(elapsed / anim.duration, 1);

    const frame = interpolateFrame(this.filledFrames, progress);
    this.applyFrame(frame);

    if (progress >= 1) this.finishAnim();
  }

  private finishAnim(): void {
    // Snapshot current arm pose for smooth return
    const snapArm = (side: "right" | "left"): ArmPose => {
      const ab = ARM_BONES[side];
      const getBoneEuler = (name: string): [number,number,number] => {
        const bone = this.getBone(name);
        const rest = this.restPose.get(bone?.name ?? name);
        if (!bone || !rest) return [0,0,0];
        // Compute delta from rest
        const delta = rest.clone().invert().multiply(bone.quaternion);
        const e = new THREE.Euler().setFromQuaternion(delta);
        return [e.x / DEG, e.y / DEG, e.z / DEG];
      };
      return {
        shoulder: getBoneEuler(ab.shoulder),
        upperArm: getBoneEuler(ab.upperArm),
        forearm:  getBoneEuler(ab.forearm),
        hand:     getBoneEuler(ab.hand),
      };
    };

    this.returnFromR = { arm: snapArm("right"), hand: NATURAL_HAND };
    this.returnFromL = { arm: snapArm("left"),  hand: NATURAL_HAND };

    this.playingAnim  = null;
    this.isReturning  = true;
    this.returnStart  = this.clock.getElapsedTime();
    this.returnDurSec = 0.5 / this.speedMult;

    this.onSignEnd?.();

    const next = this.queue.shift();
    if (next) setTimeout(() => { next.resolve(); this.startAnim(next.id); }, 120);
  }

  private tickReturn(t: number): void {
    if (!this.returnFromR) { this.isReturning = false; return; }
    const p  = Math.min((t - this.returnStart) / this.returnDurSec, 1);
    const et = easeInOut(p);

    const rArm  = lerpArmPose(this.returnFromR.arm,  REST_ARM_R, et);
    const lArm  = lerpArmPose(this.returnFromL!.arm, REST_ARM_L, et);
    const rHand = lerpHandPose(this.returnFromR.hand, NATURAL_HAND, et);
    const lHand = lerpHandPose(this.returnFromL!.hand, NATURAL_HAND, et);

    this.applyArmPose("right", rArm);
    this.applyArmPose("left",  lArm);
    this.applyHandPose("right", rHand);
    this.applyHandPose("left",  lHand);

    if (p >= 1) {
      this.isReturning = false;
      this.returnFromR = null;
      this.returnFromL = null;
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  playSign(signId: string): Promise<void> {
    const anim = getSignAnimation(signId, this.signLanguage);
    if (!anim) return Promise.resolve();

    return new Promise<void>((resolve) => {
      if (this.playingAnim || this.isReturning) {
        this.queue.push({ id: signId, resolve });
      } else {
        resolve();
        this.startAnim(signId);
      }
    });
  }

  async playSequence(signIds: string[]): Promise<void> {
    for (const id of signIds) {
      await this.playSign(id);
      await new Promise<void>((r) => setTimeout(r, 150));
    }
  }

  /** Fingerspell a word letter by letter (80 ms gap between letters). */
  async fingerspell(word: string, onLetter?: (letterIdx: number) => void): Promise<void> {
    const prefix  = LETTER_PREFIX[this.signLanguage];
    const letters = word.toLowerCase().split("").filter((c) => /[a-záéíóúüñ]/.test(c));
    for (let j = 0; j < letters.length; j++) {
      const id = `${prefix}${letters[j]}`;
      if (getSignAnimation(id, this.signLanguage)) {
        onLetter?.(j);
        await this.playSign(id);
        if (j < letters.length - 1) {
          await new Promise<void>((r) => setTimeout(r, 80));
        }
      }
    }
  }

  setSignLanguage(lang: SignLanguageCode): void {
    this.signLanguage = lang;
  }

  /**
   * Play a mixed sequence of sign items and spell items.
   * onProgress(itemIdx, item, letterIdx?) is called at the start of each sign
   * and at the start of each letter within a spell item.
   */
  async playMixedSequence(
    items: SignSequenceItem[],
    onProgress?: (index: number, item: SignSequenceItem, letterIndex?: number) => void,
  ): Promise<void> {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type === "sign") {
        onProgress?.(i, item);
        await this.playSign(item.id);
        await new Promise<void>((r) => setTimeout(r, 150));
      } else {
        await this.fingerspell(item.word, (j) => onProgress?.(i, item, j));
        await new Promise<void>((r) => setTimeout(r, 200));
      }
      if (i < items.length - 1) {
        await new Promise<void>((r) => setTimeout(r, 300));
      }
    }
  }

  private startAnim(signId: string): void {
    const anim = getSignAnimation(signId, this.signLanguage);
    if (!anim) return;
    this.isReturning  = false;
    this.playingAnim  = anim;
    this.filledFrames = fillKeyframes(anim.keyframes);
    this.animStart    = this.clock.getElapsedTime();
    this.onSignStart?.(anim.name);
  }

  /** Immediately snap both arms to the natural resting position. */
  setRestPose(): void {
    this.applyArmPose("right", REST_ARM_R);
    this.applyArmPose("left",  REST_ARM_L);
    this.applyHandPose("right", NATURAL_HAND);
    this.applyHandPose("left",  NATURAL_HAND);
  }

  /**
   * Apply a static pose and freeze idle animation.
   * All pose fields are optional — omitted sides keep their current transform.
   */
  setStaticPose(pose: {
    rightArm?:  ArmPose  | undefined;
    leftArm?:   ArmPose  | undefined;
    rightHand?: HandPose | undefined;
    leftHand?:  HandPose | undefined;
  }): void {
    // Stop any playing animation
    this.playingAnim = null;
    this.isReturning = false;
    this.queue       = [];

    this.staticPoseActive = true;

    if (pose.rightArm)  this.applyArmPose("right",  pose.rightArm);
    if (pose.leftArm)   this.applyArmPose("left",   pose.leftArm);
    if (pose.rightHand) this.applyHandPose("right", pose.rightHand);
    if (pose.leftHand)  this.applyHandPose("left",  pose.leftHand);
  }

  /** Release the static pose lock and resume idle animation. */
  clearStaticPose(): void {
    this.staticPoseActive = false;
  }

  setSkinTone(tone: "light" | "medium" | "dark"): void {
    this.applySkinTint(tone);
  }

  private applySkinTint(tone: "light" | "medium" | "dark"): void {
    const tints = {
      light:  new THREE.Color(1.10, 1.05, 1.00),
      medium: new THREE.Color(1.00, 1.00, 1.00),
      dark:   new THREE.Color(0.70, 0.55, 0.45),
    };
    this.skinTint.copy(tints[tone]);
    this.scene.traverse((node) => {
      const mesh = node as THREE.SkinnedMesh;
      if (mesh.isSkinnedMesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat?.map) {
          mat.color.copy(this.skinTint);
          mat.needsUpdate = true;
        }
      }
    });
  }

  setSpeed(mult: number): void {
    this.speedMult = Math.max(0.3, Math.min(3, mult));
  }

  isPlayingSign(): boolean {
    return this.playingAnim !== null;
  }

  getCurrentSign(): string | null {
    return this.playingAnim?.id ?? null;
  }

  dispose(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.controls.dispose();
    this.renderer.dispose();
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.geometry?.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else (mat as THREE.Material)?.dispose();
      }
    });
  }

  static getSigns(): SignAnimation[] {
    return SIGN_ANIMATIONS;
  }
}
