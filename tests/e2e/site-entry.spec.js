import { expect, test } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
import { CHARACTERS } from "../../src/shared/characters.js";

const image = readFileSync("public/assets/preload/orange-mascot.png");

async function publicApi(page) {
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/refresh") {
      await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "未登录" }) });
      return;
    }
    const data = path === "/api/characters"
      ? { characters: [{ id: "entry-test", name: "测试角色", portrait: "/entry-test.webp" }] }
      : path === "/api/site-settings" ? { settings: { preloadTips: "进站已准备的提示语" } }
        : {};
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(data) });
  });
}

for (const width of [1440, 390, 360]) {
  test(`entry shell waits for public artwork before login at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await publicApi(page);
    let release;
    const hold = new Promise(resolve => { release = resolve; });
    let requested = false;
    const requests = new Set();
    page.on("request", request => requests.add(new URL(request.url()).pathname));
    await page.route("**/entry-test.webp", async route => {
      requested = true;
      await hold;
      await route.fulfill({ contentType: "image/png", body: image });
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect.poll(() => requested).toBe(true);
    await expect(page.getByRole("progressbar", { name: "进站资源加载进度" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /用户名/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "刷新重试" })).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const track = page.locator("[data-entry-track]");
    const bounds = await track.boundingBox();
    expect(bounds.width).toBeLessThanOrEqual(width - 40);
    expect(await page.locator("[data-entry-fill]").evaluate(el => parseFloat(getComputedStyle(el).transitionDuration))).toBeLessThanOrEqual(0.001);
    mkdirSync(".codex-run/site-entry", { recursive: true });
    await page.screenshot({ path: `.codex-run/site-entry/loading-${width}.png` });
    release();
    await expect(page.getByRole("textbox", { name: /用户名/ })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("[data-site-entry]")).toHaveCount(0);
    expect(requests.has(CHARACTERS.baconbits.portrait)).toBe(true);
    expect(requests.has("/assets/login-sigrika-mascot.webp")).toBe(true);
    expect(requests.has("/assets/preload/orange-mascot.png")).toBe(true);
    await page.screenshot({ path: `.codex-run/site-entry/login-${width}.png` });
  });
}

test("first HTML paint is usable before the application scripts download", async ({ page }) => {
  let release;
  const hold = new Promise(resolve => { release = resolve; });
  await page.route(/\/assets\/.*\.js$/, async route => { await hold; await route.continue(); });
  await page.goto("/", { waitUntil: "commit" });
  await expect(page.getByRole("progressbar", { name: "进站资源加载进度" })).toBeVisible();
  await expect(page.locator("[data-entry-percent]")).toHaveText("0%");
  expect(await page.locator("[data-site-entry]").evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(255, 251, 242)");
  release();
});

test("an unavailable portrait does not block login", async ({ page }) => {
  await publicApi(page);
  await page.route("**/entry-test.webp", route => route.abort());
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("textbox", { name: /用户名/ })).toBeVisible({ timeout: 20_000 });
});

test("session refresh keeps its cookie and starts after the public resource gate", async ({ page, context }) => {
  await context.addCookies([{ name: "entry-session-check", value: "preserved", url: "http://127.0.0.1:5291" }]);
  await publicApi(page);
  let refreshCookie;
  await page.route("**/api/auth/refresh", async route => {
    refreshCookie = route.request().headers().cookie;
    await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "未登录" }) });
  });
  let release;
  const hold = new Promise(resolve => { release = resolve; });
  let requested = false;
  await page.route("**/entry-test.webp", async route => {
    requested = true;
    await hold;
    await route.fulfill({ contentType: "image/png", body: image });
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect.poll(() => requested).toBe(true);
  expect(refreshCookie).toBeUndefined();
  release();
  await expect.poll(() => refreshCookie).toContain("entry-session-check=preserved");
  expect((await context.cookies()).find(cookie => cookie.name === "entry-session-check")?.value).toBe("preserved");
});
