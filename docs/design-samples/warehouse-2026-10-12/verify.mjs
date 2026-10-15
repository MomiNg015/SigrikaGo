import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { ESLint } from "eslint";
import projectConfig from "../../../eslint.config.js";

const output = fileURLToPath(new URL(".", import.meta.url));
const base = "http://localhost:5173/docs/design-samples/warehouse-2026-10-12/index.html";
const config = { ...projectConfig[1], files: ["**/warehouse-2026-10-12/*.jsx", "**/warehouse-2026-10-12/*.mjs"] };
const lint = new ESLint({ overrideConfigFile: true, overrideConfig: [config] });
const results = await lint.lintFiles([`${output}sample.jsx`, `${output}verify.mjs`]);
assert.equal(results.reduce((n, r) => n + r.errorCount + r.warningCount, 0), 0, JSON.stringify(results.map(r => r.messages)));
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const errors = [];
const checks = [];
try {
  const page = await browser.newPage();
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  for (const view of ["case", "book", "arcade"]) {
    for (const [width, height] of [[1440, 1000], [390, 844], [360, 640], [320, 568]]) {
      await page.setViewportSize({ width, height });
      await page.goto(`${base}?view=${view}${width < 760 ? "&embed=1" : ""}`);
      await page.evaluate(() => document.fonts.ready);
      await page.locator(".item").last().waitFor();
      await page.waitForTimeout(300);
      const geometry = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        broken: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src),
        contentClipped: [...document.querySelectorAll(".item-label,h2,.primary")].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent),
      }));
      assert.equal(geometry.overflow, false, `${view} ${width} overflow`);
      assert.deepEqual(geometry.broken, [], `${view} ${width} images`);
      assert.deepEqual(geometry.contentClipped, [], `${view} ${width} clipping`);
      await page.screenshot({ path: `${output}${view}-${width === 1440 ? "desktop" : width}.png`, fullPage: true });
      await page.getByRole("button", { name: "消耗品", exact: true }).click();
      assert.equal(await page.locator(".item").count(), 3);
      await page.getByRole("button", { name: "选择部员", exact: true }).click();
      await page.getByRole("button", { name: "取消选择部员" }).click();
      assert.equal(await page.locator(".hero-count").textContent(), "×3");
      for (let n = 0; n < 3; n++) {
        await page.getByRole("button", { name: "选择部员", exact: true }).click();
        await page.getByRole("button", { name: "达妮娅", exact: true }).click();
        await page.getByRole("button", { name: "给她跳跳糖", exact: true }).click();
      }
      assert.equal(await page.getByRole("button", { name: "已用完", exact: true }).isDisabled(), true);
      await page.getByRole("button", { name: "金币袋，数量 1", exact: true }).click();
      await page.getByRole("button", { name: "打开金币袋", exact: true }).click();
      assert.equal(await page.locator(".hero-count").textContent(), "×0");
      await page.getByRole("button", { name: "招募", exact: true }).click();
      await page.getByRole("button", { name: "前往招募", exact: true }).click();
      assert.match(await page.getByRole("status").textContent(), /准备前往招募/);
      if (view === "book") {
        await page.getByRole("button", { name: "下一件道具" }).click();
        assert.equal(await page.locator(".detail-copy h2").textContent(), "电台招募券");
        await page.getByRole("button", { name: "上一件道具" }).click();
        assert.equal(await page.locator(".detail-copy h2").textContent(), "招募海报");
      }
      await page.getByRole("button", { name: "关闭仓库" }).click();
      await page.getByRole("button", { name: "打开仓库" }).click();
      checks.push({ view, width, height, result: "passed" });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base);
  for (const label of ["道具图鉴", "街机背包", "社团补给箱"]) await page.getByRole("button", { name: new RegExp(label) }).click();
  await page.getByRole("button", { name: "手机预览" }).click();
  const frame = page.frameLocator("iframe");
  await frame.getByRole("button", { name: "金币袋，数量 1", exact: true }).click();
  await frame.getByRole("button", { name: "打开金币袋", exact: true }).click();
  await page.getByRole("button", { name: "重置样板" }).click();
  await frame.getByRole("button", { name: "金币袋，数量 1", exact: true }).waitFor();
  await page.getByRole("button", { name: "桌面预览" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await page.locator(".hero-art>img").evaluate(e => getComputedStyle(e).animationName), "none");
  assert.deepEqual(errors, []);
  await writeFile(`${output}verification.json`, JSON.stringify({ checks, lint: "passed", errors, extra: ["picker", "phone frame", "reset frame", "reduced motion"] }, null, 2));
  console.log(`Passed ${checks.length} viewport and interaction combinations, scoped lint, picker, reset and reduced motion.`);
} finally { await browser.close(); }
