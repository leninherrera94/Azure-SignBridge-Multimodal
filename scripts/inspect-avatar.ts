/**
 * scripts/inspect-avatar.ts
 *
 * Diagnostic tool: prints the full bone hierarchy, morph targets,
 * bounding box, and asset stats of an avatar GLB file.
 *
 * Usage:  npx tsx scripts/inspect-avatar.ts [path/to/avatar.glb]
 * Default path: public/models/avatar/avatar.glb
 */

import path from "path";
import fs   from "fs";
import {
  NodeIO,
  Document,
  Scene as GltfScene,
  Node,
  Mesh,
} from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";

// ─── Colour helpers (ANSI) ────────────────────────────────────────────────────
const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  cyan:   "\x1b[36m",
  yellow: "\x1b[33m",
  green:  "\x1b[32m",
  magenta:"\x1b[35m",
  red:    "\x1b[31m",
  white:  "\x1b[37m",
};
const b  = (s: string) => `${C.bold}${s}${C.reset}`;
const cy = (s: string) => `${C.cyan}${s}${C.reset}`;
const yw = (s: string) => `${C.yellow}${s}${C.reset}`;
const gn = (s: string) => `${C.green}${s}${C.reset}`;
const mg = (s: string) => `${C.magenta}${s}${C.reset}`;
const dm = (s: string) => `${C.dim}${s}${C.reset}`;

// ─── Entry point ──────────────────────────────────────────────────────────────

const filePath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(process.cwd(), "public", "models", "avatar", "avatar.glb");

if (!fs.existsSync(filePath)) {
  console.error(`${C.red}✗ File not found: ${filePath}${C.reset}`);
  console.error(`  Run: npm run download-avatar  — or place a GLB at that path.`);
  process.exit(1);
}

const fileSizeMB = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2);

console.log(`\n${b("═══════════════════════════════════════════════════")}`);
console.log(b(`  GLB Inspector — SignBridge AI`));
console.log(`${b("═══════════════════════════════════════════════════")}`);
console.log(`  File : ${cy(filePath)}`);
console.log(`  Size : ${yw(fileSizeMB + " MB")}\n`);

async function main(): Promise<void> {

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc: Document = await io.read(filePath);

// ─── Section 1: Asset stats ───────────────────────────────────────────────────

const root      = doc.getRoot();
const scenes    = root.listScenes();
const nodes     = root.listNodes();
const meshes    = root.listMeshes();
const materials = root.listMaterials();
const textures  = root.listTextures();
const skins     = root.listSkins();
const anims     = root.listAnimations();

console.log(b("── 1. Asset Stats ───────────────────────────────────"));
console.log(`  Scenes     : ${gn(String(scenes.length))}`);
console.log(`  Nodes      : ${gn(String(nodes.length))}`);
console.log(`  Meshes     : ${gn(String(meshes.length))}`);
console.log(`  Materials  : ${gn(String(materials.length))}`);
console.log(`  Textures   : ${gn(String(textures.length))}`);
console.log(`  Skins      : ${gn(String(skins.length))}`);
console.log(`  Animations : ${gn(String(anims.length))}`);

// ─── Section 2: Bounding box ──────────────────────────────────────────────────

console.log(`\n${b("── 2. Bounding Box ──────────────────────────────────")}`);

let minX =  Infinity, minY =  Infinity, minZ =  Infinity;
let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

for (const mesh of meshes) {
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute("POSITION");
    if (!pos) continue;
    const count = pos.getCount();
    for (let i = 0; i < count; i++) {
      const v = pos.getElement(i, [0, 0, 0]);
      if (v[0] < minX) minX = v[0]; if (v[0] > maxX) maxX = v[0];
      if (v[1] < minY) minY = v[1]; if (v[1] > maxY) maxY = v[1];
      if (v[2] < minZ) minZ = v[2]; if (v[2] > maxZ) maxZ = v[2];
    }
  }
}

if (minX === Infinity) {
  console.log("  (no position data found)");
} else {
  const fmt = (n: number) => n.toFixed(4).padStart(9);
  console.log(`  Min : X${fmt(minX)}  Y${fmt(minY)}  Z${fmt(minZ)}`);
  console.log(`  Max : X${fmt(maxX)}  Y${fmt(maxY)}  Z${fmt(maxZ)}`);
  console.log(`  Size: X${fmt(maxX-minX)}  Y${fmt(maxY-minY)}  Z${fmt(maxZ-minZ)}`);
  console.log(`  Height (Y): ${yw((maxY - minY).toFixed(4))} units`);
}

// ─── Section 3: Node / bone hierarchy ────────────────────────────────────────

console.log(`\n${b("── 3. Node Hierarchy (all nodes) ────────────────────")}`);
console.log(dm("  [B] = has skin (bone candidate)  [M] = has mesh  [J] = jointOf skin\n"));

// Collect joint names from all skins
const jointNames = new Set<string>();
for (const skin of skins) {
  for (const joint of skin.listJoints()) {
    const name = joint.getName();
    if (name) jointNames.add(name);
  }
}

function printNode(node: Node, prefix: string, isLast: boolean): void {
  const name     = node.getName() || dm("(unnamed)");
  const hasMesh  = !!node.getMesh();
  const isJoint  = jointNames.has(node.getName() ?? "");

  const tags: string[] = [];
  if (isJoint)  tags.push(cy("[J]"));
  if (hasMesh)  tags.push(mg("[M]"));

  const connector = isLast ? "└─ " : "├─ ";
  const tagStr    = tags.length ? "  " + tags.join(" ") : "";

  console.log(`  ${prefix}${connector}${isJoint ? cy(name) : name}${tagStr}`);

  const children = node.listChildren();
  const childPrefix = prefix + (isLast ? "   " : "│  ");
  children.forEach((child, i) => {
    printNode(child, childPrefix, i === children.length - 1);
  });
}

