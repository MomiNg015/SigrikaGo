import { expect, test } from "@playwright/test";

const entryAnimations = elements => elements.flatMap(el => el.getAnimations().filter(animation => animation.animationName?.startsWith("handbook-strip-from-")));

for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }, { width: 360, height: 640 }]) {
  test(`handbook entry and interaction at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/tests/e2e/fixtures/handbook-puzzle.html");
    const pieces = page.locator(".handbook-puzzle-piece");
    await expect(pieces).toHaveCount(10);
    if (viewport.width > 768) {
      const states = await pieces.evaluateAll(elements => elements.map((el, index) => {
        const animation = el.getAnimations().find(a => a.animationName?.startsWith("handbook-strip-from-"));
        const timing = animation.effect.getTiming();
        animation.pause(); animation.currentTime = timing.delay + 45;
        return { index, duration: timing.duration, delay: timing.delay, y: new DOMMatrix(getComputedStyle(el).transform).m42 };
      }));
      for (const state of states) {
        expect(state.duration).toBe(300);
        expect(state.delay).toBe(state.index * 40);
        expect(state.index % 2 ? state.y > 0 : state.y < 0).toBe(true);
      }
      expect(await page.locator(".handbook-puzzle-board").evaluate(el => getComputedStyle(el).overflow)).toBe("hidden");
      await pieces.evaluateAll(elements => elements.forEach(el => el.getAnimations().forEach(animation => animation.finish())));
      // Measure after image layout and the existing window entrance settle.
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.querySelectorAll(".handbook-puzzle-portrait")].map(img => img.decode()));
        await Promise.allSettled(document.getAnimations().filter(a => a.playState === "running" && Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a => a.finished));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      const portrait = pieces.first().locator("img");
      const before = await portrait.boundingBox();
      await pieces.first().hover();
      await expect(pieces.first()).toHaveClass(/is-expanded/);
      await expect.poll(async () => {
        const after = await portrait.boundingBox();
        return Math.abs(after.y - before.y) + Math.abs(after.height - before.height) + Math.abs(after.width - before.width);
      }).toBeLessThan(1);
    } else {
      expect(await pieces.evaluateAll(elements => elements.flatMap(el => el.getAnimations()).filter(a => a.animationName?.startsWith("handbook-strip-from-")).length)).toBe(0);
      await pieces.last().scrollIntoViewIfNeeded();
      const last = await pieces.last().boundingBox();
      expect(last.y + last.height).toBeLessThanOrEqual(viewport.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "西格莉卡角色详情", exact: true }).click();
    await expect(page.locator(".character-details-modal")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".character-details-modal")).toHaveCount(0);
    expect(await pieces.evaluateAll(elements => elements.flatMap(el => el.getAnimations()).filter(a => a.animationName?.startsWith("handbook-strip-from-") && a.playState === "running").length)).toBe(0);
    await page.getByRole("button", { name: "关闭部员手册", exact: true }).click();
    await page.getByRole("button", { name: "打开部员手册", exact: true }).click();
    await expect(pieces).toHaveCount(10);
    if (viewport.width > 768) {
      expect(await pieces.first().evaluate(el => el.getAnimations().find(a => a.animationName?.startsWith("handbook-strip-from-")).playState)).toBe("running");
      await expect.poll(() => pieces.evaluateAll(elements => elements.every(el => el.getAnimations().filter(a => a.animationName?.startsWith("handbook-strip-from-")).every(a => a.playState === "finished")))).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}

test("desktop reduced motion and corruption keep their original presentation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/tests/e2e/fixtures/handbook-puzzle.html");
  await expect(page.locator(".handbook-puzzle-piece")).toHaveCount(10);
  expect(await page.locator(".handbook-puzzle-piece").evaluateAll(entryAnimations)).toEqual([]);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/tests/e2e/fixtures/handbook-puzzle.html?corrupt");
  await expect(page.locator(".handbook-puzzle-piece")).toHaveCount(10);
  expect(await page.locator(".handbook-puzzle-piece").evaluateAll(entryAnimations)).toEqual([]);
  await expect(page.locator(".handbook-puzzle-tile:enabled")).toHaveCount(0);
});
