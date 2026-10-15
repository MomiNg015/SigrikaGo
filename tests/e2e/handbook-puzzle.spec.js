import { expect, test } from "@playwright/test";
import { resolveHandbookPortrait } from "../../src/shared/handbookPortraits.js";
import { PORTRAIT_VISIBLE_BOUNDS } from "../../src/shared/portraitVisibleBounds.js";

const standardIds = ["sigrika", "denia", "aemeath", "lynae", "qiuyuan", "mornye", "changli", "chisa", "nabomo"];
const landmarks = standardIds.map((id) => ({ id, ...resolveHandbookPortrait({ id }, { chibi: true }) }));

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`candy rainbow rims retain transparent interiors at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/tests/e2e/fixtures/handbook-puzzle.html?allCandy");
    const rims = page.locator(".character-candy-border");
    await expect(rims).toHaveCount(4);
    await expect(page.locator(".character-item-effect-icon")).toHaveCount(0);
    // The theme resets button-child clipping with !important. Check the rendered
    // winner so a regression cannot replace the hollow rim with an opaque fill.
    for (const rim of await rims.all()) {
      const state = await rim.evaluate((element) => ({
        clip: getComputedStyle(element).clipPath,
        pointer: getComputedStyle(element).pointerEvents,
        animation: getComputedStyle(element, "::before").animationName
      }));
      expect(state.clip).toMatch(/^polygon\(evenodd,/);
      expect(state.pointer).toBe("none");
      expect(state.animation).toBe("character-candy-rim-flow");
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const rim of await rims.all()) {
      expect(await rim.evaluate((element) => getComputedStyle(element, "::before").animationName)).toBe("none");
    }
  });
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 640 }]) {
  test(`wardrobe compares visible figures at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.route("**/api/skill-traits", (r) => r.fulfill({ json: { traits: [] } }));
    await page.route("**/api/costumes", (r) => r.fulfill({ json: { costumes: [
      { id: "denia-costume-01", characterSlug: "denia", name: "睡眠不足", portraitUrl: "/assets/costumes/portraits/denia-costume-01.webp", enabled: true },
      { id: "denia-costume-02", characterSlug: "denia", name: "黯影形态", portraitUrl: "/assets/costumes/portraits/denia-costume-02.webp", enabled: true }
    ] } }));
    await page.goto("/tests/e2e/fixtures/handbook-puzzle.html?costumes", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "达妮娅角色详情", exact: true }).click();
    await page.getByRole("button", { name: "查看达妮娅的服装", exact: true }).click();
    await expect(page.locator(".character-costume-card")).toHaveCount(3);
    await page.locator(".character-costume-card img").evaluateAll((images) => Promise.all(images.map((i) => i.decode())));
    const figures = await page.locator(".character-costume-card").evaluateAll((cards, bounds) => cards.map((card) => {
      const svg = card.querySelector(".portrait-showcase svg"), image = card.querySelector("img");
      const [, , left, top, width, height] = bounds[image.getAttribute("src")];
      const a = new DOMPoint(left, top).matrixTransform(svg.getScreenCTM());
      const b = new DOMPoint(left + width, top + height).matrixTransform(svg.getScreenCTM());
      const frame = card.querySelector(".portrait-showcase").getBoundingClientRect();
      return { height: b.y - a.y, baseline: b.y - frame.top, labelGap: card.querySelector("strong").getBoundingClientRect().top - b.y,
        contained: a.x >= frame.left - 1 && b.x <= frame.right + 1 && a.y >= frame.top - 1 && b.y <= frame.bottom + 1 };
    }), PORTRAIT_VISIBLE_BOUNDS);
    for (const figure of figures) {
      expect(figure.contained).toBe(true);
      expect(figure.labelGap).toBeGreaterThanOrEqual(6);
      expect(Math.abs(figure.height - figures[0].height)).toBeLessThan(1);
      expect(Math.abs(figure.baseline - figures[0].baseline)).toBeLessThan(1);
    }
    await page.getByRole("button", { name: "查看黯影形态详情", exact: true }).click();
    const sourceSize = await page.locator(".character-costume-detail-art img").evaluate((img) => ({
      width: parseFloat(getComputedStyle(img).width), height: parseFloat(getComputedStyle(img).height)
    }));
    const [width, height] = PORTRAIT_VISIBLE_BOUNDS["/assets/costumes/portraits/denia-costume-02.webp"];
    expect(sourceSize.width).toBe(width);
    expect(sourceSize.height).toBe(height);
  });
}

