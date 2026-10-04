import { expect, test } from "@playwright/test";

async function openFromStrip(page, tile, mobile) {
  await tile.scrollIntoViewIfNeeded();
  if (mobile) {
    await tile.tap();
    await expect(tile).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".character-detail-fullbody")).toHaveCount(0);
    const action = tile.locator("..").locator(".handbook-strip-detail-action");
    await action.scrollIntoViewIfNeeded();
    await action.tap();
  } else await tile.click();
}

for (const viewport of [{ width: 1440, height: 1024 }, { width: 1440, height: 768 },
  { width: 390, height: 844 }, { width: 360, height: 640 }]) {
  test.describe(`handbook strips ${viewport.width}x${viewport.height}`, () => {
    const mobile = viewport.width < 769;
    test.use({ viewport, isMobile: mobile, hasTouch: mobile });
    test("ordered clipped slices and touch detail actions preserve all real details and anonymity", async ({ page }) => {
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("**/api/skill-traits", (route) => route.fulfill({ json: { traits: [] } }));
      await page.goto("/tests/e2e/fixtures/handbook-puzzle.html");
      const tiles = page.locator("button.handbook-puzzle-tile");
      await expect(tiles).toHaveCount(10);
      await expect(page.locator(".sortie-button")).toHaveCount(0);
      expect(await page.locator(".handbook-puzzle-piece").evaluateAll((pieces) => pieces.map((piece) => piece.dataset.characterId)))
        .toEqual(["sigrika", "denia", "aemeath", "baconbits", "lynae", "qiuyuan", "mornye", "changli", "chisa", "nabomo"]);
      await expect.poll(() => tiles.first().locator("img").evaluate((art) => art.complete && art.naturalWidth > 0)).toBeTruthy();
      for (let index = 0; index < 10; index++) {
        const tile = tiles.nth(index);
        await tile.scrollIntoViewIfNeeded();
        expect(await tile.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
          return hit?.closest(".handbook-puzzle-tile") === element;
        })).toBeTruthy();
        await openFromStrip(page, tile, mobile);
        await expect(page.locator(".character-detail-fullbody")).toBeVisible();
        await expect(page.locator(".character-detail-figure img")).toBeVisible();
        await page.getByRole("button", { name: "关闭角色详情", exact: true }).click();
        await expect(tile).toBeFocused();
      }
      const panel = page.locator(".handbook-puzzle-panel");
      if (mobile) {
        expect(await panel.evaluate((element) => element.scrollHeight > element.clientHeight && getComputedStyle(element).overflowY === "auto")).toBeTruthy();
        await tiles.last().scrollIntoViewIfNeeded();
        expect(await tiles.last().evaluate((tile) => tile.getBoundingClientRect().bottom <= tile.closest(".handbook-puzzle-panel").getBoundingClientRect().bottom + 1)).toBeTruthy();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
      await page.goto("/tests/e2e/fixtures/handbook-puzzle.html?owned=partial");
      await expect(page.locator(".handbook-puzzle-question")).toHaveCount(6);
      const unknown = page.getByRole("button", { name: "未知角色详情", exact: true });
      await openFromStrip(page, unknown, mobile);
      const dialog = page.getByRole("dialog", { name: "未知角色详情" });
      await expect(dialog).toHaveText(/暂无情报/);
      await expect(dialog.getByText("猪小仙")).toHaveCount(0);
      await page.keyboard.press("Escape");
      await expect(unknown).toBeFocused();
      expect(errors).toEqual([]);
    });

    test("preview expands the correct axis with reachable neighbors and stable matte fills", async ({ page }) => {
      await page.goto("/tests/e2e/fixtures/handbook-puzzle.html");
      const tile = page.getByRole("button", { name: "西格莉卡角色详情", exact: true });
      const axis = mobile ? "height" : "width";
      const resting = await tile.evaluate((element, axis) => element.getBoundingClientRect()[axis], axis);
      const fill = await tile.evaluate((element) => getComputedStyle(element).backgroundImage);
      if (mobile) await tile.tap();
      else await tile.hover();
      await expect.poll(() => tile.evaluate((element, axis) => element.getBoundingClientRect()[axis], axis)).toBeGreaterThan(resting * 2);
      expect(await tile.evaluate((element) => getComputedStyle(element).backgroundImage)).toBe(fill);
      expect(await tile.evaluate((element) => getComputedStyle(element).transform)).toBe("none");
      const neighbor = page.locator(".handbook-puzzle-tile").nth(1);
      expect(await neighbor.evaluate((element, axis) => element.getBoundingClientRect()[axis], axis)).toBeGreaterThan(44);
      await page.emulateMedia({ reducedMotion: "reduce" });
      // The global reduced-motion contract retains a 1ms transition duration.
      const reducedDurations = await tile.evaluate((element) =>
        getComputedStyle(element.parentElement).transitionDuration.split(",").map((duration) =>
          parseFloat(duration) * (duration.trim().endsWith("ms") ? 1 : 1000)));
      expect(Math.max(...reducedDurations)).toBeLessThanOrEqual(1);
      await neighbor.scrollIntoViewIfNeeded();
      if (mobile) await neighbor.tap();
      else await neighbor.focus();
      await expect(neighbor).toHaveAttribute("aria-expanded", "true");
      await expect.poll(() => neighbor.evaluate((element, axis) => element.getBoundingClientRect()[axis], axis)).toBeGreaterThan(resting * 2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    });
  });
}

test.describe("mobile strip rotation", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test("detail focus returns to a stable trigger after the mobile action disappears", async ({ page }) => {
    await page.route("**/api/skill-traits", (route) => route.fulfill({ json: { traits: [] } }));
    await page.goto("/tests/e2e/fixtures/handbook-puzzle.html?candy");
    const tile = page.getByRole("button", { name: "达妮娅角色详情", exact: true });
    await openFromStrip(page, tile, true);
    await page.setViewportSize({ width: 932, height: 430 });
    await expect(page.locator(".handbook-strip-detail-action")).toHaveCount(0);
    await page.getByRole("button", { name: "关闭角色详情", exact: true }).click();
    await expect(tile).toBeFocused();
  });
});
