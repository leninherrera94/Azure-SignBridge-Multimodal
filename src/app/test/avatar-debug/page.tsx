"use client";

/**
 * src/app/test/avatar-debug/page.tsx
 *
 * Live bone-manipulation debug tool for the Avaturn GLB.
 * Sliders apply DELTA rotations relative to each bone's T-pose quaternion.
 * Use COPY POSE to export values ready to paste into sign-animations.ts.
 *
 * http://localhost:3000/test/avatar-debug
 */

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Bone definitions ─────────────────────────────────────────────────────────

const ARM_BONE_DEFS = [
  { key: "rightShoulder", label: "R. Shoulder (Clavicle)", names: ["RightShoulder", "mixamorigRightShoulder", "Bip01_R_Clavicle"] },
  { key: "rightArm",      label: "R. Upper Arm",           names: ["RightArm",      "mixamorigRightArm",      "Bip01_R_UpperArm"] },
  { key: "rightForeArm",  label: "R. Forearm",             names: ["RightForeArm",  "mixamorigRightForeArm",  "Bip01_R_Forearm"] },
  { key: "rightHand",     label: "R. Hand/Wrist",          names: ["RightHand",     "mixamorigRightHand",     "Bip01_R_Hand"] },
  { key: "leftShoulder",  label: "L. Shoulder (Clavicle)", names: ["LeftShoulder",  "mixamorigLeftShoulder",  "Bip01_L_Clavicle"] },
  { key: "leftArm",       label: "L. Upper Arm",           names: ["LeftArm",       "mixamorigLeftArm",       "Bip01_L_UpperArm"] },
  { key: "leftForeArm",   label: "L. Forearm",             names: ["LeftForeArm",   "mixamorigLeftForeArm",   "Bip01_L_Forearm"] },
  { key: "leftHand",      label: "L. Hand/Wrist",          names: ["LeftHand",      "mixamorigLeftHand",      "Bip01_L_Hand"] },
] as const;

const FINGER_DEFS = [
  { key: "thumb",  label: "Thumb",  names: ["RightHandThumb1",  "RightHandThumb2",  "RightHandThumb3"] },
  { key: "index",  label: "Index",  names: ["RightHandIndex1",  "RightHandIndex2",  "RightHandIndex3"] },
  { key: "middle", label: "Middle", names: ["RightHandMiddle1", "RightHandMiddle2", "RightHandMiddle3"] },
  { key: "ring",   label: "Ring",   names: ["RightHandRing1",   "RightHandRing2",   "RightHandRing3"] },
  { key: "pinky",  label: "Pinky",  names: ["RightHandPinky1",  "RightHandPinky2",  "RightHandPinky3"] },
] as const;

type ArmKey    = typeof ARM_BONE_DEFS[number]["key"];
type FingerKey = typeof FINGER_DEFS[number]["key"];
type XYZ       = { x: number; y: number; z: number };

const DEF_XYZ: XYZ = { x: 0, y: 0, z: 0 };
const DEFAULT_ARM_SLIDERS: Record<ArmKey, XYZ> = Object.fromEntries(
  ARM_BONE_DEFS.map((d) => [d.key, { ...DEF_XYZ }])
) as Record<ArmKey, XYZ>;
const DEFAULT_FINGER_CURLS: Record<FingerKey, number> = Object.fromEntries(
  FINGER_DEFS.map((d) => [d.key, 0])
) as Record<FingerKey, number>;

// ─── Small sub-components ─────────────────────────────────────────────────────

