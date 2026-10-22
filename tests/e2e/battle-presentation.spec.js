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

for (const width of [1440, 1024, 492, 390, 360, 320]) {
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
    if (width <= 492) {
      const title = await page.locator(".room-title-stack").boundingBox();
      const tools = await page.locator(".room-header-test-tools").boundingBox();
      expect(title.x + title.width).toBeLessThanOrEqual(tools.x);
      expect(Math.abs(title.y + title.height / 2 - tools.y - tools.height / 2)).toBeLessThan(2);
      for (const info of await page.locator(".room-scoreboard-meta, .room-scoreboard-players").all()) {
        const bounds = await info.boundingBox();
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(title.x + title.width + 1);
      }
      for (const card of await page.locator(".player-meta").all()) {
        const stone = await card.locator(".color-badge").boundingBox();
        const name = await card.locator(".name-button").boundingBox();
        const rank = await card.locator(".rank-tag").boundingBox();
        expect(Math.abs(stone.y + stone.height / 2 - rank.y - rank.height / 2)).toBeLessThan(2);
        expect(Math.abs(name.y + name.height / 2 - rank.y - rank.height / 2)).toBeLessThan(2);
        expect((await card.boundingBox()).x + (await card.boundingBox()).width - rank.x - rank.width).toBeLessThan(8);
      }
      for (const stat of await page.locator(".captures > *").all()) {
        await expect(stat).toHaveCSS("flex-direction", "row");
        await expect(stat).toHaveCSS("white-space", "nowrap");
        expect(await stat.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
      }
      const cardShadow = await page.locator(".player-meta").first().evaluate(e => getComputedStyle(e).boxShadow);
      for (const control of await page.locator(".room-header-test-tools > button, .room-mobile-exit, .room-mobile-menu-toggle, .action-bar > button").all()) {
        await expect(control).toHaveCSS("box-shadow", cardShadow);
      }
      const coords = page.locator(".room-mobile-coordinate");
      const exitBounds = await page.locator(".room-mobile-exit").boundingBox();
      const coordsBounds = await coords.boundingBox();
      expect(coordsBounds.x + coordsBounds.width).toBeLessThanOrEqual(exitBounds.x);
      expect(Math.abs(coordsBounds.y - exitBounds.y)).toBeLessThanOrEqual(2);
      await expect(coords).toHaveText("");
      await expect(coords).toHaveAttribute("aria-pressed", "true");
      await coords.click();
      await expect(coords).toHaveAttribute("aria-pressed", "false");
      await coords.click();
      await expect(coords).toHaveAttribute("aria-pressed", "true");
      const menuToggle = page.getByRole("button", { name: "选项", exact: true });
      await menuToggle.click();
      const panel = page.locator(".room-mobile-menu-panel");
      await expect(panel).toHaveCSS("opacity", "1");
      expect((await panel.boundingBox()).width).toBeLessThanOrEqual(130);
      await expect(panel.locator("button")).toHaveCount(2);
      for (const button of await panel.locator("button").all()) {
        const bounds = await button.boundingBox();
        const icon = await button.locator("svg").boundingBox();
        const label = await button.locator("span").boundingBox();
        expect(Math.abs((icon.x + label.x + label.width) / 2 - bounds.x - bounds.width / 2)).toBeLessThan(2);
        expect(Math.abs(icon.y + icon.height / 2 - label.y - label.height / 2)).toBeLessThan(2);
        expect(await button.locator("span").evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
      }
      await panel.getByRole("button", { name: "设置", exact: true }).click();
      await expect(menuToggle).toHaveAttribute("aria-expanded", "false");
      await page.mouse.move(0, 0);
    } else {
      await expect(page.locator(".room-mobile-coordinate")).toBeHidden();
    }
    const exit = page.getByRole("button", { name: "退出房间", exact: true }).first();
    await expect(exit).toHaveCSS("background-color", await tokenColor(exit, "--campus-button-danger"));
    await expect(exit).toHaveCSS("background-image", "none");
    const numbers = await page.locator(".room-screen").evaluate(root => [...root.querySelectorAll("*")]
      .filter(e => !e.closest(".board-wrap") && e.getBoundingClientRect().height > 0 && [...e.childNodes].some(n => n.nodeType === Node.TEXT_NODE && /[0-9]/.test(n.textContent)))
      .map(e => ({ text: e.textContent, font: getComputedStyle(e).fontFamily })));
    expect(numbers.length).toBeGreaterThan(6);
    expect(numbers.filter(e => !e.font.includes("Sigrika Window Title"))).toEqual([]);
    for (const coordinate of await page.locator(".coord-col span").all()) {
      expect(await coordinate.evaluate(e => getComputedStyle(e).fontFamily)).toContain("Sigrika Window Title");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({ path: testInfo.outputPath(`battle-${width}.png`), fullPage: true });
    if (width <= 390) {
      // Spectating has the production header controls, without development-only test tools.
      await page.goto("/tests/e2e/fixtures/spectator-presence.html?self");
      await page.evaluate(() => document.fonts.ready);
      for (const name of await page.locator(".room-scoreboard-name").all()) {
        const nameBounds = await name.boundingBox();
        const titleBounds = await page.locator(".room-title-stack").boundingBox();
        expect(nameBounds.x + nameBounds.width).toBeLessThanOrEqual(titleBounds.x + titleBounds.width);
      }
      await expect(page.locator(".replay-step-indicator")).toHaveCSS("font-family", /Sigrika Window Title/);
      const menu = page.getByRole("button", { name: "选项", exact: true });
      const exitBox = await exit.boundingBox();
      const menuBox = await menu.boundingBox();
      expect([exitBox.width, exitBox.height, exitBox.y]).toEqual([menuBox.width, menuBox.height, menuBox.y]);
      for (const property of ["border-top", "border-radius", "color", "box-shadow"]) {
        await expect(exit).toHaveCSS(property, await menu.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property));
      }
      await expect(exit).not.toHaveCSS("box-shadow", "none");
      await expect(exit).toHaveCSS("background-color", await tokenColor(exit, "--campus-button-danger"));
      await page.screenshot({ path: testInfo.outputPath(`battle-spectator-${width}.png`), fullPage: true });
      for (const button of [exit, menu]) {
        await button.hover();
        await expect(button).not.toHaveCSS("box-shadow", "none");
        await page.mouse.down();
        await expect(button).toHaveCSS("transform", "matrix(1, 0, 0, 1, 1, 2)");
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

for (const width of [320, 360, 390, 492]) {
  test(`dense player identities and statistics stay inline at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.goto("/tests/e2e/fixtures/spectator-presence.html?dense");
    await page.evaluate(() => document.fonts.ready);
    for (const card of await page.locator(".player-meta").all()) {
      const name = await card.locator(".battle-name-content").boundingBox();
      const rank = await card.locator(".rank-tag").boundingBox();
      expect(name.x + name.width).toBeLessThanOrEqual(rank.x + 1);
      expect(Math.abs(name.y + name.height / 2 - rank.y - rank.height / 2)).toBeLessThan(2);
    }
    for (const stat of await page.locator(".captures > *").all()) {
      expect(await stat.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
    }
    const exit = page.getByRole("button", { name: "退出房间", exact: true }).first();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await exit.hover();
    await page.mouse.down();
    await expect(exit).toHaveCSS("transform", "none");
    await expect(exit).toHaveCSS("box-shadow", "none");
    await page.mouse.up();
  });
}
