import { expect, test } from "@playwright/test";

async function mountTeamSurface(page, surface) {
  await page.goto(`/tests/e2e/fixtures/team-match.html?surface=${surface}`, { waitUntil: "domcontentloaded" });
}

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
    await page.getByRole("button", { name: /星炬对弈.*匹配中/ }).click();
    for (const [name, copy] of [
      ["吃子挑战赛", "100手内尽可能吃掉准时宝的棋子吧！吃得越多排名越高！"],
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
    await dialog.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
    const title = dialog.getByRole("heading", { name: "队际赛" }).locator("img");
    await expect(title).toBeVisible();
    expect(await title.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
    const titleBounds = await title.boundingBox();
    expect(titleBounds.y).toBeGreaterThanOrEqual(0);
    expect(titleBounds.x).toBeGreaterThanOrEqual(0);
    for (const range of ["(0-40手)", "(41-80手)", "(81手-终局)"]) {
      await expect(dialog.getByText(range, { exact: true })).toBeVisible();
    }
    const initialBounds = await dialog.boundingBox();
    const toggleMember = async (name) => {
      await page.getByRole("button", { name, exact: true }).click();
      const bounds = await dialog.boundingBox();
      for (const key of ["x", "y", "width", "height"]) expect(Math.abs(bounds[key] - initialBounds[key]), `${name}: ${key}, initial=${initialBounds[key]}, next=${bounds[key]}`).toBeLessThan(1);
    };
    const names = ["西格莉卡", "爱弥斯", "娜波摩"];
    for (const name of [...names, ...names, ...names]) await toggleMember(name);
    await expect(page.getByRole("button", { name: /前移|后移/ })).toHaveCount(0);
    await toggleMember("爱弥斯");
    await toggleMember("爱弥斯");
    await page.getByRole("button", { name: "开始匹配" }).click();
    expect(await page.evaluate(() => window.teamSelection)).toEqual({ mode: "team", lineup: ["sigrika", "nabomo", "aemeath"] });
    for (const card of await page.locator('.team-character-option[aria-pressed="true"]').all()) {
      await expect(card).toHaveCSS("background-color", "rgb(191, 232, 221)");
      await expect(card).toHaveCSS("border-top-color", "rgb(61, 43, 37)");
      await expect(card).toHaveCSS("box-shadow", "none");
      await expect(card).toHaveCSS("transform", "matrix(0.97, 0, 0, 0.97, 0, 2)");
      await expect(card.locator('.team-order-badge')).toHaveCSS('border-radius', '50%');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("team-lineup.png"), fullPage: true });
    await mountTeamSurface(page, "room");
    await expect(page.locator(".team-portrait-strip")).toHaveCount(2);
    await expect(page.locator(".team-portrait-mystery")).toHaveCount(2);
    await expect(page.getByText("Round 1", { exact: true })).toBeVisible();
    const metrics = await page.locator(".team-portrait-strip").evaluateAll((strips) => strips.map((strip) => ({
      width: strip.getBoundingClientRect().width,
      height: strip.getBoundingClientRect().height,
      cells: getComputedStyle(strip).gridTemplateColumns.split(" ").map(Number.parseFloat),
      gray: [...strip.querySelectorAll(".is-inactive")].every((cell) => getComputedStyle(cell).filter.includes("grayscale(1)"))
    })));
    for (const metric of metrics) {
      expect(metric.width).toBeGreaterThan(30);
      expect(metric.height).toBeGreaterThanOrEqual(44);
      expect(Math.max(...metric.cells) - Math.min(...metric.cells)).toBeLessThan(2);
      expect(metric.gray).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("team-room.png"), fullPage: true });
    if (viewport.width > 760) {
      const framing = await page.locator('.team-portrait-art img').first().evaluate((img) => {
        const frame = img.closest('.team-portrait-slot').getBoundingClientRect();
        const rect = img.getBoundingClientRect();
        return { imageWidth: rect.width, frameWidth: frame.width, centerDelta: Math.abs(rect.top + rect.height / 2 - frame.top - frame.height / 2) };
      });
      expect(framing.imageWidth).toBeGreaterThan(framing.frameWidth * 1.3);
      expect(framing.centerDelta).toBeLessThan(2);
    }
  });
}