for (const scene of scenes) {
  console.log(`  ${b("Scene:")} ${scene.getName() || dm("(unnamed)")}`);
  const rootNodes = scene.listChildren();
  rootNodes.forEach((n, i) => printNode(n, "", i === rootNodes.length - 1));
}

// ─── Section 4: Joint / bone names flat list ─────────────────────────────────

console.log(`\n${b("── 4. Skin Joints (bone names) ──────────────────────")}`);

if (skins.length === 0) {
  console.log("  (no skins found — model may not be rigged)");
} else {
  for (let si = 0; si < skins.length; si++) {
    const skin   = skins[si];
    const joints = skin.listJoints();
    console.log(`\n  ${b("Skin " + si + ":")} ${skin.getName() || dm("(unnamed)")}  [${joints.length} joints]`);

    joints.forEach((joint, i) => {
      const name = joint.getName() || dm("(unnamed)");
      const num  = String(i).padStart(3, " ");
      console.log(`    ${dm(num)}  ${cy(name)}`);
    });
  }
}

// ─── Section 5: Morph targets / blend shapes ─────────────────────────────────

console.log(`\n${b("── 5. Morph Targets / Blend Shapes ──────────────────")}`);

let totalMorphs = 0;
for (const mesh of meshes) {
  const meshName = mesh.getName() || dm("(unnamed mesh)");
  const prims    = mesh.listPrimitives();
  const allTargetNames: string[] = [];

  for (const prim of prims) {
    const targets = prim.listTargets();
    for (const tgt of targets) {
      const n = tgt.getName();
      if (n && !allTargetNames.includes(n)) allTargetNames.push(n);
    }
  }

  if (allTargetNames.length > 0) {
    console.log(`\n  ${b("Mesh:")} ${mg(meshName)}  (${allTargetNames.length} targets)`);
    allTargetNames.forEach((name, i) => {
      console.log(`    ${dm(String(i).padStart(3))}  ${yw(name)}`);
    });
    totalMorphs += allTargetNames.length;
  }
}

if (totalMorphs === 0) {
  console.log("  (no morph targets found)");
}

// ─── Section 6: Materials ─────────────────────────────────────────────────────

console.log(`\n${b("── 6. Materials ─────────────────────────────────────")}`);

if (materials.length === 0) {
  console.log("  (none)");
} else {
  materials.forEach((mat, i) => {
    const name   = mat.getName() || dm("(unnamed)");
    const base   = mat.getBaseColorFactor();
    const rough  = mat.getRoughnessFactor().toFixed(2);
    const metal  = mat.getMetallicFactor().toFixed(2);
    const hasTex = !!mat.getBaseColorTexture();
    console.log(`  ${String(i).padStart(2)}  ${gn(name)}${hasTex ? "  [tex]" : ""}  rough=${rough}  metal=${metal}`);
  });
}

// ─── Section 7: Animations ────────────────────────────────────────────────────

if (anims.length > 0) {
  console.log(`\n${b("── 7. Animations ────────────────────────────────────")}`);
  anims.forEach((anim, i) => {
    const channels = anim.listChannels();
    console.log(`  ${String(i).padStart(2)}  ${gn(anim.getName() || "(unnamed)")}  [${channels.length} channels]`);
  });
}

// ─── Section 8: Quick bone name summary for mapping ──────────────────────────

console.log(`\n${b("── 8. Bone Name Quick Reference ─────────────────────")}`);
console.log(dm("  Copy–paste these into your bone map in avatar-engine.ts\n"));

// Categorise by known patterns
const allJointNames = skins.length ? skins[0].listJoints().map((j) => j.getName()) : [];

const groups: Record<string, string[]> = {
  "Spine / Head":   [],
  "Right Arm":      [],
  "Left Arm":       [],
  "Right Hand":     [],
  "Left Hand":      [],
  "Legs / Hips":    [],
  "Other":          [],
};

for (const name of allJointNames) {
  if (!name) continue;
  const low = name.toLowerCase();
  if (/spine|neck|head|hips?|chest|shoulder/.test(low) && !/hand|arm|fore/.test(low)) {
    groups["Spine / Head"].push(name);
  } else if (/right.*(arm|fore|shoulder)/i.test(name) || /(arm|fore|shoulder).*right/i.test(name)) {
    groups["Right Arm"].push(name);
  } else if (/left.*(arm|fore|shoulder)/i.test(name) || /(arm|fore|shoulder).*left/i.test(name)) {
    groups["Left Arm"].push(name);
  } else if (/right.*hand|right.*finger|right.*thumb|right.*index|right.*middle|right.*ring|right.*pinky/i.test(name)) {
    groups["Right Hand"].push(name);
  } else if (/left.*hand|left.*finger|left.*thumb|left.*index|left.*middle|left.*ring|left.*pinky/i.test(name)) {
    groups["Left Hand"].push(name);
  } else if (/leg|knee|ankle|foot|toe|hip/i.test(low)) {
    groups["Legs / Hips"].push(name);
  } else {
    groups["Other"].push(name);
  }
}

for (const [group, names] of Object.entries(groups)) {
  if (names.length === 0) continue;
  console.log(`  ${b(group + ":")}  (${names.length})`);
  names.forEach((n) => console.log(`    ${cy(n)}`));
  console.log();
}

console.log(`${b("═══════════════════════════════════════════════════")}`);
console.log(`${b("  Done.")}  Use Section 4 & 8 to update bone mappings.\n`);

} // ── end main ──────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
