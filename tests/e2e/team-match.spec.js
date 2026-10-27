import { expect, test } from "@playwright/test";
import { CHARACTER_CHIBI_LANDMARKS } from "../../src/shared/characterChibiPortraits.js";

async function mountTeamSurface(page, surface) {
  await page.goto(`/tests/e2e/fixtures/team-match.html?surface=${surface}`, { waitUntil: "domcontentloaded" });
}

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
  test(`unified practice selection and capture ranking at ${viewport.width}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.route("**/api/leaderboard?mode=capture-challenge", route => route.fulfill({ json: { players: Array.from({ length: 40 }, (_, index) => ({ id: index === 4 ? "team-one" : `rank-${index}`, username: `挑战者${index + 1}`, rank: "3段", stars: 2, recordCharacter: "sigrika", captures: 100 - index })) } }));
    await mountTeamSurface(page, "modes");
    await page.getByRole("button", { name: "准时宝陪练", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "准时宝陪练" });
    const start = dialog.getByRole("button", { name: "START！" });
    await expect(start).toBeDisabled();
    await expect(dialog).toContainText("今天想找准时宝做什么呢？");
    await page.evaluate(() => document.fonts.ready);
    const level = dialog.locator(".practice-level-button");
    const dimensions = [];
    const colors = [];
    for (const label of ["初级", "中级", "高级"]) {
      await expect(level).toHaveText(label);
      await page.locator(".match-mode-backdrop").evaluate(element => Promise.all(element.getAnimations({ subtree: true }).filter(animation => animation.effect.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))));
      const metrics = await level.evaluate(element => {
        const style = getComputedStyle(element), icon = element.querySelector("svg"), text = element.querySelector("span"), shape = icon.querySelector("circle");
        const rect = element.getBoundingClientRect(), iconRect = icon.getBoundingClientRect(), textRect = text.getBoundingClientRect();
        return { width: rect.width, height: rect.height, paddingX: parseFloat(style.paddingLeft), paddingY: parseFloat(style.paddingTop), gap: textRect.left - iconRect.right, fill: getComputedStyle(shape).fill, color: getComputedStyle(icon).color, overflow: element.scrollWidth > element.clientWidth };
      });
      expect(metrics.height).toBeGreaterThanOrEqual(44);
      expect(metrics.paddingX).toBeGreaterThanOrEqual(12);
      expect(metrics.paddingY).toBeGreaterThanOrEqual(8);
      expect(metrics.gap).toBeGreaterThanOrEqual(6);
      expect(metrics.fill).toBe(metrics.color);
      expect(metrics.overflow).toBe(false);
      dimensions.push([metrics.width, metrics.height]);
      colors.push(metrics.fill);
      await level.click();
    }
    expect(dimensions[1]).toEqual(dimensions[0]);
    expect(dimensions[2]).toEqual(dimensions[0]);
    expect(new Set(colors).size).toBe(3);
    await expect(level).toHaveText("初级");
    await dialog.getByRole("button", { name: "准时宝对局选择角色", exact: true }).click();
    const picker = page.getByRole("dialog", { name: "选择角色" });
    await picker.getByRole("button", { name: "西格莉卡", exact: true }).click();
    await picker.getByRole("button", { name: "关闭选择角色" }).click();
    await dialog.getByRole("button", { name: "吃子挑战赛", exact: true }).click();
    await expect(dialog.getByAltText("西格莉卡（惊讶）")).toBeVisible();
    const bubble = dialog.locator(".practice-sheet-bubble");
    await expect(bubble).toContainText("随机猜先。在100手内尽可能多地提掉准时宝的棋子吧！吃得越多分数越高！");
    const copyFits = await bubble.evaluate(element => {
      const range = document.createRange(); range.selectNodeContents(element);
      const text = range.getBoundingClientRect(), box = element.getBoundingClientRect();
      return text.left >= box.left && text.right <= box.right && text.bottom <= box.bottom && box.bottom <= element.closest(".practice-dialog-sheet").getBoundingClientRect().bottom;
    });
    expect(copyFits).toBe(true);
    await expect(start).toBeEnabled();
    await page.locator(".match-mode-backdrop").evaluate(element => Promise.all(element.getAnimations({ subtree: true }).filter(animation => animation.effect.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))));
    await expect(dialog.getByAltText("西格莉卡（惊讶）")).toHaveJSProperty("complete", true);
    await page.screenshot({ path: testInfo.outputPath("practice-capture.png") });
    await dialog.getByRole("button", { name: "吃子挑战赛排行榜" }).click();
    const board = page.getByRole("dialog", { name: "吃子挑战赛排行榜" });
    await expect(board.getByText("挑战者40", { exact: true })).toHaveCount(1);
    await expect(board.getByRole("tab")).toHaveCount(0);
    await expect(board.getByText("我的排名")).toBeVisible();
    await board.evaluate(element => Promise.all(element.getAnimations({ subtree: true }).filter(animation => animation.effect.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))));
    await page.screenshot({ path: testInfo.outputPath("capture-ranking.png") });
    await board.locator(".lp-scroll").evaluate(element => { element.scrollTop = element.scrollHeight; });
    await expect(board.getByText("挑战者40", { exact: true })).toBeInViewport();
    await expect(board.getByText("我的排名")).toBeInViewport();
    await page.keyboard.press("Escape");
    await expect(board).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: "吃子挑战赛排行榜" })).toBeFocused();
    await expect(dialog.getByRole("button", { name: "吃子挑战赛", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await page.getByRole("button", { name: "准时宝陪练", exact: true }).click();
    await expect(start).toBeEnabled();
    await expect(level).toHaveText("初级");
    await start.click();
    expect(await page.evaluate(() => window.practiceStarted)).toEqual({ difficulty: "advanced", challenge: "capture-challenge", playerColor: "random", characterId: "sigrika" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("match character slots keep their square depth across mouse, touch and reduced motion", async ({ page, browser }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mountTeamSurface(page, "modes");
  const modes = page.locator(".match-mode-modal");
  await modes.getByRole("button", { name: "标准对弈", exact: true }).click();
  const slot = modes.getByRole("button", { name: /^常规匹配选择角色/ });
  const settle = (surface) => surface.evaluate(element => Promise.all(element.getAnimations({ subtree: true })
    .filter(animation => animation.effect.getTiming().iterations !== Infinity)
    .map(animation => animation.finished.catch(() => {}))));
  const measure = (button) => button.evaluate(element => {
    const box = element.getBoundingClientRect(), parent = element.parentElement.getBoundingClientRect();
    const style = getComputedStyle(element);
    const exteriorShadow = style.boxShadow.split(/,(?![^(]*\))/).find(value => !value.includes("inset")) ?? "";
    const shadow = [...exteriorShadow.matchAll(/(-?[\d.]+)px/g)].map(match => Number(match[1]));
    return { x: box.x - parent.x, y: box.y - parent.y, width: box.width, height: box.height,
      background: style.backgroundColor, outlineWidth: parseFloat(style.outlineWidth),
      outlineStyle: style.outlineStyle,
      focused: element.matches(":focus"), focusVisible: element.matches(":focus-visible"),
      shadowX: shadow[0] ?? 0, shadowY: shadow[1] ?? 0 };
  });
  const expectSquare = (metric) => {
    expect(metric.width).toBeCloseTo(metric.height, 2);
    expect(metric.width).toBeGreaterThanOrEqual(44);
    expect(metric.width).toBeLessThan(48);
    expect(metric.background).not.toBe("rgba(0, 0, 0, 0)");
  };
  await page.evaluate(() => document.fonts.ready);
  for (const state of ["empty", "selected"]) {
    await page.mouse.move(0, 0);
    await settle(modes);
    const resting = await measure(slot);
    expectSquare(resting);
    expect(resting.shadowX).toBeGreaterThan(0);
    expect(resting.shadowY).toBeGreaterThan(0);
    await modes.screenshot({ path: testInfo.outputPath(`${state}-slot-default.png`), animations: "disabled" });
    await slot.hover();
    await settle(modes);
    const hovering = await measure(slot);
    expectSquare(hovering);
    expect(hovering.outlineStyle, `${state} hover focus-visible: ${hovering.focusVisible}`).toBe("none");
    expect(resting.y - hovering.y).toBeGreaterThan(0);
    expect(resting.y - hovering.y).toBeLessThanOrEqual(4);
    await modes.screenshot({ path: testInfo.outputPath(`${state}-slot-hover.png`), animations: "disabled" });
    await page.mouse.down();
    await settle(modes);
    const pressed = await measure(slot);
    expectSquare(pressed);
    expect(pressed.y).toBeGreaterThan(resting.y);
    expect(pressed.shadowY).toBeLessThan(resting.shadowY);
    await modes.screenshot({ path: testInfo.outputPath(`${state}-slot-pressed.png`), animations: "disabled" });
    await page.mouse.move(0, 0);
    await page.mouse.up();
    if (state === "empty") {
      await slot.click();
      await page.getByRole("dialog", { name: "选择角色" }).getByRole("button", { name: "爱弥斯", exact: true }).click();
      await expect(slot).toHaveAttribute("aria-label", "常规匹配选择角色：爱弥斯");
      await expect(slot.locator(".match-character-portrait")).toBeVisible();
    }
  }
  await page.reload();
  await modes.getByRole("button", { name: "标准对弈", exact: true }).click();
  await expect(slot).toHaveAttribute("aria-label", "常规匹配选择角色：爱弥斯");
  await page.mouse.move(0, 0);
  await slot.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(slot).toBeFocused();
  const keyboardFocus = await measure(slot);
  expect(keyboardFocus.focused).toBe(true);
  expect(keyboardFocus.focusVisible).toBe(true);
  expect(keyboardFocus.outlineStyle).not.toBe("none");
  expect(keyboardFocus.outlineWidth).toBeGreaterThan(0);
  await slot.evaluate(element => element.blur());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.mouse.move(0, 0);
  await settle(modes);
  const reducedResting = await measure(slot);
  await slot.hover();
  await settle(modes);
  const reducedHover = await measure(slot);
  expect(Math.abs(reducedHover.x - reducedResting.x)).toBeLessThan(0.05);
  expect(Math.abs(reducedHover.y - reducedResting.y)).toBeLessThan(0.05);
  await page.mouse.down();
  await settle(modes);
  const reducedPressed = await measure(slot);
  expect(Math.abs(reducedPressed.x - reducedResting.x)).toBeLessThan(0.05);
  expect(Math.abs(reducedPressed.y - reducedResting.y)).toBeLessThan(0.05);
  await page.mouse.move(0, 0);
  await page.mouse.up();
  const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  try {
    const touchPage = await touchContext.newPage();
    await touchPage.goto(page.url(), { waitUntil: "domcontentloaded" });
    const touchModes = touchPage.locator(".match-mode-modal");
    await touchModes.getByRole("button", { name: "标准对弈", exact: true }).tap();
    const touchSlot = touchModes.getByRole("button", { name: /^常规匹配选择角色/ });
    await touchPage.evaluate(() => document.fonts.ready);
    await settle(touchModes);
    const beforeTap = await measure(touchSlot);
    await touchSlot.tap();
    await touchPage.getByRole("dialog", { name: "选择角色" }).getByRole("button", { name: "爱弥斯", exact: true }).tap();
    await settle(touchModes);
    const afterTap = await measure(touchSlot);
    expectSquare(afterTap);
    expect(Math.abs(afterTap.y - beforeTap.y)).toBeLessThan(0.05);
    expect(afterTap.outlineStyle).toBe("none");
    await expect(touchSlot).toHaveAttribute("aria-label", "常规匹配选择角色：爱弥斯");
  } finally {
    await touchContext.close();
  }
});

test("bookmarks grow the window before scrolling and recalculate on viewport and tab changes", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await mountTeamSurface(page, "bookmarks");
  await page.evaluate(() => document.fonts.ready);
  const rail = page.getByRole("tablist");
  const dialog = page.getByRole("dialog");
  const overflow = () => rail.evaluate((element) => element.scrollHeight - element.clientHeight);
  await expect.poll(overflow).toBeLessThanOrEqual(1);
  expect((await dialog.boundingBox()).height).toBeGreaterThan(440);
  await page.setViewportSize({ width: 390, height: 1000 });
  await expect.poll(overflow).toBeLessThanOrEqual(1);
  const tall = (await dialog.boundingBox()).height;
  expect(tall).toBeGreaterThan(600);
  await page.locator(".modal-backdrop").evaluate((element) => Promise.all(
    element.getAnimations({ subtree: true })
      .filter((animation) => animation.effect.getTiming().iterations !== Infinity)
      .map((animation) => animation.finished.catch(() => {}))
  ));
  await page.screenshot({ path: testInfo.outputPath("bookmarks-all-visible.png") });
  await page.getByRole("button", { name: "切换标签数量" }).click();
  await expect.poll(async () => (await dialog.boundingBox()).height).toBeLessThan(tall - 100);
  await expect.poll(overflow).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "切换标签数量" }).click();
  await page.setViewportSize({ width: 360, height: 640 });
  await expect.poll(overflow).toBeGreaterThan(0);
  expect((await dialog.boundingBox()).height).toBeLessThanOrEqual(564);
  await page.getByRole("tab").last().click();
  await expect(page.getByText("当前标签 6")).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect.poll(overflow).toBeLessThanOrEqual(1);
  expect((await dialog.boundingBox()).height).toBeLessThan(tall - 100);
});

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 640 }]) {
  test(`event descriptions and capture entrance at ${viewport.width}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await mountTeamSurface(page, "modes");
    await page.locator(".match-mode-modal").getByRole("button", { name: "星炬对弈", exact: true }).click({ position: { x: 20, y: 40 } });
    for (const [name, copy] of [
      ["队际赛", "挑选3位部员，进行一盘棋接力3个阶段的紧张刺激的队际赛！"]
    ]) {
      const info = page.getByRole("button", { name: `查看${name}规则` });
      if (viewport.width > 768) {
        await expect(info).toBeHidden();
        await page.getByRole("button", { name, exact: true }).hover();
      } else {
        await info.click();
      }
      await expect(page.getByRole("tooltip")).toContainText(copy);
      const bounds = await page.getByRole("tooltip").boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
      expect(await page.getByRole("tooltip").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      expect(await page.evaluate(() => window.practiceStarted)).toBeUndefined();
      await page.screenshot({ path: testInfo.outputPath(`${name}-hint.png`) });
      await page.keyboard.press("Escape");
      await expect(page.getByRole("tooltip")).toHaveCount(0);
    }
    await mountTeamSurface(page, "capture-opening");
    await expect(page.locator(".opening-duel")).toBeVisible();
    const bot = page.getByAltText("白方：准时宝");
    await expect(bot).toBeVisible();
    expect(await bot.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("capture-opening.png") });
    await expect(page.locator(".opening-duel,.opening-backdrop")).toHaveCount(0);
  });

  test(`team replay badges are not clipped at ${viewport.width}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await mountTeamSurface(page, "replays");
    await expect(page.getByRole("tablist")).toHaveCount(0);
    const icons = page.getByRole("img", { name: "队际赛", exact: true });
    await expect(icons).toHaveCount(12);
    for (const icon of [icons.first(), icons.last()]) {
      await icon.scrollIntoViewIfNeeded();
      const clipped = await icon.evaluate((element) => {
        const r = element.getBoundingClientRect();
        for (let parent = element.parentElement; parent; parent = parent.parentElement) {
          const s = getComputedStyle(parent), p = parent.getBoundingClientRect();
          if (s.overflowX !== "visible" && (r.left < p.left - 1 || r.right > p.right + 1)) return parent.className;
          if (s.overflowY !== "visible" && (r.top < p.top - 1 || r.bottom > p.bottom + 1)) return parent.className;
        }
        return "";
      });
      expect(clipped).toBe("");
    }
    await icons.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath("replay-flags.png"), fullPage: true });
  });

  test(`team lineup and portraits at ${viewport.width}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await mountTeamSurface(page, "lineup");
    await expect(page.getByRole("dialog", { name: "队际赛阵容" })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const dialog = page.getByRole("dialog", { name: "队际赛阵容" });
    expect(await dialog.locator(".team-character-options").evaluate(element => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(viewport.width <= 768 ? 3 : 5);
    await dialog.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
    const title = dialog.getByRole("heading", { name: "队际赛" }).locator("img");
    await expect(title).toBeVisible();
    expect(await title.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
    const titleBounds = await title.boundingBox();
    expect(titleBounds.y).toBeGreaterThanOrEqual(0);
    expect(titleBounds.x).toBeGreaterThanOrEqual(0);
    for (const range of ["0-40手", "41-80手", "81手-终局"]) {
      await expect(dialog.getByText(range, { exact: true })).toBeVisible();
    }
    const initialBounds = await dialog.boundingBox();
    const initialSummary = await dialog.locator(".team-lineup-slots").boundingBox();
    const initialTilts = await dialog.locator(".match-character-id").evaluateAll(cards => cards.map(card => card.style.getPropertyValue("--match-character-tilt")));
    expect(initialTilts.every(tilt => Math.abs(parseFloat(tilt)) <= 2.5)).toBe(true);
    const toggleMember = async (name) => {
      await page.getByRole("button", { name, exact: true }).click();
      const bounds = await dialog.boundingBox();
      for (const key of ["x", "y", "width", "height"]) expect(Math.abs(bounds[key] - initialBounds[key]), `${name}: ${key}, initial=${initialBounds[key]}, next=${bounds[key]}`).toBeLessThan(1);
      expect(Math.abs((await dialog.locator(".team-lineup-slots").boundingBox()).y - initialSummary.y)).toBeLessThan(1);
      expect(await dialog.locator(".match-character-id").evaluateAll(cards => cards.map(card => card.style.getPropertyValue("--match-character-tilt")))).toEqual(initialTilts);
    };
    const names = ["西格莉卡", "爱弥斯", "娜波摩"];
    for (const name of [...names, ...names, ...names]) await toggleMember(name);
    await expect(page.getByRole("button", { name: /前移|后移/ })).toHaveCount(0);
    await toggleMember("爱弥斯");
    await toggleMember("爱弥斯");
    await page.getByRole("button", { name: "开始队际赛匹配" }).click();
    expect(await page.evaluate(() => window.teamSelection)).toEqual({ mode: "team", lineup: ["sigrika", "aemeath", "nabomo"] });
    for (const card of await page.locator('.team-character-option[aria-pressed="true"]').all()) {
      await expect(card).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(card).toHaveCSS("outline-style", "none");
      await expect(card).toHaveCSS("box-shadow", "none");
      await expect(card).toHaveCSS("transform", "none");
      await expect(card.locator('.match-character-selection-stamp')).toHaveAttribute('src', /selection-stamp-[123]-v2\.png$/);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("team-lineup.png"), fullPage: true });
    for (const scenario of [
      { suffix: "", round: 1, statuses: { active: 2, finished: 0, waiting: 2, hidden: 2 }, images: 4 },
      { suffix: "&round=2", round: 2, statuses: { active: 2, finished: 2, waiting: 1, hidden: 1 }, images: 5 },
      { suffix: "&round=2&finished=1", round: 2, statuses: { active: 2, finished: 2, waiting: 2, hidden: 0 }, images: 6 }
    ]) {
      await mountTeamSurface(page, `room${scenario.suffix}`);
      await expect(page.locator(".team-portrait-strip")).toHaveCount(2);
      await expect(page.locator(".team-portrait-slot")).toHaveCount(6);
      await expect(page.getByText(`Round ${scenario.round}`, { exact: true })).toBeVisible();
      for (const [status, count] of Object.entries(scenario.statuses)) {
        await expect(page.locator(`.team-portrait-slot.is-${status}`)).toHaveCount(count);
      }
      await expect(page.locator(".team-portrait-mystery")).toHaveCount(scenario.statuses.hidden);
      await expect(page.locator(".team-portrait-art img")).toHaveCount(scenario.images);
      await expect(page.locator(".team-portrait-slot.is-hidden img")).toHaveCount(0);
      for (const image of await page.locator(".team-portrait-art img").all()) {
        await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
        await expect(image).toHaveCSS("object-fit", "contain");
      }
      for (const art of await page.locator(".team-portrait-slot:is(.is-active,.is-waiting) .team-portrait-art").all())
        await expect(art).toHaveCSS("filter", "none");
      for (const art of await page.locator(".team-portrait-slot.is-finished .team-portrait-art").all()) {
        await expect(art).toHaveCSS("filter", "grayscale(1)");
        await expect(art).toHaveCSS("opacity", "0.55");
      }
      const metrics = await page.locator(".team-portrait-strip").evaluateAll(strips => strips.map(strip => {
        const box = strip.getBoundingClientRect();
        return {
          width: box.width, height: box.height,
          clips: [...strip.querySelectorAll(".team-portrait-slot")].map(slot => getComputedStyle(slot).clipPath),
          centers: [...strip.querySelectorAll(".team-portrait-art")].map(art => {
            const bounds = art.getBoundingClientRect(); return bounds.x + bounds.width / 2;
          }),
          images: [...strip.querySelectorAll(".team-portrait-art img")].map(img => {
            const image = img.getBoundingClientRect();
            const art = img.parentElement.getBoundingClientRect();
            const mask = img.closest(".character-bust-portrait");
            const crop = mask.getBoundingClientRect();
            const frame = mask.closest(".team-portrait-art").getBoundingClientRect();
            const focalY = -parseFloat(img.parentElement.style.getPropertyValue("--character-bust-anchor-y")) / 100;
            const focalX = -parseFloat(img.parentElement.style.getPropertyValue("--character-bust-anchor-x")) / 100;
            return { widthDelta: Math.abs(image.width - art.width), heightDelta: Math.abs(image.height - art.height),
              maskWidthDelta: Math.abs(crop.width - frame.width), maskHeightDelta: Math.abs(crop.height - frame.height),
              maskOverflow: getComputedStyle(mask).overflow,
              standard: mask.dataset.standard === "true",
              imageRatio: image.width / image.height, naturalRatio: img.naturalWidth / img.naturalHeight,
              faceCenterDelta: Math.abs(image.x + image.width * focalX - crop.x - crop.width / 2),
              faceY: (image.top + image.height * focalY - crop.top) / crop.height,
              widthRatio: image.width / crop.width,
              headTopGap: image.top - crop.top,
              bottomCrop: image.bottom - crop.bottom,
              visibleHeightRatio: (Math.min(image.bottom, crop.bottom) - Math.max(image.top, crop.top)) / crop.height };
          })
        };
      }));
      for (const metric of metrics) {
        expect(metric.width).toBeGreaterThan(30);
        expect(metric.height).toBeGreaterThanOrEqual(44);
        expect(metric.clips).toHaveLength(3);
        if (viewport.width > 768) {
          expect(metric.clips.every(clip => clip.startsWith("polygon("))).toBe(true);
          expect(new Set(metric.clips).size).toBe(3);
          for (let index = 1; index < metric.centers.length; index++) expect(metric.centers[index]).toBeGreaterThan(metric.centers[index - 1]);
        } else {
          expect(metric.clips.every(clip => clip === "none")).toBe(true);
          for (const active of await page.locator('.team-portrait-slot.is-active').all()) {
            const bounds = await active.boundingBox();
            expect(bounds.width).toBeGreaterThanOrEqual(metric.width - 1);
            expect(bounds.height).toBeGreaterThanOrEqual(32);
            const face = await active.locator('img').evaluate((image, landmarks) => {
              const id = image.getAttribute('src').split('/').at(-1).replace('.webp', '');
              const source = image.getBoundingClientRect();
              const frame = image.closest('.character-bust-portrait').getBoundingClientRect();
              const eyeY = source.top + source.height * landmarks[id].focal[1] / image.naturalHeight;
              return { eyeY, top: frame.top, bottom: frame.bottom };
            }, CHARACTER_CHIBI_LANDMARKS);
            expect(face.eyeY).toBeGreaterThan(face.top + 8);
            expect(face.eyeY).toBeLessThan(face.bottom - 8);
          }
        }
        for (const image of metric.images) {
          expect(image.widthDelta).toBeLessThan(1);
          expect(image.heightDelta).toBeLessThan(1);
          expect(image.maskWidthDelta).toBeLessThan(1);
          expect(image.maskHeightDelta).toBeLessThan(1);
          expect(image.maskOverflow).toBe("hidden");
          if (image.standard) {
            // The source keeps its proportions and complete top edge. Phone
            // active members get the whole column rather than a diagonal mask.
            expect(image.imageRatio).toBeCloseTo(image.naturalRatio, 2);
            expect(image.faceCenterDelta).toBeLessThan(1);
            expect(image.widthRatio).toBeLessThanOrEqual(1);
            expect(image.headTopGap).toBeGreaterThanOrEqual(0);
            expect(image.visibleHeightRatio).toBeGreaterThan(.3);
          }
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`team-room-${scenario.round}-${scenario.statuses.hidden}.png`), fullPage: true });
    }
  });
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 800 }]) {
  test(`full character card layout at ${viewport.width}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await mountTeamSurface(page, "modes&all-owned=1");
    await page.getByRole("button", { name: "标准对弈", exact: true }).click();
    await page.getByRole("button", { name: "常规匹配选择角色", exact: true }).click();
    const picker = page.getByRole("dialog", { name: "选择角色" });
    await page.evaluate(() => document.fonts.ready);
    await expect(picker.locator(".team-character-option")).toHaveCount(10);
    await expect(picker.locator(".match-character-id-emblem")).toHaveCount(0);
    expect(await page.evaluate(() => [...document.fonts].find(face => face.family.replaceAll('"', "") === "Sigrika Window Title")?.status)).toBe("loaded");
    const columns = viewport.width <= 768 ? 3 : 5;
    const list = picker.locator(".team-character-options");
    await expect.poll(() => picker.locator(".match-character-id-frame").evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    const measureCards = () => picker.locator(".match-character-id").evaluateAll(cards => cards.map(card => {
      const bounds = card.getBoundingClientRect();
      const list = card.closest(".team-character-options").getBoundingClientRect();
      const name = card.querySelector(".match-character-name");
      const bust = card.querySelector(".match-character-bust");
      const filter = getComputedStyle(card.querySelector(".match-character-id-frame")).filter;
      const shadow = [...filter.matchAll(/(-?[\d.]+)px/g)].map(match => Number(match[1]));
      const angle = parseFloat(getComputedStyle(card).rotate) * Math.PI / 180;
      const [offsetX = 0, offsetY = 0, blur = 0] = shadow;
      const shiftX = offsetX * Math.cos(angle) - offsetY * Math.sin(angle);
      const shiftY = offsetX * Math.sin(angle) + offsetY * Math.cos(angle);
      const painted = {
        left: Math.min(bounds.left, bounds.left + shiftX - blur * 2),
        right: Math.max(bounds.right, bounds.right + shiftX + blur * 2),
        top: Math.min(bounds.top, bounds.top + shiftY - blur * 2),
        bottom: Math.max(bounds.bottom, bounds.bottom + shiftY + blur * 2)
      };
      return { left: painted.left - list.left, right: list.right - painted.right,
        top: painted.top - list.top, bottom: list.bottom - painted.bottom, painted,
        shadowVisible: filter.includes("drop-shadow(") && offsetX > 0 && offsetY > 0,
        nameFits: name.scrollWidth <= name.clientWidth && name.scrollHeight <= name.clientHeight,
        nameFont: getComputedStyle(name).fontFamily.split(",")[0].trim().replaceAll('"', ""),
        bustTopRatio: bust.offsetTop / card.offsetHeight,
        rotation: getComputedStyle(card).rotate, tilt: card.style.getPropertyValue("--match-character-tilt") };
    }));
    const metrics = await measureCards();
    for (const metric of metrics) {
      expect(metric.left).toBeGreaterThanOrEqual(0);
      expect(metric.right).toBeGreaterThanOrEqual(0);
      expect(metric.shadowVisible).toBe(true);
      expect(metric.nameFits).toBe(true);
      expect(metric.nameFont).toBe("Sigrika Window Title");
      expect(metric.bustTopRatio).toBeGreaterThanOrEqual(0);
      expect(metric.bustTopRatio).toBeLessThanOrEqual(0.05);
      expect(parseFloat(metric.rotation)).toBeCloseTo(parseFloat(metric.tilt), 2);
    }
    for (let index = 0; index < metrics.length - 1; index++) {
      if ((index + 1) % columns !== 0) expect(metrics[index + 1].painted.left - metrics[index].painted.right).toBeGreaterThanOrEqual(0);
    }
    for (const metric of metrics.slice(0, columns)) expect(metric.top).toBeGreaterThanOrEqual(0);
    await list.evaluate(element => { element.scrollTop = element.scrollHeight; });
    const lastRowCount = metrics.length % columns || columns;
    for (const metric of (await measureCards()).slice(-lastRowCount)) expect(metric.bottom).toBeGreaterThanOrEqual(0);
    await list.evaluate(element => { element.scrollTop = 0; });
    await picker.screenshot({ path: testInfo.outputPath("full-roster-picker.png"), animations: "disabled" });
  });
  test(`match character cards retain selection at ${viewport.width}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await mountTeamSurface(page, "modes");
    const modes = page.locator(".match-mode-modal");
    if (viewport.width <= 768) {
      await page.evaluate(() => document.fonts.ready);
      const heights = await modes.locator(".match-mode-option-wrap > .match-mode-option").evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height));
      expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(1);
      for (const title of await modes.locator(".match-mode-copy > strong").all()) await expect(title).toHaveCSS("font-size", "28px");
      await modes.screenshot({ path: testInfo.outputPath("mobile-primary-cards.png"), animations: "disabled" });
    }
    await modes.getByRole("button", { name: "标准对弈", exact: true }).click();
    expect(await page.evaluate(() => window.matchNotice)).toBeUndefined();
    await modes.getByRole("button", { name: "常规匹配", exact: true }).click();
    expect(await page.evaluate(() => window.matchNotice)).toBe("尚未选择角色，无法匹配");
    expect(await page.evaluate(() => window.matchSelection)).toBeUndefined();
    const empty = modes.getByRole("button", { name: "常规匹配选择角色", exact: true });
    await expect(empty).toHaveCSS("border-style", "dashed");
    const square = await empty.boundingBox();
    expect(square.width).toBe(44); expect(square.height).toBe(44);
    await empty.click();
    const picker = page.getByRole("dialog", { name: "选择角色" });
    expect((await picker.boundingBox()).width).toBeLessThanOrEqual(920);
    expect(await picker.locator(".team-character-options").evaluate(element => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(viewport.width <= 768 ? 3 : 5);
    await expect(picker.locator(".match-character-bust")).toHaveCount(3);
    const bust = await picker.locator(".match-character-bust").first().boundingBox();
    expect(bust.width).toBeGreaterThan(55); expect(bust.height).toBeGreaterThan(55);
    await expect(picker.locator(".match-character-id-frame")).toHaveCount(3);
    expect(await picker.locator(".match-character-id-frame").evaluateAll(images => images.every(image => image.getAttribute("src") === "/assets/home/character-selection-id-v4.png"))).toBe(true);
    expect(await picker.locator(".match-character-id-frame").evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    await picker.screenshot({ path: testInfo.outputPath("owned-bust-picker.png"), animations: "disabled" });
    await picker.getByRole("button", { name: "爱弥斯", exact: true }).click();
    await picker.getByRole("button", { name: "关闭选择角色", exact: true }).click();
    await modes.getByRole("button", { name: "常规匹配", exact: true }).click();
    expect(await page.evaluate(() => window.matchSelection)).toEqual({ mode: "standard", characterId: "aemeath" });
    await page.reload();
    await modes.getByRole("button", { name: "标准对弈", exact: true }).click();
    await expect(modes.getByRole("button", { name: "常规匹配选择角色：爱弥斯", exact: true })).toBeVisible();
    await modes.getByRole("button", { name: "返回", exact: true }).click();
    await modes.getByRole("button", { name: "星炬对弈", exact: true }).click({ position: { x: 20, y: 40 } });
    await modes.getByRole("button", { name: "队际赛选择角色1", exact: true }).click();
    const team = page.getByRole("dialog", { name: "队际赛阵容" });
    for (const name of ["娜波摩", "西格莉卡", "爱弥斯"]) await team.getByRole("button", { name, exact: true }).click();
    await team.getByRole("button", { name: "开始队际赛匹配", exact: true }).click();
    expect(await page.evaluate(() => window.matchSelection)).toEqual({ mode: "team", lineup: ["nabomo", "sigrika", "aemeath"] });
    await expect(modes.locator(".match-mode-count")).toHaveCount(0);
    if (viewport.width <= 768) {
      await modes.evaluate(element => Promise.all(element.getAnimations({ subtree: true })
        .filter(animation => animation.effect.getTiming().iterations !== Infinity)
        .map(animation => animation.finished.catch(() => {}))));
      const geometry = await modes.locator(".match-mode-submode").evaluateAll(elements => elements.map(element => {
        const card = element.querySelector(".match-mode-option").getBoundingClientRect();
        const slots = element.querySelector(".match-character-slots").getBoundingClientRect();
        const title = element.querySelector("strong");
        const range = document.createRange();
        range.selectNodeContents(title);
        const text = range.getBoundingClientRect();
        const info = element.querySelector(".match-mode-info-button")?.getBoundingClientRect();
        return { height: card.height, rightGap: card.right - slots.right, topGap: slots.top - card.top, bottomGap: card.bottom - slots.bottom, infoOffset: info ? info.left - text.right : null, infoTop: info ? info.top - text.top : null };
      }));
      expect(new Set(geometry.map(card => card.height)).size).toBe(1);
      for (const card of geometry) {
        expect(card.rightGap).toBeGreaterThanOrEqual(16);
        expect(card.topGap).toBeGreaterThanOrEqual(20);
        expect(card.bottomGap).toBeGreaterThanOrEqual(20);
        if (card.infoOffset !== null) {
          expect(Math.abs(card.infoOffset)).toBeLessThan(10);
          expect(card.infoTop).toBeLessThan(0);
        }
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await modes.screenshot({ path: testInfo.outputPath("selected-team-cards.png"), animations: "disabled" });
  });
}
