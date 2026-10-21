import { expect, test } from "@playwright/test";

async function tokenColor(locator, token) {
  return locator.evaluate((element, name) => {
    const probe = document.createElement("span");
    probe.style.backgroundColor = `var(${name})`;
    element.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  }, token);
}

for (const width of [1440, 1024, 390, 320]) {
  test(`battle header columns, numeric fonts and exit color at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width > 900 ? 1000 : 844 });
    await page.goto("/tests/e2e/fixtures/spectator-presence.html");
    await page.evaluate(() => document.fonts.ready);
    const rows = page.locator(".room-scoreboard-player");
    await expect(rows).toHaveCount(2);
    const first = await rows.nth(0).boundingBox();
    const second = await rows.nth(1).boundingBox();
    expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
    for (let column = 0; column < 3; column++) {
      const top = rows.nth(0).locator(":scope > span").nth(column);
      const bottom = rows.nth(1).locator(":scope > span").nth(column);
      expect((await top.boundingBox()).x).toBeCloseTo((await bottom.boundingBox()).x, 0);
      await expect(top).toHaveCSS("text-align", "left");
    }
    const header = await page.locator(".room-header").boundingBox();
    expect(second.x + second.width).toBeLessThanOrEqual(header.x + header.width);
    const exit = page.getByRole("button", { name: "退出房间", exact: true }).first();
    await expect(exit).toHaveCSS("background-color", await tokenColor(exit, "--campus-button-danger"));
    await expect(exit).toHaveCSS("background-image", "none");
    const numbers = await page.locator(".room-screen").evaluate(root => [...root.querySelectorAll("*")]
      .filter(e => !e.closest(".board-wrap") && e.getBoundingClientRect().height > 0 && [...e.childNodes].some(n => n.nodeType === Node.TEXT_NODE && /[0-9]/.test(n.textContent)))
      .map(e => ({ text: e.textContent, font: getComputedStyle(e).fontFamily })));
    expect(numbers.length).toBeGreaterThan(6);
    expect(numbers.filter(e => !e.font.includes("Sigrika Window Title"))).toEqual([]);
    for (const coordinate of await page.locator(".coord-col span").all()) {
      expect(await coordinate.evaluate(e => getComputedStyle(e).fontFamily)).not.toContain("Sigrika Window Title");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({ path: testInfo.outputPath(`battle-${width}.png`), fullPage: true });
    if (width <= 390) {
      // Spectating has the production header controls, without development-only test tools.
      await page.goto("/tests/e2e/fixtures/spectator-presence.html?self");
      await page.evaluate(() => document.fonts.ready);
      for (const name of await page.locator(".room-scoreboard-name").all()) {
        expect(await name.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
      }
      await expect(page.locator(".replay-step-indicator")).toHaveCSS("font-family", /Sigrika Window Title/);
      const menu = page.getByRole("button", { name: "选项", exact: true });
      const exitBox = await exit.boundingBox();
      const menuBox = await menu.boundingBox();
      expect([exitBox.width, exitBox.height, exitBox.y]).toEqual([menuBox.width, menuBox.height, menuBox.y]);
      for (const property of ["border-top", "border-radius", "color", "box-shadow"]) {
        await expect(exit).toHaveCSS(property, await menu.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property));
      }
      await expect(exit).toHaveCSS("box-shadow", "none");
      await expect(exit).toHaveCSS("background-color", await tokenColor(exit, "--campus-button-danger"));
      await page.screenshot({ path: testInfo.outputPath(`battle-spectator-${width}.png`), fullPage: true });
      for (const button of [exit, menu]) {
        await button.hover();
        await expect(button).toHaveCSS("box-shadow", "none");
        await page.mouse.down();
        await expect(button).toHaveCSS("transform", "matrix(1, 0, 0, 1, 2, 2)");
        await expect(button).toHaveCSS("box-shadow", "none");
        await page.mouse.move(0, 0);
        await page.mouse.up();
        await expect(button).toHaveCSS("transform", "none");
      }
    }
  });
}

for (const width of [1440, 390]) {
  test(`result colors follow the current player outcome at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width > 900 ? 1000 : 844 });
    for (const [outcome, token] of [["win", "--campus-button-success"], ["loss", "--campus-button-danger"], ["draw", "--theme-bg"]]) {
      await page.goto(`/tests/e2e/fixtures/spectator-presence.html?result=${outcome}`);
      await page.evaluate(() => document.fonts.ready);
      const result = page.locator(`.result-outcome-${outcome}.result-modal`);
      await expect(result).toBeVisible();
      await expect(result).toHaveCSS("background-color", await tokenColor(result, token));
      expect(await result.evaluate(e => getComputedStyle(e).backgroundImage)).toContain("linear-gradient");
      await page.screenshot({ path: testInfo.outputPath(`result-${outcome}-${width}.png`), fullPage: true });
    }
  });
}
