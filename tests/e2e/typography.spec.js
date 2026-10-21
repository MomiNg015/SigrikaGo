import { expect, test } from "@playwright/test";
import { mockWindowData, settleWindow, windowSurfaces } from "./window-surfaces-fixture.js";

async function textFonts(root) {
  return root.evaluate(element => [element, ...element.querySelectorAll("*")]
    .filter(node => node.getBoundingClientRect().height > 0 && [...node.childNodes].some(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim()))
    .map(node => ({ text: node.textContent.trim().slice(0, 60), font: getComputedStyle(node).fontFamily })));
}

async function platformFonts(page, selector) {
  const session = await page.context().newCDPSession(page);
  await session.send("DOM.enable");
  await session.send("CSS.enable");
  const { root } = await session.send("DOM.getDocument");
  const { nodeId } = await session.send("DOM.querySelector", { nodeId: root.nodeId, selector });
  const { fonts } = await session.send("CSS.getPlatformFontsForNode", { nodeId });
  await session.detach();
  return fonts.filter(font => font.glyphCount > 0);
}

for (const width of [1440, 390]) {
  test(`production windows use LXGW with existing WuWa exceptions at ${width}`, async ({ page }, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: width > 900 ? 1000 : 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mockWindowData(page);
    for (const [surface, selector] of Object.entries({ Auth: ".auth-panel", Loading: "#root", ...windowSurfaces }).filter(([surface]) => !["Achievements", "Personalization"].includes(surface))) {
      await page.goto(`/tests/e2e/fixtures/window-surfaces.html?surface=${surface}`);
      const root = surface === "Loading" ? page.locator("#root") : page.locator(selector).first();
      await expect(root).toBeVisible();
      await settleWindow(page);
      const fonts = await textFonts(root);
      expect(fonts.length, surface).toBeGreaterThan(0);
      expect(fonts.filter(row => !/Sigrika Window Title|Sigrika Accent Latin/.test(row.font)), surface).toEqual([]);
      if (["Auth", "Warehouse", "Resume"].includes(surface)) await page.screenshot({ path: testInfo.outputPath(`${surface}-${width}.png`), fullPage: true });
    }
  });

  test(`IRIS entry and window keep all original font stacks at ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width > 900 ? 1000 : 844 });
    await page.goto("/tests/e2e/fixtures/window-surfaces.html?surface=Iris");
    const entry = page.getByRole("button", { name: "打开 IRIS 数据库" });
    await entry.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await settleWindow(page);
    const current = [...await textFonts(entry), ...await textFonts(dialog)];
    expect(current.length).toBeGreaterThan(20);
    expect(current.filter(row => !/IRIS Dotted Songti Circle|^"Microsoft YaHei UI"/.test(row.font))).toEqual([]);
    expect(current.some(row => row.font.startsWith('"Sigrika Accent Latin"'))).toBe(true);
    // Recreate the previous global default: IRIS must not depend on either version.
    await page.addStyleTag({ content: ':root { --font-ui-default: "Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", system-ui, sans-serif; }' });
    expect([...await textFonts(entry), ...await textFonts(dialog)]).toEqual(current);
    await page.screenshot({ path: testInfo.outputPath(`iris-${width}.png`), fullPage: true });
  });
}

test("desktop administration and actual font files follow the typography contract", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mockWindowData(page);
  await page.goto("/tests/e2e/fixtures/window-surfaces.html?surface=Admin");
  await expect(page.locator(".admin-screen")).toBeVisible();
  await settleWindow(page);
  const adminFonts = await textFonts(page.locator(".admin-screen"));
  expect(adminFonts.length).toBeGreaterThan(10);
  expect(adminFonts.filter(row => !row.font.includes("Sigrika Window Title"))).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("admin.png"), fullPage: true });

  await page.goto("/tests/e2e/fixtures/window-surfaces.html?surface=Auth");
  await settleWindow(page);
  const fonts = await platformFonts(page, '.auth-label-row > span');
  expect(fonts.some(font => font.isCustomFont && /LXGW|霞鹜/i.test(font.familyName))).toBe(true);
  await page.locator(".auth-panel").evaluate(root => {
    const probe = document.createElement("span");
    probe.className = "text-rating-value";
    probe.id = "wuwa-font-probe";
    probe.textContent = "1234567890";
    root.append(probe);
  });
  await page.evaluate(() => document.fonts.ready);
  const accent = await platformFonts(page, "#wuwa-font-probe");
  expect(accent.some(font => font.isCustomFont && /WuWa/i.test(font.familyName))).toBe(true);
});
