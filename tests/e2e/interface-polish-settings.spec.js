import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 1440, height: 800 },
  { width: 800, height: 600 },
  { width: 390, height: 844 },
  { width: 320, height: 568 }
]) {
  test(`settings shell stays fixed across tabs and long copy at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/tests/e2e/fixtures/interface-polish.html?surface=settings&long-about");
    await page.evaluate(() => document.fonts.ready);
    const shell = page.locator(".settings-modal");
    await expect(shell.locator(".window-bookmark-rail")).toBeVisible();
    await shell.evaluate(async element => {
      await Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => {})));
    });
    const initial = await shell.boundingBox();
    const assertStable = async () => {
      const rect = await shell.boundingBox();
      for (const key of ["x", "y", "width", "height"]) expect(rect[key]).toBeCloseTo(initial[key], 1);
      expect(rect.y + rect.height).toBeLessThan(viewport.height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    };
    const audioPanel = shell.locator(".settings-panel");
    await audioPanel.evaluate(element => { element.scrollTop = element.scrollHeight; });
    await expect(shell.getByRole("slider", { name: "语音", exact: true })).toBeInViewport({ ratio: 1 });
    for (const name of ["界面", "关于"]) {
      await shell.getByRole("tab", { name, exact: true }).click();
      await assertStable();
    }
    for (const name of ["碎碎念", "返回"]) {
      const copy = shell.locator(".about-panel-text");
      const action = shell.getByRole("button", { name, exact: true });
      // Wait for the existing panel entrance before comparing scroll-only movement.
      await shell.locator(".settings-panel").evaluate(async element => {
        await Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => {})));
      });
      await action.click({ trial: true });
      // Trial positioning starts the ordinary button hover transition.
      await action.evaluate(async element => {
        await Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => {})));
      });
      const beforeScroll = await action.boundingBox();
      await copy.evaluate(element => { element.scrollTop = element.scrollHeight; });
      const metrics = await copy.evaluate(element => ({
        height: element.clientHeight, total: element.scrollHeight, top: element.scrollTop,
        width: element.clientWidth, totalWidth: element.scrollWidth
      }));
      expect(metrics.total).toBeGreaterThan(metrics.height);
      expect(metrics.top + metrics.height).toBeGreaterThanOrEqual(metrics.total - 1);
      expect(metrics.totalWidth).toBeLessThanOrEqual(metrics.width);
      expect((await action.boundingBox()).y).toBeCloseTo(beforeScroll.y, 1);
      await expect(action).toBeInViewport({ ratio: 1 });
      await action.click();
      await assertStable();
      expect(await copy.evaluate(element => element.scrollTop)).toBe(0);
    }
    await shell.getByRole("tab", { name: "音频", exact: true }).click();
    await assertStable();
  });
}
