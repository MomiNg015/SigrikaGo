import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 1440, height: 1024 }, { width: 1280, height: 960 },
  { width: 1024, height: 768 }, { width: 769, height: 1024 }
]) {
  test(`desktop handbook names clear visible portrait pixels at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/tests/e2e/fixtures/handbook-puzzle.html");
    await page.evaluate(() => document.fonts.ready);
    const tiles = page.locator(".handbook-puzzle-tile");
    for (const tile of await tiles.all()) {
      await tile.focus();
      await tile.hover();
      await expect(tile).toHaveAttribute("aria-expanded", "true");
      await page.waitForTimeout(600);
      const result = await tile.evaluate(async element => {
        const image = element.querySelector("img");
        await image.decode();
        const name = element.querySelector(".handbook-strip-name-text");
        const text = name.getBoundingClientRect(), art = image.getBoundingClientRect();
        const box = element.getBoundingClientRect();
        const pen = getComputedStyle(name, "::after");
        const padding = Math.max(Math.abs(parseFloat(pen.left)), Math.abs(parseFloat(pen.right))) + 8;
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(image, 0, 0);
        const sx = canvas.width / art.width, sy = canvas.height / art.height;
        const left = Math.max(0, Math.floor((text.left - padding - art.left) * sx));
        const right = Math.min(canvas.width, Math.ceil((text.right + padding - art.left) * sx));
        const top = Math.max(0, Math.floor((text.top - 8 - art.top) * sy));
        const bottom = Math.min(canvas.height, Math.ceil((text.bottom + 8 - art.top) * sy));
        let solidPixels = 0;
        if (right > left && bottom > top) {
          const pixels = ctx.getImageData(left, top, right - left, bottom - top).data;
          for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 32) solidPixels++;
        }
        return { name: name.textContent, solidPixels, left: text.left - box.left,
          right: box.right - text.right, pen: pen.backgroundImage, font: getComputedStyle(name).fontFamily };
      });
      expect(result.solidPixels, `${result.name}: portrait enters name/marker clearance`).toBe(0);
      expect(result.left).toBeGreaterThan(28);
      expect(result.right, `${result.name}: right edge clipped`).toBeGreaterThan(28);
      expect(result.pen).toContain("linear-gradient");
      expect(result.font).toContain("Sigrika Window Title");
    }
  });
}
