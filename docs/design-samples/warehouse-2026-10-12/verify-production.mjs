import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const output = fileURLToPath(new URL(".", import.meta.url));
const url = "http://localhost:5173/docs/design-samples/warehouse-2026-10-12/production.html";
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const checks = [], errors = [];
try {
  const page = await browser.newPage();
  page.on("pageerror", e => errors.push(e.message));
  for (const [width, height] of [[1440, 1000], [390, 844], [360, 640], [320, 568]]) {
    let fixedHeight, actionTop;
    await page.setViewportSize({ width, height });
    for (const state of ["", "?long", "?many", "?empty"]) {
      await page.goto(url + state);
      await page.locator(state === "?empty" ? ".warehouse-empty" : ".wg-entry").last().waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(200);
      if (!state) {
        await page.locator(".wg-use").scrollIntoViewIfNeeded();
        await page.waitForFunction(() => [...document.querySelectorAll(".wg-book img")].every(i => i.complete && i.naturalWidth > 0));
        await page.locator(".wg-book").evaluate(e => { e.scrollTop = 0; });
        await page.screenshot({ path: `${output}production-${width === 1440 ? "desktop" : width}.png` });
      }
      const geometry = await page.evaluate(() => {
        const modal = document.querySelector(".warehouse-modal");
        const bounds = modal.getBoundingClientRect();
        const properties = ["border", "borderRadius", "backgroundColor", "backgroundImage", "backgroundSize", "boxShadow"];
        const appearance = () => Object.fromEntries(properties.map(key => [key, getComputedStyle(modal)[key]]));
        const current = appearance();
        modal.classList.remove("warehouse-field-guide");
        const original = appearance();
        modal.classList.add("warehouse-field-guide");
        return { overflow: document.documentElement.scrollWidth > innerWidth, internalOverflow: modal.scrollWidth > modal.clientWidth + 1, outside: bounds.x < 0 || bounds.right > innerWidth + 1, height: bounds.height, current, original };
      });
      assert.equal(geometry.overflow || geometry.internalOverflow || geometry.outside, false, `${width} ${state}`);
      assert.deepEqual(geometry.current, geometry.original, "Original window appearance must be preserved");
      fixedHeight ??= geometry.height;
      assert.ok(Math.abs(geometry.height - fixedHeight) < 1, "Content must not resize the window");
      assert.equal(await page.locator('.window-title-sticker-art[src*="warehouse.webp"]').count(), 1);
      assert.equal(await page.locator(".wg-number,.wg-page-heading,.wg-spark,.wg-emblem").count(), 0);
      assert.equal(await page.getByText("道具档案", { exact: true }).count(), 0);
      if (state !== "?empty") {
        const layout = await page.evaluate(() => {
          const book = document.querySelector(".wg-book");
          const list = document.querySelector(".wg-list");
          const details = document.querySelector(".wg-details");
          const action = document.querySelector(".wg-action-row").getBoundingClientRect();
          const nav = document.querySelector(".wg-page-turn").getBoundingClientRect();
          return { actionTop: action.top, bottomGap: book.getBoundingClientRect().bottom - nav.bottom, outerScroll: book.scrollHeight - book.clientHeight, listScroll: list.scrollHeight - list.clientHeight, detailScroll: details.scrollHeight - details.clientHeight };
        });
        actionTop ??= layout.actionTop;
        assert.ok(Math.abs(layout.actionTop - actionTop) < 1, "Long content must not move the action row");
        assert.ok(layout.bottomGap >= 0 && layout.bottomGap <= 32, "Navigation must fill the bottom of the content area");
        assert.ok(layout.outerScroll <= 1, "Directory and description must scroll independently");
        if (state === "?many") assert.ok(layout.listScroll > 0);
        if (state === "?long") assert.ok(layout.detailScroll > 0);
      }
      if (state === "?many" || state === "?long") {
        await page.locator(".wg-use").scrollIntoViewIfNeeded();
        assert.equal(await page.locator(".wg-use").isVisible(), true);
      }
      if (!state) {
        for (const category of ["招募", "消耗品", "全部"]) {
          await page.getByRole("button", { name: category, exact: true }).click();
          assert.ok(Math.abs(await page.locator(".warehouse-modal").evaluate(e => e.getBoundingClientRect().height) - fixedHeight) < 1);
        }
        await page.getByRole("button", { name: "使用：彩虹豆豆跳跳糖", exact: true }).click();
        const target = page.getByRole("button", { name: "西格莉卡", exact: true });
        await target.click();
        await page.waitForFunction(() => document.querySelector(".wg-hero-count")?.textContent === "×2");
        await page.getByRole("button", { name: "下一件道具" }).click();
        assert.equal(await page.getByRole("button", { name: "前去招募：招募海报" }).isDisabled(), false);
        await page.getByRole("button", { name: "金币袋，数量 1" }).click();
        await page.getByRole("button", { name: "使用：金币袋" }).click();
        await page.waitForFunction(() => document.querySelectorAll(".wg-entry").length === 5);
        await page.getByRole("button", { name: "招募", exact: true }).click();
        await page.getByRole("button", { name: "魔法时钟，数量 2" }).click();
        assert.equal(await page.locator(".wg-use").count(), 0);
        await page.getByRole("button", { name: "招募海报，数量 5" }).click();
        await page.getByRole("button", { name: "前去招募：招募海报" }).click();
        await page.locator(".recruitment-modal").waitFor();
        assert.equal(await page.locator(".warehouse-modal").count(), 0);
      }
      checks.push({ width, height, state: state || "normal", result: "passed" });
    }
  }
  assert.deepEqual(errors, []);
  await writeFile(`${output}production-verification.json`, JSON.stringify({ checks, errors }, null, 2));
  console.log(`Passed ${checks.length} production component viewport/state checks and real hook callbacks with isolated fixtures.`);
} finally { await browser.close(); }
