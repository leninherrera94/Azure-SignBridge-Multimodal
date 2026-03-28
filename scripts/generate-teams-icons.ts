/**
 * Generates teams-app/color.png (192x192) and teams-app/outline.png (32x32)
 * using raw SVG → sharp PNG conversion. No native canvas needed.
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(__dirname, "../teams-app");

// ── color.png: 192×192, cyan background, "SB" in white ────────────────────────
const colorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192">
  <rect width="192" height="192" rx="32" ry="32" fill="#06B6D4"/>
  <text
    x="96" y="120"
    font-family="Arial, Helvetica, sans-serif"
    font-size="88"
    font-weight="bold"
    text-anchor="middle"
    fill="white"
    letter-spacing="-4"
  >SB</text>
</svg>`;

// ── outline.png: 32×32, transparent background, "SB" in white ─────────────────
const outlineSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
  <rect width="32" height="32" rx="5" ry="5" fill="none" stroke="white" stroke-width="2"/>
  <text
    x="16" y="22"
    font-family="Arial, Helvetica, sans-serif"
    font-size="14"
    font-weight="bold"
    text-anchor="middle"
    fill="white"
    letter-spacing="-1"
  >SB</text>
</svg>`;

async function main() {
  await sharp(Buffer.from(colorSvg))
    .png()
    .toFile(path.join(out, "color.png"));
  console.log("✓ teams-app/color.png  (192×192)");

  await sharp(Buffer.from(outlineSvg))
    .png()
    .toFile(path.join(out, "outline.png"));
  console.log("✓ teams-app/outline.png (32×32)");
}

main().catch((e) => { console.error(e); process.exit(1); });
