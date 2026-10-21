import { expect, test } from "@playwright/test";

for (const width of [1440, 390, 360, 320]) {
  test(`auth cards keep their geometry through registration errors at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/auth/register", route => route.fulfill({ status: 409, json: { error: "用户名已存在" } }));
    await page.goto("/tests/e2e/fixtures/window-surfaces.html?surface=Auth");
    await page.evaluate(() => document.fonts.ready);
    const card = page.locator(".auth-panel");
    await expect(card).toHaveCSS("background-image", "none");
    expect(await card.evaluate(e => getComputedStyle(e).backgroundColor)).toMatch(/^rgb\(/);
    await expect(page.locator(".auth-go-mark")).toHaveCSS("opacity", "0.5");
    await page.screenshot({ path: testInfo.outputPath(`login-${width}.png`), fullPage: true });
    await page.getByRole("button", { name: "注册", exact: true }).click();
    const initial = await card.boundingBox();
    const submit = page.getByRole("button", { name: "登记入部信息" });
    const expectStableCard = async () => {
      const current = await card.boundingBox();
      expect(current.width).toBe(initial.width);
      expect(current.height).toBe(initial.height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      for (const error of await page.locator(".auth-label-row .auth-field-error").all()) {
        const label = await error.locator("..").boundingBox();
        const bounds = await error.boundingBox();
        expect(bounds.y).toBe(label.y);
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(label.y + label.height + 1);
        expect(Math.abs(bounds.x + bounds.width - label.x - label.width)).toBeLessThan(1);
      }
    };
    await submit.click();
    await expect(page.locator(".auth-label-row .auth-field-error")).toHaveCount(3);
    await expectStableCard();
    await page.locator("#auth-username").fill("a!!!");
    await page.locator("#auth-password").fill("x");
    await page.locator("#auth-confirm-password").fill("y");
    await submit.click();
    await expectStableCard();
    await page.screenshot({ path: testInfo.outputPath(`register-errors-${width}.png`), fullPage: true });
    await page.locator("#auth-username").fill("TestUser");
    await page.locator("#auth-password").fill("password123");
    await page.locator("#auth-confirm-password").fill("password123");
    await submit.click();
    await expect(page.locator(".form-error")).toHaveText("用户名已存在");
    await expectStableCard();
  });

  test(`entry loading tip and first-load note stay centered at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/tests/e2e/fixtures/window-surfaces.html?surface=Loading");
    await page.evaluate(() => document.fonts.ready);
    const tip = page.locator(".login-loading-tip");
    const note = page.getByText("（第一次加载需要2-3分钟，请耐心等待）");
    const bar = await page.getByRole("progressbar").boundingBox();
    await expect(tip).toHaveCSS("text-align", "center");
    const noteBounds = await note.boundingBox();
    expect(noteBounds.y).toBeGreaterThanOrEqual(bar.y + bar.height);
    for (const locator of [tip, note]) {
      const bounds = await locator.boundingBox();
      expect(Math.abs(bounds.x + bounds.width / 2 - width / 2)).toBeLessThan(1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({ path: testInfo.outputPath(`loading-${width}.png`), fullPage: true });
  });
}
