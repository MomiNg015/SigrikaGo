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

test("Denia story and teaching NPC use full expressions with the original NPC grid slot", async ({ page }) => {
  await page.route("**/api/skill-traits", (route) => route.fulfill({ json: { traits: [] } }));
  await page.goto(url(denia.id), { waitUntil: "domcontentloaded" });
  await expect(page.locator(".onboarding-story-portrait img")).toHaveAttribute("src", /denia\/.*(?<!-avatar)\.webp$/);
  await expect(page.getByRole("button", { name: "剧情对话文本" })).toContainText(denia.text);
  await page.goto(url(npc.id) + "&battle=1", { waitUntil: "domcontentloaded" });
  const bubble = page.locator(".tutorial-battle-dialogue");
  await expect(bubble.locator("img")).toHaveAttribute("src", /denia\/.*(?<!-avatar)\.webp$/);
  await expect.poll(() => bubble.locator("img").evaluate((element) => element.complete && element.naturalWidth)).toBe(832);
  await expect(bubble.locator(".tutorial-npc-portrait-slot")).toHaveCSS("width", "68px");
  await expect(bubble.locator(".tutorial-npc-portrait-slot")).toHaveCSS("height", "68px");
  await expect(bubble).toContainText(npc.speakerName || "达妮娅");
});
