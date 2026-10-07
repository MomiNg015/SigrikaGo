import { expect } from "@playwright/test";
import { test, api, newPlayer, openTestDatabase, openHome } from "./full-system-helpers.js";

let db;
test.beforeAll(() => { db = openTestDatabase(); });
test.afterAll(async () => { await db?.$disconnect(); });

const ADMIN_PAGES = [
  ["概况", "/api/admin/analytics/overview"], ["运营分析", "/api/admin/analytics/operations"],
  ["用户管理", "/api/admin/users"], ["角色管理", "/api/admin/characters"],
  ["特性词", "/api/admin/skill-traits"], ["商城管理", "/api/admin/shop-items"],
  ["服装管理", "/api/admin/costumes"], ["道具管理", "/api/admin/shop-items"],
  ["装饰管理", "/api/admin/decorations"], ["音乐管理", "/api/music-tracks"],
  ["扭蛋管理", "/api/admin/gacha-pools"], ["招募配置", "/api/admin/recruitment-config"],
  ["公告管理", "/api/admin/announcements?kind=announcement&status=all"],
  ["剧情教学", "/api/admin/story-scripts"], ["邮箱管理", "/api/admin/mailbox/batches"],
  ["成就管理", "/api/admin/achievements"], ["看板娘管理", "/api/admin/site-settings"],
  ["系统设置", "/api/admin/site-settings"], ["留言反馈", "/api/admin/feedback"],
  ["用户举报", "/api/admin/user-reports"], ["审计日志", "/api/admin/audit-logs"]
];

test("all 21 admin pages load real data and a settings save survives reload and reaches the player header", async ({ page, request }) => {
  test.setTimeout(150_000);
  const admin = await newPlayer(request, db, { role: "admin" });
  const errors = [];
  const failedApi = [];
  const loaded = new Set();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    const pathname = new URL(response.url()).pathname;
    if (!pathname.startsWith("/api/")) return;
    if (response.status() === 200) loaded.add(pathname);
    if (response.status() >= 400 && pathname !== "/api/auth/refresh") failedApi.push(`${pathname}:${response.status()}`);
  });
  await openHome(page, admin);
  await page.getByRole("button", { name: "打开后台管理", exact: true }).click();
  const sidebar = page.locator(".admin-sidebar");
  for (const [label, endpoint] of ADMIN_PAGES) {
    const pathname = endpoint.split("?")[0];
    const pending = label === "概况" && loaded.has(pathname) ? null : page.waitForResponse((response) =>
      new URL(response.url()).pathname === pathname && response.request().method() === "GET");
    await sidebar.getByRole("button", { name: label, exact: true }).click();
    await expect(page.locator(".admin-main > header > strong")).toHaveText(label);
    if (pending) expect((await pending).status()).toBe(200);
    await api(request, admin, "GET", endpoint);
    await expect(page.locator(".admin-main .admin-error")).toHaveCount(0);
  }
  const settingsLoaded = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/admin/site-settings"
    && response.request().method() === "GET");
  await sidebar.getByRole("button", { name: "系统设置", exact: true }).click();
  const settingsResponse = await settingsLoaded;
  expect(settingsResponse.status()).toBe(200);
  await settingsResponse.json();
  const original = (await api(request, admin, "GET", "/api/admin/site-settings")).settings;
  const title = "全量验收学园";
  const saved = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/admin/site-settings"
    && response.request().method() === "PATCH");
  const titleInput = page.getByLabel(/大厅标题/);
  await expect(titleInput).toBeEnabled();
  await expect(titleInput).toHaveValue(original.homeTitle);
  await titleInput.fill(title);
  await expect(titleInput).toHaveValue(title);
  await page.locator(".admin-settings-form").getByRole("button", { name: "保存", exact: true }).click();
  const saveResponse = await saved;
  expect(saveResponse.request().postDataJSON().homeTitle).toBe(title);
  expect(saveResponse.status()).toBe(200);
  expect((await api(request, admin, "GET", "/api/admin/site-settings")).settings.homeTitle).toBe(title);
  await page.getByRole("button", { name: "返回大厅", exact: true }).click();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".home-brand-title")).toHaveText(title, { timeout: 30_000 });
  await api(request, admin, "PATCH", "/api/admin/site-settings", original);
  expect(errors).toEqual([]);
  expect(failedApi).toEqual([]);
  await page.screenshot({ path: test.info().outputPath("admin-settings-applied.png") });
});

