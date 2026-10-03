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
      const portrait = page.locator(".home-guide-portrait-layer .tutorial-npc-portrait-frame");
      const portraitBox = await portrait.boundingBox();
      expect(Math.abs(portraitBox.y - panel.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(portraitBox.x - panel.x)).toBeLessThanOrEqual(1);
      expect(portraitBox.width).toBe(viewport.width > 900 ? 88 : 76);
      expect(portraitBox.height).toBe(portraitBox.width);
      await expect.poll(() => portrait.locator("img").evaluate(el => el.complete && el.naturalWidth)).toBe(256);
      const textBox = await page.locator(".home-guide-panel p").boundingBox();
      expect(textBox.x - portraitBox.x - portraitBox.width).toBeGreaterThanOrEqual(10);
      await expect(page.locator(".home-guide-panel img")).toHaveCount(0);
      await expect(page.locator(".home-guide-panel .tutorial-npc-portrait-slot")).toHaveCSS("width", viewport.width > 900 ? "88px" : "76px");
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
      if (target && step.target) expect(Math.min(
        Math.min(target.y + target.height, portraitBox.y + portraitBox.height) - Math.max(target.y, portraitBox.y),
        Math.min(target.x + target.width, portraitBox.x + portraitBox.width) - Math.max(target.x, portraitBox.x)
      ), `${step.id} portrait clears the target`).toBeLessThanOrEqual(1);
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

test.describe("animated home guide avatar stability", () => {
  test.use({ reducedMotion: "no-preference" });
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 360, height: 640 }]) {
    test(`home typing keeps the avatar fixed ${viewport.width}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.route("**/api/**", route => route.fulfill({ json: { items: [] } }));
      await page.clock.install();
      await page.clock.pauseAt(new Date());
      await page.goto("/tests/e2e/fixtures/home-onboarding.html");
      const avatar = page.locator(".home-guide-portrait-layer .tutorial-npc-portrait-frame");
      await expect.poll(() => avatar.locator("img").evaluate(el => el.complete && el.naturalWidth), { timeout: 15000 }).toBe(256);
      await expect(avatar).toHaveCSS("--tutorial-npc-color", "#ff9b4d");
      expect(await avatar.evaluate(el => getComputedStyle(el).borderTopColor)).toBe(
        await page.locator(".tutorial-npc-copy").evaluate(el => getComputedStyle(el).borderTopColor)
      );
      await page.evaluate(() => document.fonts.ready);
      await page.clock.runFor(400);
      await expect.poll(() => page.locator(".tutorial-battle-dialogue").evaluate(el => getComputedStyle(el).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
      const initialAvatar = await avatar.boundingBox();
      const copy = page.locator(".tutorial-npc-copy");
      const initialCopy = await copy.boundingBox();
      const initialLength = await copy.locator("p").evaluate(el => el.textContent.length);
      await page.clock.runFor(1600);
      expect(await avatar.boundingBox()).toEqual(initialAvatar);
      expect(await copy.locator("p").evaluate(el => el.textContent.length)).toBeGreaterThan(initialLength);
      const finalCopy = await copy.boundingBox();
      expect(finalCopy.height).toBeGreaterThanOrEqual(initialCopy.height);
      if (viewport.width <= 900) expect(finalCopy.height).toBeGreaterThan(initialCopy.height);
      expect(finalCopy.y).toBe(initialCopy.y);
      await page.screenshot({ path: testInfo.outputPath("home-typing.png") });
    });
  }
});
