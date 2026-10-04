import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 1440, height: 768 }, { width: 390, height: 844 }, { width: 360, height: 640 }]) {
  test.describe(`handbook ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport, isMobile: viewport.width < 769, hasTouch: viewport.width < 769 });
    test("each polygon opens real details and the anonymous piece keeps hidden intelligence", async ({ page }) => {
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("**/api/skill-traits", (route) => route.fulfill({ json: { traits: [] } }));
      await page.goto("/tests/e2e/fixtures/handbook-puzzle.html");
      const tiles = page.locator("button.handbook-puzzle-tile");
      await expect(tiles).toHaveCount(10);
      await expect(page.locator(".sortie-button")).toHaveCount(0);
      await expect.poll(() => page.locator(".handbook-puzzle-board").evaluate((board) => {
        const art = board.querySelector(".handbook-puzzle-portrait");
        return art.complete && art.naturalWidth && art.getBoundingClientRect().width < board.clientWidth;
      })).toBeTruthy();
      for (let index = 0; index < 10; index++) {
        const tile = tiles.nth(index);
        await tile.scrollIntoViewIfNeeded();
        const point = await tile.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const points = getComputedStyle(element).clipPath.match(/[-\d.]+%/g).map(parseFloat);
          let x = 0, y = 0;
          for (let axis = 0; axis < points.length; axis += 2) { x += points[axis]; y += points[axis + 1]; }
          return { x: rect.x + rect.width * x / (points.length / 2) / 100, y: rect.y + rect.height * y / (points.length / 2) / 100 };
        });
        await page.mouse.click(point.x, point.y);
        await expect(page.locator(".character-detail-fullbody")).toBeVisible();
        await expect(page.locator(".character-detail-figure img")).toBeVisible();
        const closeSvg = page.locator(".character-detail-fullbody .close-button svg");
        expect(await closeSvg.evaluate((element) => getComputedStyle(element).stroke)).toBe(await closeSvg.evaluate((element) => getComputedStyle(element).color));
        await page.getByRole("button", { name: "关闭角色详情", exact: true }).click();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
      await page.goto("/tests/e2e/fixtures/handbook-puzzle.html?owned=partial");
      await expect(page.locator(".handbook-puzzle-question")).toHaveCount(6);
      const unknown = page.getByRole("button", { name: "未知角色详情", exact: true });
      await unknown.click();
      const dialog = page.getByRole("dialog", { name: "未知角色详情" });
      await expect(dialog).toHaveText(/暂无情报/);
      await expect(dialog.getByText("猪小仙")).toHaveCount(0);
      await page.keyboard.press("Escape");
      await expect(unknown).toBeFocused();
      expect(errors).toEqual([]);
    });
  });
}

test("desktop hover lifts the puzzle piece and reduced motion keeps it still", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto("/tests/e2e/fixtures/handbook-puzzle.html");
  const tile = page.getByRole("button", { name: "西格莉卡角色详情", exact: true });
  await tile.hover();
  await expect.poll(() => tile.evaluate((element) => getComputedStyle(element.parentElement).transform)).not.toBe("none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => tile.evaluate((element) => getComputedStyle(element.parentElement).transform)).toBe("none");
});
