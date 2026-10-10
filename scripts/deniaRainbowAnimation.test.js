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
  for (const [x, y] of [[156, 398], [708, 433], [588, 698]]) {
    const hues = Array.from({ length: metadata.pages }, (_, frame) => {
      const offset = frame * stride + (y * info.width + x) * 4;
      return hue(data.subarray(offset, offset + 3));
    });
    const advances = hues.map((value, frame) => (hues[(frame + 1) % hues.length] - value + 360) % 360);
    expect(advances.every(value => value > 10 && value < 100)).toBe(true);
    expect(advances.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1080, 0);
  }
}, 15000);

it("crops every animated avatar frame exactly like the default Denia head avatar", async () => {
  const directory = "public/assets/characters/story-sprites/denia/";
  const native = await readFile(`${directory}rainbow-spray.webp`);
  const avatar = await readFile(`${directory}rainbow-spray-avatar.webp`);
  const meta = await sharp(avatar, { animated: true }).metadata();
  expect(meta).toMatchObject({ width: 512, pageHeight: 512, pages: 24, loop: 0 });
  expect(meta.delay).toEqual(Array(24).fill(60));
  const manifest = JSON.parse(await readFile("public/assets/characters/handbook-chibi-sprites/avatar-manifest.json", "utf8"));
  const crop = manifest.avatars.find(entry => entry.id === "denia").crop;
  const source = await sharp(native, { animated: true }).ensureAlpha().raw().toBuffer();
  const actual = await sharp(avatar, { animated: true }).ensureAlpha().raw().toBuffer();
  const sourceStride = 832 * 1216 * 4;
  const avatarStride = 512 * 512 * 4;
  for (let frame = 0; frame < 24; frame++) {
    const expected = await sharp(source.subarray(frame * sourceStride, (frame + 1) * sourceStride),
      { raw: { width: 832, height: 1216, channels: 4 } }).extract(crop).resize(512, 512).raw().toBuffer();
    const decoded = actual.subarray(frame * avatarStride, (frame + 1) * avatarStride);
    let differences = 0;
    for (let p = 0; p < expected.length; p += 4) {
      if (expected[p + 3] !== decoded[p + 3]
        || (expected[p + 3] && !expected.subarray(p, p + 3).equals(decoded.subarray(p, p + 3)))) differences++;
    }
    expect(differences, `avatar crop frame ${frame}`).toBe(0);
  }
}, 20000);