async function openFromStrip(page, tile, mobile) {
  await tile.scrollIntoViewIfNeeded();
  if (mobile) await tile.tap();
  else await tile.click();
  await expect(page.locator(".handbook-strip-detail-action")).toHaveCount(0);
}

for (const viewport of [{ width: 1440, height: 1024 }, { width: 1440, height: 768 },
  { width: 390, height: 844 }, { width: 360, height: 640 }]) {
  test.describe(`handbook strips ${viewport.width}x${viewport.height}`, () => {
    const mobile = viewport.width < 769;
    test.use({ viewport, isMobile: mobile, hasTouch: mobile });
    test("ordered clipped slices open matching details directly and preserve anonymity", async ({ page }) => {
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("**/api/skill-traits", (route) => route.fulfill({ json: { traits: [] } }));
      await page.route("**/api/costumes", (route) => route.fulfill({ json: { costumes: [] } }));
      await page.goto("/tests/e2e/fixtures/handbook-puzzle.html", { waitUntil: "domcontentloaded" });
      const tiles = page.locator("button.handbook-puzzle-tile");
      await expect(tiles).toHaveCount(10);
      await expect(page.locator(".sortie-button")).toHaveCount(0);
      expect(await page.locator(".handbook-puzzle-piece").evaluateAll((pieces) => pieces.map((piece) => piece.dataset.characterId)))
        .toEqual(["sigrika", "denia", "aemeath", "baconbits", "lynae", "qiuyuan", "mornye", "changli", "chisa", "nabomo"]);
      await expect.poll(() => tiles.first().locator("img").evaluate((art) => art.complete && art.naturalWidth > 0), { timeout: 30000 }).toBeTruthy();
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
        expect(await page.locator('.character-detail-fullbody').evaluate((modal) => {
          const window = modal.getBoundingClientRect();
          const art = modal.querySelector('.character-detail-figure img').getBoundingClientRect();
          return art.top >= window.top && art.bottom <= window.bottom && art.left >= window.left && art.right <= window.right;
        })).toBeTruthy();
        if (index === 0) {
          await page.getByRole('button', { name: '查看西格莉卡的服装', exact: true }).click();
          const defaultCard = page.getByRole('button', { name: '查看默认服装详情，正在装扮', exact: true });
          await expect(defaultCard.locator('img')).toHaveAttribute('src', '/assets/characters/handbook-chibi-sprites/sigrika.webp');
          await defaultCard.click();
          await expect(page.getByRole('dialog', { name: '默认服装详情', exact: true }).locator('img'))
            .toHaveAttribute('src', '/assets/characters/handbook-chibi-sprites/sigrika.webp');
          await page.getByRole('button', { name: '关闭服装详情', exact: true }).click();
          await page.getByRole('button', { name: '关闭服装列表', exact: true }).click();
        }
        await page.getByRole("button", { name: "关闭角色详情", exact: true }).click();
        await expect(tile).toBeFocused();
        if (mobile) await expect(tile).toHaveAttribute("aria-expanded", "false");
      }
      const panel = page.locator(".handbook-puzzle-panel");
      if (mobile) {
        expect(await panel.evaluate((element) => element.scrollHeight > element.clientHeight && getComputedStyle(element).overflowY === "auto")).toBeTruthy();
        await tiles.last().scrollIntoViewIfNeeded();
        expect(await tiles.last().evaluate((tile) => tile.getBoundingClientRect().bottom <= tile.closest(".handbook-puzzle-panel").getBoundingClientRect().bottom + 1)).toBeTruthy();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
      await page.goto("/tests/e2e/fixtures/handbook-puzzle.html?owned=partial", { waitUntil: "domcontentloaded" });
      await expect(page.locator(".handbook-puzzle-question")).toHaveCount(5);
      const unknown = page.getByRole("button", { name: "暂无情报", exact: true });
      await expect(unknown.locator("img, .handbook-puzzle-silhouette, .handbook-puzzle-question")).toHaveCount(0);
      await expect(unknown).toHaveText(/暂无情报/);
      await expect(unknown).not.toHaveText(/猪小仙/);
      expect(await unknown.getAttribute("title")).toBeNull();
      const locked = page.locator(".is-unowned .handbook-puzzle-tile");
      await expect(locked).toHaveCount(6);
      await expect(page.locator(".is-unowned .handbook-strip-name")).toHaveCount(0);
      for (const tile of await locked.all()) {
        await tile.scrollIntoViewIfNeeded();
        await expect(tile).toBeDisabled();
        const before = await tile.boundingBox();
        await tile.hover();
        await expect(tile).toHaveAttribute("aria-expanded", "false");
        const box = await tile.boundingBox();
        if (mobile) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
        else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await expect(page.locator(".character-detail-fullbody")).toHaveCount(0);
        await tile.evaluate((element) => { element.click(); element.focus(); });
        await expect(tile).not.toBeFocused();
        await expect(tile).toHaveAttribute("aria-expanded", "false");
        expect((await tile.boundingBox())[mobile ? "height" : "width"]).toBeCloseTo(before[mobile ? "height" : "width"], 1);
        if (mobile && await tile.locator(".handbook-puzzle-question").count()) {
          const side = await tile.locator("..").getAttribute("data-portrait-side");
          const question = await tile.locator(".handbook-puzzle-question").boundingBox();
          const x = (question.x + question.width / 2 - box.x) / box.width;
          expect(x).toBeCloseTo(side === "left" ? .74 : .26, 1);
        }
      }
      expect(errors).toEqual([]);
    });

    test("preview expands the correct axis with reachable neighbors and stable matte fills", async ({ page }) => {
      await page.goto("/tests/e2e/fixtures/handbook-puzzle.html", { waitUntil: "domcontentloaded" });
      const tile = page.getByRole("button", { name: "西格莉卡角色详情", exact: true });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const axis = mobile ? "height" : "width";
      const resting = await tile.evaluate((element, axis) => element.getBoundingClientRect()[axis], axis);
      const art = tile.locator(".handbook-puzzle-portrait");
      const artBefore = await art.boundingBox();
      const name = tile.locator(".handbook-strip-name");
      if (!mobile) {
        expect(await name.evaluate((element) => {
          const style = getComputedStyle(element);
          return style.opacity === "0" || style.visibility === "hidden" || style.display === "none";
        })).toBeTruthy();
      }
      const fill = await tile.evaluate((element) => getComputedStyle(element).backgroundImage);
      await tile.hover();
      await expect.poll(() => tile.evaluate((element, axis) => element.getBoundingClientRect()[axis], axis)).toBeGreaterThan(resting * 2);
      expect(await tile.evaluate((element) => getComputedStyle(element).backgroundImage)).toBe(fill);
      expect(await tile.evaluate((element) => getComputedStyle(element).transform)).toBe("none");
      await expect.poll(() => name.evaluate((element) => Number(getComputedStyle(element).opacity))).toBe(1);
      const nameStyle = await name.evaluate((element) => {
        const style = getComputedStyle(element);
        return { background: style.backgroundColor, image: style.backgroundImage, size: parseFloat(style.fontSize) };
      });
      expect(nameStyle.background).toBe("rgba(0, 0, 0, 0)");
      expect(nameStyle.image).toBe("none");
      expect(nameStyle.size).toBeGreaterThanOrEqual(22);
      if (!mobile) {
        const artAfter = await art.boundingBox();
        expect(artAfter.width).toBeCloseTo(artBefore.width, 1);
        expect(artAfter.height).toBeCloseTo(artBefore.height, 1);
        expect(artAfter.y).toBeCloseTo(artBefore.y, 1);
        const label = await name.boundingBox();
        const expandedTile = await tile.boundingBox();
        expect(label.x + label.width).toBeGreaterThan(expandedTile.x + expandedTile.width * 0.7);
        expect(label.y).toBeGreaterThan(expandedTile.y + expandedTile.height * 0.7);
      }
      const neighbor = page.locator(".handbook-puzzle-tile").nth(1);
      expect(await neighbor.evaluate((element, axis) => element.getBoundingClientRect()[axis], axis)).toBeGreaterThan(44);
      await page.emulateMedia({ reducedMotion: "reduce" });
      // The global reduced-motion contract retains a 1ms transition duration.
      const reducedDurations = await tile.evaluate((element) =>
        getComputedStyle(element.parentElement).transitionDuration.split(",").map((duration) =>
          parseFloat(duration) * (duration.trim().endsWith("ms") ? 1 : 1000)));
      expect(Math.max(...reducedDurations)).toBeLessThanOrEqual(1);
      await neighbor.scrollIntoViewIfNeeded();
      if (mobile) await neighbor.hover();
      else await neighbor.focus();
      await expect(neighbor).toHaveAttribute("aria-expanded", "true");
      await expect.poll(() => neighbor.evaluate((element, axis) => element.getBoundingClientRect()[axis], axis)).toBeGreaterThan(resting * 2);
      if (mobile) {
        await page.mouse.move(10, 10);
        await expect(neighbor).toHaveAttribute("aria-expanded", "false");
        await expect.poll(() => neighbor.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(100);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    });
  });
}

test.describe("mobile strip rotation", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test("last narrow row returns to resting height after hover ends", async ({ page }) => {
    await page.goto("/tests/e2e/fixtures/handbook-puzzle.html", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready);
    const tile = page.getByRole("button", { name: "娜波摩角色详情", exact: true });
    await tile.scrollIntoViewIfNeeded();
    await tile.hover();
    await expect(tile).toHaveAttribute("aria-expanded", "true");
    await expect.poll(() => tile.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThan(280);
    await page.mouse.move(10, 10);
    await expect(tile).toHaveAttribute("aria-expanded", "false");
    await expect.poll(() => tile.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(100);
  });

  test("touch press and cancellation preserve the hit area, and a single tap opens details", async ({ page }) => {
    await page.route("**/api/skill-traits", (route) => route.fulfill({ json: { traits: [] } }));
    await page.goto("/tests/e2e/fixtures/handbook-puzzle.html", { waitUntil: "domcontentloaded" });
    const tile = page.getByRole("button", { name: "西格莉卡角色详情", exact: true });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const before = await tile.boundingBox();
    const session = await page.context().newCDPSession(page);
    try {
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: before.x + before.width / 2, y: before.y + before.height / 2 }] });
      await expect(tile).toHaveAttribute("aria-expanded", "false");
      expect((await tile.boundingBox()).height).toBeCloseTo(before.height, 1);
      await session.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
      await expect(tile).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator(".character-detail-fullbody")).toHaveCount(0);
      await tile.tap();
      await expect(page.locator(".character-detail-fullbody")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(tile).toBeFocused();
      await expect(tile).toHaveAttribute("aria-expanded", "false");
      expect((await tile.boundingBox()).height).toBeCloseTo(before.height, 1);
    } finally { await session.detach(); }
  });

  test("direct detail activation restores the same trigger across orientation changes", async ({ page }) => {
    await page.route("**/api/skill-traits", (route) => route.fulfill({ json: { traits: [] } }));
    await page.goto("/tests/e2e/fixtures/handbook-puzzle.html?candy", { waitUntil: "domcontentloaded" });
    const tile = page.getByRole("button", { name: "达妮娅角色详情", exact: true });
    await openFromStrip(page, tile, true);
    await page.setViewportSize({ width: 932, height: 430 });
    await expect(page.locator(".handbook-strip-detail-action")).toHaveCount(0);
    await page.getByRole("button", { name: "关闭角色详情", exact: true }).click();
    await expect(tile).toBeFocused();
  });
});

