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
    for (const style of ["", "marker", "pencil", "wave"]) {
      for (const long of [false, true]) {
        await page.goto(`http://localhost:5173/docs/design-samples/warehouse-2026-10-12/production.html?titleStyle=${style}${long ? "&long" : ""}`);
        await page.locator(".wg-entry").last().waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForFunction(() => [...document.querySelectorAll(".wg-book img")].every(img => img.complete && img.naturalWidth > 0));
        await page.waitForTimeout(350);
        const result = await page.locator(".wg-details h3").evaluate(element => {
          const css = getComputedStyle(element);
          return { bg: css.backgroundImage, color: css.backgroundColor, border: css.borderLeftWidth,
            overflow: document.documentElement.scrollWidth > innerWidth || element.scrollWidth > element.clientWidth + 1 };
        });
        assert.ok(style ? result.bg.includes("data:image/svg+xml") : result.bg.includes("/assets/home/warehouse-title-marker.svg"));
        assert.equal(result.color, "rgba(0, 0, 0, 0)");
        assert.equal(result.border, "0px");
        assert.equal(result.overflow, false);
        if (!long) await page.screenshot({ path: `${output}title-${style || "production"}-${width}.png` });
        const action = await page.locator(".wg-action-row").boundingBox();
        await page.getByRole("button", { name: "下一件道具" }).click();
        assert.ok(Math.abs((await page.locator(".wg-action-row").boundingBox()).y - action.y) < 1);
      }
    }
  }
  await page.goto("http://localhost:5173/docs/design-samples/warehouse-2026-10-12/title.html");
  for (const style of ["pencil", "wave", "marker"]) {
    await page.locator(`[data-style="${style}"]`).click();
    await page.frameLocator("iframe").locator(`[data-title-style="${style}"] .wg-entry`).first().waitFor();
  }
  assert.deepEqual(errors, []);
  console.log("Passed 24 title style/viewport/length cases and live picker switching.");
} finally { await browser.close(); }
