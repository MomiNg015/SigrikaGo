import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { WINDOW_TITLE_STICKERS } from "../src/shared/windowTitleStickers.js";

// Ruled paper stickers, typeset with the same local font as the UI.
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
      const left = 9, top = 9, right = width - 17, bottom = height - 17, fold = 9;
      const paper = new Path2D();
      paper.moveTo(left + 3, top);
      paper.lineTo(right - 3, top);
      paper.quadraticCurveTo(right, top, right, top + 3);
      paper.lineTo(right, bottom - fold);
      paper.lineTo(right - fold, bottom);
      paper.lineTo(left + 3, bottom);
      paper.quadraticCurveTo(left, bottom, left, bottom - 3);
      paper.lineTo(left, top + 3);
      paper.quadraticCurveTo(left, top, left + 3, top);
      paper.closePath();
      const wash = ctx.createLinearGradient(0, top, 0, bottom);
      wash.addColorStop(0, "#fffdf7");
      wash.addColorStop(0.5, "#fffaf0");
      wash.addColorStop(1, "#f2e4ce");
      ctx.fillStyle = wash;
      ctx.strokeStyle = "#fffdf7";
      ctx.lineWidth = 6;
      // Canvas shadow lengths use output pixels, independently of ctx.scale(3, 3).
      ctx.shadowColor = "rgba(61,43,37,0.38)";
      ctx.shadowOffsetX = 9;
      ctx.shadowOffsetY = 15;
      ctx.shadowBlur = 12;
      ctx.stroke(paper);
      ctx.fill(paper);
      ctx.shadowColor = "transparent";
      ctx.save();
      ctx.clip(paper);
      ctx.strokeStyle = "rgba(112,157,165,0.23)";
      ctx.lineWidth = 0.7;
      for (let y = top + 13; y < bottom; y += 12) {
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = "#6a554d";
      ctx.lineWidth = 1.2;
      ctx.stroke(paper);
      ctx.fillStyle = "#fffdf7";
      ctx.beginPath();
      ctx.moveTo(right - fold, bottom);
      ctx.lineTo(right - fold, bottom - fold);
      ctx.lineTo(right, bottom - fold);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#3d2b25";
      ctx.font = `${title.length > 4 ? 28 : 32}px "Title Export"`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(title, width / 2 - 4, height / 2 - 3);
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
