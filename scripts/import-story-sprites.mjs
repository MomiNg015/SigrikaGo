import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { CHARACTER_STORY_SPRITES } from "../src/shared/characterStorySprites.js";

const sourceIndex = process.argv.indexOf("--source-root");
if (sourceIndex < 0 || !process.argv[sourceIndex + 1]) throw new Error("Usage: node scripts/import-story-sprites.mjs --source-root <delivery-root>");
const sourceRoot = path.resolve(process.argv[sourceIndex + 1]);
const outputRoot = path.resolve("public/assets/characters/story-sprites");
const manifest = { version: 1, fullSize: [832, 1216], avatarSize: [256, 256], files: [] };
for (const entry of Object.values(CHARACTER_STORY_SPRITES)) {
  const target = path.join(outputRoot, entry.characterId);
  await mkdir(target, { recursive: true });
  for (const expression of entry.expressions) {
    const input = await readFile(path.join(sourceRoot, entry.sourcePackage, "exports/native", `${entry.sourcePrefix}${expression}.png`));
    const original = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (original.info.width !== entry.width || original.info.height !== entry.height) throw new Error(`Unexpected source dimensions: ${entry.characterId}/${expression}`);
    const full = await sharp(input).webp({ lossless: true, effort: 6 }).toBuffer();
    const decoded = await sharp(full).ensureAlpha().raw().toBuffer();
    for (let pixel = 0; pixel < decoded.length; pixel += 4) {
      if (decoded[pixel + 3] !== original.data[pixel + 3] || (decoded[pixel + 3] && !decoded.subarray(pixel, pixel + 3).equals(original.data.subarray(pixel, pixel + 3)))) throw new Error(`Visible pixels changed: ${entry.characterId}/${expression}`);
    }
    const avatar = await sharp(input).extract(entry.avatarCrop).resize(256, 256).webp({ lossless: true, effort: 6 }).toBuffer();
    await writeFile(path.join(target, `${expression}.webp`), full);
    await writeFile(path.join(target, `${expression}-avatar.webp`), avatar);
    manifest.files.push({ characterId: entry.characterId, appearanceId: entry.appearanceId, expressionId: expression, sourcePackage: entry.sourcePackage, sourceSha256: createHash("sha256").update(input).digest("hex"), crop: entry.avatarCrop, fullBytes: full.length, avatarBytes: avatar.length });
  }
}
await writeFile(path.join(outputRoot, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Imported ${manifest.files.length} expressions; visible RGB and alpha unchanged. Full: ${manifest.files.reduce((sum, file) => sum + file.fullBytes, 0)} bytes; avatars: ${manifest.files.reduce((sum, file) => sum + file.avatarBytes, 0)} bytes.`);
