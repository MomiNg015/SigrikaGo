// Reproducible effect layers over the accepted current Denia sprite.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rename, unlink } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
import sharp from "sharp";
import { normalizePortraitBuffer, validateNormalizedPortrait } from "./characterPortraitNormalization.mjs";

const output = "output/denia-rainbow-covered-v4";
const sourcePath = "public/assets/characters/story-sprites/denia/surprised.webp";
const width = 832;
const height = 1216;
const count = 24;
const delay = 60;
// The original GIF advances roughly one spectral band per 70ms. Three full
// rolls per 1.44s loop match that speed while closing the loop exactly.
const colorRollsPerLoop = 3;
const colors = ["#ff3268", "#ff962e", "#ffe83a", "#79f257", "#3ddfee", "#5377ff", "#ba55ff"];
const jets = [
  { name: "left-eye", origin: [365, 476], end: [43, 356], startWidth: 120, endWidth: 107,
    emitter: { center: [354, 467], radii: [80, 62] } },
  { name: "right-eye", origin: [550, 501], end: [793, 397], startWidth: 112, endWidth: 99,
    emitter: { center: [555, 501], radii: [69, 61] } },
  { name: "mouth", origin: [455, 557], end: [660, 774], startWidth: 44, endWidth: 78,
    emitter: { center: [455, 557], radii: [23, 28] } }
];
const number = (value) => value.toFixed(2);
function ribbonPoint(jet, progress, edge, phase) {
  const dx = jet.end[0] - jet.origin[0];
  const dy = jet.end[1] - jet.origin[1];
  const length = Math.hypot(dx, dy);
  const wave = Math.sin(progress * Math.PI * 4 - phase) * 1.8 * progress ** 1.3
    + Math.sin(phase) * 1.2 * progress ** 2;
  const breadth = (jet.startWidth + (jet.endWidth - jet.startWidth) * progress)
    * (1 + Math.sin(phase - progress * Math.PI * 4) * 0.02 * progress);
  const normal = wave + breadth * edge;
  return [jet.origin[0] + dx * progress - dy / length * normal,
    jet.origin[1] + dy * progress + dx / length * normal];
}
function band(jet, bottom, top, phase) {
  const points = [];
  for (let i = 0; i <= 40; i++) points.push(ribbonPoint(jet, i / 40, bottom, phase));
  for (let i = 40; i >= 0; i--) points.push(ribbonPoint(jet, i / 40, top, phase));
  return `M${points.map(([x, y]) => `${number(x)},${number(y)}`).join(" L")} Z`;
}
function overlay(frame) {
  const phase = frame / count * Math.PI * 2;
  let art = "";
  let definitions = "";
  for (const jet of jets) {
    const [x, y] = jet.origin;
    // Distal light stays translucent; an independent opaque, feathered source
    // below covers the whole facial feature without making the entire ray solid.
    definitions += `<linearGradient id="fade-${jet.name}" gradientUnits="userSpaceOnUse" x1="${x}" y1="${y}" x2="${jet.end[0]}" y2="${jet.end[1]}"><stop offset="0" stop-color="white" stop-opacity=".12"/><stop offset=".12" stop-color="white" stop-opacity=".82"/><stop offset=".45" stop-color="white"/><stop offset=".72" stop-color="white" stop-opacity=".85"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="mask-${jet.name}" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="url(#fade-${jet.name})"/></mask>`;
    let bands = "";
    const colorOffset = (frame / count * colorRollsPerLoop) % 1;
    for (let i = 0; i < colors.length * 2; i++) {
      const bottom = Math.max(-0.5, i / colors.length - 0.5 - colorOffset);
      const top = Math.min(0.5, (i + 1) / colors.length - 0.5 - colorOffset);
      if (top <= bottom) continue;
      bands += `<path d="${band(jet, bottom - 0.012, top + 0.012, phase)}" fill="${colors[i % colors.length]}"/>`;
    }
    const pulse = 0.93 + 0.07 * Math.sin(phase);
    art += `<g mask="url(#mask-${jet.name})" opacity="${number(pulse)}"><g filter="url(#glow)" opacity=".36">${bands}</g><g filter="url(#blend)" opacity=".58">${bands}</g>`;
    // Faint longitudinal glints travel outward with smooth fade-in/out at the loop.
    for (let i = 0; i < 2; i++) {
      const progress = (frame / count + i / 3) % 1;
      const start = ribbonPoint(jet, Math.max(0, progress - 0.14), (i - 0.5) * 0.3, phase);
      const end = ribbonPoint(jet, progress, (i - 0.5) * 0.3, phase);
      art += `<path d="M${start.map(number).join(",")} L${end.map(number).join(",")}" stroke="#fffce0" stroke-width="3" stroke-linecap="round" opacity="${number(Math.sin(progress * Math.PI) ** 2 * 0.18)}" filter="url(#blend)"/>`;
    }
    art += "</g>";
    definitions += `<linearGradient id="root-fade-${jet.name}" gradientUnits="userSpaceOnUse" x1="${x}" y1="${y}" x2="${jet.end[0]}" y2="${jet.end[1]}"><stop offset="0" stop-color="white"/><stop offset=".18" stop-color="white"/><stop offset=".5" stop-color="white" stop-opacity="0"/></linearGradient><mask id="root-mask-${jet.name}" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="url(#root-fade-${jet.name})"/></mask>`;
    art += `<g mask="url(#root-mask-${jet.name})"><g filter="url(#blend)">${bands}</g></g>`;
    const { center: [cx, cy], radii: [rx, ry] } = jet.emitter;
    definitions += `<radialGradient id="source-fade-${jet.name}"><stop offset="0" stop-color="white"/><stop offset=".82" stop-color="white"/><stop offset=".9" stop-color="white" stop-opacity=".98"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient><mask id="source-mask-${jet.name}" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#source-fade-${jet.name})"/></mask>`;
    // Continue the same spectral bands behind the ray origin so its source covers
    // the full eye/mouth rather than stopping at the center of the pupil/lips.
    let sourceBands = "";
    for (let i = -colors.length; i < colors.length * 3; i++) {
      const bottom = (i / colors.length - 0.5 - colorOffset) * jet.startWidth;
      const color = colors[(i + colors.length) % colors.length];
      sourceBands += `<rect x="-120" y="${number(bottom - 0.5)}" width="240" height="${number(jet.startWidth / colors.length + 1)}" fill="${color}"/>`;
    }
    const angle = Math.atan2(jet.end[1] - y, jet.end[0] - x) * 180 / Math.PI;
    const sourceArt = `<g transform="translate(${x} ${y}) rotate(${number(angle)})">${sourceBands}</g>`;
    art += `<g filter="url(#glow)" opacity=".35"><g mask="url(#source-mask-${jet.name})">${sourceArt}</g></g>`;
    art += `<g mask="url(#source-mask-${jet.name})"><g filter="url(#blend)">${sourceArt}</g></g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><filter id="glow" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="8"/></filter><filter id="blend" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="2.8"/></filter>${definitions}</defs>${art}</svg>`;
}
async function writeAsset(path, data) {
  await writeFile(`${path}.new`, data);
  for (let attempt = 0; ; attempt++) {
    try {
      await rename(`${path}.new`, path);
      return;
    } catch (error) {
      // Windows readers/watchers can briefly hold the existing destination open.
      if (!["EPERM", "EBUSY", "EACCES"].includes(error.code)) throw error;
      if (attempt >= 5) {
        // Some Windows preview readers allow writes but deny replacement of the
        // directory entry. Keep the validated .new copy until the write succeeds.
        await writeFile(path, data);
        await unlink(`${path}.new`);
        return;
      }
      await setTimeout(200 * 2 ** attempt);
    }
  }
}
await mkdir(`${output}/frames`, { recursive: true });
await mkdir(`${output}/effects`, { recursive: true });
const source = await readFile(sourcePath);
const original = await sharp(source).ensureAlpha().raw().toBuffer();
const frames = [];
const verification = [];
for (let index = 0; index < count; index++) {
  const svg = Buffer.from(overlay(index));
  const effect = await sharp(svg).png().toBuffer();
  const composited = await sharp(source).composite([{ input: effect }]).png().toBuffer();
  const pixels = await sharp(composited).ensureAlpha().raw().toBuffer();
  const mask = await sharp(effect).ensureAlpha().raw().toBuffer();
  // Avoid premultiplied-alpha rounding on untouched semi-transparent source edges.
  for (let p = 0; p < original.length; p += 4) {
    if (!mask[p + 3]) original.copy(pixels, p, p, p + 4);
  }
  const frame = await sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer();
  let differences = 0;
  for (let p = 0; p < original.length; p += 4) {
    if (!mask[p + 3] && (original[p + 3] !== pixels[p + 3]
      || (original[p + 3] && !original.subarray(p, p + 3).equals(pixels.subarray(p, p + 3))))) differences++;
  }
  if (differences) throw new Error(`Source changed outside effect overlay: frame ${index}`);
  frames.push(frame);
  verification.push({ frame: index, outsideEffectVisiblePixelDifferences: differences });
  const name = String(index).padStart(2, "0");
  await writeFile(`${output}/frames/${name}.png`, frame);
  await writeFile(`${output}/effects/${name}.svg`, svg);
}
const animation = await sharp(frames, { join: { animated: true } })
  .webp({ lossless: true, minSize: true, effort: 4, delay: Array(count).fill(delay), loop: 0 }).toBuffer();
await writeFile(`${output}/denia-rainbow-native.webp`, animation);
const gifFrames = await Promise.all(frames.map(frame => sharp(frame).resize(640, 935).png().toBuffer()));
await sharp(gifFrames, { join: { animated: true } })
  .gif({ delay: Array(count).fill(delay), loop: 0, effort: 7, colours: 256 })
  .toFile(`${output}/denia-rainbow.gif`);
const normalized = await normalizePortraitBuffer(animation);
const validation = await validateNormalizedPortrait(normalized.buffer, { requireAnimation: true });
if (!validation.ok) throw new Error(JSON.stringify(validation));
const portraitRoot = "public/assets/characters/story-sprites/denia";
await writeAsset(`${portraitRoot}/rainbow-spray.webp`, animation);
const still = await sharp(frames[0]).webp({ lossless: true }).toBuffer();
await writeAsset(`${portraitRoot}/rainbow-spray-still.webp`, still);
await writeAsset("public/assets/characters/denia_color.webp", animation);
await writeAsset("public/assets/characters/denia_color.gif", await readFile(`${output}/denia-rainbow.gif`));
await writeAsset("public/assets/characters/portraits/denia-candy.webp", normalized.buffer);
await writeFile(`${output}/manifest.json`, JSON.stringify({ sourcePath,
  sourceSha256: createHash("sha256").update(source).digest("hex"),
  width, height, frames: count, delay, loop: 0, durationMs: count * delay, jets,
  colorRollsPerLoop, colorRollPeriodMs: count * delay / colorRollsPerLoop,
  sourceProtection: verification, normalizedPortrait: validation,
  nativeBytes: animation.length, normalizedBytes: normalized.buffer.length,
  method: "Unchanged accepted surprised sprite with independent vector effect overlays; no generated face or body repaint."
}, null, 2) + "\n");
console.log(`Exported ${count} frames / ${count * delay}ms; native ${animation.length} bytes; normalized ${normalized.buffer.length} bytes. Source protection passed.`);
