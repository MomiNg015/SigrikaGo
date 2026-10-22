import { expect, test } from "@playwright/test";

const viewports = [{ width: 1440, height: 768 }, { width: 800, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 640 }, { width: 320, height: 568 }];
const costumes = Array.from({ length: 9 }, (_, index) => ({
  id: `layout-costume-${index}`, characterSlug: "sigrika", enabled: true, owned: true, sortOrder: index,
  name: index === 0 ? "HelloHello" : `很长的服装名称用于检查省略和裁切${index}`,
  portraitUrl: "/assets/costumes/portraits/sigrika-costume-01.webp",
  description: "长介绍应能滚动至结尾，人物和关闭按钮保持可用。".repeat(30) + "介绍结束",
  illustName: "画师署名", illustUrl: "https://example.com/artist"
}));

async function settle(page) {
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
    .map(animation => animation.finished.catch(() => {}))));
}

async function openDetail(page, viewport) {
  await page.setViewportSize(viewport);
  await page.route("**/api/skill-traits", route => route.fulfill({ json: { traits: [] } }));
  await page.route("**/api/costumes", route => route.fulfill({ json: { costumes } }));
  await page.goto("/tests/e2e/fixtures/handbook-puzzle.html?costumes&music");
  await page.getByRole("button", { name: "西格莉卡角色详情", exact: true }).click();
  await settle(page);
  await page.evaluate(() => document.fonts.ready);
}

async function expectContained(locator, parent, shadow = 0) {
  const rect = await locator.boundingBox(), frame = await parent.boundingBox();
  expect(rect.x).toBeGreaterThanOrEqual(frame.x);
  expect(rect.y).toBeGreaterThanOrEqual(frame.y);
  expect(rect.x + rect.width + shadow).toBeLessThanOrEqual(frame.x + frame.width + 0.5);
  expect(rect.y + rect.height + shadow).toBeLessThanOrEqual(frame.y + frame.height + 0.5);
}

