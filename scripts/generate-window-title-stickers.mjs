import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { WINDOW_TITLE_STICKERS } from "../src/shared/windowTitleStickers.js";

// Deliberately plain paper labels, typeset with the same local font as the UI.
// Render at 3x so both PNG delivery and runtime WebP retain crisp Chinese glyphs.
const root = new URL("../", import.meta.url);
const output = new URL("public/assets/window-titles/", root);
const font = await fs.readFile(new URL("public/assets/fonts/LXGWMarkerGothic-Regular.ttf", root));
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage();
  await page.evaluate(async (base64) => {
    const face = new FontFace("Title Export", `url(data:font/ttf;base64,${base64})`);
    document.fonts.add(await face.load());
  }, font.toString("base64"));
  for (const [key, { title, width, height }] of Object.entries(WINDOW_TITLE_STICKERS)) {
    const data = await page.evaluate(({ title, width, height }) => {
      const canvas = document.createElement("canvas");
      canvas.width = width * 3;
      canvas.height = height * 3;
      const ctx = canvas.getContext("2d");
      ctx.scale(3, 3);
      ctx.fillStyle = "#fffaf0";
      ctx.strokeStyle = "#3d2b25";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "rgba(61,43,37,0.18)";
      ctx.shadowOffsetX = 1.5;
      ctx.shadowOffsetY = 2.5;
      ctx.shadowBlur = 1;
      ctx.beginPath();
      ctx.roundRect(5, 8, width - 12, height - 18, 3);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.stroke();
      ctx.fillStyle = "#3d2b25";
      ctx.font = `${title.length > 4 ? 26 : 28}px "Title Export"`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(title, width / 2 - 1, height / 2 - 1);
      return canvas.toDataURL("image/png").split(",")[1];
    }, { title, width, height });
    const png = Buffer.from(data, "base64");
    await fs.writeFile(new URL(`${key}.png`, output), png);
    await sharp(png).webp({ lossless: true }).toFile(fileURLToPath(new URL(`${key}.webp`, output)));
  }
} finally {
  await browser.close();
}
console.log(`Exported ${Object.keys(WINDOW_TITLE_STICKERS).length} LXGW paper titles.`);
