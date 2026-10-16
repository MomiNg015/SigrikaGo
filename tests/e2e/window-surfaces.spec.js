import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { windowSurfaces, mockWindowData, settleWindow } from "./window-surfaces-fixture.js";

const before = JSON.parse(readFileSync(new URL("../../docs/design-samples/window-surfaces-2026-10-15/before.json", import.meta.url), "utf8"));
async function paper(locator) {
  const style = await locator.evaluate(element => {
    const s = getComputedStyle(element);
    return { image: s.backgroundImage, size: s.backgroundSize, color: s.backgroundColor };
  });
  expect(style.image).toContain("linear-gradient(90deg");
  expect(style.size.split(", ")).toEqual(["20px 20px", "20px 20px"]);
  expect(style.color).toBe("rgb(255, 251, 242)");
}

for (const width of [1440, 390]) {
  test(`nested handbook windows share paper at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockWindowData(page);
    await page.goto("/tests/e2e/fixtures/handbook-puzzle.html?costumes");
    await page.getByRole("button", { name: "西格莉卡角色详情", exact: true }).click();
    await paper(page.locator(".character-detail"));
    await page.getByRole("button", { name: "查看西格莉卡的服装" }).click();
    await paper(page.locator(".character-costume-dialog"));
    await page.getByRole("button", { name: /查看默认服装详情/ }).click();
    await paper(page.locator(".character-costume-detail"));
  });
  for (const surface of ["match", "result"]) {
    test(`${surface} game window shares paper at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await mockWindowData(page);
      await page.goto(`/tests/e2e/fixtures/global-portraits.html?surface=${surface}`);
      const dialog = page.locator(surface === "match" ? ".small-modal" : ".result-modal");
      await expect(dialog).toBeVisible();
      await paper(dialog);
    });
  }
}

for (const width of [1440, 390]) {
  for (const [surface, selector] of Object.entries(windowSurfaces)) {
    test(`${surface} window paper at ${width}`, async ({ page }) => {
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
      await mockWindowData(page);
      await page.goto(`/tests/e2e/fixtures/window-surfaces.html?surface=${surface}`);
      await expect(page.locator(selector).first()).toBeVisible();
      await settleWindow(page);
      if (surface === "Shop") {
        const saved = before.find(row => row.width === width && row.surface === "Shop");
        expect(await page.locator(selector).evaluate(element => getComputedStyle(element).backgroundImage)).toBe(saved.background);
        expect(await page.locator(selector).evaluate(element => getComputedStyle(element).backgroundColor)).toBe(saved.color);
      } else await paper(page.locator(selector).first());
      if (["Resume", "Profile"].includes(surface)) {
        for (const content of [".profile-folder-page"]) {
          expect(await page.locator(content).evaluate(element => getComputedStyle(element).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
        }
      }
      expect(errors).toEqual([]);
    });
  }
}

for (const width of [1440, 800, 390, 320]) {
  for (const variant of ["", "&long&nameplate"]) {
    test(`profile tools and identity align at ${width} ${variant || "plain"}`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
      await mockWindowData(page);
      await page.goto(`/tests/e2e/fixtures/window-surfaces.html?surface=Profile${variant}`);
      await expect(page.locator(".profile-resume-hero")).toBeVisible();
      await settleWindow(page);
      const card = await page.locator(".profile-resume-hero").boundingBox();
      const avatar = await page.locator(".profile-hero-portrait").boundingBox();
      const identity = await page.locator(".profile-identity-block").boundingBox();
      expect(Math.abs(avatar.y + avatar.height / 2 - identity.y - identity.height / 2)).toBeLessThan(1);
      expect(Math.abs(avatar.y + avatar.height / 2 - card.y - card.height / 2)).toBeLessThan(1);
      await expect(page.locator(".profile-identity-actions")).toHaveCSS("position", "absolute");
      const buttons = page.locator(".profile-identity-actions > button");
      await expect(buttons).toHaveCount(4);
      const rects = await buttons.evaluateAll(elements => elements.map(element => {
        const r = element.getBoundingClientRect(), s = getComputedStyle(element);
        return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height, like: element.classList.contains("profile-like-button"), text: element.textContent, title: element.title, label: element.getAttribute("aria-label"), radius: s.borderRadius, border: s.borderColor };
      }));
      for (const rect of rects) {
        expect(rect.text).toBe(rect.like ? "4" : ""); expect(rect.title).toBe(rect.label);
        expect(rect.width).toBe(rect.like ? 54 : 34); expect(rect.height).toBe(34);
        expect(rect.radius).toBe("9px"); expect(rect.border).toBe(rects[0].border);
        expect(rect.y).toBe(rects[0].y);
        for (const content of [avatar, identity]) {
          const overlapsHorizontally = rect.x < content.x + content.width && rect.right > content.x;
          if (overlapsHorizontally) expect(rect.y).toBeGreaterThan(content.y + content.height);
        }
        expect(rect.x).toBeGreaterThanOrEqual(card.x);
        expect(rect.right).toBeLessThanOrEqual(card.x + card.width);
      }
      expect(card.x + card.width - rects.at(-1).right).toBeLessThanOrEqual(26);
      expect(card.y + card.height - rects.at(-1).bottom).toBeLessThanOrEqual(24);
      const name = await page.locator(".profile-identity-block .user-identity").boundingBox();
      expect(name.x + name.width).toBeLessThanOrEqual(card.x + card.width);
      await buttons.last().click();
      await paper(page.getByRole("dialog", { name: "举报用户" }));
      await page.keyboard.press("Escape");
      await expect(buttons.last()).toBeFocused();
    });
  }
}
