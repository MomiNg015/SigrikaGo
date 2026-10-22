import { expect, test } from "@playwright/test";
import { settleWindow } from "./window-surfaces-fixture.js";

const initialFriends = ["sigrika", "denia", "qiuyuan", "lynae", "chisa", "mornye", "aemeath"].map((characterId, index) => ({
  id: `friend-${index}`, characterId,
  username: ["小满", "晚风", "秋日来信", "WWWWWWWW", "千咲", "午后", "远航星"][index],
  status: index < 2 ? "online" : index === 2 ? "playing" : "offline"
}));

for (const [width, height] of [[1440, 900], [800, 800], [390, 844], [360, 800], [320, 740], [390, 600]]) {
  test(`companion preserves left bookmarks and reachable actions at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    let friends = [...initialFriends];
    await page.route("**/api/**", route => {
      const path = new URL(route.request().url()).pathname;
      if (!path.startsWith("/api/")) return route.continue();
      if (route.request().method() === "DELETE") friends = friends.filter(row => !path.endsWith(row.id));
      return route.fulfill({ json: { friends, blacklist: [] } });
    });
    await page.goto("/tests/e2e/fixtures/window-surfaces.html?surface=Friends");
    await page.locator(".fc-detail").waitFor();
    await settleWindow(page);
    const shell = page.locator(".friends-companion-window");
    const rail = shell.locator(":scope > .window-bookmark-rail");
    await expect(rail).toHaveAttribute("aria-orientation", "vertical");
    const bounds = await shell.boundingBox();
    const railBounds = await rail.boundingBox();
    expect(railBounds.x).toBeGreaterThanOrEqual(0);
    expect(railBounds.x + railBounds.width).toBeLessThanOrEqual(bounds.x + 4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const roster = await page.locator(".fc-roster").boundingBox();
    const detail = await page.locator(".fc-detail").boundingBox();
    if (width > 768) expect(detail.x).toBeGreaterThan(roster.x + roster.width);
    else expect(detail.y).toBeGreaterThanOrEqual(roster.y + roster.height);
    const actions = await page.locator(".fc-actions").boundingBox();
    expect(actions.y + actions.height + 4).toBeLessThanOrEqual(bounds.y + bounds.height);
    const last = page.locator(".fc-person").last();
    await last.scrollIntoViewIfNeeded();
    const lastBounds = await last.boundingBox();
    expect(lastBounds.x + lastBounds.width + 4).toBeLessThanOrEqual(roster.x + roster.width);
    expect(lastBounds.y + lastBounds.height + 4).toBeLessThanOrEqual(roster.y + roster.height);
    await last.click();
    await expect(page.getByRole("button", { name: "对局申请" })).toBeDisabled();
    await expect(page.locator(".fc-detail")).toHaveAttribute("aria-label", "远航星的操作");
    await expect(page.locator(".fc-portrait-full")).toHaveAttribute("src", /aemeath\.webp$/);
    await rail.getByRole("tab", { name: "黑名单" }).click();
    await expect(page.getByText("暂无黑名单", { exact: true })).toBeVisible();
    await expect(page.locator(".fc-detail")).toHaveCount(0);
    await rail.getByRole("tab", { name: "黑名单" }).press("ArrowUp");
    await expect(rail.getByRole("tab", { name: "好友", exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".fc-detail")).toHaveAttribute("aria-label", "远航星的操作");
    await page.getByRole("button", { name: "选择 小满，在线" }).click();
    await page.getByRole("button", { name: "对局申请", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "选择对弈模式" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "对局申请", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "解除好友", exact: true }).click();
    await page.getByRole("dialog", { name: "解除好友" }).getByRole("button", { name: "确定" }).click();
    await expect(page.locator(".fc-detail")).toHaveAttribute("aria-label", "晚风的操作");
    await page.screenshot({ path: `docs/design-samples/friends-window-2026-10-22/production-${width}x${height}.png` });
    expect(errors).toEqual([]);
  });
}

test("paper card depth follows hover and press and respects reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/api/**", route => new URL(route.request().url()).pathname.startsWith("/api/") ? route.fulfill({ json: { friends: initialFriends, blacklist: [] } }) : route.continue());
  await page.goto("/tests/e2e/fixtures/window-surfaces.html?surface=Friends");
  const first = page.locator(".fc-person").first();
  await first.waitFor();
  await settleWindow(page);
  const resting = await first.evaluate(el => ({ shadow: getComputedStyle(el).boxShadow, translate: getComputedStyle(el).translate }));
  expect(resting.shadow).not.toBe("none");
  await first.hover();
  await expect.poll(() => first.evaluate(el => getComputedStyle(el).translate)).toBe("-1px -2px");
  await page.mouse.down();
  await expect.poll(() => first.evaluate(el => getComputedStyle(el).translate)).toBe("2px 3px");
  await page.mouse.up();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => first.evaluate(el => getComputedStyle(el).transitionProperty)).toBe("none");
});
