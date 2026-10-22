import { expect, test } from "@playwright/test";
import { mockWindowData, settleWindow } from "./window-surfaces-fixture.js";

for (const width of [1440, 390]) {
  test(`production watch turns finished rooms gray without changing live search at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height:width === 1440 ? 900 : 844 });
    await mockWindowData(page);
    let finished = false, requests = 0;
    await page.route("**/api/rooms/watch?mode=all", route => {
      requests += 1;
      return route.fulfill({ json:{ rooms:[
        { code:"123456", mode:"spark", moveNumber:86, onlineCount:12, status:finished ? "finished" : "playing", black:{ user:{username:"ALICE"}, characterId:"sigrika", connected:true }, white:{ user:{username:"雨天"}, characterId:"denia", connected:true } },
        { code:"654321", mode:"standard", moveNumber:1024, onlineCount:128, status:"playing" }
      ] } });
    });
    await page.goto("/tests/e2e/fixtures/window-surfaces.html?surface=Watch");
    await expect(page.locator(".wl-row")).toHaveCount(2);
    await settleWindow(page);
    const row = page.locator(".wl-row").first();
    const fill = () => row.evaluate(element => getComputedStyle(element, "::before").backgroundColor);
    const playing = await fill();
    const input = page.getByRole("textbox", { name:"搜索房间或玩家" });
    const frame = page.locator(".wl-search");
    const frameStyle = () => frame.evaluate(element => {
      const style = getComputedStyle(element);
      return [style.border,style.boxShadow,style.outline];
    });
    const before = await frameStyle();
    await input.focus();
    expect(await frameStyle()).toEqual(before);
    await expect(page.locator(".wl-search button")).toHaveCount(0);
    for (const query of ["123", "  alice  ", "雨天"]) {
      await input.fill(query);
      await expect(page.locator(".wl-row")).toHaveCount(1);
    }
    expect(requests).toBe(1);
    await input.fill("");
    finished = true;
    await page.getByRole("button", { name:"刷新对局列表" }).click();
    await expect(row).toHaveClass(/finished/);
    await settleWindow(page);
    const gray = await fill();
    expect(gray).not.toBe(playing);
    expect(await row.evaluate(element => {
      const canvas = document.createElement("canvas"), context = canvas.getContext("2d");
      context.fillStyle = getComputedStyle(element, "::before").backgroundColor;
      context.fillRect(0,0,1,1);
      const [r,g,b] = context.getImageData(0,0,1,1).data;
      return r === g && g === b && r > 180 && r < 240;
    })).toBe(true);
    await row.hover(); await settleWindow(page);
    expect(await fill()).toBe(gray);
    await page.mouse.down(); await settleWindow(page);
    expect(await fill()).toBe(gray);
    expect(await row.evaluate(element => getComputedStyle(element, "::before").boxShadow)).toContain("1px 1px");
    await page.mouse.up();
    await expect(page.getByRole("button", { name:"观战房间 123456" })).toBeEnabled();
    expect(requests).toBe(2);
  });
}
