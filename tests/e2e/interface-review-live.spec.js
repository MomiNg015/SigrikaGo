import fs from "node:fs/promises";
import path from "node:path";
import { expect } from "@playwright/test";
import { test, newPlayer, openTestDatabase, openHome } from "./full-system-helpers.js";

let db;
test.beforeAll(() => { db = openTestDatabase(); });
test.afterAll(async () => { await db?.$disconnect(); });

const output = path.resolve(process.env.INTERFACE_REVIEW_CAPTURE_DIR ?? ".tmp/interface-polish/live");
async function capture(page, name) {
  await fs.mkdir(output, { recursive: true });
  await expect.poll(() => page.evaluate(() => document.fonts.status), {
    message: "Visible text fonts must finish loading before capture"
  }).toBe("loaded");
  await expect.poll(() => page.evaluate(() => [...document.images].filter(img => {
    const box = img.getBoundingClientRect();
    let left = Math.max(0, box.left);
    let right = Math.min(innerWidth, box.right);
    let top = Math.max(0, box.top);
    let bottom = Math.min(innerHeight, box.bottom);
    for (let node = img; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === "none" || (node === img && style.visibility !== "visible") ||
          style.contentVisibility === "hidden" || Number(style.opacity) === 0) return false;
      if (node !== img) {
        const clip = node.getBoundingClientRect();
        if (/^(auto|scroll|hidden|clip)$/.test(style.overflowX)) {
          left = Math.max(left, clip.left);
          right = Math.min(right, clip.right);
        }
        if (/^(auto|scroll|hidden|clip)$/.test(style.overflowY)) {
          top = Math.max(top, clip.top);
          bottom = Math.min(bottom, clip.bottom);
        }
      }
      if (right <= left || bottom <= top) return false;
    }
    return right > left && bottom > top;
  }).filter(img => !img.complete || img.naturalWidth === 0).map(img => img.currentSrc || img.src)), {
    message: "Images with a visible painted area must load before capture"
  }).toEqual([]);
  // Chrome's immediate full-page capture can transiently resize to 1×1 and
  // legitimately remount the app's viewport gate. Fixed-window QA stays at
  // the actual viewport, preserving the active nested dialog.
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: false, animations: "disabled" });
}

const windows = [
  ["部员手册", ".handbook-modal", "关闭部员手册", "handbook"],
  ["打开履历", ".resume-modal", "关闭履历", "resume"],
  ["招募", ".recruitment-modal", null, "recruitment"],
  ["商店", ".shop-window", "关闭商店", "shop"],
  ["仓库", ".warehouse-modal", "关闭仓库", "warehouse"],
  ["排行", ".leaderboard-modal", "关闭排行榜", "leaderboard"],
  ["观战", ".watch-list-modal", "关闭对局列表", "watch"],
  ["好友", ".friends-modal", "关闭好友窗口", "friends"]
];

