import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import { ESLint } from "eslint";
import config from "../../../eslint.config.js";
const files = ["src/app/App.jsx", "src/app/AppOverlays.jsx", "src/app/useAppActions.js", "src/app/useOverlayActions.js", "src/app/useOverlayActions.dom.test.jsx", "src/modals/gameLifecycle/ResultRankProgress.jsx", "src/modals/gameLifecycle/ResultRankProgress.dom.test.jsx", "src/modals/gameLifecycle/ResultModal.jsx", "src/modals/gameLifecycle/ResultModal.dom.test.jsx", "src/modals/gameLifecycle/lifecycleHelpers.js", "docs/design-samples/result-window-2026-10-11/production.jsx"];
const lint = new ESLint({ overrideConfigFile: true, overrideConfig: config.map((entry) => entry.files ? { ...entry, files } : entry) });
const lintResults = await lint.lintFiles(files);
console.log(await (await lint.loadFormatter("stylish")).format(lintResults));
if (lintResults.some((r) => r.errorCount || r.warningCount)) process.exitCode = 1;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const errors = []; const cases = [];
page.on("pageerror", (error) => errors.push(error.message));
const url = "http://127.0.0.1:5173/docs/design-samples/result-window-2026-10-11/production.html";
for (const [width, height] of [[1440, 900], [390, 844], [360, 640], [320, 568]]) {
  await page.setViewportSize({ width, height });
  for (const outcome of ["win", "loss"]) {
    for (const delta of ["star", "rank", "points", "eight", "unchanged"]) {
      await page.goto(`${url}?outcome=${outcome}&delta=${delta}`);
      await page.locator(".result-player-portrait-image").evaluate((img) => img.decode());
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(350);
      const result = await page.evaluate(() => {
        const box = document.querySelector(".result-modal").getBoundingClientRect();
        const art = document.querySelector(".result-winner-portrait-wrap").getBoundingClientRect();
        const ratingBox = document.querySelector(".result-reward-rating").getBoundingClientRect();
        const stars = [...document.querySelectorAll(".result-rank-slot")];
        const starFits = stars.every((star) => star.getBoundingClientRect().right <= ratingBox.right);
        const mark = document.querySelector(".result-rank-slot.is-changed");
        const markPainted = !mark || getComputedStyle(mark).outlineStyle === "dashed" && getComputedStyle(mark).backgroundColor !== "rgba(0, 0, 0, 0)";
        const buttons = [...document.querySelectorAll(".result-actions button")].map((b) => b.getBoundingClientRect());
        return { starFits, markPainted, centerError: Math.abs((box.top + box.bottom - art.top - art.bottom) / 2),
          buttonsSameRow: Math.abs(buttons[0].y - buttons[1].y) < 1,
          fits: box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight,
          buttonHeight: Math.min(...buttons.map((b) => b.height)),
          overflow: document.documentElement.scrollWidth > innerWidth,
          text: document.querySelector(".result-rank-trail").getAttribute("aria-label") };
      });
      cases.push({ width, height, outcome, delta, ...result });
      if (!result.starFits || !result.markPainted || result.centerError > 1 || !result.buttonsSameRow || !result.fits || result.overflow || result.buttonHeight < 44) errors.push(JSON.stringify(cases.at(-1)));
      if (delta === "star" && (width === 1440 || width === 390)) await page.screenshot({ path: new URL(`production-${width}-${outcome}.png`, import.meta.url).pathname.replace(/^\/(?=[A-Z]:)/, "") });
    }
  }
}
await page.getByRole("button", { name: "返回棋盘", exact: true }).click();
if (await page.locator(".result-modal").count() || !await page.getByText("对弈棋盘", { exact: true }).isVisible()) errors.push("board return failed");
await page.getByRole("button", { name: "重新展示结果" }).click();
await page.getByRole("button", { name: "退出房间", exact: true }).click();
if (await page.locator(".result-modal").count() || !await page.getByText("主界面大厅", { exact: true }).isVisible()) errors.push("leave room failed");
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto(`${url}?outcome=win&delta=star`);
if (await page.locator(".result-rank-slot.is-added > svg").evaluate((node) => getComputedStyle(node).animationName) !== "none") errors.push("reduced motion failed");
await browser.close();
await writeFile(new URL("production-verification.json", import.meta.url), JSON.stringify({ cases, errors }, null, 2));
console.log(JSON.stringify({ cases: cases.length, errors }));
if (errors.length) process.exitCode = 1;
