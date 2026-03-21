"use client";

/**
 * src/app/test/avatar-calibrate/page.tsx
 *
 * Side-by-side calibration tool:
 *   LEFT  — debug scene: applies rotations via debug page's exact approach
 *           (tries bone names in order from ARM_BONE_DEFS)
 *   RIGHT — engine scene: applies rotations via avatar-engine.ts's exact approach
 *           (ARM_BONES canonical name → getBone → BONE_ALIASES → setBoneEuler)
 *
 * If both scenes look IDENTICAL → engine math is correct.
 * Diagnostic panel shows per-bone quaternion comparison.
 */

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Constants (must mirror avatar-debug and avatar-engine exactly) ────────────

const DEG = Math.PI / 180;

// Debug page ARM_BONE_DEFS (same order/names)
const ARM_DEFS = [
  { key: "rightShoulder", label: "R. Shoulder (Clavicle)", names: ["RightShoulder", "mixamorigRightShoulder", "Bip01_R_Clavicle"] as string[] },
  { key: "rightArm",      label: "R. Upper Arm",           names: ["RightArm",      "mixamorigRightArm",      "Bip01_R_UpperArm"] as string[] },
  { key: "rightForeArm",  label: "R. Forearm",             names: ["RightForeArm",  "mixamorigRightForeArm",  "Bip01_R_Forearm"] as string[] },
  { key: "rightHand",     label: "R. Wrist",               names: ["RightHand",     "mixamorigRightHand",     "Bip01_R_Hand"] as string[] },
  { key: "leftShoulder",  label: "L. Shoulder (Clavicle)", names: ["LeftShoulder",  "mixamorigLeftShoulder",  "Bip01_L_Clavicle"] as string[] },
  { key: "leftArm",       label: "L. Upper Arm",           names: ["LeftArm",       "mixamorigLeftArm",       "Bip01_L_UpperArm"] as string[] },
  { key: "leftForeArm",   label: "L. Forearm",             names: ["LeftForeArm",   "mixamorigLeftForeArm",   "Bip01_L_Forearm"] as string[] },
  { key: "leftHand",      label: "L. Wrist",               names: ["LeftHand",      "mixamorigLeftHand",      "Bip01_L_Hand"] as string[] },
];

const FINGER_DEFS = [
  { key: "thumb",  label: "Thumb",  names: ["RightHandThumb1",  "RightHandThumb2",  "RightHandThumb3"]  as string[] },
  { key: "index",  label: "Index",  names: ["RightHandIndex1",  "RightHandIndex2",  "RightHandIndex3"]  as string[] },
  { key: "middle", label: "Middle", names: ["RightHandMiddle1", "RightHandMiddle2", "RightHandMiddle3"] as string[] },
  { key: "ring",   label: "Ring",   names: ["RightHandRing1",   "RightHandRing2",   "RightHandRing3"]   as string[] },
  { key: "pinky",  label: "Pinky",  names: ["RightHandPinky1",  "RightHandPinky2",  "RightHandPinky3"]  as string[] },
];

// Engine ARM_BONES (avatar-engine.ts)
const ENGINE_ARM: Record<"right" | "left", Record<"shoulder"|"forearm"|"hand", string>> = {
  right: { shoulder: "RightShoulder", forearm: "RightForeArm", hand: "RightHand" },
  left:  { shoulder: "LeftShoulder",  forearm: "LeftForeArm",  hand: "LeftHand"  },
};

// Engine BONE_ALIASES (avatar-engine.ts)
const ENGINE_ALIASES: Record<string, string[]> = {
  RightShoulder: ["mixamorigRightShoulder", "Bip01_R_Clavicle"],
  RightArm:      ["mixamorigRightArm",      "Bip01_R_UpperArm"],
  RightForeArm:  ["mixamorigRightForeArm",  "Bip01_R_Forearm"],
  RightHand:     ["mixamorigRightHand",     "Bip01_R_Hand"],
  LeftShoulder:  ["mixamorigLeftShoulder",  "Bip01_L_Clavicle"],
  LeftArm:       ["mixamorigLeftArm",       "Bip01_L_UpperArm"],
  LeftForeArm:   ["mixamorigLeftForeArm",   "Bip01_L_Forearm"],
  LeftHand:      ["mixamorigLeftHand",      "Bip01_L_Hand"],
};

