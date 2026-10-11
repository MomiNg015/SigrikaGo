import { expect, test } from "@playwright/test";
import path from "node:path";

const fixture = "/tests/e2e/fixtures/spectator-presence.html";
const output = path.resolve(".codex-run/battle-presence");
async function ready(page, query = "count=6") {
  await page.goto(`${fixture}?${query}`);
  await expect(page.locator(".spectator-gallery").first()).toBeVisible();
  await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode().catch(() => {}))));
}

async function centers(page) {
  return page.locator(".spectator-hit").evaluateAll((nodes) => nodes.map((node) => ({
    id: node.dataset.spectatorId, x: Number(node.dataset.centerX), y: Number(node.dataset.centerY), rotation: Number(node.dataset.rotation)
  })));
}
async function clickSpectator(page, id) {
  const point = (await centers(page)).find((entry) => entry.id === id);
  await page.mouse.click(point.x, point.y);
}
async function assertSafeCenters(page, count) {
  const points = await centers(page);
  expect(points).toHaveLength(count);
  for (const point of points) {
    expect(point.rotation).toBeGreaterThanOrEqual(-30);
    expect(point.rotation).toBeLessThanOrEqual(30);
    expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.dataset.spectatorId, point)).toBe(point.id);
    const box = await page.locator(`[data-spectator-id="${point.id}"] + .spectator-figure`).boundingBox();
    expect(Math.abs(box.x + box.width / 2 - point.x)).toBeLessThan(1);
    expect(Math.abs(box.y + box.height / 2 - point.y)).toBeLessThan(1);
  }
  const clear = await page.locator(".board-stage, .room-header, .action-bar > button, .player-info").evaluateAll((nodes) => nodes.every((node) => {
    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) return true;
    return !document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)?.closest(".spectator-gallery");
  }));
  expect(clear).toBe(true);
  // Protect the entire control surface, including padding, frame and gaps.
  // Checking only button centers misses portraits leaking through the dock.
  const cleanDock = await page.locator('.action-bar, .room-direct-actions').evaluateAll((nodes) => nodes.every((node) => {
    const rect = node.getBoundingClientRect();
    for (let y = Math.max(0, rect.top + 1); y < Math.min(innerHeight, rect.bottom); y += 5) {
      for (let x = Math.max(0, rect.left + 1); x < Math.min(innerWidth, rect.right); x += 5) {
        if (document.elementFromPoint(x, y)?.closest('.spectator-gallery')) return false;
      }
    }
    return true;
  }));
  expect(cleanDock).toBe(true);
}

async function assertFullArtAndTags(page, width) {
  expect(await page.locator('.spectator-crop').count()).toBe(0);
  const compact = width <= 900;
  const results = await page.locator('.spectator-figure').evaluateAll((figures) => figures.map((figure) => {
    const image = figure.querySelector('img');
    const tag = figure.querySelector('.spectator-username');
    const art = figure.querySelector('.spectator-art');
    const style = getComputedStyle(tag);
    return {
      width: figure.getBoundingClientRect().width, height: figure.getBoundingClientRect().height,
      imageHeight: image ? parseFloat(getComputedStyle(image).height) : null,
      mask: getComputedStyle(art).maskImage, clip: getComputedStyle(art).clipPath,
      tagTop: parseFloat(tag.style.top), tagBottom: tag.getBoundingClientRect().bottom, paper: style.backgroundColor !== 'rgba(0, 0, 0, 0)',
      border: style.borderTopWidth, shadow: style.boxShadow !== 'none'
    };
  }));
  for (const result of results) {
    expect([result.width, result.height]).toEqual(compact ? [144, 160] : [192, 232]);
    if (result.imageHeight !== null) expect(result.imageHeight).toBeCloseTo(result.height, 0);
    expect(result.mask).toBe('none');
    expect(result.clip).toBe('none');
    expect(result.tagTop).toBeGreaterThan(result.height / 2);
    expect(result.tagBottom).toBeLessThanOrEqual((await page.viewportSize()).height + 2);
    expect([result.paper, result.border, result.shadow]).toEqual([true, '1px', true]);
  }
}

