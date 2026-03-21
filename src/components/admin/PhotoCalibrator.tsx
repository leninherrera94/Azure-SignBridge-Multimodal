"use client";

import { useRef, useState } from "react";
import type { PoseFingers } from "@/lib/azure/signs-db";

// ─── MediaPipe landmark indices ────────────────────────────────────────────────
// Hand: wrist=0, thumb=[1-4], index=[5-8], middle=[9-12], ring=[13-16], pinky=[17-20]

interface Landmark { x: number; y: number; z: number }

function angleBetween(a: Landmark, b: Landmark, c: Landmark): number {
  const v1 = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const v2 = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const m1  = Math.sqrt(v1.x ** 2 + v1.y ** 2 + v1.z ** 2);
  const m2  = Math.sqrt(v2.x ** 2 + v2.y ** 2 + v2.z ** 2);
  if (m1 === 0 || m2 === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (m1 * m2)));
  return Math.acos(cos) * (180 / Math.PI);
}

function curlDeg(lm: Landmark[], mcp: number, pip: number, tip: number): number {
  // Angle at the PIP joint (MCP→PIP→TIP); 180°=straight, ~90°=curled
  const deg = angleBetween(lm[mcp], lm[pip], lm[tip]);
  // Remap: 180° → 0 (extended), 0° → 90 (fully curled)
  return Math.round(Math.max(0, Math.min(90, (180 - deg) / 2)));
}

function landmarksToFingers(lm: Landmark[]): PoseFingers {
  return {
    thumb:  curlDeg(lm, 1,  2,  4),
    index:  curlDeg(lm, 5,  6,  8),
    middle: curlDeg(lm, 9,  10, 12),
    ring:   curlDeg(lm, 13, 14, 16),
    pinky:  curlDeg(lm, 17, 18, 20),
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PhotoCalibratorProps {
  onDetected: (fingers: PoseFingers) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PhotoCalibrator({ onDetected }: PhotoCalibratorProps) {
  const fileRef    = useRef<HTMLInputElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl]   = useState<string | null>(null);
  const [detected, setDetected]   = useState<PoseFingers | null>(null);
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState<string | null>(null);

  async function processImage(file: File) {
    setLoading(true);
    setError(null);
    setDetected(null);

    const url = URL.createObjectURL(file);
    setImageUrl(url);

    try {
      // Dynamically import MediaPipe Hands
      const { Hands } = await import("@mediapipe/hands");

      let resolved = false;

      await new Promise<void>((resolve, reject) => {
        const hands = new Hands({
          locateFile: (f: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
        });

        hands.setOptions({
          maxNumHands:          1,
          modelComplexity:      1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence:  0.5,
        });

        hands.onResults((results: { multiHandLandmarks?: Landmark[][] }) => {
          if (resolved) return;
          resolved = true;

          const canvas = canvasRef.current;
          const lmList = results.multiHandLandmarks?.[0];

          if (!canvas) { resolve(); return; }

          // Draw image + landmarks on canvas
          const img = new Image();
          img.onload = () => {
            canvas.width  = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) { resolve(); return; }

            ctx.drawImage(img, 0, 0);

            if (lmList) {
              // Draw connections
              const connections = [
                [0,1],[1,2],[2,3],[3,4],
                [0,5],[5,6],[6,7],[7,8],
                [0,9],[9,10],[10,11],[11,12],
                [0,13],[13,14],[14,15],[15,16],
                [0,17],[17,18],[18,19],[19,20],
                [5,9],[9,13],[13,17],
              ];
              ctx.strokeStyle = "rgba(6,182,212,0.8)";
              ctx.lineWidth   = 2;
              for (const [a, b] of connections) {
                ctx.beginPath();
                ctx.moveTo(lmList[a].x * img.width, lmList[a].y * img.height);
                ctx.lineTo(lmList[b].x * img.width, lmList[b].y * img.height);
                ctx.stroke();
              }
              // Draw points
              for (const lm of lmList) {
                ctx.beginPath();
                ctx.arc(lm.x * img.width, lm.y * img.height, 4, 0, Math.PI * 2);
                ctx.fillStyle = "#06b6d4";
                ctx.fill();
              }

              const fingers = landmarksToFingers(lmList);
              setDetected(fingers);
            } else {
              setError("No hand detected in the photo. Try a clearer image with the hand visible.");
            }
            resolve();
          };
          img.src = url;
        });

        // Send the image to MediaPipe
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = async () => {
          try {
            await hands.send({ image: img });
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = url;

        // Timeout safety
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            setError("Detection timed out. Try a different photo.");
            resolve();
          }
        }, 8000);
      });
    } catch (e) {
      console.error("[PhotoCalibrator]", e);
      setError("MediaPipe failed to initialize. Make sure you have internet access (CDN required).");
    } finally {
      setLoading(false);
    }
  }

  function handleFile(files: FileList | null) {
    if (!files?.[0]) return;
    processImage(files[0]);
  }

  function handleApply() {
    if (detected) onDetected(detected);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Upload zone */}
      <div
        className="relative rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:border-cyan-400 flex items-center justify-center p-6 text-center"
        style={{ borderColor: "rgba(255,255,255,0.15)", minHeight: 100 }}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files); }}
        aria-label="Upload reference photo"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") fileRef.current?.click(); }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files)}
        />
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-cyan-400">
            <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
            Detecting hand landmarks…
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-400">
              📷 Upload Reference Photo
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Drag &amp; drop or click · Auto-detects finger positions
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 rounded-lg px-3 py-2"
           style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </p>
      )}

      {/* Canvas preview */}
      {imageUrl && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          <canvas
            ref={canvasRef}
            className="w-full h-auto block"
            style={{ maxHeight: 200, objectFit: "contain" }}
          />
        </div>
      )}

      {/* Detected values */}
      {detected && (
        <div
          className="rounded-xl p-3"
          style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}
        >
          <p className="text-xs text-cyan-400 font-semibold mb-2">✓ Hand detected — finger curl angles:</p>
          <div className="grid grid-cols-5 gap-1 text-center mb-3">
            {(["thumb", "index", "middle", "ring", "pinky"] as const).map((f) => (
              <div key={f}>
                <div className="text-sm font-bold text-white">{detected[f]}°</div>
                <div className="text-xs text-slate-500">{f.charAt(0).toUpperCase()}</div>
              </div>
            ))}
          </div>
          <button
            onClick={handleApply}
            className="w-full py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)" }}
          >
            Apply Finger Values to Sliders
          </button>
        </div>
      )}

      <p className="text-xs text-slate-600">
        Note: Only finger curl is detected from photos. Adjust arm position manually with sliders.
      </p>
    </div>
  );
}
