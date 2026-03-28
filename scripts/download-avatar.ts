/**
 * scripts/download-avatar.ts
 *
 * Downloads a Ready Player Me avatar GLB with full hand rig.
 * Run: npm run download-avatar
 */

import fs   from "fs";
import path from "path";

const MODEL_DIR  = path.join(process.cwd(), "public", "models", "avatar");
const MODEL_PATH = path.join(MODEL_DIR, "avatar.glb");

const RPM_URL =
  "https://models.readyplayer.me/64bfa15f0e72c63d7c3934f6.glb" +
  "?morphTargets=ARKit,Oculus+Visemes&textureAtlas=1024&lod=0";

const FALLBACK_URL =
  "https://models.readyplayer.me/6460d95f9ae8cb45e3431301.glb" +
  "?morphTargets=ARKit&textureAtlas=1024&lod=0";

function printManualInstructions(): void {
  console.log("\n📋 Manual download instructions:");
  console.log("\n  Option A — direct GLB link (open in browser → File → Save):");
  console.log(`    ${RPM_URL}`);
  console.log(`  Save to: ${MODEL_PATH}`);
  console.log("\n  Option B — create your own avatar:");
  console.log("    1. Go to https://readyplayer.me/hub");
  console.log("    2. Create a free avatar");
  console.log("    3. Click Download → GLB");
  console.log(`    4. Save to: ${MODEL_PATH}`);
  console.log("\n  Option C — fallback neutral avatar:");
  console.log(`    ${FALLBACK_URL}`);
  console.log(`  Save to: ${MODEL_PATH}`);
}

async function tryDownload(url: string, label: string): Promise<boolean> {
  console.log(`\n📥 Trying ${label}...`);
  console.log(`   ${url}`);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "SignBridgeAI/1.0" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 10_000) throw new Error("File too small — likely an error page");
    fs.writeFileSync(MODEL_PATH, Buffer.from(buf));
    const mb = (buf.byteLength / 1024 / 1024).toFixed(1);
    console.log(`✅ Downloaded (${mb} MB) → ${MODEL_PATH}`);
    return true;
  } catch (err: unknown) {
    console.warn(`   ⚠️  Failed: ${(err as Error).message}`);
    return false;
  }
}

async function main(): Promise<void> {
  // Ensure directory
  if (!fs.existsSync(MODEL_DIR)) fs.mkdirSync(MODEL_DIR, { recursive: true });

  // Already downloaded?
  if (fs.existsSync(MODEL_PATH)) {
    const mb = (fs.statSync(MODEL_PATH).size / 1024 / 1024).toFixed(1);
    console.log(`✅ Avatar already present (${mb} MB): ${MODEL_PATH}`);
    return;
  }

  const ok =
    (await tryDownload(RPM_URL, "primary RPM avatar")) ||
    (await tryDownload(FALLBACK_URL, "fallback RPM avatar"));

  if (!ok) {
    console.error("\n❌ Automatic download failed (CORS or network issue).");
    printManualInstructions();
    process.exit(1);
  }
}

main();