for (const width of [320, 360, 390]) {
  test(`${width}px: window-space centers, full art, paper labels, compact gap and all viewers clickable`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    let originalDock;
    for (const count of [0, 1, 6, 20]) {
      await ready(page, `count=${count}`);
      await expect(page.locator(".spectator-hit")).toHaveCount(count);
      await expect(page.getByRole("tab", { name: /操作|成员/ })).toHaveCount(0);
      await expect(page.locator(".spectator-mobile-gap")).toHaveCount(0);
      const self = await page.locator(".mobile-self-slot").boundingBox();
      const dock = await page.locator(".room-direct-actions").boundingBox();
      expect(dock.y - self.y - self.height).toBeLessThanOrEqual(10);
      if (originalDock == null) originalDock = dock.y;
      expect(dock.y).toBeCloseTo(originalDock, 0);
      await assertSafeCenters(page, count);
      await assertFullArtAndTags(page, width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (count === 6 || count === 20 || (width === 390 && count === 0)) await page.screenshot({ path: path.join(output, `same-screen-mobile-${width}-${count}.png`) });
    }
  });
}

test("snapshots and joins keep centers and angles; reduce motion disables entry fade", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page, "count=6&controls");
  const original = await centers(page);
  await page.getByRole("button", { name: "刷新房间数据" }).click();
  await page.getByRole("button", { name: "增加观战者" }).click();
  await expect(page.locator(".spectator-hit")).toHaveCount(7);
  expect((await centers(page)).slice(0, 6)).toEqual(original);
  await expect(page.locator(".spectator-arriving")).toHaveCount(1);
  await page.getByRole("button", { name: "减少观战者" }).click();
  await page.getByRole("button", { name: "增加观战者" }).click();
  await expect(page.locator(".spectator-arriving")).toHaveCount(0);
  expect((await centers(page)).slice(0, 6)).toEqual(original);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "增加观战者" }).click();
  expect(await page.locator(".spectator-arriving").evaluate((node) => getComputedStyle(node).animationName)).toBe("none");
});

test("player and spectator open direct profiles; social actions retain confirmations and restrictions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let relation = "none";
  const requests = [];
  await page.route(/\/api\/(?:users|social)\//, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("/profile")) {
      const id = url.pathname.split("/")[3];
      return route.fulfill({ json: { profile: { id, username: id === "watcher-0" ? "青柠汽水" : "星炬棋手", relation, mode: "spark", rank: "3段", rating: 1200, characterId: "sigrika", recordStats: { totalGames: 10, wins: 6, losses: 4, draws: 0 }, characterStats: [], recentResults: [] } } });
    }
    requests.push(`${route.request().method()} ${url.pathname}`);
    relation = route.request().method() === "DELETE" ? "none" : url.pathname.includes("/friends/") ? "friend" : "blacklist";
    return route.fulfill({ json: { friends: [], blacklist: [] } });
  });
  await ready(page);
  await clickSpectator(page, "watcher-0");
  await expect(page.locator(".user-profile-modal")).toBeVisible();
  await expect(page.locator(".user-profile-modal")).toContainText("青柠汽水");
  await page.screenshot({ path: path.join(output, "mobile-profile.png"), fullPage: true });
  await page.getByRole("button", { name: "加好友", exact: true }).click();
  await expect(page.getByRole("button", { name: "加入黑名单", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "解除好友", exact: true }).click();
  const confirm = page.getByRole("dialog", { name: "解除好友" });
  await expect(confirm).toBeVisible();
  await confirm.getByRole("button", { name: "确定", exact: true }).click();
  await expect(page.getByRole("button", { name: "加好友", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "加入黑名单", exact: true }).click();
  await page.getByRole("dialog", { name: "加入黑名单" }).getByRole("button", { name: "确认加入", exact: true }).click();
  await page.getByRole("button", { name: "移出黑名单", exact: true }).click();
  await expect(page.getByRole("button", { name: "加入黑名单", exact: true })).toBeVisible();
  expect(requests).toEqual(["POST /api/social/friends/watcher-0", "DELETE /api/social/friends/watcher-0", "POST /api/social/blacklist/watcher-0", "DELETE /api/social/blacklist/watcher-0"]);
  await page.getByRole("button", { name: "关闭详细资料" }).click();
  await page.locator(".mobile-self-slot button.player-meta").click();
  await expect(page.locator(".user-profile-modal")).toContainText("星炬棋手");
  await expect(page.getByRole("button", { name: "加好友", exact: true })).toBeDisabled();
});

