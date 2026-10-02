import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { WINDOW_TITLE_STICKERS } from "./windowTitleStickers.js";

describe("window title asset delivery", () => {
  it("ships matching PNG and WebP with actual transparent margins for every title", async () => {
    for (const [key, asset] of Object.entries(WINDOW_TITLE_STICKERS)) {
      for (const extension of ["png", "webp"]) {
        const url = new URL(`../../public/assets/window-titles/${key}.${extension}`, import.meta.url);
        const image = sharp(await readFile(url));
        const metadata = await image.metadata();
        const stats = await image.stats();
        expect(metadata.width, key).toBe(asset.width * 3);
        expect(metadata.height, key).toBe(asset.height * 3);
        expect(metadata.hasAlpha, key).toBe(true);
        expect(stats.channels.at(-1).min, key).toBe(0);
        expect(stats.channels.at(-1).max, key).toBe(255);
        const { data, info } = await image.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        const edgeAlpha = [];
        for (let x = 0; x < info.width; x += 1) {
          edgeAlpha.push(data[x * 4 + 3], data[((info.height - 1) * info.width + x) * 4 + 3]);
        }
        for (let y = 0; y < info.height; y += 1) {
          edgeAlpha.push(data[y * info.width * 4 + 3], data[(y * info.width + info.width - 1) * 4 + 3]);
        }
        expect(Math.max(...edgeAlpha), `${key}.${extension}: shadow must fade before the canvas edge`).toBeLessThanOrEqual(2);
      }
    }
  });
});