for (const viewport of viewports) {
  test(`stage variants keep text and controls reachable at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.route('**/api/skill-traits', route => route.fulfill({ json: { traits: [] } }));
    for (const query of ['character=aemeath', 'long', 'noMusic', 'unowned', 'costume']) {
      await page.goto(`/tests/e2e/fixtures/handbook-stage.html?${query}`);
      await page.locator('.character-detail-fullbody').waitFor();
      await page.evaluate(() => document.fonts.ready);
      await settle(page);
      const modal = page.locator('.character-detail-fullbody');
      const box = await modal.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width + 7).toBeLessThanOrEqual(viewport.width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
      const image = page.locator('.character-detail-figure img');
      expect(await image.evaluate(e => e.complete && e.naturalWidth > 0)).toBe(true);
      if (query === 'noMusic') {
        await expect(page.locator('.character-music-toggle')).toBeDisabled();
        await expect(page.locator('.character-music-name')).toHaveText('无可用曲目');
      }
      if (query === 'unowned') expect(await modal.evaluate(e => e.style.getPropertyValue('--detail-emblem'))).toBe('none');
      if (query === 'character=aemeath') {
        const derived = page.locator('.derived-skill-detail').first();
        await expect(derived).toBeVisible();
        const child = await derived.boundingBox();
        const parent = await page.locator('.character-detail-copy > .character-skill-description').boundingBox();
        expect(child.y).toBeLessThan(parent.y + parent.height);
        expect(child.x).toBeGreaterThan(parent.x);
      }
      await page.locator('.character-detail-copy').evaluate(e => { e.scrollTop = e.scrollHeight; });
      const end = await page.locator('.character-description').evaluate(e => {
        const range = document.createRange(); range.selectNodeContents(e); range.setStart(e.firstChild, e.firstChild.length - 1);
        return range.getBoundingClientRect().toJSON();
      });
      const radio = await page.locator('.character-music-player').boundingBox();
      expect(end.bottom).toBeLessThanOrEqual(radio ? radio.y : box.y + box.height);
      expect(await page.locator('.character-cv-label').evaluate(e => getComputedStyle(e).textDecorationLine)).toBe('none');
      await page.keyboard.press('Escape');
      await expect(modal).toHaveCount(0);
    }
  });
  test(`detail controls clear portrait and heading at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await openDetail(page, viewport);
    const name = await page.locator(".character-detail-heading h3").boundingBox();
    const music = await page.locator(".character-music-player").boundingBox();
    const overlapX = Math.min(name.x + name.width, music.x + music.width) - Math.max(name.x, music.x);
    const overlapY = Math.min(name.y + name.height, music.y + music.height) - Math.max(name.y, music.y);
    expect(overlapX <= 0 || overlapY <= 0, "name and radio must not overlap").toBe(true);
    const wardrobe = page.getByRole("button", { name: "查看西格莉卡的服装" });
    const frame = await page.locator('.character-detail-fullbody').boundingBox();
    const close = page.getByRole('button', { name: '关闭角色详情', exact: true });
    const closeBox = await close.boundingBox();
    expect(Math.abs(closeBox.x + closeBox.width / 2 - frame.x - frame.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(closeBox.y + closeBox.height / 2 - frame.y)).toBeLessThanOrEqual(1);
    expect(music.x + music.width).toBeGreaterThan(frame.x + frame.width);
    expect(music.y + music.height).toBeGreaterThan(frame.y + frame.height);
    expect(music.x + music.width + 5).toBeLessThanOrEqual(viewport.width);
    expect(music.y + music.height + 6).toBeLessThanOrEqual(viewport.height);
    await expect(page.locator('.acquisition-method')).toHaveCount(0);
    if (viewport.width <= 768) {
      const art = await page.locator('.character-detail-art').boundingBox();
      const button = await wardrobe.boundingBox();
      expect(button.width).toBeLessThanOrEqual(34);
      expect(button.width).toBe(button.height);
      expect(button.x - art.x).toBeLessThanOrEqual(12);
      expect(art.y + art.height - button.y - button.height).toBeLessThanOrEqual(16);
      expect(name.x).toBeGreaterThan(button.x + button.width);
    }
    const toggle = page.locator('.character-music-toggle');
    const glyphColor = await toggle.evaluate(e => getComputedStyle(e).color);
    await toggle.hover();
    expect(await toggle.evaluate(e => getComputedStyle(e).color)).toBe(glyphColor);
    await close.hover();
    expect(await close.evaluate(e => getComputedStyle(e).outlineStyle)).toBe('none');
    await page.mouse.move(0, 0);
    await expectContained(wardrobe, page.locator(".character-detail-art"), 3);
    await wardrobe.hover();
    await settle(page);
    await expectContained(wardrobe, page.locator(".character-detail-art"), 3);
    await page.locator(".character-music-title-trigger").click();
    const sheet = page.getByRole("region", { name: "角色技能曲目单" });
    await expect(sheet).toBeVisible();
    await settle(page);
    const sheetBox = await sheet.boundingBox();
    expect(sheetBox.x).toBeGreaterThanOrEqual(0);
    expect(sheetBox.x + sheetBox.width).toBeLessThanOrEqual(viewport.width);
    expect(sheetBox.y + sheetBox.height).toBeLessThanOrEqual(viewport.height);
    expect(await sheet.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
    }), "music picker stays above the detail").toBe(true);
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
    await expect(page.locator(".character-detail")).toBeVisible();
    await page.locator(".character-detail-copy").evaluate(element => { element.scrollTop = element.scrollHeight; });
    await expect(page.locator(".character-description")).toBeInViewport();
    await page.getByRole("button", { name: "关闭角色详情", exact: true }).click();
    await expect(page.locator(".character-detail")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "西格莉卡角色详情", exact: true })).toBeFocused();
  });

  test(`wardrobe keeps frame, long labels and last action reachable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await openDetail(page, viewport);
    await page.getByRole("button", { name: "查看西格莉卡的服装" }).click();
    await expect(page.locator(".character-costume-card")).toHaveCount(10);
    await settle(page);
    const dialog = page.locator(".character-costume-dialog");
    const frame = await dialog.boundingBox();
    expect(frame.x).toBeGreaterThanOrEqual(0);
    expect(frame.y).toBeGreaterThanOrEqual(0);
    expect(frame.x + frame.width + 6, "wardrobe shadow clears viewport right edge").toBeLessThanOrEqual(viewport.width);
    expect(frame.y + frame.height + 6, "wardrobe shadow clears viewport bottom edge").toBeLessThanOrEqual(viewport.height);
    const names = await page.locator(".character-costume-detail-trigger strong").evaluateAll(elements => elements.map(element => ({
      labelWidth: element.getBoundingClientRect().width,
      buttonWidth: element.closest("button").clientWidth,
      ellipsis: getComputedStyle(element).textOverflow
    })));
    for (const name of names) {
      expect(name.labelWidth).toBeLessThanOrEqual(name.buttonWidth);
      expect(name.ellipsis).toBe("ellipsis");
    }
    await page.locator(".character-costume-grid").evaluate(element => { element.scrollTop = element.scrollHeight; });
    const lastEquip = page.locator(".character-costume-equip-button").last();
    await expect(lastEquip).toBeInViewport();
    await expectContained(lastEquip, page.locator(".character-costume-grid"), 3);
    await page.locator(".character-costume-detail-trigger").last().click();
    await expect(page.locator(".character-costume-detail")).toBeVisible();
    await settle(page);
    await page.locator(".character-costume-detail").evaluate(element => { element.scrollTop = element.scrollHeight; });
    await page.locator(".character-costume-detail-copy").evaluate(element => { element.scrollTop = element.scrollHeight; });
    const description = page.locator(".character-costume-detail-copy p");
    await description.evaluate(element => { element.scrollTop = element.scrollHeight; });
    const bottom = await description.evaluate(element => {
      const range = document.createRange(); range.selectNodeContents(element); range.setStart(element.firstChild, element.firstChild.length - 4);
      const rect = range.getBoundingClientRect(); return { top: rect.top, bottom: rect.bottom };
    });
    expect(bottom.top).toBeGreaterThanOrEqual(0);
    expect(bottom.bottom).toBeLessThanOrEqual(viewport.height);
    await page.keyboard.press("Escape");
    await expect(page.locator(".character-costume-detail")).toHaveCount(0);
    await page.getByRole("button", { name: "关闭服装列表", exact: true }).click();
    await expect(page.locator(".character-costume-dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "查看西格莉卡的服装" })).toBeFocused();
  });
}