const PLAYER_WINDOWS = [
  ["部员手册", ".handbook-modal", "关闭部员手册"],
  ["打开履历", ".resume-modal", "关闭履历"],
  ["招募", ".recruitment-modal", null], ["商店", ".shop-window", "关闭商店"],
  ["仓库", ".warehouse-modal", "关闭仓库"], ["排行", ".leaderboard-modal", "关闭排行榜"],
  ["观战", ".watch-list-modal", "关闭对局列表"], ["好友", ".friends-modal", "关闭好友窗口"]
];

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`player windows load and close without horizontal overflow at ${viewport.width}`, async ({ page, request }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    const player = await newPlayer(request, db);
    const errors = [];
    const failedApi = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (new URL(response.url()).pathname.startsWith("/api/") && response.status() >= 400
        && !response.url().includes("/auth/refresh")) failedApi.push(`${response.url()}:${response.status()}`);
    });
    await openHome(page, player);
    for (const [label, selector, closeLabel] of PLAYER_WINDOWS) {
      await page.getByRole("button", { name: label, exact: true }).click();
      const window = page.locator(selector);
      await expect(window).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      if (closeLabel) await window.getByRole("button", { name: closeLabel, exact: true }).click();
      else await window.locator(":scope > .close-button").click();
      await expect(window).toHaveCount(0);
    }
    await page.getByRole("button", { name: "打开履历", exact: true }).click();
    for (const [label, selector, closeLabel] of [
      ["成就", ".achievement-modal", "关闭成就窗口"],
      ["个性化", ".personalization-modal", "关闭个性化窗口"],
      ["对局回放", null, "关闭对局回放"]
    ]) {
      await page.locator(".resume-modal").getByRole("button", { name: label, exact: true }).click();
      const nestedWindow = selector ? page.locator(selector) : page.getByRole("dialog", { name: "对局回放", exact: true });
      await expect(nestedWindow).toBeVisible();
      await page.getByRole("button", { name: closeLabel, exact: true }).click();
      await expect(nestedWindow).toHaveCount(0);
      await expect(page.locator(".resume-modal")).toBeVisible();
    }
    await page.getByRole("button", { name: "关闭履历", exact: true }).click();
    for (const [desktopLabel, mobileLabel, selector, closeLabel] of [
      [/^打开公告/, "公告", ".announcement-modal", "关闭公告窗口"],
      [/^打开邮箱/, "邮箱", ".mailbox-modal", "关闭邮箱"],
      ["打开设置", "设置", ".settings-modal", "关闭设置"],
      ["打开留言板", "留言", ".message-board-modal", null]
    ]) {
      if (viewport.width < 768) {
        await page.getByRole("button", { name: "打开首页菜单", exact: true }).click();
        await page.locator(".home-mobile-menu-panel").getByRole("button", { name: new RegExp(`^${mobileLabel}`) }).click();
      } else await page.getByRole("button", { name: desktopLabel, exact: typeof desktopLabel === "string" }).click();
      const window = page.locator(selector);
      await expect(window).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      if (closeLabel) await window.getByRole("button", { name: closeLabel, exact: true }).click();
      else await window.locator(".close-button").click();
      await expect(window).toHaveCount(0);
    }
    expect(errors).toEqual([]);
    expect(failedApi).toEqual([]);
    await page.screenshot({ path: test.info().outputPath("player-windows-returned-home.png") });
  });

  test(`real registration form and both onboarding skips persist at ${viewport.width}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("textbox", { name: /用户名/ })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "注册", exact: true }).click();
    const username = `ui${Date.now().toString(36).slice(-6)}`;
    await page.locator("#auth-username").fill(username);
    await page.locator("#auth-password").fill("pwpass12");
    await page.locator("#auth-confirm-password").fill("pwpass12");
    const registered = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/auth/register"
      && response.request().method() === "POST");
    await page.getByRole("button", { name: "登记入部信息", exact: true }).click();
    const response = await registered;
    expect(response.status()).toBe(200);
    const auth = await response.json();
    await page.getByRole("button", { name: "快进并跳过引导", exact: true }).waitFor({ timeout: 45_000 });
    await page.getByRole("button", { name: "快进并跳过引导", exact: true }).click();
    await page.getByRole("button", { name: "确认跳过", exact: true }).click();
    await page.getByRole("dialog", { name: "主界面引导" }).getByRole("button", { name: "跳过引导", exact: true }).click();
    await expect(page.getByRole("button", { name: "部员手册", exact: true })).toBeVisible();
    await expect.poll(async () => (await api(page.request, auth, "GET", "/api/home-onboarding")).status).toBe("skipped");
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "部员手册", exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("dialog", { name: "主界面引导" })).toHaveCount(0);
    await api(page.request, auth, "POST", "/api/auth/logout", {});
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("textbox", { name: /用户名/ })).toBeVisible({ timeout: 30_000 });
  });
}
