import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { settleWindow } from "./window-surfaces-fixture.js";

const preview = "/docs/design-samples/warehouse-paper-2026-10-22/production.html";
const output = fileURLToPath(new URL("../../docs/design-samples/warehouse-paper-2026-10-22/", import.meta.url));
async function wholeCards(page) {
  await expect.poll(() => page.locator(".wg-list").evaluate(list => {
    const bounds = list.getBoundingClientRect();
    const visible = [...list.querySelectorAll(".wg-entry")].map(el => el.getBoundingClientRect()).filter(card => card.bottom > bounds.top + 1 && card.top < bounds.bottom - 1);
    return visible.length > 0 && visible.every(card => card.top >= bounds.top + 1 && card.bottom + 4 <= bounds.bottom + 1);
  })).toBe(true);
}

for (const [width, height] of [[1440, 900], [800, 900], [390, 844], [360, 800], [320, 740], [390, 600]]) {
  test(`warehouse paper geometry and whole-card scrolling at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(preview);
    await expect(page.locator(".wg-entry")).toHaveCount(6);
    await settleWindow(page);
    await wholeCards(page);
    const shell = await page.locator(".warehouse-modal").boundingBox();
    const detail = await page.locator(".wg-inspector").boundingBox();
    expect(detail.x + detail.width + 4).toBeLessThanOrEqual(shell.x + shell.width);
    expect(detail.y + detail.height + 4).toBeLessThanOrEqual(shell.y + shell.height);
    if (width <= 768) expect(detail.height).toBeLessThanOrEqual(227);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await expect(page.locator(".wg-filters,.wg-type,.wg-page-turn,.wg-directory-footer,.wg-hero-count")).toHaveCount(0);
    await expect(page.locator(".wg-orbit")).toBeVisible();
    expect(await page.locator(".wg-hero img").evaluate(el => getComputedStyle(el).transform)).not.toBe("none");
    expect(await page.locator(".wg-hero img").evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
    await page.screenshot({ path: `${output}production-${width}x${height}.png` });
    await page.locator(".wg-list").hover();await page.mouse.wheel(0,137);await page.mouse.move(0,0);
    await expect.poll(() => page.locator(".wg-list").evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    await wholeCards(page);
    await page.locator(".wg-entry").last().scrollIntoViewIfNeeded();await wholeCards(page);
    await page.locator(".wg-entry").last().click();
    await expect(page.getByRole("heading", { name: "金币袋" })).toBeVisible();
    await page.getByRole("button", { name: "使用：金币袋", exact: true }).click();
    await expect(page.locator(".wg-entry")).toHaveCount(5);
    await expect(page.getByRole("heading", { name: "魔法时钟" })).toBeVisible();
    await expect(page.locator(".wg-use")).toHaveCount(0);
    await page.mouse.move(0,0);await wholeCards(page);
    await page.getByRole("button", { name: "关闭仓库" }).click();
    await page.getByRole("button", { name: "打开仓库", exact: true }).click();
    await expect(page.locator(".wg-entry")).toHaveCount(5);await wholeCards(page);
    expect(errors).toEqual([]);
  });
}

test("warehouse character use, recruitment and feedback keep their real component routes", async ({ page }) => {
  await page.goto(preview);
  await page.getByRole("button", { name: "使用：彩虹豆豆跳跳糖" }).click();
  await expect(page.locator(".character-target-modal")).toBeVisible();
  await page.getByRole("button", { name: "西格莉卡", exact: true }).click();
  await expect(page.locator(".character-target-modal")).toHaveCount(0);
  await expect(page.locator(".wg-inspector .wg-quantity strong")).toHaveText("2");
  const card = page.locator(".wg-entry").first();
  await card.hover();await expect(card).toHaveCSS("translate", "-1px -2px");
  await page.mouse.down();await expect(card).toHaveCSS("translate", "2px 3px");await page.mouse.up();
  await page.emulateMedia({ reducedMotion: "reduce" });await expect(card).toHaveCSS("transition-property", "none");
  await page.getByRole("button", { name: "招募海报，数量 5" }).click();
  await page.getByRole("button", { name: "前去招募：招募海报" }).click();
  await expect(page.locator(".warehouse-modal")).toHaveCount(0);
  await expect(page.locator(".recruitment-modal")).toBeVisible();
});

test("warehouse large inventory and long text keep quantities, actions and whole rows reachable", async ({ page }) => {
  await page.setViewportSize({ width:320,height:740 });
  await page.goto(`${preview}?many&long&largeCounts`);
  await expect(page.locator(".wg-entry")).toHaveCount(30);await settleWindow(page);await wholeCards(page);
  await expect(page.locator(".wg-inspector .wg-quantity strong")).toHaveText("9999");
  const copy=page.locator(".wg-details");await copy.evaluate(el=>{el.scrollTop=el.scrollHeight;});
  await expect(page.locator(".wg-use")).toBeVisible();
  await page.locator(".wg-entry").last().scrollIntoViewIfNeeded();await wholeCards(page);
  await page.setViewportSize({ width:390,height:600 });await wholeCards(page);
  await page.setViewportSize({ width:1440,height:900 });await wholeCards(page);
});

test("warehouse touch scroll settles on complete cards", async ({ browser }) => {
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage();
  try {
    await page.goto(`http://127.0.0.1:5297${preview}`);await expect(page.locator(".wg-entry")).toHaveCount(6);await settleWindow(page);
    const client=await context.newCDPSession(page),area=await page.locator(".wg-list").boundingBox();
    await client.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:area.x+area.width/2,y:area.y+area.height-30}]});
    for(let step=1;step<=8;step++){
      await client.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:area.x+area.width/2,y:area.y+area.height-30-step*19}]});
      await page.waitForTimeout(20);
    }
    await client.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
    await expect.poll(()=>page.locator(".wg-list").evaluate(el=>el.scrollTop)).toBeGreaterThan(0);await wholeCards(page);
    await page.screenshot({path:`${output}production-touch-scrolled.png`});
  } finally { await context.close(); }
});
