import { chromium } from "playwright";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
const output = fileURLToPath(new URL(".", import.meta.url));
const browser = await chromium.launch({ headless: true, channel: "chrome" });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const [width, height] of [[1440, 1000], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height });
    for (const style of ["", "tag", "stamp", "counter"]) {
      for (const large of [false, true]) {
        await page.goto(`http://localhost:5173/docs/design-samples/warehouse-2026-10-12/production.html?quantity=${style}${large ? "&largeCounts" : ""}`);
        await page.locator(".wg-entry").last().waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForFunction(() => [...document.querySelectorAll(".wg-book img")].every(img => img.complete && img.naturalWidth > 0));
        await page.waitForTimeout(350);
        const result = await page.evaluate(() => {
          const book = document.querySelector(".wg-book");
          const hero = document.querySelector(".wg-hero-count");
          return { overflow: document.documentElement.scrollWidth > innerWidth || book.scrollWidth > book.clientWidth + 1,
            count: hero.textContent, borderWidth: getComputedStyle(hero).borderTopWidth, font: getComputedStyle(hero).fontFamily,
            fits: [...document.querySelectorAll(".wg-quantity,.wg-hero-count")].every(e => e.scrollWidth <= e.clientWidth + 1),
            duplicate: document.querySelector(".wg-owned") ? "visible" : "none" };
        });
        assert.equal(result.overflow, false);
        assert.equal(result.fits, true);
        assert.equal(result.duplicate, "none");
        if (style === "" || style === "stamp") {
          assert.equal(result.borderWidth, width > 768 ? "3px" : "2px");
          assert.ok(result.font.includes("Arial"));
        }
        assert.equal(result.count, large ? "×9999" : "×3");
        if (!large) await page.screenshot({ path: `${output}quantity-${style || "production"}-${width}.png` });
        await page.getByRole("button", { name: "金币袋，数量 " + (large ? "12" : "1") }).click();
        await page.getByRole("button", { name: "使用：金币袋" }).click();
        await page.waitForFunction(expected => document.querySelector(".wg-hero-count")?.textContent === expected, large ? "×11" : "×2");
      }
    }
  }
  await page.goto("http://localhost:5173/docs/design-samples/warehouse-2026-10-12/quantity.html");
  for (const style of ["stamp", "counter", "tag"]) {
    await page.locator(`[data-style="${style}"]`).click();
    await page.frameLocator("iframe").locator(`[data-quantity-style="${style}"] .wg-entry`).first().waitFor();
  }
  assert.deepEqual(errors, []);
  console.log("Passed 24 quantity variant/viewport/count combinations and live picker switching.");
} finally { await browser.close(); }
