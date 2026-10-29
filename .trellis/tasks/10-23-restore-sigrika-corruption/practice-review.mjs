import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const stage = process.argv[2] || "before";
const root = new URL("./practice-review/", import.meta.url);
await mkdir(root, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ reducedMotion: "reduce" });
const report = [];
for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
  await page.setViewportSize(viewport);
  await page.goto("http://127.0.0.1:5173/tests/e2e/fixtures/interface-polish.html?surface=practice");
  await page.getByRole("button", { name: "准时宝陪练", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "准时宝陪练", exact: true });
  await dialog.waitFor();
  if (stage === "capture") await dialog.getByRole("button", { name: "吃子挑战赛", exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  await dialog.locator(".practice-sheet-bust img").evaluate(image => image.decode());
  if (stage === "before" && viewport.width === 390) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("DOM.enable"); await cdp.send("CSS.enable");
    const { root: document } = await cdp.send("DOM.getDocument");
    for (const selector of [".practice-sheet-controls .close-button", ".practice-sheet-bust img"]) {
      const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: document.nodeId, selector });
      const matches = await cdp.send("CSS.getMatchedStylesForNode", { nodeId });
      console.log(JSON.stringify({ selector, matches: matches.matchedCSSRules.filter(({ rule }) => rule.style.cssProperties.some(p => ["height", "width", "min-height", "max-width"].includes(p.name))).map(({ rule }) => ({ selector: rule.selectorList.text, declarations: rule.style.cssProperties.filter(p => ["height", "width", "min-height", "max-width"].includes(p.name)) })) }));
    }
    await cdp.detach();
  }
  report.push(await dialog.evaluate((dialog, viewport) => {
    const measure = selector => {
      const node = dialog.querySelector(selector);
      const css = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return { rect: rect.toJSON(), width: css.width, height: css.height, minHeight: css.minHeight,
        maxHeight: css.maxHeight, padding: css.padding, top: css.top, overflow: css.overflow,
        objectFit: css.objectFit, transform: css.transform, naturalWidth: node.naturalWidth, naturalHeight: node.naturalHeight };
    };
    return { viewport, dialog: dialog.getBoundingClientRect().toJSON(), close: measure(".close-button"),
      bust: measure(".practice-sheet-bust"), image: measure(".practice-sheet-bust img"), bubble: measure(".practice-sheet-bubble") };
  }, viewport));
  await dialog.screenshot({ path: new URL(`${stage}-${viewport.width}.png`, root).pathname.replace(/^\//, "") });
}
await writeFile(new URL(`${stage}.json`, root), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
await browser.close();
