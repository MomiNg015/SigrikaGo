import { expect, test } from "@playwright/test";
import { mockWindowData, settleWindow } from "./window-surfaces-fixture.js";

for (const width of [1440, 390, 320]) {
  test(`empty warehouse keeps the box and disables opening an empty list at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await mockWindowData(page);
    await page.route("**/api/items/inventory", route => route.fulfill({ json: { items: [] } }));
    await page.goto("/tests/e2e/fixtures/window-surfaces.html?surface=Warehouse");
    await expect(page.getByText("暂无道具", { exact: true })).toBeVisible();
    await settleWindow(page);
    const shell = page.locator(".warehouse-modal");
    await expect(shell).toHaveCSS("background-image", /warehouse-box-overhead/);
    await expect(page.getByRole("button", { name: "展开持有详情" })).toBeDisabled();
    await expect(page.locator(".wg-loot,.wg-inspector,.wg-use")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({ path: testInfo.outputPath(`empty-warehouse-${width}.png`), fullPage: true });
  });

  test(`team picker starts matchmaking with the chosen order at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/tests/e2e/fixtures/team-match.html?surface=modes");
    await page.getByRole("button", { name: "星炬对弈", exact: true }).last().click();
    await page.getByRole("button", { name: "队际赛选择角色2", exact: true }).click();
    const start = page.getByRole("button", { name: "开始队际赛匹配", exact: true });
    await expect(start).toBeDisabled();
    for (const name of ["娜波摩", "西格莉卡", "爱弥斯"]) await page.getByRole("button", { name, exact: true }).click();
    await expect(start).toBeEnabled();
    await settleWindow(page);
    expect(await page.evaluate(() => window.matchSelection)).toBeUndefined();
    const buttonBox = await start.boundingBox();
    expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(width);
    expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(900);
    await page.screenshot({ path: testInfo.outputPath(`team-start-${width}.png`), fullPage: true });
    await start.click();
    await expect(page.getByRole("dialog", { name: "队际赛阵容" })).toHaveCount(0);
    expect(await page.evaluate(() => window.matchSelection)).toEqual({ mode: "team", lineup: ["nabomo", "sigrika", "aemeath"], characterId: undefined });
  });

  test(`match success uses green paper while special matches retain their styling at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/tests/e2e/fixtures/window-surfaces.html?surface=MatchSuccess");
    const card = page.locator(".match-success-modal");
    await settleWindow(page);
    const green = await card.evaluate(element => {
      const probe = document.createElement("span");
      probe.style.backgroundColor = "var(--campus-button-success)";
      element.append(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    });
    await expect(card).toHaveCSS("background-color", green);
    expect(await card.evaluate(element => getComputedStyle(element).backgroundImage)).toContain("linear-gradient");
    await page.screenshot({ path: testInfo.outputPath(`match-success-${width}.png`), fullPage: true });
    await page.goto("/tests/e2e/fixtures/window-surfaces.html?surface=MatchSuccess&special&corrupt");
    await expect(card).toHaveClass(/sigrika-corruption-match-modal/);
    expect(await card.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(green);
  });
}
