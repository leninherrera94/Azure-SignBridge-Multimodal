"use client";

import {
  useState, useEffect, useRef, useCallback,
  type ChangeEvent, type FormEvent,
} from "react";
import SignAvatar from "@/components/SignAvatar";
import PhotoCalibrator from "@/components/admin/PhotoCalibrator";
import type { SignAvatarHandle } from "@/components/SignAvatar";
import type { SignDefinition, PoseArm, PoseFingers, PoseData } from "@/lib/azure/signs-db";
import type { ArmPose, HandPose, FingerRotation } from "@/lib/avatar/sign-animations";

// ─── Local types ──────────────────────────────────────────────────────────────

type XYZ = [number, number, number];

interface ArmSliders { shoulder: XYZ; upperArm: XYZ; forearm: XYZ; hand: XYZ }
interface FingerSliders { thumb: number; index: number; middle: number; ring: number; pinky: number }
interface PoseSliders { rightArm: ArmSliders; leftArm: ArmSliders; rightFingers: FingerSliders; leftFingers: FingerSliders }

// ─── Constants ────────────────────────────────────────────────────────────────

const REST_SLIDERS: PoseSliders = {
  rightArm: { shoulder: [27,3,-14], upperArm: [41,0,0], forearm: [10,59,-27], hand: [5,35,-14] },
  leftArm:  { shoulder: [27,3,10],  upperArm: [41,0,0], forearm: [10,54,29],  hand: [-3,-54,-1] },
  rightFingers: { thumb:10, index:10, middle:10, ring:10, pinky:10 },
  leftFingers:  { thumb:10, index:10, middle:10, ring:10, pinky:10 },
};

const CATEGORIES: SignDefinition["category"][] = [
  "greeting","response","expression","number","letter","common","custom",
];

