import { expect, test } from "@playwright/test";
import { settleWindow } from "./window-surfaces-fixture.js";

async function effectiveSize(locator) {
  return locator.evaluate(element => {
    let scale = 1;
    for (let parent = element; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      if (style.transform !== "none") {
        const matrix = new DOMMatrixReadOnly(style.transform);
        scale *= Math.hypot(matrix.a, matrix.b);
      }
      scale *= parseFloat(style.zoom) || 1;
    }
    return parseFloat(getComputedStyle(element).fontSize) * scale;
  });
}

for (const width of [1440, 390, 320]) {
  test(`record labels and character names stay readable in their existing cards at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width > 900 ? 1000 : 844 });
    await page.goto("/tests/e2e/fixtures/interface-polish.html?surface=profile");
    await settleWindow(page);
    for (const label of await page.locator(".profile-record-metric dt").all()) {
      expect(await effectiveSize(label)).toBeGreaterThanOrEqual(13);
      expect(await label.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
    }
    const character = page.locator(".profile-character-name").first();
    expect(await effectiveSize(character)).toBeGreaterThanOrEqual(14);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({ path: testInfo.outputPath(`profile-${width}.png`), fullPage: true });
  });
}

for (const width of [390, 320]) {
  test(`battle actions wrap without shrinking and clocks retain WuWa at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/tests/e2e/fixtures/spectator-presence.html");
    await settleWindow(page);
    for (const name of await page.locator(".room-scoreboard-name").all()) {
      expect(await name.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
    }
    for (const label of await page.locator(".mobile-tab-panel .action-label").all()) {
      expect(await effectiveSize(label)).toBeGreaterThanOrEqual(12);
      expect(await label.evaluate(e => e.scrollWidth <= e.clientWidth + 1 && e.scrollHeight <= e.clientHeight + 1)).toBe(true);
    }
    for (const name of await page.locator(".player-meta .user-identity-name").all()) {
      expect(await effectiveSize(name)).toBeGreaterThanOrEqual(13);
    }
    for (const clock of await page.locator(".timer-primary").all()) {
      await expect(clock).toHaveCSS("font-family", /Battle WuWa Digits/);
      await expect(clock).toHaveCSS("font-size", "24px");
      expect(await clock.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({ path: testInfo.outputPath(`battle-${width}.png`), fullPage: true });
  });
}
