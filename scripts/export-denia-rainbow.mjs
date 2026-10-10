// Reproducible effect layers over the accepted current Denia sprite.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import sharp from "sharp";
import { normalizePortraitBuffer, validateNormalizedPortrait } from "./characterPortraitNormalization.mjs";

const output = "output/denia-rainbow-chibi-v1";
const sourcePath = "public/assets/characters/story-sprites/denia/surprised.webp";
const width = 832;
const height = 1216;
const count = 24;
const delay = 60;
const colors = ["#f982ac", "#ffb45a", "#ffe571", "#8de3aa", "#83dbed", "#a3b4fa", "#d5a4ee"];
const jets = [
  { name: "left-eye", origin: [365, 476], end: [43, 356], startWidth: 49, endWidth: 91 },
  { name: "right-eye", origin: [550, 501], end: [793, 397], startWidth: 43, endWidth: 83 },
  { name: "mouth", origin: [455, 557], end: [660, 774], startWidth: 20, endWidth: 77 }
];
const number = (value) => value.toFixed(2);
function ribbonPoint(jet, progress, edge, phase) {
  const dx = jet.end[0] - jet.origin[0];
  const dy = jet.end[1] - jet.origin[1];
  const length = Math.hypot(dx, dy);
  const wave = Math.sin(progress * Math.PI * 5 - phase) * 8 * progress ** 1.3
    + Math.sin(phase) * 5 * progress ** 2;
  const breadth = (jet.startWidth + (jet.endWidth - jet.startWidth) * progress)
    * (1 + Math.sin(phase - progress * Math.PI * 4) * 0.035 * progress);
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
  for (const jet of jets) {
    const outline = band(jet, -0.5, 0.5, phase);
    art += `<path d="${outline}" fill="#fff9d9" opacity=".32" filter="url(#glow)"/>`;
    art += `<path d="${outline}" fill="#714453" stroke="#714453" stroke-width="3" stroke-linejoin="round" opacity=".62"/>`;
    colors.forEach((color, i) => {
      art += `<path d="${band(jet, i / 7 - 0.5, (i + 1) / 7 - 0.5 + 0.003, phase)}" fill="${color}"/>`;
    });
    // Highlights move out from the emission point, never across the whole face.
    for (let i = 0; i < 3; i++) {
      const progress = (frame / count + i / 3) % 1;
      const [x, y] = ribbonPoint(jet, progress, 0.18 * Math.sin(i * 2), phase);
      const opacity = Math.sin(progress * Math.PI) * 0.65;
      art += `<path d="M${number(x - 4)},${number(y)} L${number(x)},${number(y - 6)} L${number(x + 4)},${number(y)} L${number(x)},${number(y + 6)} Z" fill="#fffbe8" opacity="${number(opacity)}"/>`;
    }
    const [x, y] = jet.origin;
    const radius = jet.name === "mouth" ? 9 : 18;
    art += `<ellipse cx="${x}" cy="${y}" rx="${radius}" ry="${radius * 0.85}" fill="#fffbe8" opacity=".65" filter="url(#soft)"/>`;
    art += `<ellipse cx="${x}" cy="${y}" rx="${radius * 0.4}" ry="${radius * 0.35}" fill="#fffbe8" opacity=".85"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><filter id="glow" x="-30%" y="-70%" width="160%" height="240%"><feGaussianBlur stdDeviation="5"/></filter><filter id="soft"><feGaussianBlur stdDeviation="3"/></filter></defs>${art}</svg>`;
}
async function atomicWrite(path, data) {
  await writeFile(`${path}.new`, data);
  await rename(`${path}.new`, path);
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
await atomicWrite(`${portraitRoot}/rainbow-spray.webp`, animation);
const still = await sharp(frames[0]).webp({ lossless: true }).toBuffer();
await atomicWrite(`${portraitRoot}/rainbow-spray-still.webp`, still);
await atomicWrite("public/assets/characters/denia_color.webp", animation);
await atomicWrite("public/assets/characters/denia_color.gif", await readFile(`${output}/denia-rainbow.gif`));
await atomicWrite("public/assets/characters/portraits/denia-candy.webp", normalized.buffer);
await writeFile(`${output}/manifest.json`, JSON.stringify({ sourcePath,
  sourceSha256: createHash("sha256").update(source).digest("hex"),
  width, height, frames: count, delay, loop: 0, durationMs: count * delay, jets,
  sourceProtection: verification, normalizedPortrait: validation,
  nativeBytes: animation.length, normalizedBytes: normalized.buffer.length,
  method: "Unchanged accepted surprised sprite with independent vector effect overlays; no generated face or body repaint."
}, null, 2) + "\n");
console.log(`Exported ${count} frames / ${count * delay}ms; native ${animation.length} bytes; normalized ${normalized.buffer.length} bytes. Source protection passed.`);
