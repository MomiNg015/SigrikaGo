import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import config from "../../../eslint.config.js";

const root = new URL("./", import.meta.url);
const target = "http://127.0.0.1:5173/docs/design-samples/result-window-2026-10-11/index.html";
const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: config.map((entry) => entry.files ? { ...entry, files: ["docs/design-samples/result-window-2026-10-11/*.jsx"] } : entry) });
const lint = await eslint.lintFiles([fileURLToPath(new URL("sample.jsx", root))]);
if (lint.some((result) => result.errorCount || result.warningCount)) {
  console.log(await (await eslint.loadFormatter("stylish")).format(lint));
  process.exitCode = 1;
}
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("response", (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
const results = [];
for (const [width, height] of [[1440, 900], [390, 844], [360, 640], [320, 568]]) {
  await page.setViewportSize({ width, height });
  for (const direction of ["side", "top", "slash"]) {
    for (const outcome of ["win", "loss", "draw"]) {
      await page.goto(`${target}?scene=1&direction=${direction}&outcome=${outcome}`);
      await page.locator(".portrait-art img").first().evaluate((img) => img.decode());
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(80);
      const geometry = await page.evaluate(() => {
        const elements = [".result-sample", ".portrait-art", ".confirm", ".weather"].flatMap((selector) => {
          const element = document.querySelector(selector);
          if (!element) return [];
          const rect = element.getBoundingClientRect();
          return [{ selector, x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, fits: rect.x >= 0 && rect.y >= 0 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1 }];
        });
        return { elements, overflow: document.documentElement.scrollWidth > innerWidth, animation: getComputedStyle(document.querySelector(".portrait-art img")).animationName, loaded: [...document.images].every((img) => img.complete && img.naturalWidth > 0) };
      });
      results.push({ width, height, direction, outcome, ...geometry });
      if (width === 1440 || width === 390) {
        if (outcome !== "draw") await page.screenshot({ path: fileURLToPath(new URL(`${width === 1440 ? "desktop" : "mobile"}-${direction}-${outcome}.png`, root)) });
      }
      await page.getByRole("button", { name: "返回棋盘" }).click();
      await page.getByRole("button", { name: "重新查看结果" }).click();
      await page.keyboard.press("Escape");
      if (!await page.getByRole("button", { name: "重新查看结果" }).isVisible()) errors.push("Escape failed");
    }
  }
}
for (const direction of ["side", "top", "slash"]) {
  for (const mode of ["team", "friendly", "practice", "challenge"]) {
    await page.goto(`${target}?scene=1&direction=${direction}&mode=${mode}&outcome=loss&character=qiuyuan`);
    const button = await page.locator(".confirm").boundingBox();
    if (button.y + button.height > 568) errors.push(`${direction}/${mode} button below viewport`);
  }
}
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto(`${target}?scene=1&outcome=loss`);
if (await page.locator(".weather").isVisible() || !await page.locator(".still-cloud").isVisible()) errors.push("Reduced motion weather failed");
await page.goto(`${target}?scene=1`);
if (await page.locator(".portrait-art img").evaluate((img) => getComputedStyle(img).animationName) !== "none") errors.push("Reduced motion hop failed");
await page.emulateMedia({ reducedMotion: "no-preference" });
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(target);
for (const name of ["顶部探出", "斜切战报", "侧身破框"]) await page.getByRole("button", { name: new RegExp(name) }).click();
await page.getByLabel(/^结果/).selectOption("loss");
await page.getByLabel(/^角色/).selectOption("denia");
await page.getByRole("button", { name: "手机竖屏" }).click();
await page.frameLocator("iframe").getByRole("button", { name: "返回棋盘" }).click();
await page.getByRole("button", { name: "重新展示" }).click();
await page.frameLocator("iframe").getByRole("button", { name: "返回棋盘" }).waitFor();
await browser.close();
const failures = results.filter((result) => result.overflow || !result.loaded || result.elements.some((element) => !element.fits));
await writeFile(new URL("verification.json", root), JSON.stringify({ cases: results, failures, errors }, null, 2));
console.log(JSON.stringify({ cases: results.length, failures, errors }, null, 2));
if (failures.length || errors.length) process.exitCode = 1;
