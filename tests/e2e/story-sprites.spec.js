import { expect, test } from "@playwright/test";
import { ADMIN_DEFAULT_CONFIG } from "../../server/adminDefaultSnapshot.js";

const source = JSON.parse(ADMIN_DEFAULT_CONFIG.storyScripts.find((entry) => entry.key === "onboarding.default").publishedNodesJson);
const denia = source.find((node) => node.type === "story" && node.characterId === "denia");
const npc = source.find((node) => node.type === "npc-dialogue" && node.characterId === "denia");
const url = (node = "node-1") => `/tests/e2e/fixtures/story-sprites.html?instant=1&node=${encodeURIComponent(node)}`;

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 640 }]) {
  test(`standard story layout and original dialogue ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url(), { waitUntil: "domcontentloaded" });
    const portrait = page.locator(".onboarding-story-portrait");
    const image = portrait.locator("img");
    await expect(image).toHaveAttribute("src", /sigrika\/surprised\.webp$/);
    await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth)).toBe(832);
    const originalCrop = await portrait.boundingBox();
    const originalImage = await image.boundingBox();
    await expect(page.getByRole("button", { name: "剧情对话文本" })).toContainText(source[0].text.replaceAll("{username}", "新同学"));
    await page.getByRole("button", { name: "你怎么知道的？", exact: true }).click();
    await expect(image).toHaveAttribute("src", /closed_smile\.webp$/);
    await expect(portrait).toHaveAttribute("data-story-node-id", "node-2");
    expect(await portrait.boundingBox()).toEqual(originalCrop);
    expect(await image.boundingBox()).toEqual(originalImage);
    expect(await page.locator(".onboarding-story-modal").evaluate((element) => element.scrollTop)).toBe(0);
    const boxes = await page.locator(".onboarding-story-modal").evaluate((element) => [element, element.querySelector(".onboarding-story-portrait"), element.querySelector(".onboarding-story-text-button"), element.querySelector("footer")].map((entry) => entry.getBoundingClientRect().toJSON()));
    for (const box of boxes) {
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(viewport.width);
      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.bottom).toBeLessThanOrEqual(viewport.height);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await page.goto(url("node-4-1"), { waitUntil: "domcontentloaded" });
    const text = page.getByRole("button", { name: "剧情对话文本" });
    await expect(text).toContainText("最后根据所采用的规则");
    expect(await portrait.boundingBox()).toEqual(originalCrop);
    expect(await image.boundingBox()).toEqual(originalImage);
    await expect.poll(() => text.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
    await text.press("End");
    await expect.poll(() => text.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    expect(await page.locator(".onboarding-story-modal").evaluate((element) => element.scrollTop)).toBe(0);
    expect(await portrait.boundingBox()).toEqual(originalCrop);
    await expect(page.getByRole("button", { name: "...", exact: true })).toBeVisible();
    await page.goto(url("node-3"), { waitUntil: "domcontentloaded" });
    await expect(page.locator(".onboarding-story-options button")).toHaveCount(3);
    expect(await portrait.boundingBox()).toEqual(originalCrop);
    expect(await image.boundingBox()).toEqual(originalImage);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("Denia story uses full art and teaching NPC uses a fixed avatar", async ({ page }) => {
  await page.route("**/api/skill-traits", (route) => route.fulfill({ json: { traits: [] } }));
  await page.goto(url(denia.id), { waitUntil: "domcontentloaded" });
  await expect(page.locator(".onboarding-story-portrait img")).toHaveAttribute("src", /denia\/.*(?<!-avatar)\.webp$/);
  await expect(page.getByRole("button", { name: "剧情对话文本" })).toContainText(denia.text);
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto(url(npc.id) + "&battle=1", { waitUntil: "domcontentloaded" });
  const bubble = page.locator(".tutorial-battle-dialogue");
  await expect(bubble.locator("img")).toHaveAttribute("src", /denia\/.*-avatar\.webp$/);
  await expect.poll(() => bubble.locator("img").evaluate((element) => element.complete && element.naturalWidth)).toBe(256);
  await expect(bubble.locator(".tutorial-npc-portrait-slot")).toHaveCSS("width", "88px");
  await expect(bubble.locator(".tutorial-npc-portrait-slot")).toHaveCSS("height", "88px");
  await expect(bubble).toContainText(npc.speakerName || "达妮娅");
});

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 640 }]) {
  test(`NPC square avatar stays at the bubble top ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.route("**/api/skill-traits", (route) => route.fulfill({ json: { traits: [] } }));
    for (const id of ["doc-liberty-intro", "doc-liberty-right-top"]) {
      await page.goto(url(id) + "&battle=1", { waitUntil: "domcontentloaded" });
      const bubble = page.locator(".tutorial-battle-dialogue");
      const frame = bubble.locator(".standard-npc-sprite");
      const image = frame.locator("img");
      await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth)).toBe(256);
      await expect.poll(() => bubble.evaluate((element) => getComputedStyle(element).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
      const a = await bubble.boundingBox();
      const b = await frame.boundingBox();
      const text = await bubble.locator("p").boundingBox();
      const artwork = await image.boundingBox();
      expect(Math.abs(a.y - b.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(a.x - b.x)).toBeLessThanOrEqual(1);
      expect(b.width).toBe(viewport.width > 900 ? 88 : 76);
      expect(b.height).toBe(b.width);
      expect(text.x - b.x - b.width).toBeGreaterThanOrEqual(10);
      expect(artwork.height).toBeLessThan(b.height);
      await expect(frame).toHaveCSS("overflow", "hidden");
      await page.screenshot({ path: testInfo.outputPath(`${id}.png`) });
      const geometry = await frame.evaluate((element) => {
        const bubble = element.closest(".tutorial-battle-dialogue");
        const board = document.querySelector(".board-stage");
        const rectangles = () => [bubble, board].map((entry) => entry.getBoundingClientRect().toJSON());
        const before = rectangles();
        element.style.visibility = "hidden";
        return { before, after: rectangles() };
      });
      expect(geometry.after).toEqual(geometry.before);
    }
  });
}

test.describe("animated NPC avatar stability", () => {
  test.use({ reducedMotion: "no-preference" });
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 640 }]) {
    test(`typing grows text without moving the avatar ${viewport.width}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.route("**/api/skill-traits", route => route.fulfill({ json: { traits: [] } }));
      await page.clock.install();
      await page.clock.pauseAt(new Date());
      await page.goto(url("doc-life-1") + "&battle=1", { waitUntil: "domcontentloaded" });
      const bubble = page.locator(".tutorial-battle-dialogue");
      const frame = bubble.locator(".tutorial-npc-portrait-frame");
      await expect.poll(() => frame.locator("img").evaluate(el => el.complete && el.naturalWidth), { timeout: 15000 }).toBe(256);
      await page.evaluate(() => document.fonts.ready);
      await page.clock.runFor(400);
      await expect.poll(() => bubble.evaluate(el => getComputedStyle(el).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
      const startFrame = await frame.boundingBox();
      const startText = await bubble.locator(".tutorial-npc-copy").boundingBox();
      const firstLength = await bubble.locator("p").evaluate(el => el.textContent.length);
      await page.clock.runFor(1600);
      expect(await frame.boundingBox()).toEqual(startFrame);
      expect(await bubble.locator("p").evaluate(el => el.textContent.length)).toBeGreaterThan(firstLength);
      const endText = await bubble.locator(".tutorial-npc-copy").boundingBox();
      expect(endText.height).toBeGreaterThan(startText.height);
      expect(endText.y).toBe(startText.y);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath("typing.png") });
    });
  }
});
