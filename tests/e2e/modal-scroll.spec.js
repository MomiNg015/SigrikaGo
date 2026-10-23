import { expect, test } from "@playwright/test";

async function swipe(page, target, distance, horizontalPosition = 0.5) {
  const rect = await target.boundingBox();
  const x = rect.x + rect.width * horizontalPosition;
  const y = rect.y + Math.max(2, Math.min(rect.height - 2, rect.height / 2 + distance / 2));
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let step = 1; step <= 8; step += 1) {
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - distance * step / 8 }] });
    await page.waitForTimeout(24);
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await client.detach();
  await page.waitForTimeout(350);
}

for (const width of [320, 390]) {
  test(`touch stays inside the window and unlocks at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 700 });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/tests/e2e/fixtures/modal-scroll.html");
    const home = page.locator(".home-screen");
    // This theme's home route naturally scrolls the document; retain an
    // independent scroller as well to catch both forms of background leakage.
    await home.evaluate(node => node.style.setProperty("height", "700px", "important"));
    await home.evaluate(node => { node.scrollTop = 120; });
    await page.getByRole("button", { name: "打开测试窗口" }).click();
    await expect(home).toHaveCSS("overflow-y", "hidden");
    const position = () => page.evaluate(() => ({
      page: window.scrollY, home: document.querySelector(".home-screen").scrollTop,
      shell: document.querySelector(".app-shell").scrollTop
    }));
    const original = await position();
    await page.getByRole("tab", { name: "关于", exact: true }).click();
    const panel = page.locator(".about-panel");
    await expect.poll(() => panel.evaluate(node => node.scrollHeight - node.clientHeight)).toBeGreaterThan(100);
    await swipe(page, panel, 160);
    await expect.poll(() => panel.evaluate(node => node.scrollTop)).toBeGreaterThan(20);
    expect(await position()).toEqual(original);
    await panel.evaluate(node => { node.scrollTop = node.scrollHeight; });
    await swipe(page, panel, 130);
    expect(await position()).toEqual(original);
    await panel.evaluate(node => { node.scrollTop = 0; });
    await swipe(page, panel, -130);
    expect(await position()).toEqual(original);
    await swipe(page, page.locator(".settings-modal h2"), 30);
    expect(await position()).toEqual(original);
    await swipe(page, page.locator(".modal-backdrop"), 100, 0.01);
    expect(await position()).toEqual(original);
    await page.getByRole("button", { name: "关闭设置" }).click();
    const confirm = page.locator(".confirm-modal");
    await expect(confirm).toBeVisible();
    await swipe(page, confirm.locator("p"), 30);
    expect(await position()).toEqual(original);
    expect(await panel.evaluate(node => node.scrollTop)).toBe(0);
    await page.getByRole("button", { name: "取消", exact: true }).click();
    await expect(home).toHaveCSS("overflow-y", "hidden");
    await swipe(page, panel, 160);
    await expect.poll(() => panel.evaluate(node => node.scrollTop)).toBeGreaterThan(20);
    await page.screenshot({ path: testInfo.outputPath(`modal-scroll-${width}.png`) });
    await page.getByRole("button", { name: "关闭设置" }).click();
    await page.getByRole("button", { name: "全部关闭" }).click();
    await expect(home).toHaveCSS("overflow-y", "auto");
    expect(await position()).toEqual(original);
    await swipe(page, home, 160);
    await expect.poll(() => home.evaluate(node => node.scrollTop)).toBeGreaterThan(original.home);
    expect(errors).toEqual([]);
  });
}

for (const [width, height] of [[320, 568], [320, 700], [390, 700], [390, 844]]) {
  test(`leaderboard personal rank cannot move the window at ${width}x${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.route("**/api/leaderboard?*", route => route.fulfill({ json: { players: Array.from({ length: 40 }, (_, index) => ({
      id: `player-${index}`, username: `棋手${index}`, rank: "3段", stars: 2, wins: 40 - index, losses: 2, draws: 1, totalGames: 43 - index
    })) } }));
    await page.goto("/tests/e2e/fixtures/modal-scroll.html?surface=leaderboard");
    await page.getByRole("button", { name: "打开测试窗口" }).click();
    const label = page.getByText("我的排名", { exact: true });
    const modal = page.locator(".leaderboard-modal");
    await expect(label).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    const geometry = () => label.evaluate(node => {
      const result = [];
      for (let element = node; element; element = element.parentElement) {
        const rect = element.getBoundingClientRect();
        result.push({ name: element.className || element.tagName, top: rect.y, height: rect.height, scroll: element.scrollTop, content: element.scrollHeight, client: element.clientHeight, overflow: getComputedStyle(element).overflowY });
      }
      return result;
    });
    const before = await geometry();
    const list = page.locator(".lp-scroll");
    const backdrop = page.locator(".modal-backdrop");
    // Absolutely positioned screen-reader labels must be contained by the
    // scrolling list, otherwise their static positions enlarge the backdrop.
    expect(await list.evaluate(node => [...node.querySelectorAll(".lp-row .lp-rate small")]
      .every(label => node === label.offsetParent || node.contains(label.offsetParent)))).toBe(true);
    expect(await backdrop.evaluate(node => node.scrollHeight - node.clientHeight)).toBeLessThanOrEqual(1);
    const bounds = await modal.boundingBox();
    await swipe(page, label, 220);
    const after = await geometry();
    await testInfo.attach("scroll-geometry", { body: JSON.stringify({ before, after }, null, 2), contentType: "application/json" });
    await page.screenshot({ path: testInfo.outputPath(`leaderboard-after-swipe-${width}.png`) });
    expect((await modal.boundingBox()).y).toBeCloseTo(bounds.y, 0);
    await expect(label).toBeInViewport();
    await swipe(page, list, 160);
    await expect.poll(() => list.evaluate(node => node.scrollTop)).toBeGreaterThan(20);
    await list.evaluate(node => { node.scrollTop = node.scrollHeight; });
    await expect(list.locator(".lp-row").last()).toBeInViewport();
    await swipe(page, label, 160);
    expect((await modal.boundingBox()).y).toBeCloseTo(bounds.y, 0);
    expect(await backdrop.evaluate(node => node.scrollTop)).toBe(0);
  });
}

test.describe("desktop", () => {
  test.use({ hasTouch: false, isMobile: false, viewport: { width: 1440, height: 900 } });
  test("leaves desktop overflow unchanged", async ({ page }) => {
    await page.goto("/tests/e2e/fixtures/modal-scroll.html");
    const styles = () => page.evaluate(() => [document.documentElement, document.body, document.querySelector(".app-shell"), document.querySelector(".home-screen")]
      .map(node => ({ value: node.style.overflowY, priority: node.style.getPropertyPriority("overflow-y") })));
    const original = await styles();
    await page.getByRole("button", { name: "打开测试窗口" }).click();
    await expect(page.locator(".settings-modal")).toBeVisible();
    expect(await styles()).toEqual(original);
  });
});
