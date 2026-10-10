import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { expect, it } from "vitest";

function hue([r, g, b]) {
  const high = Math.max(r, g, b);
  const low = Math.min(r, g, b);
  const delta = high - low;
  if (!delta) return 0;
  const sector = high === r ? (g - b) / delta : high === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return (sector * 60 + 360) % 360;
}

it("rolls the rainbow spectrum through all three beams instead of only shimmering", async () => {
  const input = await readFile("public/assets/characters/story-sprites/denia/rainbow-spray.webp");
  const metadata = await sharp(input, { animated: true }).metadata();
  expect(metadata.pages).toBe(24);
  expect(metadata.delay).toEqual(Array(24).fill(60));
  const { data, info } = await sharp(input, { animated: true }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const stride = info.width * metadata.pageHeight * 4;
  // Fixed positions inside the left-eye, right-eye and mouth beams. Motion of a
  // highlight or a tiny change in brightness cannot satisfy full spectral travel.
  for (const [x, y] of [[156, 398], [708, 433], [588, 698], [365, 476], [550, 501], [455, 557]]) {
    const hues = Array.from({ length: metadata.pages }, (_, frame) => {
      const offset = frame * stride + (y * info.width + x) * 4;
      return hue(data.subarray(offset, offset + 3));
    });
    const advances = hues.map((value, frame) => (hues[(frame + 1) % hues.length] - value + 360) % 360);
    expect(advances.every(value => value > 10 && value < 100)).toBe(true);
    expect(advances.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1080, 0);
  }
}, 15000);

it("covers eye and mouth contours with saturated source light throughout the loop", async () => {
  const input = await readFile("public/assets/characters/story-sprites/denia/rainbow-spray.webp");
  const metadata = await sharp(input, { animated: true }).metadata();
  const { data, info } = await sharp(input, { animated: true }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const stride = info.width * metadata.pageHeight * 4;
  const contours = [[330, 477], [398, 478], [366, 434], [348, 504],
    [535, 471], [572, 494], [524, 525], [550, 537],
    [446, 557], [455, 544], [463, 562], [455, 571]];
  for (let frame = 0; frame < metadata.pages; frame++) {
    for (const [x, y] of contours) {
      const offset = frame * stride + (y * info.width + x) * 4;
      const rgb = [...data.subarray(offset, offset + 3)];
      expect(Math.max(...rgb), `source light at ${x},${y}, frame ${frame}`).toBeGreaterThan(180);
      expect(Math.max(...rgb) - Math.min(...rgb)).toBeGreaterThan(40);
    }
  }
}, 15000);
