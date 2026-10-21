import { expect, test } from "@playwright/test";

for (const width of [390, 320]) {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    test(`IRIS touch target stays anchored at ${width} with ${reducedMotion}`, async ({ browser }, testInfo) => {
      const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, reducedMotion });
      const page = await context.newPage();
      try {
        await page.goto("http://127.0.0.1:5297/tests/e2e/fixtures/window-surfaces.html?surface=Iris");
        await page.evaluate(() => document.fonts.ready);
        const entry = page.getByRole("button", { name: "打开 IRIS 数据库" });
        const initial = await entry.boundingBox();
        const touch = await context.newCDPSession(page);
        await touch.send("DOM.enable");
        await touch.send("CSS.enable");
        const { root } = await touch.send("DOM.getDocument");
        const { nodeId } = await touch.send("DOM.querySelector", { nodeId: root.nodeId, selector: ".iris-database-entry" });
        // Touch browsers differ in when they apply/stick hover and active. Cover each CSS state explicitly.
        for (const forcedPseudoClasses of [["hover"], ["active"], ["hover", "active"], ["focus-visible"]]) {
          await touch.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses });
          await page.waitForTimeout(180);
          const current = await entry.boundingBox();
          for (const dimension of ["x", "y", "width", "height"]) {
            expect(Math.abs(current[dimension] - initial[dimension])).toBeLessThan(1);
          }
        }
        await touch.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: [] });
        await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: initial.x + initial.width * 0.65, y: initial.y + 8 }] });
        await page.waitForTimeout(350);
        const pressed = await entry.boundingBox();
        await page.screenshot({ path: testInfo.outputPath(`iris-pressed-${width}-${reducedMotion}.png`) });
        expect(Math.abs(pressed.y - initial.y)).toBeLessThan(1);
        expect(Math.abs(pressed.x - initial.x)).toBeLessThan(1);
        await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.getByRole("button", { name: "关闭 IRIS 数据库" }).tap();
        await expect(page.getByRole("dialog")).toHaveCount(0);
        await expect.poll(async () => (await entry.boundingBox()).y).toBeCloseTo(initial.y, 0);
        await entry.tap();
        await expect(page.getByRole("dialog")).toBeVisible();
      } finally {
        await context.close();
      }
    });
  }
}