const EMPTY_FORM: Partial<SignDefinition> = {
  id: "", name: "", language: "ASL", category: "common",
  type: "static", duration: 1000, keywords: [], description: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function curl(deg: number): FingerRotation {
  return { metacarpal:[deg,0,0], proximal:[deg,0,0], distal:[deg,0,0] };
}

function fingersToHandPose(f: FingerSliders): HandPose {
  return {
    thumb: curl(f.thumb), index: curl(f.index), middle: curl(f.middle),
    ring:  curl(f.ring),  pinky: curl(f.pinky),
  };
}

function armSlidersToArmPose(a: ArmSliders): ArmPose {
  return { shoulder: a.shoulder, upperArm: a.upperArm, forearm: a.forearm, hand: a.hand };
}

function slidersToPoseData(s: PoseSliders): PoseData {
  return {
    rightArm:     { shoulder: s.rightArm.shoulder, upperArm: s.rightArm.upperArm, forearm: s.rightArm.forearm, hand: s.rightArm.hand },
    leftArm:      { shoulder: s.leftArm.shoulder,  upperArm: s.leftArm.upperArm,  forearm: s.leftArm.forearm,  hand: s.leftArm.hand },
    rightFingers: s.rightFingers,
    leftFingers:  s.leftFingers,
  };
}

function poseDataToSliders(p: PoseData): PoseSliders {
  return {
    rightArm: { shoulder: p.rightArm.shoulder, upperArm: p.rightArm.upperArm, forearm: p.rightArm.forearm, hand: p.rightArm.hand },
    leftArm:  p.leftArm
      ? { shoulder: p.leftArm.shoulder, upperArm: p.leftArm.upperArm, forearm: p.leftArm.forearm, hand: p.leftArm.hand }
      : REST_SLIDERS.leftArm,
    rightFingers: p.rightFingers,
    leftFingers:  p.leftFingers ?? REST_SLIDERS.leftFingers,
  };
}

function toSnakeCase(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function mirrorArm(arm: ArmSliders): ArmSliders {
  // Mirror the Z-axis (left-right symmetry) for each bone component
  return {
    shoulder: [arm.shoulder[0],  arm.shoulder[1],  -arm.shoulder[2]],
    upperArm: [arm.upperArm[0],  arm.upperArm[1],  -arm.upperArm[2]],
    forearm:  [arm.forearm[0],   arm.forearm[1],   -arm.forearm[2]],
    hand:     [arm.hand[0],      arm.hand[1],      -arm.hand[2]],
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Tag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
      style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", color: "#67e8f9" }}
    >
      {label}
      <button onClick={onRemove} className="ml-0.5 text-slate-400 hover:text-white" aria-label={`Remove keyword ${label}`}>×</button>
    </span>
  );
}

function SliderRow({ label, value, min = -180, max = 180, onChange }: {
  label: string; value: number; min?: number; max?: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-8 text-right">{label}</span>
      <input
        type="range" min={min} max={max} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1"
        style={{ accentColor: "#06b6d4" }}
      />
      <span className="text-xs text-slate-300 w-10 text-right font-mono">{value}°</span>
    </div>
  );
}

function XYZGroup({ label, value, onChange }: {
  label: string; value: XYZ; onChange: (v: XYZ) => void;
}) {
  return (
    <div className="mb-2">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <SliderRow label="X" value={value[0]} onChange={(v) => onChange([v, value[1], value[2]])} />
      <SliderRow label="Y" value={value[1]} onChange={(v) => onChange([value[0], v, value[2]])} />
      <SliderRow label="Z" value={value[2]} onChange={(v) => onChange([value[0], value[1], v])} />
    </div>
  );
}

function FingerGroup({ label, value, onChange }: {
  label: string; value: FingerSliders; onChange: (v: FingerSliders) => void;
}) {
  return (
    <div className="mb-2">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {(["thumb","index","middle","ring","pinky"] as const).map((f) => (
        <SliderRow key={f} label={f.slice(0,3)} min={0} max={90}
          value={value[f]} onChange={(v) => onChange({ ...value, [f]: v })} />
      ))}
    </div>
  );
}

function Collapsible({ title, defaultOpen = false, children }: {
  title: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full text-xs text-slate-400 hover:text-white transition-colors py-1"
      >
        <span className="text-slate-600">{open ? "▼" : "▶"}</span>
        {title}
      </button>
      {open && <div className="pl-3 pt-1 border-l border-white/5">{children}</div>}
    </div>
  );
}

// ─── Slider Panel ─────────────────────────────────────────────────────────────

function SliderPanel({
  sliders, onChange, avatarRef,
  showPreviewAnimation, onPreviewAnimation,
  signType, activePoseTab, onTabChange,
  onSavePose, onReset, onMirror,
}: {
  sliders: PoseSliders;
  onChange: (s: PoseSliders) => void;
  avatarRef: React.RefObject<SignAvatarHandle>;
  showPreviewAnimation?: boolean;
  onPreviewAnimation?: () => void;
  signType: "static" | "dynamic";
  activePoseTab: "start" | "end";
  onTabChange: (t: "start" | "end") => void;
  onSavePose: () => void;
  onReset: () => void;
  onMirror: () => void;
}) {
  const { rightArm, leftArm, rightFingers, leftFingers } = sliders;

  // Real-time avatar update
  useEffect(() => {
    if (!avatarRef.current) return;
    avatarRef.current.setStaticPose({
      rightArm:  armSlidersToArmPose(rightArm),
      leftArm:   armSlidersToArmPose(leftArm),
      rightHand: fingersToHandPose(rightFingers),
      leftHand:  fingersToHandPose(leftFingers),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliders]);

  const setRA = (patch: Partial<ArmSliders>) => onChange({ ...sliders, rightArm: { ...rightArm, ...patch } });
  const setLA = (patch: Partial<ArmSliders>) => onChange({ ...sliders, leftArm:  { ...leftArm,  ...patch } });
  const setRF = (v: FingerSliders)           => onChange({ ...sliders, rightFingers: v });
  const setLF = (v: FingerSliders)           => onChange({ ...sliders, leftFingers:  v });

  return (
    <div className="flex flex-col h-full">
      {/* Pose tab (dynamic only) */}
      {signType === "dynamic" && (
        <div
          className="flex-none flex rounded-lg overflow-hidden mb-3"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {(["start","end"] as const).map((t) => (
            <button
              key={t}
              onClick={() => onTabChange(t)}
              className="flex-1 py-1.5 text-xs font-semibold capitalize transition-all"
              style={{
                background: activePoseTab === t ? "rgba(6,182,212,0.15)" : "transparent",
                color: activePoseTab === t ? "#06b6d4" : "rgba(255,255,255,0.4)",
                borderBottom: `2px solid ${activePoseTab === t ? "#06b6d4" : "transparent"}`,
              }}
            >
              {t} Pose
            </button>
          ))}
        </div>
      )}

      {/* Scrollable sliders */}
      <div className="flex-1 overflow-y-auto pr-1">
        {/* Right Arm */}
        <div
          className="rounded-lg p-2 mb-2"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-xs font-semibold text-slate-300 mb-2">Right Arm</p>
          <XYZGroup label="Shoulder"  value={rightArm.shoulder} onChange={(v) => setRA({ shoulder: v })} />
          <XYZGroup label="Upper Arm" value={rightArm.upperArm} onChange={(v) => setRA({ upperArm: v })} />
          <XYZGroup label="Forearm"   value={rightArm.forearm}  onChange={(v) => setRA({ forearm: v })} />
          <XYZGroup label="Wrist"     value={rightArm.hand}     onChange={(v) => setRA({ hand: v })} />
        </div>

        {/* Right Fingers */}
        <Collapsible title="Right Fingers" defaultOpen>
          <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
            <FingerGroup label="" value={rightFingers} onChange={setRF} />
          </div>
        </Collapsible>

        {/* Left Arm */}
        <Collapsible title="Left Arm">
          <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
            <XYZGroup label="Shoulder"  value={leftArm.shoulder} onChange={(v) => setLA({ shoulder: v })} />
            <XYZGroup label="Upper Arm" value={leftArm.upperArm} onChange={(v) => setLA({ upperArm: v })} />
            <XYZGroup label="Forearm"   value={leftArm.forearm}  onChange={(v) => setLA({ forearm: v })} />
            <XYZGroup label="Wrist"     value={leftArm.hand}     onChange={(v) => setLA({ hand: v })} />
          </div>
        </Collapsible>

        {/* Left Fingers */}
        <Collapsible title="Left Fingers">
          <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
            <FingerGroup label="" value={leftFingers} onChange={setLF} />
          </div>
        </Collapsible>
      </div>

      {/* Actions */}
      <div className="flex-none flex flex-col gap-2 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex gap-2">
          <button onClick={onReset}  className="flex-1 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            ↺ Reset
          </button>
          <button onClick={onMirror} className="flex-1 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            ⇄ Mirror R→L
          </button>
        </div>
        {signType === "static" ? (
          <button onClick={onSavePose} className="w-full py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)" }}>
            Save Pose ✓
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={onSavePose} className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)" }}>
              Save {activePoseTab === "start" ? "Start" : "End"} ✓
            </button>
            {onPreviewAnimation && (
              <button onClick={onPreviewAnimation} className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
                ▶ Preview
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  initial,
  avatarRef,
  onSave,
  onClose,
  saving,
}: {
  initial: Partial<SignDefinition>;
  avatarRef: React.RefObject<SignAvatarHandle>;
  onSave: (data: Partial<SignDefinition>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const isNew = !initial.createdAt;

  // Form state
  const [form, setForm] = useState<Partial<SignDefinition>>({ ...EMPTY_FORM, ...initial });
  const [keywordInput, setKeywordInput] = useState("");
  const [showPhotoCalib, setShowPhotoCalib] = useState(false);

  // Pose tab (for dynamic signs)
  const [activePoseTab, setActivePoseTab] = useState<"start" | "end">("start");

  // Slider states
  const [startSliders, setStartSliders] = useState<PoseSliders>(() => {
    const p = initial.type === "static" ? initial.pose : initial.poseStart;
    return p ? poseDataToSliders(p) : { ...REST_SLIDERS };
  });
  const [endSliders, setEndSliders] = useState<PoseSliders>(() => {
    const p = initial.poseEnd;
    return p ? poseDataToSliders(p) : { ...REST_SLIDERS };
  });

  // Which sliders are active (start or end)
  const activeSliders = activePoseTab === "start" ? startSliders : endSliders;
  const setActiveSliders = activePoseTab === "start" ? setStartSliders : setEndSliders;

  function setFormField<K extends keyof SignDefinition>(key: K, value: SignDefinition[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    // Auto-generate id from name
    if (key === "name" && isNew) {
      setForm((f) => ({ ...f, name: value as string, id: toSnakeCase(value as string) }));
    }
  }

  function addKeyword(kw: string) {
    const k = kw.trim().toLowerCase();
    if (!k) return;
    setForm((f) => ({ ...f, keywords: [...(f.keywords ?? []), k].filter((v, i, a) => a.indexOf(v) === i) }));
    setKeywordInput("");
  }

  function removeKeyword(kw: string) {
    setForm((f) => ({ ...f, keywords: (f.keywords ?? []).filter((k) => k !== kw) }));
  }

  function handleSavePose() {
    if (form.type === "static") {
      setForm((f) => ({ ...f, pose: slidersToPoseData(startSliders) }));
    } else if (activePoseTab === "start") {
      setForm((f) => ({ ...f, poseStart: slidersToPoseData(startSliders) }));
    } else {
      setForm((f) => ({ ...f, poseEnd: slidersToPoseData(endSliders) }));
    }
  }

  function handlePreviewAnimation() {
    if (!avatarRef.current) return;
    // Build a temporary sign and play it
    const signId = "__preview__";
    const start = slidersToPoseData(startSliders);
    const end   = slidersToPoseData(endSliders);
    // Call clearStaticPose and then play the animation via the DB loader approach
    avatarRef.current.clearStaticPose();
    // Use translate-to-signs flow is too complex here; just show start → end visually
    avatarRef.current.setStaticPose({
      rightArm:  armSlidersToArmPose(start.rightArm),
      leftArm:   armSlidersToArmPose(start.leftArm ?? { ...REST_SLIDERS.leftArm } as PoseArm),
      rightHand: fingersToHandPose(start.rightFingers),
      leftHand:  fingersToHandPose(start.leftFingers ?? REST_SLIDERS.leftFingers),
    });
    setTimeout(() => {
      if (!avatarRef.current) return;
      avatarRef.current.setStaticPose({
        rightArm:  armSlidersToArmPose(end.rightArm),
        leftArm:   armSlidersToArmPose(end.leftArm ?? { ...REST_SLIDERS.leftArm } as PoseArm),
        rightHand: fingersToHandPose(end.rightFingers),
        leftHand:  fingersToHandPose(end.leftFingers ?? REST_SLIDERS.leftFingers),
      });
    }, form.duration ?? 1000);
    void signId;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Auto-save the current pose if not explicitly saved
    const finalForm = { ...form };
    if (form.type === "static" && !form.pose) {
      finalForm.pose = slidersToPoseData(startSliders);
    }
    if (form.type === "dynamic") {
      if (!form.poseStart) finalForm.poseStart = slidersToPoseData(startSliders);
      if (!form.poseEnd)   finalForm.poseEnd   = slidersToPoseData(endSliders);
    }
    onSave(finalForm);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.9)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxWidth: 1200, height: "90vh",
          background: "#0f172a",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? "Create new sign" : `Edit ${initial.name}`}
      >
        {/* Modal header */}
        <div
          className="flex-none flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <h2 className="text-lg font-bold text-white">
            {isNew ? "✦ New Sign" : `Edit — ${initial.name}`}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl" aria-label="Close">×</button>
        </div>

        {/* Modal body */}
        <div className="flex-1 flex min-h-0">

          {/* LEFT: Avatar + sliders (60%) */}
          <div className="flex flex-col w-[60%] border-r min-h-0" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            {/* Avatar (upper half) */}
            <div className="flex-none h-[40%] min-h-0 p-3">
              <SignAvatar
                ref={avatarRef}
                className="w-full h-full"
                style={{ minHeight: 0 }}
              />
            </div>

            {/* Sliders (lower half, scrollable) */}
            <div className="flex-1 min-h-0 p-3">
              <SliderPanel
                sliders={activeSliders}
                onChange={setActiveSliders}
                avatarRef={avatarRef}
                signType={form.type ?? "static"}
                activePoseTab={activePoseTab}
                onTabChange={setActivePoseTab}
                onSavePose={handleSavePose}
                onReset={() => setActiveSliders({ ...REST_SLIDERS })}
                onMirror={() =>
                  setActiveSliders((s) => ({
                    ...s,
                    leftArm:     mirrorArm(s.rightArm),
                    leftFingers: { ...s.rightFingers },
                  }))
                }
                onPreviewAnimation={form.type === "dynamic" ? handlePreviewAnimation : undefined}
              />
            </div>
          </div>

          {/* RIGHT: Form (40%) */}
          <form
            onSubmit={handleSubmit}
            id="sign-form"
            className="flex flex-col w-[40%] min-h-0 overflow-y-auto p-5 gap-4"
          >
            {/* Sign ID */}
            <Field label="Sign ID">
              <input
                value={form.id ?? ""} required
                onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                placeholder="hello, letter_a, house…"
                className="form-input"
                pattern="[a-z0-9_]+"
                title="Lowercase letters, digits, underscores only"
              />
            </Field>

            {/* Name */}
            <Field label="Display Name">
              <input
                value={form.name ?? ""} required
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormField("name", e.target.value)}
                placeholder="Hello, A, House…"
                className="form-input"
              />
            </Field>

            {/* Language + Category row */}
            <div className="flex gap-3">
              <Field label="Language" className="flex-1">
                <select
                  value={form.language ?? "ASL"}
                  onChange={(e) => setFormField("language", e.target.value as "ASL" | "LSC")}
                  className="form-select"
                >
                  <option value="ASL">ASL 🇺🇸</option>
                  <option value="LSC">LSC 🇨🇴</option>
                </select>
              </Field>
              <Field label="Category" className="flex-1">
                <select
                  value={form.category ?? "common"}
                  onChange={(e) => setFormField("category", e.target.value as SignDefinition["category"])}
                  className="form-select"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Type */}
            <Field label="Type">
              <div className="flex gap-3">
                {(["static","dynamic"] as const).map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio" name="sign-type" value={t}
                      checked={form.type === t}
                      onChange={() => setFormField("type", t)}
                      className="accent-cyan-400"
                    />
                    <span className="text-sm text-slate-300">
                      {t === "static" ? "Static (single pose)" : "Dynamic (start → end)"}
                    </span>
                  </label>
                ))}
              </div>
            </Field>

            {/* Duration */}
            <Field label={`Duration: ${form.duration ?? 1000} ms`}>
              <input
                type="range" min={300} max={3000} step={100}
                value={form.duration ?? 1000}
                onChange={(e) => setFormField("duration", Number(e.target.value))}
                className="w-full" style={{ accentColor: "#06b6d4" }}
              />
              <div className="flex justify-between text-xs text-slate-600 mt-0.5">
                <span>0.3s</span><span>3s</span>
              </div>
            </Field>

            {/* Description */}
            <Field label="Description">
              <textarea
                value={form.description ?? ""}
                onChange={(e) => setFormField("description", e.target.value)}
                placeholder="Short description of the sign…"
                rows={2}
                className="form-input resize-none"
              />
            </Field>

            {/* Keywords */}
            <Field label="Keywords (press Enter to add)">
              <div
                className="flex flex-wrap gap-1.5 p-2 rounded-lg min-h-[40px]"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {(form.keywords ?? []).map((kw) => (
                  <Tag key={kw} label={kw} onRemove={() => removeKeyword(kw)} />
                ))}
                <input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addKeyword(keywordInput); }
                    if (e.key === "," || e.key === " ") { e.preventDefault(); addKeyword(keywordInput); }
                  }}
                  placeholder={(form.keywords?.length ?? 0) === 0 ? "Type a keyword, press Enter…" : ""}
                  className="bg-transparent outline-none text-sm text-white flex-1 min-w-[120px]"
                />
              </div>
            </Field>

            {/* Pose status */}
            <div
              className="rounded-lg p-3 text-xs"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-slate-400 font-semibold mb-1">Pose Status</p>
              {form.type === "static" ? (
                <p className={form.pose ? "text-green-400" : "text-slate-500"}>
                  {form.pose ? "✓ Pose saved" : "○ No pose saved yet — use Save Pose button"}
                </p>
              ) : (
                <>
                  <p className={form.poseStart ? "text-green-400" : "text-slate-500"}>
                    {form.poseStart ? "✓ Start pose saved" : "○ Start pose not saved"}
                  </p>
                  <p className={form.poseEnd ? "text-green-400" : "text-slate-500"}>
                    {form.poseEnd ? "✓ End pose saved" : "○ End pose not saved"}
                  </p>
                </>
              )}
            </div>

            {/* Photo calibration */}
            <Collapsible title="📷 Calibrate from Photo">
              <PhotoCalibrator
                onDetected={(fingers) => {
                  setActiveSliders((s) => ({
                    ...s,
                    rightFingers: fingers,
                  }));
                }}
              />
            </Collapsible>
          </form>
        </div>

        {/* Modal footer */}
        <div
          className="flex-none flex items-center justify-between px-6 py-4 border-t gap-3"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <button
            type="button"
            onClick={() => {
              if (!avatarRef.current) return;
              avatarRef.current.clearStaticPose();
              const id = form.type === "static" ? form.id : undefined;
              if (id) avatarRef.current.playSign(id).catch(() => {});
            }}
            className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            ▶ Preview Sign
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="sign-form"
              disabled={saving}
              className="px-6 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)" }}
            >
              {saving ? "Saving…" : isNew ? "Create Sign" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Inline styles for form inputs */}
      <style>{`
        .form-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 6px 10px;
          color: #fff;
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s;
        }
        .form-input:focus { border-color: rgba(6,182,212,0.5); }
        .form-select {
          width: 100%;
          background: #1e293b;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 6px 10px;
          color: #fff;
          font-size: 13px;
          outline: none;
          cursor: pointer;
          color-scheme: dark;
        }
        .form-select:focus { border-color: rgba(6,182,212,0.5); }
        select { color-scheme: dark; }
        select option {
          background: #1e293b;
          color: #fff;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children, className }: {
  label: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminSignsPage() {
  const avatarRef = useRef<SignAvatarHandle>(null);

  // Data
  const [signs,   setSigns]   = useState<SignDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Filters
  const [language,        setLanguage]        = useState<"ASL" | "LSC">("ASL");
  const [search,          setSearch]          = useState("");
  const [filterCategory,  setFilterCategory]  = useState<string>("");
  const [filterType,      setFilterType]      = useState<string>("");

  // Modal
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editingSign,  setEditingSign]  = useState<Partial<SignDefinition> | null>(null);
  const [saving,       setSaving]       = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Load signs ─────────────────────────────────────────────────────────────
  const loadSigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/signs?language=${language}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json() as SignDefinition[];
      setSigns(data);
    } catch (e) {
      setError("Failed to load signs. Check Cosmos DB connection.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => { loadSigns(); }, [loadSigns]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = signs.filter((s) => {
    if (filterCategory && s.category !== filterCategory) return false;
    if (filterType && s.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.keywords.some((k) => k.includes(q))
      );
    }
    return true;
  });

  // ── Modal handlers ─────────────────────────────────────────────────────────
  function openNew() {
    setEditingSign({ ...EMPTY_FORM, language });
    setModalOpen(true);
  }

  function openEdit(sign: SignDefinition) {
    setEditingSign({ ...sign });
    setModalOpen(true);
    // Apply pose on avatar
    if (avatarRef.current) {
      const p = sign.type === "static" ? sign.pose : sign.poseStart;
      if (p) {
        avatarRef.current.setStaticPose({
          rightArm:  { shoulder: p.rightArm.shoulder, upperArm: p.rightArm.upperArm, forearm: p.rightArm.forearm, hand: p.rightArm.hand },
          leftArm:   p.leftArm ? { shoulder: p.leftArm.shoulder, upperArm: p.leftArm.upperArm, forearm: p.leftArm.forearm, hand: p.leftArm.hand } : undefined,
        });
      }
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingSign(null);
    avatarRef.current?.clearStaticPose();
  }

  async function handleSave(data: Partial<SignDefinition>) {
    setSaving(true);
    try {
      const isNew = !signs.find((s) => s.id === data.id);
      const url    = isNew ? "/api/signs" : `/api/signs/${data.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      closeModal();
      await loadSigns();
    } catch (e) {
      console.error(e);
      alert("Failed to save sign. Check console.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await fetch(`/api/signs/${id}`, { method: "DELETE" });
      setDeleteId(null);
      await loadSigns();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate(sign: SignDefinition) {
    const target: "ASL" | "LSC" = sign.language === "ASL" ? "LSC" : "ASL";
    try {
      await fetch(`/api/signs/${sign.id}?action=duplicate&language=${target}`, { method: "POST" });
      await loadSigns();
    } catch (e) {
      console.error(e);
    }
  }

  async function handlePreview(sign: SignDefinition) {
    if (!avatarRef.current) return;
    avatarRef.current.clearStaticPose();
    await avatarRef.current.playSign(sign.id);
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#0f172a", color: "#fff" }}>

      {/* Hidden avatar for preview (always mounted) */}
      <div className="sr-only" aria-hidden>
        <SignAvatar ref={avatarRef} />
      </div>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b"
        style={{ background: "rgba(15,23,42,0.97)", backdropFilter: "blur(8px)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl" aria-hidden>🤟</span>
          <div>
            <h1 className="font-bold text-base text-white leading-none">SignBridge AI</h1>
            <p className="text-xs text-slate-500">Sign Language Manager</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Language toggle */}
          <div
            className="flex rounded-lg overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            role="group"
            aria-label="Language"
          >
            {(["ASL","LSC"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className="px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  background: language === lang ? "rgba(6,182,212,0.15)" : "transparent",
                  color: language === lang ? "#06b6d4" : "rgba(255,255,255,0.4)",
                  borderRight: lang === "ASL" ? "1px solid rgba(255,255,255,0.1)" : "none",
                }}
                aria-pressed={language === lang}
              >
                {lang} {lang === "ASL" ? "🇺🇸" : "🇨🇴"}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search signs or keywords…"
            className="px-3 py-1.5 rounded-lg text-sm outline-none w-52"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
            aria-label="Search"
          />

          {/* + New Sign */}
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)" }}
          >
            + New Sign
          </button>
        </div>
      </header>

      {/* ── Filters ── */}
      <div
        className="flex gap-3 px-6 py-3 border-b flex-wrap"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="text-xs rounded-lg px-2 py-1.5 outline-none"
          style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", colorScheme: "dark" }}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-xs rounded-lg px-2 py-1.5 outline-none"
          style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", colorScheme: "dark" }}
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          <option value="static">Static</option>
          <option value="dynamic">Dynamic</option>
        </select>

        <span className="text-xs text-slate-600 ml-auto self-center">
          {filtered.length} of {signs.length} signs
        </span>
      </div>

      {/* ── Table ── */}
      <div className="px-6 py-4">
        {loading && (
          <div className="text-center py-16 text-slate-500 text-sm">
            <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
            {" "}Loading signs…
          </div>
        )}

        {error && (
          <div
            className="rounded-xl p-4 text-sm text-red-400 mb-4"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Name","Language","Category","Type","Keywords","Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-600 text-sm">
                      No signs found. {signs.length === 0 ? "Run npm run seed-signs to populate." : "Adjust your filters."}
                    </td>
                  </tr>
                )}
                {filtered.map((sign, i) => (
                  <tr
                    key={sign.id}
                    style={{
                      background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                    className="group hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{sign.name}</div>
                      <div className="text-xs text-slate-600 font-mono">{sign.id}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {sign.language} {sign.language === "ASL" ? "🇺🇸" : "🇨🇴"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
                      >
                        {sign.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          background: sign.type === "dynamic" ? "rgba(167,139,250,0.1)" : "rgba(6,182,212,0.1)",
                          color:      sign.type === "dynamic" ? "#c4b5fd" : "#67e8f9",
                          border:     `1px solid ${sign.type === "dynamic" ? "rgba(167,139,250,0.2)" : "rgba(6,182,212,0.2)"}`,
                        }}
                      >
                        {sign.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px]">
                      <span className="truncate block">{sign.keywords.slice(0, 4).join(", ")}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ActionBtn onClick={() => handlePreview(sign)}    label="Preview" color="#06b6d4">▶</ActionBtn>
                        <ActionBtn onClick={() => openEdit(sign)}         label="Edit">✎</ActionBtn>
                        <ActionBtn onClick={() => handleDuplicate(sign)}  label={`Copy to ${sign.language === "ASL" ? "LSC" : "ASL"}`}>⧉</ActionBtn>
                        <ActionBtn onClick={() => setDeleteId(sign.id)}   label="Delete" color="#f87171">🗑</ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {modalOpen && editingSign && (
        <EditModal
          initial={editingSign}
          avatarRef={avatarRef}
          onSave={handleSave}
          onClose={closeModal}
          saving={saving}
        />
      )}

      {/* ── Delete confirm ── */}
      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.9)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)" }}
            role="alertdialog"
            aria-modal="true"
          >
            <h2 className="font-bold text-white mb-2">Delete Sign?</h2>
            <p className="text-sm text-slate-400 mb-6">
              This will permanently remove <span className="text-white font-mono">{deleteId}</span> from the database.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 rounded-xl text-sm text-slate-400 hover:text-white"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)" }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ onClick, label, children, color }: {
  onClick: () => void; label: string; children: React.ReactNode; color?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all hover:scale-110"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: color ?? "rgba(255,255,255,0.5)",
      }}
    >
      {children}
    </button>
  );
}