test.describe("fixed handbook portrait composition", () => {
  test("desktop portraits move in one direction with the actual strip width", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.goto("/tests/e2e/fixtures/handbook-puzzle.html", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(350);
    for (const id of ["sigrika", "qiuyuan", "nabomo"]) {
      await page.mouse.move(10, 10);
      await page.waitForTimeout(350);
      const tile = page.locator(`[data-character-id="${id}"] .handbook-puzzle-tile`);
      await tile.evaluate((element) => {
        window.handbookMotion = new Promise((resolve) => {
          const samples = [];
          const start = performance.now();
          const sample = () => {
            const art = element.querySelector("img").getBoundingClientRect();
            samples.push({ x: art.x, width: art.width, y: art.y });
            if (performance.now() - start < 450) requestAnimationFrame(sample);
            else resolve(samples);
          };
          requestAnimationFrame(sample);
        });
      });
      await tile.hover();
      const samples = await page.evaluate(() => window.handbookMotion);
      const delta = samples.at(-1).x - samples[0].x;
      expect(Math.abs(delta)).toBeGreaterThan(10);
      const direction = Math.sign(delta);
      for (let index = 1; index < samples.length; index++) {
        expect((samples[index].x - samples[index - 1].x) * direction).toBeGreaterThan(-.6);
        expect(samples[index].width).toBeCloseTo(samples[0].width, 1);
        expect(samples[index].y).toBeCloseTo(samples[0].y, 1);
      }
      const landmark = landmarks.find((point) => point.id === id);
      const box = await tile.boundingBox();
      const art = await tile.locator("img").boundingBox();
      const face = art.x + landmark.focal[0] * art.width / landmark.width;
      expect((face - box.x) / box.width).toBeCloseTo(.30, 2);
    }
  });

  test("desktop full bodies share a safe height and baseline before and after preview", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.goto("/tests/e2e/fixtures/handbook-puzzle.html", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const measure = () => page.evaluate((points) => points.map(({ id, bodyTop, bodyBottom, width }) => {
      const image = document.querySelector(`[data-character-id="${id}"] .handbook-puzzle-portrait`);
      const rect = image.getBoundingClientRect();
      const scale = rect.width / width;
      const tile = image.closest(".handbook-puzzle-tile").getBoundingClientRect();
      return { id, top: (rect.y + bodyTop * scale - tile.y) / tile.height,
        bottom: (rect.y + bodyBottom * scale - tile.y) / tile.height, imageHeight: rect.height };
    }), landmarks);
    const before = await measure();
    before.forEach(({ top, bottom }) => {
      expect(top).toBeCloseTo(.07, 2);
      expect(bottom).toBeCloseTo(.95, 2);
    });
    await page.getByRole("button", { name: "莫宁角色详情", exact: true }).hover();
    await page.waitForTimeout(350);
    const after = await measure();
    after.forEach((value, index) => {
      expect(value.top).toBeCloseTo(before[index].top, 2);
      expect(value.bottom).toBeCloseTo(before[index].bottom, 2);
      expect(value.imageHeight).toBeCloseTo(before[index].imageHeight, 1);
    });
  });

  for (const viewport of [{ width: 390, height: 844 }, { width: 360, height: 640 }]) {
    test(`mobile alternates art with readable opposite names at ${viewport.width}px`, async ({ browser }) => {
      const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
      try {
        const page = await context.newPage();
        await page.goto("/tests/e2e/fixtures/handbook-puzzle.html", { waitUntil: "domcontentloaded" });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(300);
        const verify = () => page.evaluate((points) => points.map(({ id, focal, width }) => {
          const piece = document.querySelector(`[data-character-id="${id}"]`);
          const tile = piece.querySelector(".handbook-puzzle-tile").getBoundingClientRect();
          const art = piece.querySelector("img").getBoundingClientRect();
          const name = piece.querySelector(".handbook-strip-name");
          const nameRect = name.getBoundingClientRect();
          const style = getComputedStyle(name);
          return { side: piece.dataset.portraitSide,
            faceX: (art.x + focal[0] * art.width / width - tile.x) / tile.width,
            nameX: (nameRect.x + nameRect.width / 2 - tile.x) / tile.width,
            font: style.fontFamily, size: parseFloat(style.fontSize), background: style.backgroundColor };
        }), landmarks);
        (await verify()).forEach(({ side, faceX, nameX, font, size, background }) => {
          expect(faceX).toBeCloseTo(side === "left" ? 0.28 : 0.72, 1);
          expect(side === "left" ? nameX > 0.5 : nameX < 0.5).toBeTruthy();
          expect(font).toContain("Sigrika Window Title");
          expect(size).toBeGreaterThanOrEqual(22);
          expect(background).toBe("rgba(0, 0, 0, 0)");
        });
        const denia = page.getByRole("button", { name: "达妮娅角色详情", exact: true });
        await denia.hover();
        await page.waitForTimeout(350);
        const expanded = (await verify())[1];
        expect(expanded.faceX).toBeCloseTo(0.72, 1);
        expect(expanded.nameX).toBeLessThan(0.5);
        const clearance = await denia.evaluate((tile, point) => {
          const art = tile.querySelector('img').getBoundingClientRect();
          const name = tile.querySelector('.handbook-strip-name').getBoundingClientRect();
          return name.top - (art.y + point.bodyBottom * art.height / point.height);
        }, landmarks.find(({ id }) => id === 'denia'));
        expect(clearance).toBeGreaterThan(8);
        // A hybrid device can switch from hover to touch. Tap the lower half
        // of the expanded target, where premature collapse would lose the hit.
        await denia.tap({ position: { x: viewport.width * 0.35, y: 240 } });
        await expect(page.locator(".character-detail-fullbody")).toBeVisible();
        await expect(page.locator(".character-detail-fullbody")).toContainText("达妮娅");
        await page.keyboard.press("Escape");
        await expect(denia).toBeFocused();
        await expect(denia).toHaveAttribute("aria-expanded", "false");
        await expect.poll(() => denia.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(100);
        await page.mouse.move(10, 10);
        await denia.hover();
        await expect(denia).toHaveAttribute("aria-expanded", "true");
        await page.mouse.move(10, 10);
        await expect(denia).toHaveAttribute("aria-expanded", "false");
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
      } finally {
        await context.close();
      }
    });
  }
});
