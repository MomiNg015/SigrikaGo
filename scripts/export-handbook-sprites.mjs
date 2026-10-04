import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = "docs/design-samples/handbook-puzzle/assets/characters";
const outputDirectory = "public/assets/characters/handbook-sprites";
const characterIds = [
  "sigrika", "denia", "aemeath", "lynae", "mornye",
  "chisa", "changli", "qiuyuan", "nabomo",
];
const expectedDimensions = { width: 832, height: 1216 };
const losslessOptions = { lossless: true, quality: 100, alphaQuality: 100, effort: 6 };
const lossyOptions = { lossless: false, quality: 95, alphaQuality: 100, effort: 6 };

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

function inspectPixels(pixels, width, height) {
  let transparentPixels = 0;
  let opaquePixels = 0;
  let partialAlphaPixels = 0;
  let opaqueBlackPixels = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let offset = 0; offset < pixels.length; offset += 4) {
    const alpha = pixels[offset + 3];
    if (alpha === 0) {
      transparentPixels += 1;
      continue;
    }
    if (alpha === 255) {
      opaquePixels += 1;
      if (pixels[offset] === 0 && pixels[offset + 1] === 0 && pixels[offset + 2] === 0) {
        opaqueBlackPixels += 1;
      }
    } else {
      partialAlphaPixels += 1;
    }
    const pixel = offset / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return {
    transparentPixels,
    opaquePixels,
    partialAlphaPixels,
    visiblePixels: opaquePixels + partialAlphaPixels,
    opaqueBlackPixels,
    visibleBounds: maxX < 0 ? null : {
      x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1,
    },
  };
}

function comparePixels(source, output) {
  assert(source.length === output.length, "Decoded image buffers must have equal lengths.");
  let alphaDifferences = 0;
  let visibleRgbPixelDifferences = 0;
  let visibleRgbMaxChannelDifference = 0;
  let visibleRgbAbsoluteChannelDifference = 0;
  let visibleRgbChannelsCompared = 0;
  let opaqueBlackPixelDifferences = 0;
  for (let offset = 0; offset < source.length; offset += 4) {
    const alpha = source[offset + 3];
    if (alpha !== output[offset + 3]) alphaDifferences += 1;
    // RGB values under fully transparent pixels do not contribute to the image.
    // In particular, no black-background removal or color-keying is performed.
    if (alpha === 0) continue;
    let rgbChanged = false;
    for (let channel = 0; channel < 3; channel += 1) {
      const difference = Math.abs(source[offset + channel] - output[offset + channel]);
      if (difference > 0) rgbChanged = true;
      visibleRgbMaxChannelDifference = Math.max(visibleRgbMaxChannelDifference, difference);
      visibleRgbAbsoluteChannelDifference += difference;
      visibleRgbChannelsCompared += 1;
    }
    if (rgbChanged) visibleRgbPixelDifferences += 1;
    if (alpha === 255 && source[offset] === 0 && source[offset + 1] === 0 && source[offset + 2] === 0
      && (output[offset] !== 0 || output[offset + 1] !== 0 || output[offset + 2] !== 0
        || output[offset + 3] !== 255)) {
      opaqueBlackPixelDifferences += 1;
    }
  }
  return {
    alphaIdentical: alphaDifferences === 0,
    alphaDifferences,
    visibleRgbIdentical: visibleRgbPixelDifferences === 0,
    visibleRgbPixelDifferences,
    visibleRgbChannelsCompared,
    visibleRgbMaxChannelDifference,
    visibleRgbMeanAbsoluteChannelDifference: visibleRgbChannelsCompared === 0 ? 0
      : Number((visibleRgbAbsoluteChannelDifference / visibleRgbChannelsCompared).toFixed(8)),
    opaqueBlackPixelDifferences,
  };
}

