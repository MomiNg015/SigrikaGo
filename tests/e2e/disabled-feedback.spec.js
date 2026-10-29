import { test, expect } from "@playwright/test";

async function pointPress(page, button) {
  await button.scrollIntoViewIfNeeded();
  const box = await button.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}
async function expectShake(button) {
  await expect(button).toHaveClass(/ui-unavailable-shake/);
  await expect.poll(() => button.evaluate(el => Math.abs(parseFloat(getComputedStyle(el).translate)))).toBeGreaterThan(0.5);
  expect(await button.evaluate(el => el.style.getPropertyPriority("translate"))).toBe("important");
}

for (const width of [1440, 390, 320]) {
  test(`disabled resume and battle controls at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/api/users/feedback/profile?*", route => route.fulfill({ json: { profile: { id: "feedback", username: "星炬同学", characterStats: [] } } }));
    await page.goto("/tests/e2e/fixtures/disabled-feedback.html?surface=resume");
    for (const name of ["成就", "个性化"]) {
      const button = page.getByRole("button", { name, exact: true });
      await expect(button).toBeDisabled();
      await pointPress(page, button);
      await expectShake(button);
    }
    expect(await page.evaluate(() => window.feedbackActions)).toBe(0);
    await page.goto("/tests/e2e/fixtures/disabled-feedback.html");
    for (const button of [page.locator(".skill-action"), page.getByRole("button", { name: "后台保存" })]) {
      await expect(button).toBeDisabled();
      await pointPress(page, button);
      await expectShake(button);
    }
    const aria = page.getByRole("button", { name: "ARIA 禁用" });
    await aria.focus(); await page.keyboard.press("Enter");
    await expectShake(aria);
    expect(await page.evaluate(() => window.feedbackActions)).toBe(0);
  });
}

test("a dedicated-sound disabled button plays one unavailable sound per press", async ({ page }) => {
  await page.addInitScript(() => {
    window.feedbackSoundStarts = 0;
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      window.feedbackSoundStarts++;
      return start.apply(this, args);
    };
  });
  await page.goto("/tests/e2e/fixtures/disabled-feedback.html");
  await page.evaluate(async () => {
    const { preloadEffectSound, UI_UNAVAILABLE_SOUND } = await import("/src/audio/effectPlayback.js");
    await preloadEffectSound(UI_UNAVAILABLE_SOUND);
  });
  const button = page.getByRole("button", { name: "后台保存" });
  await pointPress(page, button);
  await expect.poll(() => page.evaluate(() => window.feedbackSoundStarts)).toBe(1);
  await expect(button).not.toHaveClass(/ui-unavailable-shake/);
  expect(await page.evaluate(() => window.feedbackSoundStarts)).toBe(1);
  await pointPress(page, button);
  await expect.poll(() => page.evaluate(() => window.feedbackSoundStarts)).toBe(2);
});

test("touch and reduced motion preserve unavailable feedback", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(`${test.info().project.use.baseURL}/tests/e2e/fixtures/disabled-feedback.html`);
  const button = page.locator(".skill-action");
  await expect(button).toBeVisible();
  const box = await button.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await expect(button).toHaveClass(/ui-unavailable-shake/);
  await expect.poll(() => button.evaluate(el => getComputedStyle(el).filter)).toContain("brightness");
  expect(await button.evaluate(el => el.style.translate)).toBe("");
  await expect(button).not.toHaveClass(/ui-unavailable-shake/);
  expect(await button.evaluate(el => el.style.filter)).toBe("");
  expect(await page.evaluate(() => window.feedbackActions)).toBe(0);
  await context.close();
});