function SliderRow({
  label,
  value,
  min = -180,
  max = 180,
  onChange,
  onReset,
  color = "#06b6d4",
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  onReset: () => void;
  color?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
      <span style={{ width: 22, fontSize: 11, color: "rgba(255,255,255,0.45)", flexShrink: 0 }}>
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: color, cursor: "pointer" }}
      />
      <span
        style={{
          width: 36,
          textAlign: "right",
          fontSize: 11,
          fontFamily: "monospace",
          color: Math.abs(value) > 0.5 ? color : "rgba(255,255,255,0.25)",
        }}
      >
        {value > 0 ? "+" : ""}{value}°
      </span>
      <button
        onClick={onReset}
        title="Reset to 0"
        style={{
          width: 16,
          height: 16,
          borderRadius: 3,
          border: "none",
          background: "rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.4)",
          fontSize: 10,
          cursor: "pointer",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

function Section({
  title,
  accent = "#06b6d4",
  defaultOpen = true,
  children,
}: {
  title: string;
  accent?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 8, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "6px 10px",
          background: "rgba(255,255,255,0.04)",
          border: "none",
          color: "rgba(255,255,255,0.65)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: accent }}>{title}</span>
        <span style={{ opacity: 0.4 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding: "8px 10px", background: "rgba(0,0,0,0.15)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Bone hierarchy tree ──────────────────────────────────────────────────────

interface BoneNode { name: string; children: BoneNode[] }

function BoneTree({ node, depth = 0 }: { node: BoneNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 3);
  const hasChildren = node.children.length > 0;
  return (
    <div style={{ marginLeft: depth * 10 }}>
      <div
        onClick={() => hasChildren && setOpen((p) => !p)}
        style={{
          fontSize: 10,
          fontFamily: "monospace",
          color: depth === 0 ? "#67e8f9" : "rgba(255,255,255,0.55)",
          cursor: hasChildren ? "pointer" : "default",
          padding: "1px 0",
          whiteSpace: "nowrap",
        }}
      >
        {hasChildren ? (open ? "▾ " : "▸ ") : "  "}
        {node.name}
      </div>
      {open && node.children.map((c) => (
        <BoneTree key={c.name} node={c} depth={depth + 1} />
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AvatarDebugPage() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Refs for Three.js objects (avoid re-renders on 3D state changes)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const threeRef    = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bonesRef    = useRef<Map<string, any>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rendererRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const animIdRef   = useRef<number>(0);
  const deadRef     = useRef(false);

  // UI state
  const [loaded,       setLoaded]       = useState(false);
  const [loadPct,      setLoadPct]      = useState(0);
  const [error,        setError]        = useState<string | null>(null);
  const [boneTree,     setBoneTree]     = useState<BoneNode[]>([]);
  const [allBoneNames, setAllBoneNames] = useState<string[]>([]);
  const [foundBones,   setFoundBones]   = useState<Record<string, string>>({});
  const [copyMsg,      setCopyMsg]      = useState("");
  const [sendMsg,      setSendMsg]      = useState("");

  const [armSliders,   setArmSliders]   = useState<Record<ArmKey, XYZ>>(DEFAULT_ARM_SLIDERS);
  const [fingerCurls,  setFingerCurls]  = useState<Record<FingerKey, number>>(DEFAULT_FINGER_CURLS);

  // ── Apply a delta rotation to a named bone ──────────────────────────────────
  const applyBone = useCallback((boneName: string, x: number, y: number, z: number) => {
    const THREE = threeRef.current;
    const entry = bonesRef.current.get(boneName) as
      | { bone: import("three").Bone; restQuat: import("three").Quaternion }
      | undefined;
    if (!THREE || !entry) return;
    const DEG = Math.PI / 180;
    const delta = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(x * DEG, y * DEG, z * DEG)
    );
    entry.bone.quaternion.copy(entry.restQuat).multiply(delta);
  }, []);

  // ── Apply one arm bone key (tries each candidate name) ─────────────────────
  const applyArmKey = useCallback((key: ArmKey, vals: XYZ) => {
    const def = ARM_BONE_DEFS.find((d) => d.key === key)!;
    for (const name of def.names) {
      if (bonesRef.current.has(name)) {
        applyBone(name, vals.x, vals.y, vals.z);
        return;
      }
    }
  }, [applyBone]);

  // ── Apply a finger curl (0 = extended, 90 = closed) ────────────────────────
  const applyFinger = useCallback((key: FingerKey, curl: number) => {
    const def = FINGER_DEFS.find((d) => d.key === key)!;
    def.names.forEach((name) => {
      if (bonesRef.current.has(name)) applyBone(name, curl, 0, 0);
    });
  }, [applyBone]);

  // ── Arm slider handler ──────────────────────────────────────────────────────
  const handleArm = useCallback(
    (key: ArmKey, axis: "x" | "y" | "z", value: number) => {
      setArmSliders((prev) => {
        const next = { ...prev, [key]: { ...prev[key], [axis]: value } };
        applyArmKey(key, next[key]);
        return next;
      });
    },
    [applyArmKey]
  );

  // ── Finger curl handler ─────────────────────────────────────────────────────
  const handleFinger = useCallback(
    (key: FingerKey, value: number) => {
      setFingerCurls((prev) => {
        const next = { ...prev, [key]: value };
        applyFinger(key, value);
        return next;
      });
    },
    [applyFinger]
  );

  // ── REST POSE button ────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    const fresh = { ...DEFAULT_ARM_SLIDERS };
    setArmSliders(fresh);
    setFingerCurls({ ...DEFAULT_FINGER_CURLS });
    ARM_BONE_DEFS.forEach((def) => applyArmKey(def.key, DEF_XYZ));
    FINGER_DEFS.forEach((def) => applyFinger(def.key, 0));
  }, [applyArmKey, applyFinger]);

  // ── RELAX ARMS button ───────────────────────────────────────────────────────
  //   Animates arms down by rotating RightShoulder and LeftShoulder progressively.
  //   Tries positive X (clavicle-based lowering common in Avaturn/Mixamo).
  const handleRelaxArms = useCallback(() => {
    let frame = 0;
    const TARGET = 60; // degrees
    const FRAMES = 40;
    function step() {
      frame++;
      const t = Math.min(frame / FRAMES, 1);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const val = Math.round(TARGET * ease);
      const rVals: XYZ = { x: val, y: 0, z:  5 };
      const lVals: XYZ = { x: val, y: 0, z: -5 };
      applyArmKey("rightShoulder", rVals);
      applyArmKey("leftShoulder",  lVals);
      setArmSliders((prev) => ({
        ...prev,
        rightShoulder: rVals,
        leftShoulder: lVals,
      }));
      if (frame < FRAMES) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [applyArmKey]);

  // ── COPY POSE button ────────────────────────────────────────────────────────
  const handleCopyPose = useCallback(() => {
    const s = armSliders;
    const f = fingerCurls;
    const pose = {
      rightArm: {
        shoulder: [s.rightShoulder.x, s.rightShoulder.y, s.rightShoulder.z],
        upperArm: [s.rightArm.x,      s.rightArm.y,      s.rightArm.z],
        forearm:  [s.rightForeArm.x,  s.rightForeArm.y,  s.rightForeArm.z],
        hand:     [s.rightHand.x,     s.rightHand.y,     s.rightHand.z],
      },
      leftArm: {
        shoulder: [s.leftShoulder.x, s.leftShoulder.y, s.leftShoulder.z],
        upperArm: [s.leftArm.x,      s.leftArm.y,      s.leftArm.z],
        forearm:  [s.leftForeArm.x,  s.leftForeArm.y,  s.leftForeArm.z],
        hand:     [s.leftHand.x,     s.leftHand.y,     s.leftHand.z],
      },
      rightFingers: {
        thumb:  f.thumb,
        index:  f.index,
        middle: f.middle,
        ring:   f.ring,
        pinky:  f.pinky,
      },
    };
    navigator.clipboard.writeText(JSON.stringify(pose, null, 2)).then(() => {
      setCopyMsg("✓ Copied!");
      setTimeout(() => setCopyMsg(""), 2000);
    });
  }, [armSliders, fingerCurls]);

  // ── SEND TO AVATAR button ───────────────────────────────────────────────────
  const handleSendToAvatar = useCallback(() => {
    const s = armSliders;
    const f = fingerCurls;
    const pose = {
      rightArm: {
        shoulder: [s.rightShoulder.x, s.rightShoulder.y, s.rightShoulder.z],
        upperArm: [s.rightArm.x,      s.rightArm.y,      s.rightArm.z],
        forearm:  [s.rightForeArm.x,  s.rightForeArm.y,  s.rightForeArm.z],
        hand:     [s.rightHand.x,     s.rightHand.y,     s.rightHand.z],
      },
      leftArm: {
        shoulder: [s.leftShoulder.x, s.leftShoulder.y, s.leftShoulder.z],
        upperArm: [s.leftArm.x,      s.leftArm.y,      s.leftArm.z],
        forearm:  [s.leftForeArm.x,  s.leftForeArm.y,  s.leftForeArm.z],
        hand:     [s.leftHand.x,     s.leftHand.y,     s.leftHand.z],
      },
      rightFingers: {
        thumb:  f.thumb,
        index:  f.index,
        middle: f.middle,
        ring:   f.ring,
        pinky:  f.pinky,
      },
    };
    localStorage.setItem("signbridge-debug-pose", JSON.stringify(pose, null, 2));
    setSendMsg("✓ Sent!");
    setTimeout(() => setSendMsg(""), 2000);
  }, [armSliders, fingerCurls]);

  // ── Build bone hierarchy from scene ────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function buildTree(node: any): BoneNode | null {
    const isBone = node.isBone as boolean;
    if (!isBone) {
      // still descend non-bone nodes (e.g. Armature)
      const childTrees = node.children.map(buildTree).filter(Boolean) as BoneNode[];
      if (childTrees.length === 0) return null;
      // return a pseudo-node for the armature
      return { name: `[${node.name || node.type}]`, children: childTrees };
    }
    return {
      name: node.name,
      children: node.children.map(buildTree).filter(Boolean) as BoneNode[],
    };
  }

  // ── Three.js setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;
    deadRef.current = false;

    (async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      if (deadRef.current) return;

      threeRef.current = THREE;

      // Canvas
      const canvas = document.createElement("canvas");
      canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
      container.appendChild(canvas);

      // Renderer
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = false;
      rendererRef.current = renderer;

      // Scene
      const scene = new THREE.Scene();

      // Camera — chest-up framing
      const cam = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 50);
      cam.position.set(0, 1.35, 1.8);
      cam.lookAt(0, 1.25, 0);

      // Lights
      scene.add(new THREE.AmbientLight(0xffffff, 0.8));
      const key = new THREE.DirectionalLight(0xffffff, 1.0);
      key.position.set(3, 5, 4);
      scene.add(key);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x333333, 0.5));

      // Controls
      const controls = new OrbitControls(cam, renderer.domElement);
      controls.enablePan    = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controls.minDistance  = 0.8;
      controls.maxDistance  = 3.0;
      controls.minPolarAngle = Math.PI / 3;
      controls.maxPolarAngle = Math.PI / 2.2;
      controls.target.set(0, 1.25, 0);
      controls.update();
      controlsRef.current = controls;

      // Resize
      const ro = new ResizeObserver(() => {
        const w = container.clientWidth, h = container.clientHeight;
        renderer.setSize(w, h, false);
        cam.aspect = w / h;
        cam.updateProjectionMatrix();
      });
      ro.observe(container);

      // Render loop
      function animate() {
        if (deadRef.current) return;
        animIdRef.current = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, cam);
      }

      // Load GLB
      const loader = new GLTFLoader();
      loader.load(
        "/models/avatar/avatar.glb",
        (gltf) => {
          if (deadRef.current) return;
          const model = gltf.scene;

          // Centre on floor
          const box    = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center);
          model.position.y = 0;
          scene.add(model);

          // ── Extract all bones ──
          const boneMap = new Map<string, any>();
          const names: string[] = [];

          model.traverse((node: any) => {
            if (node.isBone) {
              const bone = node;
              boneMap.set(bone.name, { bone, restQuat: bone.quaternion.clone() });
              names.push(bone.name);

              // Console log with rest rotation
              console.log(
                `Bone: ${bone.name.padEnd(30)} | Parent: ${bone.parent?.name ?? "(none)".padEnd(20)} ` +
                `| RestRot: x=${bone.rotation.x.toFixed(3)} y=${bone.rotation.y.toFixed(3)} z=${bone.rotation.z.toFixed(3)}`
              );
            }
          });

          bonesRef.current = boneMap;
          console.log(`[avatar-debug] Total bones: ${names.length}`, names);

          // Which arm bones were found?
          const found: Record<string, string> = {};
          ARM_BONE_DEFS.forEach((def) => {
            for (const n of def.names) {
              if (boneMap.has(n)) { found[def.key] = n; break; }
            }
          });
          FINGER_DEFS.forEach((def) => {
            if (boneMap.has(def.names[0])) found[def.key] = def.names[0];
          });
          setFoundBones(found);
          setAllBoneNames(names);

              // Build hierarchy tree
          const trees = model.children.map(buildTree).filter(Boolean) as BoneNode[];
          setBoneTree(trees);

          setLoadPct(100);
          setLoaded(true);
          animate();
        },
        (progress) => {
          if (progress.total > 0) setLoadPct(Math.round(progress.loaded / progress.total * 100));
        },
        (err) => {
          console.error("[avatar-debug]", err);
          setError("Could not load avatar.glb — run: npm run download-avatar");
          animate();
        }
      );
    })();

    return () => {
      deadRef.current = true;
      cancelAnimationFrame(animIdRef.current);
      rendererRef.current?.dispose();
      controlsRef.current?.dispose();
      // Remove canvas from DOM
      canvasContainerRef.current?.querySelector("canvas")?.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  const panelBg = "rgba(0,0,0,0.55)";
  const sectionHdr: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.3)",
    padding: "4px 0 2px",
    marginTop: 4,
  };

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        background: "linear-gradient(135deg,#09090f 0%,#0d1117 100%)",
        color: "#fff",
        fontFamily: "system-ui,sans-serif",
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 18 }}>🦴</span>
        <div>
          <h1 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#67e8f9" }}>
            Avatar Debug — Bone Inspector
          </h1>
          <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
            Sliders apply delta rotations from T-pose. Use COPY POSE to export for sign-animations.ts.
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", fontSize: 11 }}>
          <a href="/test/avatar" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>
            ← Live Avatar
          </a>
          <a href="/" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Home</a>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── Left: 3D canvas ── */}
        <div
          ref={canvasContainerRef}
          style={{
            position: "relative",
            flex: "1 1 auto",
            minWidth: 0,
            background: "radial-gradient(ellipse at 50% 80%, #1e293b 0%, #0f172a 100%)",
          }}
        >
          {/* Loading overlay */}
          {!loaded && !error && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 12, zIndex: 10,
            }}>
              <div style={{ fontSize: 32 }}>🤟</div>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Loading avatar…</p>
              <div style={{ width: 160, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 9999 }}>
                <div style={{ width: `${loadPct}%`, height: "100%", background: "linear-gradient(90deg,#06b6d4,#7c3aed)", borderRadius: 9999, transition: "width 0.3s" }} />
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{loadPct}%</p>
            </div>
          )}
          {/* Error overlay */}
          {error && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 8, padding: 24, zIndex: 10, textAlign: "center",
            }}>
              <div style={{ fontSize: 28 }}>⚠️</div>
              <p style={{ margin: 0, fontSize: 13, color: "#f87171" }}>Model not found</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{error}</p>
            </div>
          )}
          {/* Bone count badge */}
          {loaded && (
            <div style={{
              position: "absolute", top: 8, left: 8, zIndex: 20,
              fontSize: 10, color: "rgba(103,232,249,0.5)",
              background: "rgba(0,0,0,0.4)", borderRadius: 6, padding: "3px 7px",
            }}>
              {allBoneNames.length} bones loaded
            </div>
          )}
        </div>

        {/* ── Right: Control panel ── */}
        <div
          style={{
            width: 320,
            flexShrink: 0,
            overflowY: "auto",
            overflowX: "hidden",
            background: panelBg,
            borderLeft: "1px solid rgba(255,255,255,0.07)",
            padding: "10px 10px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {/* ── Action buttons ── */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
            {[
              { label: "REST POSE",  onClick: handleReset,     color: "#7c3aed" },
              { label: "RELAX ARMS", onClick: handleRelaxArms, color: "#0891b2" },
              { label: copyMsg || "COPY POSE",       onClick: handleCopyPose,    color: "#059669" },
              { label: sendMsg || "SEND TO AVATAR",  onClick: handleSendToAvatar, color: "#d97706" },
            ].map(({ label, onClick, color }) => (
              <button
                key={label}
                onClick={onClick}
                style={{
                  flex: 1,
                  minWidth: 80,
                  padding: "6px 4px",
                  borderRadius: 7,
                  border: `1px solid ${color}55`,
                  background: `${color}22`,
                  color: color,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Found bones status ── */}
          {loaded && (
            <div style={{ marginBottom: 6, fontSize: 10, color: "rgba(255,255,255,0.25)", lineHeight: 1.6 }}>
              {ARM_BONE_DEFS.map((def) => (
                <span
                  key={def.key}
                  style={{ display: "inline-block", marginRight: 6, color: foundBones[def.key] ? "#34d399" : "#f87171" }}
                >
                  {foundBones[def.key] ? "✓" : "✗"} {def.label}
                </span>
              ))}
            </div>
          )}

          {/* ── Arm Bones ── */}
          <Section title="Right Arm Bones" accent="#06b6d4">
            {(["rightShoulder", "rightArm", "rightForeArm", "rightHand"] as ArmKey[]).map((key) => {
              const def  = ARM_BONE_DEFS.find((d) => d.key === key)!;
              const vals = armSliders[key];
              const found = !!foundBones[key];
              return (
                <div key={key} style={{ marginBottom: 10 }}>
                  <div style={{ ...sectionHdr, color: found ? "rgba(103,232,249,0.7)" : "#f87171" }}>
                    {def.label} {found ? `(${foundBones[key]})` : "— not found"}
                  </div>
                  {(["x", "y", "z"] as const).map((ax) => (
                    <SliderRow
                      key={ax}
                      label={ax.toUpperCase()}
                      value={vals[ax]}
                      onChange={(v) => handleArm(key, ax, v)}
                      onReset={() => handleArm(key, ax, 0)}
                    />
                  ))}
                </div>
              );
            })}
          </Section>

          <Section title="Left Arm Bones" accent="#a78bfa">
            {(["leftShoulder", "leftArm", "leftForeArm", "leftHand"] as ArmKey[]).map((key) => {
              const def  = ARM_BONE_DEFS.find((d) => d.key === key)!;
              const vals = armSliders[key];
              const found = !!foundBones[key];
              return (
                <div key={key} style={{ marginBottom: 10 }}>
                  <div style={{ ...sectionHdr, color: found ? "rgba(167,139,250,0.7)" : "#f87171" }}>
                    {def.label} {found ? `(${foundBones[key]})` : "— not found"}
                  </div>
                  {(["x", "y", "z"] as const).map((ax) => (
                    <SliderRow
                      key={ax}
                      label={ax.toUpperCase()}
                      value={vals[ax]}
                      color="#a78bfa"
                      onChange={(v) => handleArm(key, ax, v)}
                      onReset={() => handleArm(key, ax, 0)}
                    />
                  ))}
                </div>
              );
            })}
          </Section>

          <Section title="Right Hand Fingers" accent="#f59e0b">
            <p style={{ margin: "0 0 8px", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
              0° = extended  ·  90° = closed fist
            </p>
            {FINGER_DEFS.map((def) => {
              const found = !!foundBones[def.key];
              return (
                <div key={def.key} style={{ marginBottom: 6 }}>
                  <SliderRow
                    label={def.label}
                    value={fingerCurls[def.key as FingerKey]}
                    min={0}
                    max={90}
                    color="#f59e0b"
                    onChange={(v) => handleFinger(def.key as FingerKey, v)}
                    onReset={() => handleFinger(def.key as FingerKey, 0)}
                  />
                  {!found && (
                    <div style={{ fontSize: 9, color: "#f87171", marginLeft: 22 }}>bone not found</div>
                  )}
                </div>
              );
            })}
          </Section>

          {/* ── Bone Hierarchy ── */}
          <Section title={`Bone Hierarchy (${allBoneNames.length})`} defaultOpen={false} accent="#94a3b8">
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {boneTree.length > 0 ? (
                boneTree.map((node, i) => <BoneTree key={i} node={node} />)
              ) : (
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: 0 }}>
                  {loaded ? "No bones found." : "Loading…"}
                </p>
              )}
            </div>
          </Section>

          {/* ── All bone names flat list ── */}
          <Section title="All Bone Names (flat)" defaultOpen={false} accent="#64748b">
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {allBoneNames.map((name, i) => (
                <div key={name} style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.45)", padding: "1px 0" }}>
                  <span style={{ color: "rgba(255,255,255,0.2)", marginRight: 6 }}>{i}</span>
                  {name}
                </div>
              ))}
            </div>
          </Section>

          {/* ── Current values JSON ── */}
          <Section title="Current Values (JSON)" defaultOpen={false} accent="#64748b">
            <pre style={{
              fontSize: 9,
              fontFamily: "monospace",
              color: "rgba(255,255,255,0.5)",
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}>
              {JSON.stringify({
                rightArm: {
                  shoulder: [armSliders.rightShoulder.x, armSliders.rightShoulder.y, armSliders.rightShoulder.z],
                  forearm:  [armSliders.rightForeArm.x,  armSliders.rightForeArm.y,  armSliders.rightForeArm.z],
                  hand:     [armSliders.rightHand.x,     armSliders.rightHand.y,     armSliders.rightHand.z],
                },
                leftArm: {
                  shoulder: [armSliders.leftShoulder.x, armSliders.leftShoulder.y, armSliders.leftShoulder.z],
                  forearm:  [armSliders.leftForeArm.x,  armSliders.leftForeArm.y,  armSliders.leftForeArm.z],
                  hand:     [armSliders.leftHand.x,     armSliders.leftHand.y,     armSliders.leftHand.z],
                },
                rightFingers: fingerCurls,
              }, null, 2)}
            </pre>
          </Section>

          {/* ── Instructions ── */}
          <div style={{
            marginTop: 8,
            padding: "8px 10px",
            borderRadius: 8,
            background: "rgba(6,182,212,0.04)",
            border: "1px solid rgba(6,182,212,0.12)",
            fontSize: 10,
            color: "rgba(255,255,255,0.3)",
            lineHeight: 1.7,
          }}>
            <strong style={{ color: "rgba(103,232,249,0.6)" }}>How to use:</strong><br/>
            1. Drag sliders to pose the avatar<br/>
            2. Hit <strong>COPY POSE</strong> to copy JSON<br/>
            3. Paste into a keyframe in sign-animations.ts<br/>
            4. <strong>RELAX ARMS</strong> tries to lower arms from T-pose<br/>
            5. Open DevTools console to see all bone names + rest rotations
          </div>
        </div>
      </div>
    </main>
  );
}
