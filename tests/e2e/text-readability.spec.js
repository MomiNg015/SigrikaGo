import { expect, test } from "@playwright/test";
import { mockWindowData, settleWindow } from "./window-surfaces-fixture.js";

const denseText = "翻阅详细资料时，缠绕交错的繁复笔画也应该清晰可辨。请确认技能触发条件、棋盘边缘的落子限制，以及对局结束后的奖励说明。";

async function expectReadable(locator) {
  await expect(locator).toBeVisible();
  const styles = await locator.evaluate(element => {
    const style = getComputedStyle(element);
    return { weight: style.fontWeight, synthesis: style.fontSynthesisWeight, size: parseFloat(style.fontSize), leading: parseFloat(style.lineHeight), tracking: parseFloat(style.letterSpacing) };
  });
  expect(styles.weight).toBe("400");
  expect(styles.synthesis).toBe("none");
  expect(styles.size).toBeGreaterThanOrEqual(16);
  expect(styles.leading / styles.size).toBeCloseTo(1.65, 2);
  expect(styles.tracking / styles.size).toBeCloseTo(0.025, 3);
}

for (const width of [1440, 390, 320]) {
  test(`dense prose stays readable and scrollable at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mockWindowData(page);
    await page.route("**/api/skill-traits", route => route.fulfill({ json: { traits: [{ id: "sprint", name: "疾走", definition: denseText }] } }));
    await page.goto("/tests/e2e/fixtures/window-surfaces.html?surface=House");
    await page.locator(".handbook-puzzle-tile").first().click();
    await settleWindow(page);
    const skill = page.locator(".character-detail-copy .skill-description-body").first();
    await expectReadable(skill);
    await expectReadable(skill.locator("span").first());
    const trait = skill.locator(".skill-trait-token").first();
    await expectReadable(trait);
    await trait.click();
    await expectReadable(page.locator(".skill-trait-popover p").first());
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({ path: testInfo.outputPath(`skill-${width}.png`), fullPage: true });

    await page.route("**/api/items/inventory", route => route.fulfill({ json: { items: [{ itemId: "candy", name: "彩虹糖", quantity: 3, description: denseText.repeat(12), type: "consumable", imageUrl: "/assets/items/rainbow-candy.webp" }] } }));
    await page.goto("/tests/e2e/fixtures/window-surfaces.html?surface=Warehouse");
    const description = page.locator(".wg-details > p");
    await expectReadable(description);
    await settleWindow(page);
    const details = page.locator(".wg-details");
    expect(await details.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
    await details.evaluate(element => { element.scrollTop = element.scrollHeight; });
    expect(await details.evaluate(element => element.scrollHeight - element.scrollTop - element.clientHeight)).toBeLessThanOrEqual(1);
    await expect(page.locator(".wg-use")).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({ path: testInfo.outputPath(`warehouse-${width}.png`), fullPage: true });

    const entry = { id: "readability", title: "长文本阅读检查", body: `${denseText}\n\n**复杂笔画仍然可辨**，${denseText.repeat(3)}\n\n- ${denseText}\n\n${denseText.repeat(8)}\n\n阅读结束。`, firstPublishedAt: "2026-10-21T00:00:00Z", isUnread: false };
    await page.route("**/api/announcements**", route => route.fulfill({ json: { items: [entry], entry, hasMore: false, summary: {} } }));
    await page.goto("/tests/e2e/fixtures/window-surfaces.html?surface=Announcements");
    await page.locator(".announcement-list-item").first().click();
    const prose = page.locator(".information-center-prose");
    await expectReadable(prose.locator("p").first());
    await expectReadable(prose.locator("strong").first());
    await expectReadable(prose.locator("li").first());
    await prose.getByText("阅读结束。", { exact: true }).scrollIntoViewIfNeeded();
    await expect(prose.getByText("阅读结束。", { exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({ path: testInfo.outputPath(`announcement-${width}.png`), fullPage: true });
  });
}
