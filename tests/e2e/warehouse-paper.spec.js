import { expect, test } from "@playwright/test";
import { settleWindow } from "./window-surfaces-fixture.js";

const preview = "/docs/design-samples/warehouse-paper-2026-10-22/production.html";

test("warehouse places the box before the items and honors reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(preview);
  const box = page.locator(".warehouse-box");
  const pile = box.locator(".wg-pile");
  await expect(pile.locator(".wg-loot")).toHaveCount(14);
  await expect(box).toHaveCSS("animation-name", "warehouse-box-settle");
  await expect(pile).toHaveCSS("animation-name", "warehouse-items-settle");
  const boxDuration = await box.evaluate(el => parseFloat(getComputedStyle(el).animationDuration));
  const pileDelay = await pile.evaluate(el => parseFloat(getComputedStyle(el).animationDelay));
  expect(boxDuration).toBeGreaterThan(0);
  expect(pileDelay).toBeGreaterThanOrEqual(boxDuration);
  await settleWindow(page);
  await expect(pile).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(box).toHaveCSS("animation-name", "none");
  await expect(pile).toHaveCSS("animation-name", "none");
  await expect(pile).toHaveCSS("opacity", "1");
});

async function largestCover(page) {
  return page.locator(".wg-loot").evaluateAll(buttons => {
    const bounds = buttons.map(button => button.getBoundingClientRect());
    return Math.max(0, ...bounds.map((box, index) => (
      bounds.filter((_, otherIndex) => otherIndex !== index).reduce((total, other) => total
        + Math.max(0, Math.min(box.right, other.right) - Math.max(box.left, other.left))
        * Math.max(0, Math.min(box.bottom, other.bottom) - Math.max(box.top, other.top)), 0)
      / (box.width * box.height)
    )));
  });
}
async function wholeCards(page) {
  await expect.poll(() => page.locator(".wg-list").evaluate(list => {
    const bounds = list.getBoundingClientRect();
    const visible = [...list.querySelectorAll(".wg-entry")].map(el => el.getBoundingClientRect()).filter(card => card.bottom > bounds.top + 1 && card.top < bounds.bottom - 1);
    return visible.length > 0 && visible.every(card => card.top >= bounds.top + 1 && card.bottom + 4 <= bounds.bottom + 1);
  })).toBe(true);
}

