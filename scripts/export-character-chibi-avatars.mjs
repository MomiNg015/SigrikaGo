import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { CHARACTER_CHIBI_LANDMARKS } from '../src/shared/characterChibiPortraits.js';

const directory = new URL('../public/assets/characters/handbook-chibi-sprites/', import.meta.url);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const avatars = [];
for (const [id, landmarks] of Object.entries(CHARACTER_CHIBI_LANDMARKS)) {
  const source = await readFile(new URL(`${id}.webp`, directory));
  // Keep the entire source width and crown/halo. Eye-centred squares removed
  // headwear before the browser could choose its own avatar framing.
  const size = 832;
  const crop = {
    left: 0,
    top: Math.max(0, Math.min(landmarks.bodyTop - 24, Math.round(landmarks.focal[1] - size * .62))),
    width: size, height: size,
  };
  const expected = await sharp(source).extract(crop).resize(512, 512).ensureAlpha().raw().toBuffer();
  const output = await sharp(expected, { raw: { width: 512, height: 512, channels: 4 } })
    .webp({ lossless: true, effort: 6 }).toBuffer();
  const decoded = await sharp(output).ensureAlpha().raw().toBuffer();
  for (let pixel = 0; pixel < expected.length; pixel += 4) {
    if (decoded[pixel + 3] !== expected[pixel + 3]
      || (expected[pixel + 3] && !decoded.subarray(pixel, pixel + 3).equals(expected.subarray(pixel, pixel + 3)))) {
      throw new Error(`${id}: avatar pixel verification failed`);
    }
  }
  await writeFile(new URL(`${id}-avatar.webp`, directory), output);
  avatars.push({ id, crop, width: 512, height: 512, sourceSha256: hash(source), sha256: hash(output), bytes: output.length });
}
await writeFile(new URL('avatar-manifest.json', directory), `${JSON.stringify({ generator: 'scripts/export-character-chibi-avatars.mjs', avatars }, null, 2)}\n`);
console.log(`Verified ${avatars.length} lossless avatars, ${avatars.reduce((sum, avatar) => sum + avatar.bytes, 0)} bytes.`);
