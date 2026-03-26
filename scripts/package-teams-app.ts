/**
 * Packages the Teams app manifest + icons into teams-app/SignBridgeAI.zip
 * ready to upload via Teams Admin Center or "Upload a custom app".
 *
 * Run: npx tsx scripts/package-teams-app.ts
 */
import archiver from "archiver";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const teamsDir   = path.resolve(__dirname, "../teams-app");
const outputPath = path.join(teamsDir, "SignBridgeAI.zip");

// Verify required files exist before zipping
const required = ["manifest.json", "color.png", "outline.png"];
for (const file of required) {
  if (!fs.existsSync(path.join(teamsDir, file))) {
    console.error(`✗ Missing required file: teams-app/${file}`);
    process.exit(1);
  }
}

// Remove old zip if present
if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

const output  = fs.createWriteStream(outputPath);
const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", () => {
  const kb = (archive.pointer() / 1024).toFixed(1);
  console.log(`✓ teams-app/SignBridgeAI.zip created (${kb} KB)`);
  console.log("");
  console.log("Contents:");
  for (const file of required) {
    const size = fs.statSync(path.join(teamsDir, file)).size;
    console.log(`  ${file.padEnd(20)} ${size} bytes`);
  }
  console.log("");
  console.log("Next steps:");
  console.log("  1. Open Microsoft Teams");
  console.log("  2. Apps → Manage your apps → Upload a custom app");
  console.log("  3. Select: teams-app/SignBridgeAI.zip");
});

archive.on("error", (err: Error) => { throw err; });
archive.pipe(output);

for (const file of required) {
  archive.file(path.join(teamsDir, file), { name: file });
}

archive.finalize();
