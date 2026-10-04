import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// These are sampled garment prints from the user's supplied standing artwork.
// Thresholds remove the cloth; no motif geometry is traced or redrawn.
const output = new URL("../public/assets/characters/handbook-ornaments/", import.meta.url);
const motifs = [
  { id: "sigrika", motif: "white mountain band on front coat", box: [250, 646, 75, 23], type: "white-print" },
  { id: "nabomo", motif: "gold triangle band on skirt hem", box: [286, 628, 132, 49], type: "gold-print" },
  { id: "denia", motif: "gold leaf print on skirt hem", box: [310, 665, 86, 51], type: "gold-print" }
];
const clamp = (value) => Math.min(1, Math.max(0, value));
await mkdir(output, { recursive: true });
const assets = [];
for (const { id, motif, box, type } of motifs) {
  const [left, top, width, height] = box;
  const source = new URL(`../public/assets/characters/handbook-sprites/${id}.webp`, import.meta.url);
  const { data } = await sharp(fileURLToPath(source)).extract({ left, top, width, height })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const [r, g, b, a] = data.subarray(offset, offset + 4);
      const print = type === "white-print"
        ? clamp((Math.min(r, g, b) - 188) / 43)
        : clamp((g - 90) / 100) * clamp((g - b - 8) / 15);
      const edge = Math.min(1, x / 3, (width - 1 - x) / 3, y / 2, (height - 1 - y) / 2);
      pixels.set([97, 86, 74, Math.round(a * print * edge)], offset);
    }
  }
  const name = `${id}.png`;
  const exported = await sharp(pixels, { raw: { width, height, channels: 4 } })
    .resize(width * 2, height * 2).png({ compressionLevel: 9, palette: true, colours: 64, dither: 0 })
    .toFile(fileURLToPath(new URL(name, output)));
  assets.push({ id, file: name, motif, source: `/assets/characters/handbook-sprites/${id}.webp`,
    sourceCanvas: [832, 1216], sourceCrop: { left, top, width, height },
    extraction: type, ink: "#61564a", edgeFadePixels: { horizontal: 3, vertical: 2 },
    width: exported.width, height: exported.height, bytes: exported.size });
}
await writeFile(new URL("manifest.json", output), `${JSON.stringify({
  provenance: "Garment details cropped from the user-supplied original standing artwork; background removed by color thresholds.",
  generator: "scripts/extract-handbook-ornaments.mjs", assets
}, null, 2)}\n`);