test("special room keeps system records; own spectator and missing art stay accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page, "count=6&special&self&failed");
  await expect(page.locator('[data-spectator-id="watcher-0"]')).toHaveCount(1);
  await expect(page.locator(".chat-toggle-button").filter({ hasText: "系统记录" })).toBeVisible();
  await expect(page.locator('[data-spectator-id="watcher-0"] + .spectator-figure img')).not.toHaveAttribute("src", "/missing-costume.png");
  await page.screenshot({ path: path.join(output, "mobile-special.png"), fullPage: true });
});

test("desktop scatters in window space while preserving functional input", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await ready(page, "count=6");
  await expect(page.locator(".spectator-gallery")).toHaveCount(1);
  await assertSafeCenters(page, 6);
  await assertFullArtAndTags(page, 1440);
  expect(errors).toEqual([]);
  await page.screenshot({ path: path.join(output, "same-screen-desktop-1440.png") });
});

test("transparent desktop player columns do not cut rectangular holes into spectator art", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await ready(page);
  const result = await page.evaluate(() => {
    const gallery = document.querySelector('.spectator-gallery');
    const card = document.querySelector('.player-info.self');
    const box = card.getBoundingClientRect();
    const point = { x: box.right - 1, y: box.top + 100 };
    const rects = [...gallery.querySelectorAll('clipPath rect')].map((rect) => Object.fromEntries(
      ['x', 'y', 'width', 'height'].map((key) => [key, Number(rect.getAttribute(key))])));
    return {
      paintsTransparentEdge: rects.some((rect) => point.x >= rect.x && point.x <= rect.x + rect.width
        && point.y >= rect.y && point.y <= rect.y + rect.height),
      contentAboveArt: [...card.querySelectorAll(':scope > .portrait-wrap, :scope > .player-meta, :scope > .player-clock-panel')]
        .every((element) => Number(getComputedStyle(element).zIndex) > Number(getComputedStyle(gallery).zIndex)),
      noParentStack: getComputedStyle(card).zIndex === 'auto'
    };
  });
  expect(result).toEqual({ paintsTransparentEdge: true, contentAboveArt: true, noParentStack: true });
  await assertSafeCenters(page, 6);
  await page.screenshot({ path: path.join(output, 'transparent-info-desktop.png') });
  await page.screenshot({ path: path.join(output, 'transparent-info-detail.png'), clip: { x: 1060, y: 180, width: 380, height: 450 } });
  await ready(page, 'count=6&special');
  expect(await page.evaluate(() => {
    const box = document.querySelector('.player-info.self').getBoundingClientRect();
    const point = { x: box.right - 1, y: box.top + 100 };
    return [...document.querySelectorAll('.spectator-gallery clipPath rect')].some((rect) => {
      const [x, y, width, height] = ['x', 'y', 'width', 'height'].map((key) => Number(rect.getAttribute(key)));
      return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;
    });
  })).toBe(false);
});

test("short phones can scroll the room from exposed spectator art", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 640 });
  await ready(page, "count=6");
  // The board fills the initial short viewport. Reveal genuine free space by
  // scrolling the room before testing a gesture that starts on a portrait.
  await page.mouse.move(195, 500);
  await page.mouse.wheel(0, 40);
  await expect(page.locator('.spectator-hit')).toHaveCount(6);
  const first = (await centers(page))[0];
  const before = await page.locator('.room-screen').evaluate((node) => node.scrollTop);
  await page.mouse.move(first.x, first.y);
  await page.mouse.wheel(0, 220);
  await expect.poll(() => page.locator(".room-screen").evaluate((node) => node.scrollTop)).toBeGreaterThan(before);
  await expect(page.locator(".user-profile-modal")).toHaveCount(0);
  await assertSafeCenters(page, 6);
});