for (const [width, height] of [[1440, 900], [800, 900], [390, 844], [360, 800], [320, 740], [390, 600]]) {
  test(`warehouse box geometry and whole-card scrolling at ${width}x${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(preview);
    await expect(page.locator(".wg-loot")).toHaveCount(14);
    await settleWindow(page);
    expect(await largestCover(page)).toBeLessThanOrEqual(.20);
    await expect(page.locator(".wg-loot").first()).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    const shell = await page.locator(".warehouse-modal").boundingBox();
    const close = await page.getByRole("button", { name: "关闭仓库" }).boundingBox();
    expect(close.width).toBe(44);
    expect(close.height).toBe(44);
    expect(Math.abs(close.x + close.width - (shell.x + shell.width * .948))).toBeLessThan(2);
    expect(Math.abs(close.y - (shell.y + shell.height * .072))).toBeLessThan(2);
    await expect(page.locator(".wg-box-title img")).toBeVisible();
    await expect(page.locator(".wg-drawer-toggle .window-bookmark-paper")).toHaveCSS("scale", "-1 1");
    await expect(page.locator(".wg-drawer-toggle .window-bookmark-label")).toHaveCSS("writing-mode", "horizontal-tb");
    const bookmark = await page.locator(".wg-drawer-toggle .window-bookmark-paper").boundingBox();
    expect(Math.abs(bookmark.x + 1 - (shell.x + shell.width * .0435))).toBeLessThan(1);
    const posters = page.locator('.wg-loot[aria-label^="查看道具详情：招募海报"]');
    const placements = () => posters.evaluateAll(items => items.map(({ style }) => [style.left, style.top, parseFloat(style.getPropertyValue("--wg-angle"))]));
    const startingPlacements = await placements();
    expect(Math.max(...startingPlacements.map(([, , angle]) => angle)) - Math.min(...startingPlacements.map(([, , angle]) => angle))).toBeGreaterThan(180);
    if (width === 1440) {
      const loot = page.locator(".wg-loot").first();
      const art = loot.locator("img");
      const hitbox = await loot.boundingBox();
      await loot.hover();
      await expect(art).toHaveCSS("translate", "3px -7px");
      await expect(art).toHaveCSS("rotate", "8deg");
      expect(await loot.boundingBox()).toEqual(hitbox);
      await expect(loot.locator(".wg-loot-label")).toHaveCount(0);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(art).toHaveCSS("translate", "none");
      await expect(art).toHaveCSS("rotate", "none");
      await page.mouse.move(0, 0);
      await loot.focus();
      await expect(loot).toHaveCSS("z-index", "100");
    }
    await page.locator(".wg-loot").first().click();
    await expect(page.getByRole("dialog", { name: /道具详情/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "展开持有详情" }).click();
    await expect(page.getByText("目前已持有6种物品")).toBeVisible();
    await wholeCards(page);
    await page.locator(".wg-entry").first().click();
    const detail = await page.locator(".wg-inspector").boundingBox();
    expect(detail.x + detail.width + 4).toBeLessThanOrEqual(shell.x + shell.width);
    expect(detail.y + detail.height + 4).toBeLessThanOrEqual(shell.y + shell.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await expect(page.locator(".wg-filters,.wg-type,.wg-page-turn,.wg-directory-footer,.wg-hero-count")).toHaveCount(0);
    await expect(page.locator(".wg-orbit")).toBeVisible();
    expect(await page.locator(".wg-hero img").evaluate(el => getComputedStyle(el).transform)).not.toBe("none");
    expect(await page.locator(".wg-hero img").evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`box-detail-${width}x${height}.png`) });
    await page.keyboard.press("Escape");
    await page.locator(".wg-list").hover();await page.mouse.wheel(0,137);await page.mouse.move(0,0);
    await expect.poll(() => page.locator(".wg-list").evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    await wholeCards(page);
    await page.locator(".wg-entry").last().scrollIntoViewIfNeeded();await wholeCards(page);
    await page.locator(".wg-entry").last().click();
    await expect(page.getByRole("heading", { name: "金币袋" })).toBeVisible();
    await page.getByRole("button", { name: "使用：金币袋", exact: true }).click();
    expect(await placements()).toEqual(startingPlacements);
    await expect(page.locator(".wg-entry")).toHaveCount(5);
    await expect(page.getByText("目前已持有5种物品")).toBeVisible();
    await expect(page.getByRole("dialog", { name: /道具详情/ })).toHaveCount(0);
    await expect(page.locator(".wg-use")).toHaveCount(0);
    await page.mouse.move(0,0);await wholeCards(page);
    await page.getByRole("button", { name: "关闭仓库" }).click();
    await page.getByRole("button", { name: "打开仓库", exact: true }).click();
    await expect(posters).toHaveCount(5);
    expect(await placements()).not.toEqual(startingPlacements);
    await page.getByRole("button", { name: "展开持有详情" }).click();
    await expect(page.locator(".wg-entry")).toHaveCount(5);await wholeCards(page);
    expect(errors).toEqual([]);
  });
}

test("a nearly empty warehouse enlarges its item without changing the window", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const route = "**/api/items/inventory";
  const entry = { itemId: "bag", name: "金币袋", imageUrl: "/assets/items/gacha-coin-bag.svg" };
  const openWithQuantity = async quantity => {
    await page.route(route, request => request.fulfill({ json: { items: [{ ...entry, quantity }, ...(quantity === 1 ? [] : [{ ...entry, itemId: "other", quantity: 2 }])] } }), { times: 1 });
    await page.goto("/tests/e2e/fixtures/window-surfaces.html?surface=Warehouse");
    await expect(page.locator(".wg-loot").first()).toBeVisible();
    return page.locator(".wg-loot").first().evaluate(button => button.offsetWidth);
  };
  const regular = await openWithQuantity(5);
  const sparse = await openWithQuantity(1);
  expect(sparse).toBeGreaterThan(regular);
  await page.getByRole("button", { name: "展开持有详情" }).click();
  await expect(page.getByText("目前已持有1种物品")).toBeVisible();
});

test("27 copies spread across the box and respect the overlap limit after resizing", async ({ page }, testInfo) => {
  await page.route("**/api/items/inventory", route => route.fulfill({ json: { items: [
    { itemId: "clock", name: "魔法时钟", quantity: 9, imageUrl: "/assets/items/magic-clock.svg" },
    { itemId: "candy", name: "彩虹豆豆跳跳糖", quantity: 10, imageUrl: "/assets/items/rainbow-bean-candy.webp" },
    { itemId: "radio", name: "电台招募券", quantity: 5, imageUrl: "/assets/items/radio-recruitment-ticket.webp" },
    { itemId: "poster", name: "招募海报", quantity: 3, imageUrl: "/assets/items/recruitment-poster.webp" }
  ] } }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/tests/e2e/fixtures/window-surfaces.html?surface=Warehouse");
  const copies = page.locator(".wg-loot");
  await expect(copies).toHaveCount(27);
  await settleWindow(page);
  const respectsFloorAndControls = () => page.locator(".wg-pile").evaluate(pile => {
    const floor = pile.getBoundingClientRect();
    const toggle = pile.parentElement.querySelector(".wg-drawer-toggle").getBoundingClientRect();
    const close = pile.closest(".warehouse-box").querySelector(".close-button").getBoundingClientRect();
    const boxes = [...pile.querySelectorAll(".wg-loot")].map(button => button.getBoundingClientRect());
    return boxes.some(box => box.top < toggle.bottom - 10 && box.left > toggle.right)
      && boxes.every(box => box.left >= floor.left + floor.width * .085 + 5
        && box.right <= floor.left + floor.width * .91 - 5
        && box.top >= floor.top + floor.height * .12 + 8
        && box.bottom <= floor.top + floor.height * .85 - 8
        && [toggle, close].every(control => box.right <= control.left || box.left >= control.right
          || box.bottom <= control.top || box.top >= control.bottom));
  });
  expect(await respectsFloorAndControls()).toBe(true);
  expect(await largestCover(page)).toBeLessThanOrEqual(.20);
  const meanFootprint = await copies.evaluateAll(buttons => buttons.reduce((total, button) => total + button.getBoundingClientRect().width, 0) / buttons.length);
  expect(meanFootprint).toBeGreaterThan(102);
  const firstSize = await copies.first().evaluate(button => button.offsetWidth);
  await page.screenshot({ path: testInfo.outputPath("spread-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => copies.first().evaluate(button => button.offsetWidth)).toBeLessThan(firstSize);
  expect(await respectsFloorAndControls()).toBe(true);
  expect(await largestCover(page)).toBeLessThanOrEqual(.20);
});

test("warehouse character use, recruitment and feedback keep their real component routes", async ({ page }) => {
  await page.goto(preview);
  await page.getByRole("button", { name: "展开持有详情" }).click();
  await page.locator(".wg-entry").first().click();
  await page.getByRole("button", { name: "使用：彩虹豆豆跳跳糖" }).click();
  await expect(page.locator(".character-target-modal")).toBeVisible();
  await page.getByRole("button", { name: "西格莉卡", exact: true }).click();
  await expect(page.locator(".character-target-modal")).toHaveCount(0);
  await expect(page.locator(".wg-inspector .wg-quantity strong")).toHaveText("2");
  await page.getByRole("button", { name: "关闭道具详情" }).click();
  const card = page.locator(".wg-entry").first();
  await card.hover();await expect(card).toHaveCSS("translate", "-1px -2px");
  await page.mouse.down();await expect(card).toHaveCSS("translate", "2px 3px");await page.mouse.up();
  await page.getByRole("button", { name: "关闭道具详情" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });await expect(card).toHaveCSS("transition-property", "none");
  await page.getByRole("button", { name: "招募海报，数量 5" }).click();
  await page.getByRole("button", { name: "前去招募：招募海报" }).click();
  await expect(page.locator(".warehouse-modal")).toHaveCount(0);
  await expect(page.locator(".recruitment-modal")).toBeVisible();
});

test("warehouse large inventory and long text keep quantities, actions and whole rows reachable", async ({ page }) => {
  await page.setViewportSize({ width:320,height:740 });
  await page.goto(`${preview}?many&long&largeCounts`);
  await expect(page.getByRole("button", { name: /查看道具详情：彩虹豆豆跳跳糖 1特别/ })).toHaveCount(10);
  await page.getByRole("button", { name: "展开持有详情" }).click();
  await expect(page.locator(".wg-entry")).toHaveCount(30);await settleWindow(page);await wholeCards(page);
  await page.locator(".wg-entry").first().click();
  await expect(page.locator(".wg-inspector .wg-quantity strong")).toHaveText("9999");
  const copy=page.locator(".wg-details");await copy.evaluate(el=>{el.scrollTop=el.scrollHeight;});
  await expect(page.locator(".wg-use")).toBeVisible();
  await page.getByRole("button", { name: "关闭道具详情" }).click();
  await page.locator(".wg-entry").last().scrollIntoViewIfNeeded();await wholeCards(page);
  await page.setViewportSize({ width:390,height:600 });await wholeCards(page);
  await page.setViewportSize({ width:1440,height:900 });await wholeCards(page);
});

test("warehouse touch scroll settles on complete cards", async ({ browser }, testInfo) => {
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage();
  try {
    await page.goto(`http://127.0.0.1:5297${preview}`);await page.getByRole("button", { name: "展开持有详情" }).click();await expect(page.locator(".wg-entry")).toHaveCount(6);await settleWindow(page);
    const client=await context.newCDPSession(page),area=await page.locator(".wg-list").boundingBox();
    await client.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:area.x+area.width/2,y:area.y+area.height-30}]});
    for(let step=1;step<=8;step++){
      await client.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:area.x+area.width/2,y:area.y+area.height-30-step*19}]});
      await page.waitForTimeout(20);
    }
    await client.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
    await expect.poll(()=>page.locator(".wg-list").evaluate(el=>el.scrollTop)).toBeGreaterThan(0);await wholeCards(page);
    await page.screenshot({path:testInfo.outputPath("box-touch-scrolled.png")});
  } finally { await context.close(); }
});
