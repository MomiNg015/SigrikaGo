import { chromium } from "playwright";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
const output = fileURLToPath(new URL(".", import.meta.url));
const browser = await chromium.launch({ headless: true, channel: "chrome" });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const [width, height] of [[1440, 1000], [390, 844], [360, 640], [320, 568]]) {
    await page.setViewportSize({ width, height });
    await page.goto("http://localhost:5173/docs/design-samples/warehouse-2026-10-12/production.html?targets");
    await page.getByRole("button", { name: "使用：彩虹豆豆跳跳糖", exact: true }).click();
    const modal = page.locator(".character-target-modal");
    await modal.locator(".match-character-id-frame").last().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => [...document.querySelectorAll(".character-target-modal img")].every(img => img.complete && img.naturalWidth > 0));
    assert.equal(await modal.locator(".match-character-id-frame").count(), 7);
    assert.equal(await modal.locator(".team-character-option:disabled").count(), 3);
    const layout = await modal.evaluate(element => {
      const grid = element.querySelector(".team-character-options");
      return { overflow: element.scrollWidth > element.clientWidth + 1 || grid.scrollWidth > grid.clientWidth + 1,
        namesFit: [...element.querySelectorAll(".match-character-name")].every(name => name.scrollWidth <= name.clientWidth + 1),
        contained: grid.getBoundingClientRect().top >= element.getBoundingClientRect().top && grid.getBoundingClientRect().bottom <= element.getBoundingClientRect().bottom,
        columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length };
    });
    assert.equal(layout.overflow, false);
    assert.equal(layout.namesFit, true);
    assert.equal(layout.contained, true);
    assert.equal(layout.columns, width > 768 ? 5 : 2);
    await modal.locator(".team-character-option").last().scrollIntoViewIfNeeded();
    await modal.locator(".team-character-option").first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}targets-${width}.png` });
    await page.getByRole("button", { name: "关闭角色选择" }).click();
    assert.equal(await page.locator(".character-target-modal").count(), 0);
    assert.equal(await page.locator(".warehouse-modal").count(), 1);
  }
  assert.deepEqual(errors, []);
  console.log("Target cards passed at desktop and three portrait sizes.");
} finally { await browser.close(); }