test("IRIS desktop hover keeps its original placement feedback", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/tests/e2e/fixtures/window-surfaces.html?surface=Iris");
  const entry = page.getByRole("button", { name: "打开 IRIS 数据库" });
  const initial = await entry.boundingBox();
  await entry.hover();
  await expect.poll(async () => (await entry.boundingBox()).x).toBeCloseTo(initial.x - 10, 0);
  await entry.click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

for (const width of [1440, 390, 360, 320]) {
  test(`auth cards preserve compact geometry and readable feedback at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 640 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    let response;
    await page.route("**/api/auth/**", route => route.fulfill(response));
    for (const mode of ["login", "register"]) {
      response = mode === "register" ? { status: 409, json: { error: "用户名已存在" } } : { status: 401, json: { error: "用户名或密码错误" } };
      await page.goto(`/tests/e2e/fixtures/window-surfaces.html?surface=Auth&mode=${mode}`);
      await page.evaluate(() => document.fonts.ready);
      const card = page.locator(".auth-panel");
      await expect(card).toHaveCSS("background-image", "none");
      expect(await card.evaluate(e => getComputedStyle(e).backgroundColor)).toMatch(/^rgb\(/);
      await expect(page.locator(".auth-go-mark")).toHaveCount(0);
      await page.screenshot({ path: testInfo.outputPath(`${mode}-${width}.png`), fullPage: true });
      const initial = await card.boundingBox();
      for (const label of await page.locator(".auth-label-row").all()) {
        await expect(label).toHaveCSS("align-items", "baseline");
      }
      const submit = page.getByRole("button", { name: mode === "register" ? "登记入部信息" : "开门！" });
      await submit.hover();
      await expect(submit).toHaveCSS("transform", "none");
      const confirmInput = await page.locator(mode === "register" ? "#auth-confirm-password" : "#auth-password").boundingBox();
      const submitBounds = await submit.boundingBox();
      expect(submitBounds.y - confirmInput.y - confirmInput.height).toBeLessThanOrEqual(12);
      expect(initial.height).toBeLessThan(width > 900 ? 600 : 575);
      const expectStableCard = async () => {
        const current = await card.boundingBox();
        expect(current.width).toBe(initial.width);
        expect(current.height).toBe(initial.height);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
        const scroller = await page.locator(".auth-screen").boundingBox();
        expect(current.x).toBeGreaterThanOrEqual(scroller.x);
        expect(current.x + current.width + 6).toBeLessThanOrEqual(scroller.x + scroller.width + 0.5);
        for (const error of await page.locator(".auth-label-row .auth-field-error").all()) {
          const label = await error.locator("..").boundingBox();
          const bounds = await error.boundingBox();
          const input = await error.locator("xpath=../..").locator("input").boundingBox();
          expect(bounds.y).toBeGreaterThan(label.y);
          expect(bounds.y + bounds.height).toBeLessThanOrEqual(input.y - 1);
          expect(Math.abs(bounds.x + bounds.width - label.x - label.width)).toBeLessThan(1);
        }
      };
      await submit.click();
      await expect(page.locator(".auth-label-row .auth-field-error")).toHaveCount(mode === "register" ? 3 : 2);
      await expectStableCard();
      await page.locator("#auth-username").fill("a!!!");
      await page.locator("#auth-password").fill("x");
      if (mode === "register") await page.locator("#auth-confirm-password").fill("y");
      await submit.click();
      await expectStableCard();
      await page.screenshot({ path: testInfo.outputPath(`${mode}-errors-${width}.png`), fullPage: true });
      await page.locator("#auth-username").fill("TestUser");
      await page.locator("#auth-password").fill("password123");
      if (mode === "register") await page.locator("#auth-confirm-password").fill("password123");
      await submit.click();
      if (mode === "register") {
        await expect(page.locator(".auth-label-row #auth-username-error")).toHaveText("用户名已存在");
        await expect(page.locator(".form-error")).toHaveCount(0);
      } else {
        await expect(page.locator(".form-error")).toHaveText("用户名或密码错误");
      }
      await expectStableCard();
      await page.locator("#auth-username").fill("NewUser");
      await expect(page.locator(".form-error, #auth-username-error")).toHaveCount(0);

      response = { status: 502, contentType: "text/html", body: "<!DOCTYPE html><title>Gateway unavailable</title>" };
      await submit.click();
      await expect(page.locator(".form-error")).toContainText("并确认后端服务已启动");
      await expectStableCard();
      const feedback = page.getByRole("region", { name: "请求错误" });
      expect(await feedback.evaluate(e => e.scrollHeight <= e.clientHeight + 1)).toBe(true);
      const serverError = await page.locator(".form-error").boundingBox();
      const finalSubmit = await submit.boundingBox();
      const finalCard = await card.boundingBox();
      expect(serverError.y).toBeGreaterThanOrEqual(finalSubmit.y + finalSubmit.height + 6);
      expect(serverError.y + serverError.height).toBeLessThan(finalCard.y + finalCard.height);
      await page.locator(".auth-screen").evaluate(e => { e.scrollTop = e.scrollHeight; });
      await page.screenshot({ path: testInfo.outputPath(`${mode}-server-error-${width}.png`), fullPage: true });

      response = { status: 403, json: { error: `账号已封禁：${"这是需要完整保留的服务端说明。".repeat(10)}` } };
      await submit.click();
      await expect(page.locator(".form-error")).toContainText("账号已封禁");
      await expectStableCard();
      await feedback.focus();
      await page.keyboard.press("End");
      await expect.poll(() => feedback.evaluate(e => e.scrollTop)).toBeGreaterThan(0);
    }
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