// Slider key → engine canonical bone name
const SLIDER_TO_ENGINE: Record<string, string> = {
  rightShoulder: ENGINE_ARM.right.shoulder,
  rightArm:      "RightArm",
  rightForeArm:  ENGINE_ARM.right.forearm,
  rightHand:     ENGINE_ARM.right.hand,
  leftShoulder:  ENGINE_ARM.left.shoulder,
  leftArm:       "LeftArm",
  leftForeArm:   ENGINE_ARM.left.forearm,
  leftHand:      ENGINE_ARM.left.hand,
};

// Bones to show in diagnostic panel
const DIAG_BONES = [
  { label: "R.Shoulder", debNames: ["RightShoulder", "mixamorigRightShoulder"], engName: "RightShoulder" },
  { label: "R.UpperArm", debNames: ["RightArm",      "mixamorigRightArm"     ], engName: "RightArm" },
  { label: "R.ForeArm",  debNames: ["RightForeArm",  "mixamorigRightForeArm" ], engName: "RightForeArm" },
  { label: "R.Hand",     debNames: ["RightHand",     "mixamorigRightHand"    ], engName: "RightHand" },
  { label: "L.Shoulder", debNames: ["LeftShoulder",  "mixamorigLeftShoulder" ], engName: "LeftShoulder" },
  { label: "L.UpperArm", debNames: ["LeftArm",       "mixamorigLeftArm"      ], engName: "LeftArm" },
  { label: "L.ForeArm",  debNames: ["LeftForeArm",   "mixamorigLeftForeArm"  ], engName: "LeftForeArm" },
  { label: "L.Hand",     debNames: ["LeftHand",      "mixamorigLeftHand"     ], engName: "LeftHand" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type XYZ = [number, number, number];
type BoneEntry = { bone: any; restQuat: any };
type SceneState = { renderer: any; scene: any; camera: any; controls: any; bones: Map<string, BoneEntry> };
type DiagEntry = { label: string; leftQ: number[] | null; rightQ: number[] | null; match: boolean };

const initArm = (): Record<string, XYZ> =>
  Object.fromEntries(ARM_DEFS.map((d) => [d.key, [0, 0, 0] as XYZ]));
const initFinger = (): Record<string, number> =>
  Object.fromEntries(FINGER_DEFS.map((d) => [d.key, 0]));

// ─── Component ────────────────────────────────────────────────────────────────

export default function AvatarCalibratePage() {
  const leftContRef  = useRef<HTMLDivElement>(null);
  const rightContRef = useRef<HTMLDivElement>(null);
  const threeRef     = useRef<any>(null);
  const leftRef      = useRef<SceneState | null>(null);
  const rightRef     = useRef<SceneState | null>(null);
  const rafRef       = useRef<number>(0);
  const deadRef      = useRef(false);
  const liveSyncRef  = useRef(true);

  // Slider values kept in both state (for UI) and refs (for callbacks)
  const armRef    = useRef<Record<string, XYZ>>(initArm());
  const fingerRef = useRef<Record<string, number>>(initFinger());

  const [armSliders,  setArmSliders]  = useState<Record<string, XYZ>>(initArm());
  const [fingerCurls, setFingerCurls] = useState<Record<string, number>>(initFinger());
  const [liveSync,    setLiveSync]    = useState(true);
  const [leftLoaded,  setLeftLoaded]  = useState(false);
  const [rightLoaded, setRightLoaded] = useState(false);
  const [leftError,   setLeftError]   = useState<string | null>(null);
  const [rightError,  setRightError]  = useState<string | null>(null);
  const [diag,        setDiag]        = useState<DiagEntry[]>([]);
  const [copyMsg,     setCopyMsg]     = useState("");
  const [sendMsg,     setSendMsg]     = useState("");

  // ── getBone helpers ──────────────────────────────────────────────────────────

  const getDebugBone = (bones: Map<string, BoneEntry>, names: string[]): BoneEntry | undefined => {
    for (const n of names) { const e = bones.get(n); if (e) return e; }
    return undefined;
  };

  const getEngineBone = useCallback((bones: Map<string, BoneEntry>, canonicalName: string): BoneEntry | undefined => {
    const direct = bones.get(canonicalName);
    if (direct) return direct;
    const aliases = ENGINE_ALIASES[canonicalName];
    if (aliases) { for (const a of aliases) { const e = bones.get(a); if (e) return e; } }
    return undefined;
  }, []);

  // ── Apply a rotation to a bone entry ────────────────────────────────────────

  const applyEntry = useCallback((THREE: any, entry: BoneEntry | undefined, x: number, y: number, z: number) => {
    if (!entry) return;
    const delta = new THREE.Quaternion().setFromEuler(new THREE.Euler(x * DEG, y * DEG, z * DEG));
    entry.bone.quaternion.copy(entry.restQuat).multiply(delta);
  }, []);

  // ── Apply to LEFT scene (debug approach) ─────────────────────────────────────

  const applyArmLeft = useCallback((key: string, vals: XYZ) => {
    const THREE = threeRef.current;
    const s = leftRef.current;
    if (!THREE || !s) return;
    const def = ARM_DEFS.find((d) => d.key === key);
    if (!def) return;
    applyEntry(THREE, getDebugBone(s.bones, def.names), vals[0], vals[1], vals[2]);
  }, [applyEntry]);

  const applyFingerLeft = useCallback((key: string, curl: number) => {
    const THREE = threeRef.current;
    const s = leftRef.current;
    if (!THREE || !s) return;
    const def = FINGER_DEFS.find((d) => d.key === key);
    if (!def) return;
    def.names.forEach((n) => applyEntry(THREE, s.bones.get(n), curl, 0, 0));
  }, [applyEntry]);

  // ── Apply to RIGHT scene (engine approach) ───────────────────────────────────

  const applyArmRight = useCallback((key: string, vals: XYZ) => {
    const THREE = threeRef.current;
    const s = rightRef.current;
    if (!THREE || !s) return;
    const canonicalName = SLIDER_TO_ENGINE[key];
    if (!canonicalName) return;
    applyEntry(THREE, getEngineBone(s.bones, canonicalName), vals[0], vals[1], vals[2]);
  }, [applyEntry, getEngineBone]);

  const applyFingerRight = useCallback((key: string, curl: number) => {
    const THREE = threeRef.current;
    const s = rightRef.current;
    if (!THREE || !s) return;
    const def = FINGER_DEFS.find((d) => d.key === key);
    if (!def) return;
    // Engine approach: apply to each bone via getEngineBone
    def.names.forEach((n) => applyEntry(THREE, getEngineBone(s.bones, n), curl, 0, 0));
  }, [applyEntry, getEngineBone]);

  // ── Diagnostic ───────────────────────────────────────────────────────────────

  const updateDiag = useCallback(() => {
    const lS = leftRef.current;
    const rS = rightRef.current;
    if (!lS || !rS) return;

    const entries: DiagEntry[] = DIAG_BONES.map(({ label, debNames, engName }) => {
      const lEntry = getDebugBone(lS.bones, debNames);
      const rEntry = getEngineBone(rS.bones, engName);

      const fmt = (q: any): number[] | null =>
        q ? [q.w, q.x, q.y, q.z].map((v: number) => Math.round(v * 10000) / 10000) : null;

      const lq = fmt(lEntry?.bone?.quaternion);
      const rq = fmt(rEntry?.bone?.quaternion);

      const match = !!lq && !!rq &&
        lq.every((v, i) => Math.abs(v - (rq[i] ?? 0)) < 0.005);

      return { label, leftQ: lq, rightQ: rq, match };
    });

    setDiag(entries);
  }, [getEngineBone]);

  // ── Slider handlers ──────────────────────────────────────────────────────────

  const handleArm = useCallback((key: string, axis: 0 | 1 | 2, val: number) => {
    const next = { ...armRef.current, [key]: [...armRef.current[key]] as XYZ };
    next[key][axis] = val;
    armRef.current = next;
    setArmSliders({ ...next });
    applyArmLeft(key, next[key]);
    if (liveSyncRef.current) applyArmRight(key, next[key]);
    setTimeout(updateDiag, 0);
  }, [applyArmLeft, applyArmRight, updateDiag]);

  const handleFinger = useCallback((key: string, val: number) => {
    const next = { ...fingerRef.current, [key]: val };
    fingerRef.current = next;
    setFingerCurls({ ...next });
    applyFingerLeft(key, val);
    if (liveSyncRef.current) applyFingerRight(key, val);
    setTimeout(updateDiag, 0);
  }, [applyFingerLeft, applyFingerRight, updateDiag]);

  // ── SYNC button (manual sync all sliders to right scene) ─────────────────────

  const handleSync = useCallback(() => {
    ARM_DEFS.forEach((d) => applyArmRight(d.key, armRef.current[d.key]));
    FINGER_DEFS.forEach((d) => applyFingerRight(d.key, fingerRef.current[d.key]));
    setTimeout(updateDiag, 0);
  }, [applyArmRight, applyFingerRight, updateDiag]);

  // ── RESET ────────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    const freshArm = initArm();
    const freshFinger = initFinger();
    armRef.current = freshArm;
    fingerRef.current = freshFinger;
    setArmSliders(freshArm);
    setFingerCurls(freshFinger);
    ARM_DEFS.forEach((d) => { applyArmLeft(d.key, [0,0,0]); if (liveSyncRef.current) applyArmRight(d.key, [0,0,0]); });
    FINGER_DEFS.forEach((d) => { applyFingerLeft(d.key, 0); if (liveSyncRef.current) applyFingerRight(d.key, 0); });
    setTimeout(updateDiag, 0);
  }, [applyArmLeft, applyArmRight, applyFingerLeft, applyFingerRight, updateDiag]);

  // ── COPY POSE ────────────────────────────────────────────────────────────────

  const handleCopyPose = useCallback(() => {
    const s = armRef.current;
    const f = fingerRef.current;
    const pose = {
      rightArm: { shoulder: s.rightShoulder, upperArm: s.rightArm, forearm: s.rightForeArm, hand: s.rightHand },
      leftArm:  { shoulder: s.leftShoulder,  upperArm: s.leftArm,  forearm: s.leftForeArm,  hand: s.leftHand  },
      rightFingers: f,
    };
    navigator.clipboard.writeText(JSON.stringify(pose, null, 2)).then(() => {
      setCopyMsg("✓ Copied!"); setTimeout(() => setCopyMsg(""), 2000);
    });
  }, []);

  // ── SEND TO AVATAR (localStorage) ────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const s = armRef.current;
    const f = fingerRef.current;
    const pose = {
      rightArm: { shoulder: s.rightShoulder, upperArm: s.rightArm, forearm: s.rightForeArm, hand: s.rightHand },
      leftArm:  { shoulder: s.leftShoulder,  upperArm: s.leftArm,  forearm: s.leftForeArm,  hand: s.leftHand  },
      rightFingers: f,
    };
    localStorage.setItem("signbridge-debug-pose", JSON.stringify(pose, null, 2));
    setSendMsg("✓ Sent!"); setTimeout(() => setSendMsg(""), 2000);
  }, []);

  // ── LOAD FROM DEBUG ───────────────────────────────────────────────────────────

  const handleLoadFromDebug = useCallback(() => {
    try {
      const raw = localStorage.getItem("signbridge-debug-pose");
      if (!raw) return;
      const pose = JSON.parse(raw);
      const updateBone = (key: string, vals: XYZ) => {
        armRef.current = { ...armRef.current, [key]: vals };
        setArmSliders((p) => ({ ...p, [key]: vals }));
        applyArmLeft(key, vals);
        if (liveSyncRef.current) applyArmRight(key, vals);
      };
      if (pose.rightArm) {
        updateBone("rightShoulder", pose.rightArm.shoulder);
        updateBone("rightForeArm",  pose.rightArm.forearm);
        updateBone("rightHand",     pose.rightArm.hand);
      }
      if (pose.leftArm) {
        updateBone("leftShoulder", pose.leftArm.shoulder);
        updateBone("leftForeArm",  pose.leftArm.forearm);
        updateBone("leftHand",     pose.leftArm.hand);
      }
      if (pose.rightFingers) {
        Object.entries(pose.rightFingers).forEach(([k, v]) => {
          fingerRef.current = { ...fingerRef.current, [k]: v as number };
          setFingerCurls((p) => ({ ...p, [k]: v as number }));
          applyFingerLeft(k, v as number);
          if (liveSyncRef.current) applyFingerRight(k, v as number);
        });
      }
      setTimeout(updateDiag, 0);
    } catch (e) { console.error("Failed to load from debug:", e); }
  }, [applyArmLeft, applyArmRight, applyFingerLeft, applyFingerRight, updateDiag]);

  // ── Three.js setup ────────────────────────────────────────────────────────────

  useEffect(() => {
    const leftCont  = leftContRef.current;
    const rightCont = rightContRef.current;
    if (!leftCont || !rightCont) return;
    deadRef.current = false;

    (async () => {
      const THREE = await import("three");
      const { GLTFLoader }    = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      if (deadRef.current) return;
      threeRef.current = THREE;

      function buildScene(cont: HTMLDivElement, label: string, onLoad: (bones: Map<string, BoneEntry>) => void, onError: (msg: string) => void): SceneState {
        const canvas = document.createElement("canvas");
        canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
        cont.appendChild(canvas);

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(cont.clientWidth, cont.clientHeight);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(40, cont.clientWidth / cont.clientHeight, 0.1, 50);
        camera.position.set(0, 1.4, 1.5);
        camera.lookAt(0, 1.2, 0);

        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const key = new THREE.DirectionalLight(0xffffff, 1.0);
        key.position.set(3, 5, 4);
        scene.add(key);
        scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.4));

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan     = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.minDistance   = 0.8;
        controls.maxDistance   = 2.5;
        controls.target.set(0, 1.2, 0);
        controls.update();

        new ResizeObserver(() => {
          const w = cont.clientWidth, h = cont.clientHeight;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        }).observe(cont);

        const bones: Map<string, BoneEntry> = new Map();
        const loader = new GLTFLoader();
        loader.load(
          "/models/avatar/avatar.glb",
          (gltf: any) => {
            if (deadRef.current) return;
            const model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            model.position.sub(box.getCenter(new THREE.Vector3()));
            model.position.y = 0;
            scene.add(model);
            model.traverse((node: any) => {
              if (node.isBone) bones.set(node.name, { bone: node, restQuat: node.quaternion.clone() });
            });
            console.log(`[calibrate:${label}] Bones: ${bones.size}`, [...bones.keys()]);
            onLoad(bones);
          },
          undefined,
          (err: any) => { console.error(`[calibrate:${label}]`, err); onError("Could not load avatar.glb"); }
        );

        return { renderer, scene, camera, controls, bones };
      }

      const leftScene = buildScene(
        leftCont, "debug",
        (bones) => { leftRef.current!.bones = bones; setLeftLoaded(true); setTimeout(updateDiag, 100); },
        (msg) => setLeftError(msg)
      );
      leftRef.current = leftScene;

      const rightScene = buildScene(
        rightCont, "engine",
        (bones) => { rightRef.current!.bones = bones; setRightLoaded(true); setTimeout(updateDiag, 100); },
        (msg) => setRightError(msg)
      );
      rightRef.current = rightScene;

      function animate() {
        if (deadRef.current) return;
        rafRef.current = requestAnimationFrame(animate);
        leftScene.controls.update();
        rightScene.controls.update();
        leftScene.renderer.render(leftScene.scene, leftScene.camera);
        rightScene.renderer.render(rightScene.scene, rightScene.camera);
      }
      animate();
    })();

    return () => {
      deadRef.current = true;
      cancelAnimationFrame(rafRef.current);
      leftRef.current?.renderer.dispose();
      rightRef.current?.renderer.dispose();
      leftContRef.current?.querySelector("canvas")?.remove();
      rightContRef.current?.querySelector("canvas")?.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────────

  const canvasLabel = (text: string, color: string, loaded: boolean, error: string | null) => (
    <div style={{
      position: "absolute", top: 8, left: 8, zIndex: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
      color, background: "rgba(0,0,0,0.5)", borderRadius: 6,
      padding: "3px 8px", border: `1px solid ${color}44`,
    }}>
      {text} {error ? "❌" : loaded ? "✅" : "⏳"}
    </div>
  );

  const allLoaded = leftLoaded && rightLoaded;
  const allMatch  = diag.length > 0 && diag.every((d) => d.match);

  return (
    <main style={{
      display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden",
      background: "linear-gradient(135deg,#09090f 0%,#0d1117 100%)", color: "#fff",
      fontFamily: "system-ui,sans-serif",
    }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "6px 12px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 18 }}>⚖️</span>
        <div>
          <h1 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#67e8f9" }}>
            Avatar Calibrate — Side-by-Side Comparison
          </h1>
          <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
            LEFT = debug approach (direct bone names) &nbsp;|&nbsp; RIGHT = engine approach (ARM_BONES + aliases)
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, fontSize: 11 }}>
          <a href="/test/avatar-debug" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>🦴 Debug</a>
          <a href="/test/avatar" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Live Avatar</a>
          <a href="/" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Home</a>
        </div>
      </div>

      {/* ── Canvas area ── */}
      <div style={{ display: "flex", flex: "0 0 52vh", minHeight: 0 }}>
        {/* Left — Debug */}
        <div style={{ flex: 1, position: "relative", borderRight: "2px solid #06b6d4" }}>
          <div
            ref={leftContRef}
            style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 80%,#1e293b,#0f172a)" }}
          />
          {canvasLabel("DEBUG (direct bones)", "#06b6d4", leftLoaded, leftError)}
          {leftError && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#f87171", zIndex: 10 }}>
              {leftError}
            </div>
          )}
        </div>

        {/* Right — Engine */}
        <div style={{ flex: 1, position: "relative" }}>
          <div
            ref={rightContRef}
            style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 80%,#1e2940,#0f172a)" }}
          />
          {canvasLabel("ENGINE (ARM_BONES + aliases)", "#a78bfa", rightLoaded, rightError)}
          {rightError && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#f87171", zIndex: 10 }}>
              {rightError}
            </div>
          )}
          {/* Overall match badge */}
          {allLoaded && (
            <div style={{
              position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", zIndex: 20,
              fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 9999,
              background: allMatch ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)",
              border: `1px solid ${allMatch ? "#34d399" : "#f87171"}`,
              color: allMatch ? "#34d399" : "#f87171",
            }}>
              {allMatch ? "✅ ALL BONES MATCH" : "❌ MISMATCH DETECTED"}
            </div>
          )}
        </div>
      </div>

      {/* ── Controls + Diagnostic ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.07)" }}>

        {/* Left: sliders */}
        <div style={{
          width: "55%", overflowY: "auto", padding: "8px 10px",
          borderRight: "1px solid rgba(255,255,255,0.07)",
        }}>
          {/* Action buttons */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {[
              { label: "RESET",                    onClick: handleReset,    color: "#7c3aed" },
              { label: liveSync ? "🔴 LIVE SYNC" : "LIVE SYNC OFF", onClick: () => { const n = !liveSync; setLiveSync(n); liveSyncRef.current = n; }, color: liveSync ? "#06b6d4" : "#475569" },
              { label: "SYNC NOW",                 onClick: handleSync,     color: "#0891b2" },
              { label: copyMsg || "COPY POSE",     onClick: handleCopyPose, color: "#059669" },
              { label: sendMsg || "SEND TO AVATAR",onClick: handleSend,     color: "#d97706" },
              { label: "LOAD FROM DEBUG",          onClick: handleLoadFromDebug, color: "#64748b" },
            ].map(({ label, onClick, color }) => (
              <button key={label} onClick={onClick} style={{
                padding: "5px 8px", borderRadius: 6, border: `1px solid ${color}55`,
                background: `${color}22`, color, fontSize: 10, fontWeight: 700,
                letterSpacing: "0.05em", cursor: "pointer",
              }}>
                {label}
              </button>
            ))}
          </div>

          {/* Arm sliders */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            {ARM_DEFS.map((def) => (
              <div key={def.key} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>
                  {def.label}
                </div>
                {(["X", "Y", "Z"] as const).map((ax, ai) => (
                  <div key={ax} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                    <span style={{ width: 12, fontSize: 10, color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>{ax}</span>
                    <input
                      type="range" min={-180} max={180} step={1}
                      value={armSliders[def.key]?.[ai] ?? 0}
                      onChange={(e) => handleArm(def.key, ai as 0|1|2, Number(e.target.value))}
                      style={{ flex: 1, accentColor: "#06b6d4", cursor: "pointer" }}
                    />
                    <span style={{ width: 34, fontSize: 10, fontFamily: "monospace", textAlign: "right", color: (armSliders[def.key]?.[ai] ?? 0) !== 0 ? "#67e8f9" : "rgba(255,255,255,0.2)" }}>
                      {(armSliders[def.key]?.[ai] ?? 0) > 0 ? "+" : ""}{armSliders[def.key]?.[ai] ?? 0}°
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Finger sliders */}
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>
              Right Hand Fingers (0° = open · 90° = closed)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
              {FINGER_DEFS.map((def) => (
                <div key={def.key} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 36, fontSize: 10, color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>{def.label}</span>
                    <input
                      type="range" min={0} max={90} step={1}
                      value={fingerCurls[def.key] ?? 0}
                      onChange={(e) => handleFinger(def.key, Number(e.target.value))}
                      style={{ flex: 1, accentColor: "#f59e0b", cursor: "pointer" }}
                    />
                    <span style={{ width: 26, fontSize: 10, fontFamily: "monospace", textAlign: "right", color: (fingerCurls[def.key] ?? 0) > 0 ? "#f59e0b" : "rgba(255,255,255,0.2)" }}>
                      {fingerCurls[def.key] ?? 0}°
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: diagnostic */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>
            Bone Quaternion Diagnostic
          </div>
          {diag.length === 0 ? (
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
              {allLoaded ? "Move a slider to see comparison." : "Loading models…"}
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
              <thead>
                <tr style={{ color: "rgba(255,255,255,0.3)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th style={{ textAlign: "left", padding: "2px 4px", fontWeight: 600 }}>Bone</th>
                  <th style={{ textAlign: "left", padding: "2px 4px", fontWeight: 600, color: "#06b6d4" }}>Debug (L)</th>
                  <th style={{ textAlign: "left", padding: "2px 4px", fontWeight: 600, color: "#a78bfa" }}>Engine (R)</th>
                  <th style={{ padding: "2px 4px", fontWeight: 600 }}>Match</th>
                </tr>
              </thead>
              <tbody>
                {diag.map((d) => (
                  <tr key={d.label} style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: d.match ? "transparent" : "rgba(248,113,113,0.04)",
                  }}>
                    <td style={{ padding: "3px 4px", fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>{d.label}</td>
                    <td style={{ padding: "3px 4px", fontFamily: "monospace", color: "#06b6d4", fontSize: 9 }}>
                      {d.leftQ ? `w:${d.leftQ[0]} x:${d.leftQ[1]} y:${d.leftQ[2]} z:${d.leftQ[3]}` : "—"}
                    </td>
                    <td style={{ padding: "3px 4px", fontFamily: "monospace", color: "#a78bfa", fontSize: 9 }}>
                      {d.rightQ ? `w:${d.rightQ[0]} x:${d.rightQ[1]} y:${d.rightQ[2]} z:${d.rightQ[3]}` : "—"}
                    </td>
                    <td style={{ padding: "3px 4px", textAlign: "center", fontSize: 13 }}>
                      {d.match ? "✅" : (d.leftQ && d.rightQ ? "❌" : "—")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Instructions */}
          <div style={{ marginTop: 12, padding: "8px", borderRadius: 8, background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.1)", fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.7 }}>
            <strong style={{ color: "rgba(103,232,249,0.6)" }}>How to use:</strong><br/>
            1. Move sliders — LEFT updates immediately, RIGHT updates if LIVE SYNC is on<br/>
            2. If both avatars look identical → engine math is correct ✅<br/>
            3. If they look different → check diagnostic for mismatched quaternions ❌<br/>
            4. COPY POSE → paste values into sign-animations.ts keyframes<br/>
            5. SEND TO AVATAR → saves to localStorage for /test/avatar calibration panel
          </div>
        </div>
      </div>
    </main>
  );
}
