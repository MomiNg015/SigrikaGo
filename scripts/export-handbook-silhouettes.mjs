import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { portraitSilhouette } from './portraitSilhouette.js';

const root = new URL('../', import.meta.url);
const directory = 'public/assets/characters/handbook-chibi-sprites/';
const portraits = JSON.parse(await readFile(new URL(`${directory}manifest.json`, root), 'utf8'));
const masks = [];
for (const sprite of portraits.sprites) {
  const source = await readFile(new URL(sprite.source.path, root));
  const hash = createHash('sha256').update(source).digest('hex');
  if (hash !== sprite.source.sha256) throw new Error(`${sprite.id}: export portraits before silhouettes`);
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = portraitSilhouette(data, info.width, info.height);
  const bytes = await sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ lossless: true, effort: 6 }).toBuffer();
  const decoded = await sharp(bytes).ensureAlpha().raw().toBuffer();
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] !== decoded[index]) throw new Error(`${sprite.id}: silhouette alpha verification failed`);
  }
  const path = `${directory}${sprite.id}-silhouette.webp`;
  await writeFile(new URL(path, root), bytes);
  masks.push({ id: sprite.id, sourceSha256: hash, path, bytes: bytes.length,
    width: info.width, height: info.height, alphaValues: [0, 255], enclosedHolesFilled: true });
}
await writeFile(new URL(`${directory}silhouette-manifest.json`, root), JSON.stringify({
  generator: 'scripts/export-handbook-silhouettes.mjs', alphaThreshold: 128, masks,
}, null, 2) + '\n');
console.log(`Verified ${masks.length} solid silhouette masks (${masks.reduce((sum, mask) => sum + mask.bytes, 0)} bytes)`);
