import { expect, test } from "@playwright/test";
import { settleWindow } from "./window-surfaces-fixture.js";

for (const width of [1440, 800, 390, 360, 320]) {
  for (const surface of ["Resume", "Profile"]) {
    test(`${surface} paper cards and attached bookmarks at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: width <= 360 ? 568 : 900 });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.route("**/api/**", route => {
        const url = new URL(route.request().url());
        if (!url.pathname.startsWith("/api/")) return route.continue();
        const empty = url.searchParams.get("mode") === "standard";
        return route.fulfill({ json: url.pathname.endsWith("/like") ? { likeCount: 5, likedToday: true } : url.pathname.endsWith("/profile") ? { profile: {
          rank: "3段", stars: 2, rating: 1200,
          recordStats: { totalGames: 128, wins: 83, losses: 42, draws: 3 },
          recentResults: ["win", "loss", "draw"],
          characterStats: empty ? [] : ["denia", "sigrika", "aemeath", "fina", "baconbits"].map(characterId => ({ characterId, total: 128, wins: 83, losses: 42, draws: 3 }))
        } } : {} });
      });
      await page.goto(`/tests/e2e/fixtures/window-surfaces.html?surface=${surface}`);
      const shell = page.locator(".profile-folder-modal");
      const rail = shell.locator(":scope > .window-bookmark-rail");
      await expect(rail.getByRole("tab")).toHaveText(["星炬", "标准", "其它"]);
      await expect(shell).not.toHaveAttribute("aria-busy", "true");
      await expect(shell.locator(".profile-folder")).not.toHaveAttribute("aria-busy", "true");
      await settleWindow(page);
      const bounds = await shell.boundingBox();
      const clip = await rail.evaluate(element => {
        const rect = element.getBoundingClientRect();
        return { right: rect.right, path: getComputedStyle(element).clipPath };
      });
      expect(clip.path).toBe("inset(0px 3px 0px 0px)");
      expect(Math.abs(clip.right - 3 - bounds.x)).toBeLessThan(1);
      expect(bounds.x).toBeGreaterThanOrEqual(58);
      expect(bounds.x + bounds.width + 7).toBeLessThanOrEqual(width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await expect(shell.locator(".profile-resume-hero")).toHaveCSS("box-shadow", "none");
      await expect(shell.locator(".profile-hero-portrait")).toHaveCSS("box-shadow", "none");
      await expect(shell.locator(".profile-hero-portrait > .profile-portrait-mask")).toHaveCSS("box-shadow", "none");
      if (width <= 768) {
        for (const button of await shell.locator(".profile-identity-actions > button:not(.profile-like-button), .profile-replay-button").all()) {
          const buttonBounds = await button.boundingBox();
          const size = await button.evaluate(e => e.classList.contains("profile-replay-button") ? 44 : 34);
          expect(buttonBounds.width).toBe(size);
          expect(buttonBounds.height).toBe(size);
          for (const text of await button.locator(":scope > span").all()) await expect(text).toBeHidden();
          await expect(button).toHaveAttribute("aria-label", /.+/);
        }
        {
          const portrait = await shell.locator(".profile-hero-portrait").boundingBox();
          const identity = await shell.locator(".profile-identity-block").boundingBox();
          const card = await shell.locator(".profile-resume-hero").boundingBox();
          expect(portrait.width).toBeGreaterThanOrEqual(84);
          expect(Math.abs(identity.y + identity.height / 2 - portrait.y - portrait.height / 2)).toBeLessThan(1);
          expect(Math.abs(portrait.y + portrait.height / 2 - card.y - card.height / 2)).toBeLessThan(1);
        }
      } else {
        await expect(shell.locator(".profile-replay-button > span")).toBeVisible();
      }
      await expect(shell.locator(".profile-identity-actions")).toHaveCSS("position", "absolute");
      const geometry = await shell.locator(".profile-resume-hero").evaluate(card => {
        const actions = card.querySelector(".profile-identity-actions");
        const measure = () => [card, card.querySelector(".profile-hero-portrait"), card.querySelector(".profile-identity-block")].map(e => {
          const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height];
        });
        const before = measure();
        const previous = actions.style.display;
        actions.style.setProperty("display", "none", "important");
        const hidden = measure();
        actions.style.removeProperty("display");
        if (previous) actions.style.display = previous;
        return { before, hidden };
      });
      expect(geometry.hidden).toEqual(geometry.before);
      if (surface === "Profile") {
        const like = shell.locator(".profile-like-button");
        await expect(like.locator(".profile-like-count")).toHaveText("4");
        await expect(like.locator(".profile-like-count")).toBeVisible();
        await expect(like).toHaveCSS("background-color", "rgb(191, 232, 221)");
        await like.hover();
        await expect(like).toHaveCSS("background-color", "rgb(191, 232, 221)");
      }
      for (const selector of [".profile-resume-hero", ".profile-summary-item", ".profile-recent-section", ".profile-character-section", ".profile-identity-actions button", ".profile-play-tabs button", ".profile-replay-button"]) {
        for (const element of await shell.locator(selector).all()) {
          const style = await element.evaluate(e => ({ fill: getComputedStyle(e).backgroundColor, shadow: getComputedStyle(e).boxShadow }));
          expect(style.fill, selector).not.toBe("rgba(0, 0, 0, 0)");
          if (selector !== ".profile-resume-hero") expect(style.shadow, selector).not.toBe("none");
        }
      }
      const body = shell.locator(".profile-folder");
      const bodyBounds = await body.boundingBox();
      for (const card of await shell.locator(".profile-resume-hero, .profile-summary-item, .profile-recent-section, .profile-character-section").all()) {
        const rect = await card.boundingBox();
        expect(rect.x).toBeGreaterThanOrEqual(bodyBounds.x + 4);
        expect(rect.x + rect.width + 3).toBeLessThanOrEqual(bodyBounds.x + bodyBounds.width - 2);
      }
      expect(await body.evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
      const lastRow = shell.locator(".profile-character-table tbody tr").last();
      await lastRow.scrollIntoViewIfNeeded();
      const lastBounds = await lastRow.boundingBox();
      expect(lastBounds.y + lastBounds.height).toBeLessThanOrEqual(bounds.y + bounds.height - 10);
      await body.evaluate(e => { e.scrollTop = e.scrollHeight; });
      const tableCard = shell.locator(".profile-character-section");
      const bottomCard = await tableCard.boundingBox();
      expect(bottomCard.y + bottomCard.height + 4).toBeLessThanOrEqual(bodyBounds.y + bodyBounds.height - 4);
      if (width <= 360) {
        await tableCard.evaluate(e => { e.scrollLeft = e.scrollWidth; });
        expect(await tableCard.evaluate(e => e.scrollLeft)).toBeGreaterThan(0);
        expect(await body.evaluate(e => e.scrollLeft)).toBe(0);
        expect((await tableCard.boundingBox()).x).toBe(bottomCard.x);
        await tableCard.evaluate(e => { e.scrollLeft = 0; });
      }
      await rail.getByRole("tab", { name: "星炬", exact: true }).focus();
      await page.keyboard.press("ArrowDown");
      await expect(rail.getByRole("tab", { name: "标准", exact: true })).toHaveAttribute("aria-selected", "true");
      await expect(shell.getByText("暂无角色战绩")).toBeVisible();
      await page.keyboard.press("ArrowUp");
      await expect(lastRow).toBeAttached();
      await shell.locator(".profile-folder").evaluate(e => { e.scrollTop = 0; });
      if (surface === "Profile") {
        await shell.locator(".profile-like-button").click();
        await expect(shell.locator(".profile-like-count")).toHaveText("5");
      }
      if ([1440, 390].includes(width)) await page.screenshot({ path: `docs/design-samples/profile-cards-2026-10-15/production-${surface.toLowerCase()}-${width}.png` });
      expect(errors).toEqual([]);
    });
  }
}
