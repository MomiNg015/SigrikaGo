import { expect, test } from "@playwright/test";
import { VERIFICATION_CHALLENGE_ANSWER } from "../../server/authChallenges.js";

test("register refresh and logout maintain the browser refresh-cookie session", async ({ request }) => {
  const username = `e2e${Date.now().toString(36).slice(-5)}`;
  const password = "pwpass12";

  const register = await request.post("/api/auth/register", {
    data: { username, password }
  });
  expect(register.status()).toBe(200);
  const registered = await register.json();
  expect(registered.token).toBeTruthy();
  expect(registered.user.username).toBe(username);

  const refresh = await request.post("/api/auth/refresh");
  expect(refresh.status()).toBe(200);
  const refreshed = await refresh.json();
  expect(refreshed.token).toBeTruthy();
  expect(refreshed.user.username).toBe(username);

  const logout = await request.post("/api/auth/logout", {
    headers: { Authorization: `Bearer ${refreshed.token}` }
  });
  expect(logout.status()).toBe(200);

  const refreshAfterLogout = await request.post("/api/auth/refresh");
  expect(refreshAfterLogout.status()).toBe(401);
});

for (const width of [1440, 390, 320]) {
  test(`registration image challenge refresh and submission at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.setExtraHTTPHeaders({ "x-stability-scope": `captcha-${width}` });
    await page.goto("/");
    await page.getByRole("button", { name: "注册", exact: true }).click();
    const image = page.getByAltText("验证码，点击换一张");
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((img) => img.naturalWidth)).toBe(210);
    await page.locator("#auth-username").fill(`c${width}${Date.now().toString(36).slice(-3)}`.slice(0, 8));
    await page.locator("#auth-password").fill("password123");
    await page.locator("#auth-confirm-password").fill("password123");
    await page.locator("#auth-challenge-answer").fill("AAAAAA");
    const rejected = page.waitForResponse((r) => r.url().endsWith("/api/auth/register"));
    const refreshed = page.waitForResponse((r) => r.url().includes("/api/auth/challenge?"));
    await page.getByRole("button", { name: "登记入部信息" }).click();
    expect((await rejected).status()).toBe(400);
    expect((await refreshed).status()).toBe(200);
    await expect(page.locator("#auth-challenge-answer")).toHaveValue("");
    await expect(image).toBeVisible();
    await page.locator("#auth-challenge-answer").fill(VERIFICATION_CHALLENGE_ANSWER);
    const frame = await page.locator(".auth-challenge-controls").boundingBox();
    expect(frame.x).toBeGreaterThanOrEqual(0);
    expect(frame.x + frame.width).toBeLessThanOrEqual(width);
    await page.screenshot({ path: testInfo.outputPath(`registration-${width}.png`), fullPage: true });
    const registered = page.waitForResponse((r) => r.url().endsWith("/api/auth/register"));
    await page.getByRole("button", { name: "登记入部信息" }).click();
    expect((await registered).status()).toBe(200);
    await expect(page.locator(".auth-screen")).toHaveCount(0);
  });
}
