import { test, expect } from "@playwright/test";
import { HOME_ONBOARDING_STEPS } from "../../src/home/onboarding/homeOnboardingScript.js";

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 360, height: 640 }]) {
  test(`complete real-window home tour ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/api/**", async (route) => {
      const url = route.request().url();
      const data = url.includes("mailbox") ? { messages: [], unreadCount: 0, badgeCount: 0 }
        : url.includes("recruitment") ? { items: [], utilities: [], task: null }
          : url.includes("profile") ? { profile: { username: "新部员", characterStats: [], rating: 1000 } }
            : { items: [] };
      await route.fulfill({ json: data });
    });
    await page.goto("/tests/e2e/fixtures/home-onboarding.html");
    await expect(page.getByRole("dialog", { name: "主界面引导" })).toBeVisible();
    await expect.poll(async () => (await page.locator(".home-guide-scrim").boundingBox())?.height).toBe(viewport.height);
    for (const step of HOME_ONBOARDING_STEPS) {
      await expect(page.locator(".home-onboarding")).toHaveAttribute("data-step", step.id);
      if (step.choice) {
        await expect(page.locator(".tutorial-battle-dialogue")).toHaveCount(0);
        const reply = await page.locator(".home-guide-choice-panel").boundingBox();
        expect(Math.abs(reply.y + reply.height / 2 - viewport.height / 2)).toBeLessThan(2);
        await page.getByRole("button", { name: step.choice, exact: true }).click();
        continue;
      }
      if (step.text) await expect(page.locator(".home-guide-panel p")).toHaveText(step.text);
      if (step.target || step.surface) await expect(page.locator(".home-guide-spotlight")).toBeVisible();
      await expect(page.getByText("正在准备介绍的窗口…", { exact: true })).toHaveCount(0);
      const target = step.target || step.surface ? await page.locator(".home-guide-spotlight").boundingBox() : null;
      const scrollBefore = await page.evaluate(() => [window.scrollY, document.querySelector(".app-shell").scrollTop]);
      await page.mouse.move(8, viewport.height - 8);
      await page.mouse.wheel(0, 240);
      expect(await page.evaluate(() => [window.scrollY, document.querySelector(".app-shell").scrollTop])).toEqual(scrollBefore);
      if (step.target) await expect.poll(async () => page.evaluate(targetName => {
        const actual = [...document.querySelectorAll(`[data-home-guide="${targetName}"]`)]
          .map(el => el.getBoundingClientRect()).find(rect => rect.width && rect.height);
        const highlight = document.querySelector(".home-guide-spotlight").getBoundingClientRect();
        return Math.max(Math.abs(highlight.y - Math.max(6, actual.y - 5)), Math.abs(highlight.x - Math.max(6, actual.x - 5)));
      }, step.target), { message: `${step.id} tracks its actual target` }).toBeLessThan(2);
      const panel = await page.locator(".home-guide-panel").boundingBox();
      expect(panel.x).toBeGreaterThanOrEqual(0);
      expect(panel.x + panel.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(panel.y + panel.height).toBeLessThanOrEqual(viewport.height + 1);
      if (!step.target) expect(panel.y).toBeLessThan(100);
      if (target && step.target) await expect.poll(async () => {
        const a = await page.locator(".home-guide-spotlight").boundingBox();
        const b = await page.locator(".home-guide-panel").boundingBox();
        return Math.min(Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y),
          Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
      }, { message: `${step.id} spotlight overlaps dialogue` }).toBeLessThanOrEqual(1);
      if (step.surface) {
        const windowRect = await page.locator(step.surface).first().boundingBox();
        await page.locator(".home-onboarding").evaluate(el => { el.style.visibility = "hidden"; });
        expect(await page.locator(step.surface).first().boundingBox()).toEqual(windowRect);
        await page.locator(".home-onboarding").evaluate(el => { el.style.removeProperty("visibility"); });
      }
      if (["handbook", "sigrika", "skill", "practice", "recruitment-intro", "shop-intro", "mailbox"].includes(step.id)) {
        await page.screenshot({ path: testInfo.outputPath(`${step.id}.png`) });
      }
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog", { name: "主界面引导" })).toBeVisible();
      if (step.action) {
        await expect(page.locator(".home-guide-target")).toHaveCSS("opacity", "0");
        await page.locator(".home-guide-target").click();
      }
      else if (step.choice) await page.getByRole("button", { name: step.choice, exact: true }).click();
      else await page.locator(".tutorial-battle-dialogue").click();
    }
    await expect(page.getByTestId("outcome")).toHaveText("completed");
    await expect(page.locator(".home-onboarding")).toHaveCount(0);
    expect(await page.evaluate(() => Boolean(window.__unexpectedAction))).toBe(false);
    expect(errors).toEqual([]);
  });
}
