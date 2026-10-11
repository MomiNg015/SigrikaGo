import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import config from "../../../eslint.config.js";
const files = ["docs/design-samples/result-rank-2026-10-11/sample.jsx"];
const lint = new ESLint({ overrideConfigFile: true, overrideConfig: config.map((entry) => entry.files ? { ...entry, files } : entry) });
const lintResults = await lint.lintFiles(files);
console.log(await (await lint.loadFormatter("stylish")).format(lintResults));
if (lintResults.some((result) => result.errorCount || result.warningCount)) process.exitCode = 1;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const errors = []; const cases = [];
page.on("pageerror", (error) => errors.push(error.message));
const url = "http://127.0.0.1:5173/docs/design-samples/result-rank-2026-10-11/index.html";
for (const [width, height] of [[1440, 900], [390, 844], [360, 640], [320, 568]]) {
  await page.setViewportSize({ width, height });
  for (const design of ["trail", "medal", "compare"]) {
    for (const state of ["gain", "loss", "promote", "demote"]) {
      await page.goto(`${url}?scene=1&design=${design}&state=${state}`);
      await page.locator(".vr-design").waitFor();
      await page.locator(".result-player-portrait-image").evaluate((img) => img.decode());
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(750);
      const result = await page.evaluate(() => {
        const panel = document.querySelector(".result-modal").getBoundingClientRect();
        const rank = document.querySelector(".result-reward-rating").getBoundingClientRect();
        const coin = document.querySelector(".result-reward-coins").getBoundingClientRect();
        const visual = document.querySelector(".vr-design");
        const outside = [...visual.querySelectorAll("span")].filter((el) => {
          const box = el.getBoundingClientRect();
          return box.width && box.right > coin.left + 1;
        }).map((el) => el.className);
        return { label: visual.getAttribute("aria-label"), fits: panel.top >= 0 && panel.bottom <= innerHeight && panel.left >= 0 && panel.right <= innerWidth, outside, rankWidth: rank.width,
          overflow: document.documentElement.scrollWidth > innerWidth,
          literalDeltaVisible: getComputedStyle(document.querySelector(".result-reward-rating > strong")).display !== "none" };
      });
      cases.push({ width, height, design, state, ...result });
      if (!result.fits || result.overflow || result.literalDeltaVisible || result.outside.length) errors.push(cases.at(-1));
      if (width === 390 || width === 1440) await page.screenshot({ path: fileURLToPath(new URL(`${width === 390 ? "mobile" : "desktop"}-${design}-${state}.png`, import.meta.url)) });
    }
  }
}
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto(`${url}?scene=1&design=trail&state=gain`);
await page.locator(".vr-design").waitFor();
if (await page.locator(".vr-slot.changed > svg").evaluate((el) => getComputedStyle(el).animationName) !== "none") errors.push("reduced motion failure");
await page.getByRole("button", { name: "返回棋盘", exact: true }).click();
await page.getByRole("button", { name: "重新查看结果" }).click();
await page.getByRole("button", { name: "退出房间", exact: true }).click();
if (!await page.getByText("主界面大厅", { exact: true }).isVisible()) errors.push("sample leave failed");
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(url);
for (const name of ["段位徽章", "前后对照", "星轨点亮"]) await page.getByRole("button", { name: new RegExp(name) }).click();
await page.getByLabel("结算状态", { exact: true }).selectOption("demote");
await page.getByRole("button", { name: "手机竖屏", exact: true }).click();
await page.getByRole("button", { name: "重播变化", exact: true }).click();
await page.frameLocator("iframe").getByRole("img", { name: "由四段降至三段，三段两星" }).waitFor();
await browser.close();
await writeFile(new URL("verification.json", import.meta.url), JSON.stringify({ cases, errors }, null, 2));
console.log(JSON.stringify({ cases: cases.length, errors }));
if (errors.length) process.exitCode = 1;