async function exportSprite(id) {
  const sourcePath = `${sourceDirectory}/${id}.png`;
  const outputPath = `${outputDirectory}/${id}.webp`;
  const sourceBytes = await readFile(path.join(projectRoot, sourcePath));
  const sourceHash = sha256(sourceBytes);
  const sourceMetadata = await sharp(sourceBytes).metadata();
  assert(sourceMetadata.width === expectedDimensions.width
    && sourceMetadata.height === expectedDimensions.height, `${id}: unexpected source dimensions.`);
  assert(sourceMetadata.hasAlpha, `${id}: source alpha channel is required.`);

  // Do not resize, trim, rotate, flatten, or alter the original illustration.
  let compression = { mode: "lossless", ...losslessOptions };
  let outputBytes = await sharp(sourceBytes).webp(losslessOptions).toBuffer();
  const losslessCandidateBytes = outputBytes.length;
  if (outputBytes.length > sourceBytes.length) {
    compression = {
      mode: "quality-95",
      reason: "Lossless WebP was larger than the source PNG.",
      losslessCandidateBytes,
      ...lossyOptions,
    };
    outputBytes = await sharp(sourceBytes).webp(lossyOptions).toBuffer();
  }

  const outputMetadata = await sharp(outputBytes).metadata();
  assert(outputMetadata.width === sourceMetadata.width && outputMetadata.height === sourceMetadata.height,
    `${id}: output dimensions changed.`);
  assert(outputMetadata.hasAlpha, `${id}: output lost its alpha channel.`);
  const sourceRaw = await sharp(sourceBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const outputRaw = await sharp(outputBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert(sourceRaw.info.channels === 4 && outputRaw.info.channels === 4, `${id}: RGBA decoding failed.`);
  const verification = comparePixels(sourceRaw.data, outputRaw.data);
  assert(verification.alphaIdentical, `${id}: alpha pixels changed.`);
  if (compression.lossless) {
    assert(verification.visibleRgbIdentical, `${id}: lossless export changed visible RGB pixels.`);
    assert(verification.opaqueBlackPixelDifferences === 0, `${id}: opaque black pixels changed.`);
  }
  assert(sha256(await readFile(path.join(projectRoot, sourcePath))) === sourceHash,
    `${id}: source file changed during export.`);

  await writeFile(path.join(projectRoot, outputPath), outputBytes);
  assert(sha256(await readFile(path.join(projectRoot, outputPath))) === sha256(outputBytes),
    `${id}: written output does not match the verified buffer.`);
  const sourcePixels = inspectPixels(sourceRaw.data, sourceMetadata.width, sourceMetadata.height);
  const outputPixels = inspectPixels(outputRaw.data, outputMetadata.width, outputMetadata.height);
  const sprite = {
    id,
    source: {
      path: sourcePath, sha256: sourceHash, bytes: sourceBytes.length,
      width: sourceMetadata.width, height: sourceMetadata.height, hasAlpha: sourceMetadata.hasAlpha,
      pixels: sourcePixels,
    },
    output: {
      path: outputPath, sha256: sha256(outputBytes), bytes: outputBytes.length,
      width: outputMetadata.width, height: outputMetadata.height, hasAlpha: outputMetadata.hasAlpha,
      pixels: outputPixels,
    },
    compression,
    verification: { dimensionsIdentical: true, sourceFileUnchanged: true, ...verification },
  };
  console.log(`${id}: ${compression.mode}, ${sourceBytes.length} -> ${outputBytes.length} bytes; alpha exact, visible RGB ${verification.visibleRgbIdentical ? "exact" : "lossy"}`);
  return sprite;
}

await mkdir(path.join(projectRoot, outputDirectory), { recursive: true });
const sprites = [];
for (const id of characterIds) sprites.push(await exportSprite(id));
const sourceBytes = sprites.reduce((total, sprite) => total + sprite.source.bytes, 0);
const outputBytes = sprites.reduce((total, sprite) => total + sprite.output.bytes, 0);
const manifest = {
  schemaVersion: 1,
  generator: "scripts/export-handbook-sprites.mjs",
  dimensions: expectedDimensions,
  sharedUsage: "One full-body image per character, reused by handbook puzzle crops and character details.",
  transparencyPolicy: "Preserve the source alpha channel exactly. Fully transparent RGB is ignored only during comparison; no color-keying or background removal is applied.",
  encoderVersions: { sharp: sharp.versions.sharp, vips: sharp.versions.vips, webp: sharp.versions.webp },
  summary: {
    spriteCount: sprites.length,
    sourceBytes,
    outputBytes,
    savedBytes: sourceBytes - outputBytes,
    savedPercent: Number(((sourceBytes - outputBytes) / sourceBytes * 100).toFixed(4)),
    losslessCount: sprites.filter((sprite) => sprite.compression.lossless).length,
    alphaIdenticalForAll: sprites.every((sprite) => sprite.verification.alphaIdentical),
    visibleRgbIdenticalForAll: sprites.every((sprite) => sprite.verification.visibleRgbIdentical),
  },
  sprites,
};
await writeFile(path.join(projectRoot, outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest.summary));