const adminPages = [
  ["概况", "/api/admin/analytics/overview"], ["运营分析", "/api/admin/analytics/operations"],
  ["用户管理", "/api/admin/users"], ["角色管理", "/api/admin/characters"],
  ["特性词", "/api/admin/skill-traits"], ["商城管理", "/api/admin/shop-items"],
  ["服装管理", "/api/admin/costumes"], ["道具管理", "/api/admin/shop-items"],
  ["装饰管理", "/api/admin/decorations"], ["音乐管理", "/api/music-tracks"],
  ["扭蛋管理", "/api/admin/gacha-pools"], ["招募配置", "/api/admin/recruitment-config"],
  ["公告管理", "/api/admin/announcements"], ["剧情教学", "/api/admin/story-scripts"],
  ["邮箱管理", "/api/admin/mailbox/batches"], ["成就管理", "/api/admin/achievements"],
  ["看板娘管理", "/api/admin/site-settings"], ["系统设置", "/api/admin/site-settings"],
  ["留言反馈", "/api/admin/feedback"], ["用户举报", "/api/admin/user-reports"], ["审计日志", "/api/admin/audit-logs"]
];

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`review real player windows, nested controls and mobile menu at ${viewport.width}`, async ({ page, request }) => {
    test.setTimeout(90_000);
    page.setDefaultTimeout(10_000);
    await page.setViewportSize(viewport);
    const player = await newPlayer(request, db);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await openHome(page, player);
    await capture(page, `home-${viewport.width}`);
    for (const [label, selector, closeLabel, slug] of windows) {
      await page.getByRole("button", { name: label, exact: true }).click();
      const dialog = page.locator(selector);
      await expect(dialog).toBeVisible();
      await expect(dialog.locator(".window-loading-state")).toHaveCount(0);
      if (slug === "recruitment") {
        await expect(dialog.locator(".recruitment-selection-card")).toBeVisible();
        await expect(dialog.locator(".recruitment-item-icon")).toHaveCount(3);
        for (const image of await dialog.locator("img.recruitment-item-icon").all()) {
          await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await capture(page, `${slug}-${viewport.width}`);
      if (closeLabel) await dialog.getByRole("button", { name: closeLabel, exact: true }).click();
      else await dialog.locator(":scope > .close-button").click();
      await expect(dialog).toHaveCount(0);
    }
    await page.getByRole("button", { name: "打开履历", exact: true }).click();
    for (const [label, selector, closeLabel, slug] of [
      ["成就", ".achievement-modal", "关闭成就窗口", "achievements"],
      ["个性化", ".personalization-modal", "关闭个性化窗口", "personalization"],
      ["对局回放", null, "关闭对局回放", "replays"]
    ]) {
      await page.locator(".resume-modal").getByRole("button", { name: label, exact: true }).click();
      const dialog = selector ? page.locator(selector) : page.getByRole("dialog", { name: "对局回放", exact: true });
      await expect(dialog).toBeVisible();
      await expect(dialog.locator(".window-loading-state")).toHaveCount(0);
      await capture(page, `${slug}-${viewport.width}`);
      await page.getByRole("button", { name: closeLabel, exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(page.locator(".resume-modal")).toBeVisible();
    }
    await page.getByRole("button", { name: "关闭履历", exact: true }).click();
    for (const [desktopLabel, mobileLabel, selector, closeLabel, slug] of [
      [/^打开公告/, "公告", ".announcement-modal", "关闭公告窗口", "announcements"],
      [/^打开邮箱/, "邮箱", ".mailbox-modal", "关闭邮箱", "mailbox"],
      ["打开设置", "设置", ".settings-modal", "关闭设置", "settings"],
      ["打开留言板", "留言", ".message-board-modal", null, "message-board"]
    ]) {
      if (viewport.width < 768) {
        await page.getByRole("button", { name: "打开首页菜单", exact: true }).click();
        await page.locator(".home-mobile-menu-panel").getByRole("button", { name: new RegExp(`^${mobileLabel}`) }).click();
      } else await page.getByRole("button", { name: desktopLabel, exact: typeof desktopLabel === "string" }).click();
      const dialog = page.locator(selector);
      await expect(dialog).toBeVisible();
      await expect(dialog.locator(".window-loading-state")).toHaveCount(0);
      await capture(page, `${slug}-${viewport.width}`);
      if (closeLabel) await dialog.getByRole("button", { name: closeLabel, exact: true }).click();
      else await dialog.locator(".close-button").click();
      await expect(dialog).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
test(`review all admin screens using isolated data at ${viewport.width}`, async ({ page, request }) => {
  test.setTimeout(150_000);
  page.setDefaultTimeout(10_000);
  await page.setViewportSize(viewport);
  const admin = await newPlayer(request, db, { role: "admin" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openHome(page, admin);
  if (viewport.width < 768) {
    await page.getByRole("button", { name: "打开首页菜单", exact: true }).click();
    await page.locator(".home-mobile-menu-panel").getByRole("button", { name: "后台", exact: true }).click();
  } else await page.getByRole("button", { name: "打开后台管理", exact: true }).click();
  await expect.poll(async () => ({ sidebar: await page.locator(".admin-sidebar").count(), errors })).toEqual({ sidebar: 1, errors: [] });
  for (const [index, [title, endpoint]] of adminPages.entries()) {
    const response = index === 0 ? null : page.waitForResponse(response => new URL(response.url()).pathname === endpoint && response.request().method() === "GET");
    await page.locator(".admin-sidebar").getByRole("button", { name: title, exact: true }).click();
    await expect(page.locator(".admin-main > header > strong")).toHaveText(title);
    if (response) expect((await response).status()).toBe(200);
    await expect.poll(() => page.locator(".admin-main").evaluate(main => main.scrollTop)).toBe(0);
    await expect(page.locator(".admin-main .admin-error")).toHaveCount(0);
    await expect(page.locator(".admin-main .window-loading-state")).toHaveCount(0);
    for (const hint of await page.locator(".admin-main .quiet-text").all()) {
      await expect(hint).toHaveCSS("color", "rgb(100, 116, 139)");
    }
    if (title === "公告管理") {
      const pinRow = page.locator(".admin-announcement-pin-row");
      const checkbox = pinRow.getByRole("checkbox");
      const inputBox = await checkbox.boundingBox();
      const copyBox = await pinRow.locator("span").boundingBox();
      expect(inputBox.width).toBeLessThanOrEqual(24);
      expect(copyBox.width).toBeGreaterThanOrEqual(60);
      expect(Math.abs(inputBox.y + inputBox.height / 2 - copyBox.y - copyBox.height / 2)).toBeLessThan(2);
      await pinRow.click();
      await expect(checkbox).toBeChecked();
      await pinRow.click();
      await expect(checkbox).not.toBeChecked();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.locator(".admin-main").evaluate(main => { main.scrollTop = 0; });
    await capture(page, `admin-${String(index + 1).padStart(2, "0")}-${viewport.width}`);
    if (viewport.width < 768) {
      await page.locator(".admin-main").evaluate(main => { main.scrollTop = 200; });
    }
  }
  expect(errors).toEqual([]);
});
}
