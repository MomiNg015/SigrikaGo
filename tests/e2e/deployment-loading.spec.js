import { test, expect } from "@playwright/test";
for (const width of [1440, 390, 320]) {
  test(`theme rows and tutorial spotlight at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/api/skill-traits", route => route.fulfill({ json: { traits: [] } }));
    await page.goto("/tests/e2e/fixtures/interface-polish.html?surface=settings");
    await page.getByRole("tab", { name: "界面" }).click();
    await page.evaluate(() => document.fonts.ready);
    const rows = await page.locator(".theme-choice-button").evaluateAll(buttons => buttons.map(button => {
      const rect = button.getBoundingClientRect(), label = button.querySelector("strong");
      return { x: button.offsetLeft, y: rect.y, bottom: rect.bottom, wraps: label.scrollWidth > label.clientWidth, whiteSpace: getComputedStyle(label).whiteSpace };
    }));
    expect(rows).toHaveLength(3);
    expect(rows.every(row => Math.abs(row.x - rows[0].x) <= 5 && !row.wraps), JSON.stringify(rows)).toBe(true);
    expect(rows[1].y).toBeGreaterThanOrEqual(rows[0].bottom);
    expect(rows[2].y).toBeGreaterThanOrEqual(rows[1].bottom);
    await page.screenshot({ path: testInfo.outputPath(`settings-${width}.png`) });
    await page.goto("/tests/e2e/fixtures/interface-polish.html?surface=tutorial");
    const overlay = page.locator(".tutorial-input-focus");
    await expect(overlay).toHaveCount(0);
    await expect(page.locator(".tutorial-choice-backdrop")).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`tutorial-${width}.png`) });
    await page.getByRole("button", { name: "准备落子" }).click();
    await expect(overlay).toHaveAttribute("data-focus-mode", "board");
    await expect(overlay.locator("mask path[fill=black]")).toHaveCount(1);
    expect(await overlay.evaluate(el => getComputedStyle(el).pointerEvents)).toBe("none");
    await expect(overlay.locator("rect[fill-opacity]")).toHaveAttribute("fill-opacity", "0.2");
    await page.locator('.point[data-point-id="2,2"]').click();
    await expect(page.getByRole("button", { name: "继续", exact: true })).toBeVisible();
    await expect(overlay).toHaveCount(0);
  });
}

test("cold resource gate waits for home art and decodes IRIS and character audio before playback", async ({ page }) => {
  await page.route("**/api/skill-traits", route => route.fulfill({ json: { traits: [] } }));
  let releaseImage;
  const heldImage = new Promise(resolve => { releaseImage = resolve; });
  await page.route("**/assets/home/student-id-hanging.png", async route => { await heldImage; await route.continue(); });
  const audioRequests = [];
  page.on("request", request => { if (request.url().endsWith(".ogg")) audioRequests.push(request.url()); });
  await page.goto("/tests/e2e/fixtures/interface-polish.html?surface=settings");
  await page.evaluate(async () => {
    const { loginPreloadAssets, preloadLoginAssets } = await import("/src/shared/preloadAssets.js");
    const { CHARACTERS } = await import("/src/shared/characters.js");
    window.__readiness = "loading";
    const assets = loginPreloadAssets({ characters: { sigrika: CHARACTERS.sigrika }, user: { selectedCharacter: "sigrika", ownedCharacters: ["sigrika"] }, tracks: {} });
    window.__readyVoice = assets.voiceAudio[0];
    window.__preload = preloadLoginAssets(assets, { requireComplete: true }).then(() => { window.__readiness = "ready"; }, error => { window.__readiness = JSON.stringify(error.assets); });
  });
  await expect.poll(() => audioRequests.some(url => url.endsWith("ui_iris_database_open.ogg"))).toBe(true);
  expect(await page.evaluate(() => window.__readiness)).toBe("loading");
  releaseImage();
  await expect.poll(() => page.evaluate(() => window.__readiness), { timeout: 30000 }).toBe("ready");
  const before = audioRequests.length;
  await page.getByRole("tab", { name: "界面" }).click();
  await page.evaluate(async () => {
    const { playUiIrisDatabaseOpenSound, playPreloadedVoiceSound } = await import("/src/audio/playback.jsx");
    playUiIrisDatabaseOpenSound({ master: 1, sfx: 1, voice: 1 });
    playPreloadedVoiceSound(window.__readyVoice, { master: 1, sfx: 1, voice: 1 });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  expect(audioRequests.length).toBe(before);
});

test("tutorial setup stays covered beyond its minimum time until required assets are ready", async ({ page }) => {
  await page.route("**/api/skill-traits", route => route.fulfill({ json: { traits: [] } }));
  let release;
  const hold = new Promise(resolve => { release = resolve; });
  await page.route("**/assets/effects/sigrika-erased-field-marker.webp", async route => { await hold; await route.continue(); });
  await page.goto("/tests/e2e/fixtures/interface-polish.html?surface=tutorial&setup");
  await expect(page.locator(".tutorial-battle-preload-overlay")).toBeVisible();
  // Cross the authored three-second minimum while a required image is still pending.
  await page.waitForTimeout(3200);
  await expect(page.locator(".tutorial-battle-preload-overlay")).toBeVisible();
  await expect(page.getByRole("button", { name: "准备落子" })).toHaveCount(0);
  release();
  await expect(page.getByRole("button", { name: "准备落子" })).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".tutorial-battle-preload-overlay")).toHaveCount(0);
});
