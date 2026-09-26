import { expect, test } from "@playwright/test";

test.afterEach(async ({ page }, info) => {
  if (info.status === info.expectedStatus) return;
  const state = await page.evaluate(() => ({ room: window.practiceTest?.room,
    errors: window.practiceTest?.errors, visibility: document.visibilityState })).catch(() => null);
  await info.attach("practice-state", { body: JSON.stringify(state, null, 2), contentType: "application/json" });
});

for (const options of [
  { difficulty: "beginner", playerColor: "white" },
  { difficulty: "intermediate", playerColor: "white" },
  { difficulty: "advanced", playerColor: "white", challenge: "capture-challenge" }
]) {
  test(`browser engine plays and resumes ${options.challenge ?? options.difficulty}`, async ({ page, request }) => {
    const response = await request.post("/api/auth/register", { data: { username: `lp${Date.now().toString(36).slice(-6)}`, password: "pwpass12" } });
    expect(response.ok(), await response.text()).toBe(true);
    const { token } = await response.json();
    const browserErrors = [];
    const downloads = [];
    page.on("pageerror", (error) => { browserErrors.push(error.message); });
    page.on("request", (request) => { if (request.url().includes("/engines/")) downloads.push(request.url()); });
    await page.goto("/tests/e2e/fixtures/local-practice.html");
    await page.evaluate((token) => window.practiceTest.connect(token), token);
    await page.evaluate((options) => window.practiceTest.start(options), options);
    await expect.poll(() => page.evaluate(() => ({ move: window.practiceTest.room?.game.moveNumber,
      errors: window.practiceTest.errors, visibility: document.visibilityState })))
      .toMatchObject({ move: 1, errors: [], visibility: "visible" });
    expect(await page.evaluate(() => window.practiceTest.room.practice.engineBackend)).toBe("browser");
    expect(await page.evaluate(() => window.practiceTest.move())).toMatchObject({ ok: true });
    await expect.poll(() => page.evaluate(() => window.practiceTest.room?.game.moveNumber)).toBe(3);
    const code = await page.evaluate(() => window.practiceTest.room.code);
    await page.reload();
    await expect.poll(() => page.evaluate(() => window.practiceTest?.room?.code)).toBe(code);
    expect(await page.evaluate(() => window.practiceTest.move())).toMatchObject({ ok: true });
    await expect.poll(() => page.evaluate(() => window.practiceTest.room?.game.moveNumber)).toBe(5);
    expect(await page.evaluate(() => window.practiceTest.errors)).toEqual([]);
    expect(browserErrors).toEqual([]);
    await expect(page.locator("vite-error-overlay")).toHaveCount(0);
    if (options.difficulty === "beginner") expect(downloads).toEqual([]);
  });
}

test("failed WASM download prevents admission and a fresh attempt recovers", async ({ page, request }) => {
  const response = await request.post("/api/auth/register", { data: { username: `lf${Date.now().toString(36).slice(-6)}`, password: "pwpass12" } });
  expect(response.ok(), await response.text()).toBe(true);
  const { token } = await response.json();
  await page.route("**/engines/**", (route) => route.abort());
  await page.goto("/tests/e2e/fixtures/local-practice.html");
  await page.evaluate((token) => window.practiceTest.connect(token), token);
  await page.evaluate(() => window.practiceTest.start({ difficulty: "advanced", playerColor: "white" }));
  expect(await page.evaluate(() => window.practiceTest.room)).toBeNull();
  expect(await page.evaluate(() => window.practiceTest.errors.length)).toBe(1);
  await page.unroute("**/engines/**");
  await page.evaluate(() => { window.practiceTest.errors.length = 0; });
  await page.evaluate(() => window.practiceTest.start({ difficulty: "advanced", playerColor: "white" }));
  await expect.poll(() => page.evaluate(() => window.practiceTest.room?.game.moveNumber)).toBe(1);
  expect(await page.evaluate(() => window.practiceTest.errors)).toEqual([]);
});
