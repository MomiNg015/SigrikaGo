import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
const errors = [];
const base = "http://127.0.0.1:5173/docs/design-samples/tutorial-choice-floating-2026-10-29/";
const snap = (page, name) => page.screenshot({ path: fileURLToPath(new URL(name, import.meta.url)) });
const checkHorizontalPaint = async page => {
  const clipped = await page.locator('.tutorial-floating-choices').evaluate(group => {
    const clipLeft = group.getBoundingClientRect().left + group.clientLeft;
    const clipRight = clipLeft + group.clientWidth;
    return [...group.querySelectorAll('button')].some(button => {
      const rect = button.getBoundingClientRect();
      const shadows = getComputedStyle(button).boxShadow.replace(/rgba?\([^)]+\)/g, '').split(',')
        .map(shadow => shadow.trim().split(/\s+/).map(parseFloat));
      const left = Math.max(0, ...shadows.map(([x, , blur = 0, spread = 0]) => -x + blur + spread));
      const right = Math.max(0, ...shadows.map(([x, , blur = 0, spread = 0]) => x + blur + spread));
      return rect.left - left < clipLeft - 0.5 || rect.right + right > clipRight + 0.5;
    });
  });
  assert.equal(clipped, false, 'reply outlines and shadows must fit inside the actual scrollport');
};
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`${base}scene.html`);
  await page.locator('[data-ready="true"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  for (const [width, height] of [[390, 844], [360, 640], [320, 568], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    for (const scenario of ["normal", "long", "many", "single"]) {
      await page.goto(`${base}scene.html?scenario=${scenario}`);
      await page.locator('.tutorial-floating-choices[data-ready="true"]').waitFor();
      await page.waitForFunction(() => [...document.querySelectorAll('.tutorial-choice-step')].every(el => {
        const style = getComputedStyle(el);
        return Number(style.opacity) >= 0.999 && Math.abs(new DOMMatrix(style.transform).m41) < 0.1;
      }));
      const geometry = await page.evaluate(() => {
        const group = document.querySelector(".tutorial-floating-choices");
        const board = document.querySelector(".board-stage").getBoundingClientRect();
        const rect = group.getBoundingClientRect();
        const buttons = [...group.querySelectorAll("button")];
        return {
          scroll: group.scrollHeight > group.clientHeight + 1,
          font: getComputedStyle(buttons[0]).fontSize,
          bounds: rect.toJSON(), board: board.toJSON(),
          noSpotlight: !document.querySelector(".tutorial-input-focus"),
          backdrop: getComputedStyle(document.querySelector('.tutorial-choice-backdrop')).backgroundColor,
          backdropBounds: document.querySelector('.tutorial-choice-backdrop').getBoundingClientRect().toJSON(),
          dialogueGap: document.querySelector('.tutorial-battle-dialogue').getBoundingClientRect().top - document.querySelector('.room-header').getBoundingClientRect().bottom,
          controlCount: document.querySelectorAll(".battle-arcade-controls button").length,
          rects: buttons.map(button => button.getBoundingClientRect().toJSON()),
          textFits: buttons.every(button => { const text = button.querySelector("span"); const a = text.getBoundingClientRect(), b = button.getBoundingClientRect(); return a.right <= b.right && a.bottom <= b.bottom && text.scrollWidth <= text.clientWidth + 1; }),
          pageOverflow: document.documentElement.scrollWidth > innerWidth,
          background: getComputedStyle(buttons[0]).backgroundColor
        };
      });
      assert.ok(geometry.noSpotlight, "replies use a flat backdrop, without spotlight cutouts");
      assert.equal(geometry.backdrop, 'rgba(0, 0, 0, 0.2)', 'background dims by twenty percent');
      assert.deepEqual([geometry.backdropBounds.top, geometry.backdropBounds.left, geometry.backdropBounds.width, geometry.backdropBounds.height], [0, 0, width, height], 'dimming covers the viewport');
      if (width <= 900) assert.ok(geometry.dialogueGap >= 8 && geometry.dialogueGap <= 18, 'mobile NPC sits close below header');
      const layerProbe = await page.addStyleTag({ content: '.tutorial-choice-backdrop { pointer-events: auto !important; }' });
      assert.ok(await page.evaluate(() => {
        const backdrop = document.querySelector('.tutorial-choice-backdrop');
        const header = document.querySelector('.room-header').getBoundingClientRect();
        const button = document.querySelector('.tutorial-floating-choices button');
        const r = button.getBoundingClientRect();
        return document.elementFromPoint(header.left + 10, header.top + 10) === backdrop && button.contains(document.elementFromPoint(r.left + 10, r.top + 10));
      }), 'backdrop is above header and below replies');
      await layerProbe.evaluate(el => el.remove());
      assert.equal(geometry.background, "rgb(228, 248, 220)", "opaque approved reply fill wins the theme cascade");
      assert.equal(geometry.controlCount, 5, "normal controls preserved");
      assert.equal(geometry.pageOverflow, false);
      assert.ok(geometry.textFits, `${width}/${scenario}: wrapped text must stay within the button`);
      assert.ok(geometry.bounds.bottom <= height + 1 && geometry.bounds.right <= width, `${width}/${scenario}: viewport bounds`);
      assert.ok(width <= 900 ? geometry.bounds.top >= geometry.board.bottom : geometry.bounds.left >= geometry.board.right, `${width}/${scenario}: board frame overlap`);
      assert.ok(geometry.rects.every(rect => Math.abs(rect.width - geometry.rects[0].width) < 1), "equal width choices");
      assert.ok(geometry.rects.slice(1).every((rect, index) => rect.x > geometry.rects[index].x), "descending rightward staircase");
      await checkHorizontalPaint(page);
      if ((scenario === "normal" && width >= 360) || scenario === "single") assert.equal(geometry.scroll, false, `${width}/${scenario} should not scroll`);
      if (scenario === "normal") await snap(page, width > 900 ? "preview-desktop.png" : `preview-${width}.png`);
      if (width === 360 && scenario === "long") await snap(page, "preview-long-360.png");
      if (geometry.scroll) {
        await page.locator(".tutorial-floating-choices button").last().scrollIntoViewIfNeeded();
        await page.locator(".tutorial-floating-choices button").last().click();
        await page.getByText("这一步完成了。", { exact: true }).waitFor();
        await page.getByRole("button", { name: "继续", exact: true }).click();
        await page.locator('.tutorial-floating-choices[data-ready="true"]').waitFor();
      }
      results.push({ width, height, scenario, ...geometry });
    }
    const gutterStyle = await page.addStyleTag({ content: '.tutorial-floating-choices { overflow-y: scroll; scrollbar-gutter: stable; scrollbar-width: auto; }' });
    await page.waitForTimeout(100);
    await checkHorizontalPaint(page);
    await gutterStyle.evaluate(el => el.remove());
    const activeLogTrigger = page.locator('.room-header-story-log');
    await activeLogTrigger.click();
    await page.locator('.tutorial-story-log-popover[data-open="true"]').waitFor();
    assert.equal(await page.locator('.tutorial-floating-choices').getAttribute('inert'), '', 'history still opens through the dimmer and locks replies');
    await page.keyboard.press('Escape');
    await page.locator('.tutorial-story-log-popover[data-open="true"]').waitFor({ state: 'hidden' });
    assert.ok(await activeLogTrigger.evaluate(el => el === document.activeElement), 'closing history preserves header focus');
    await page.getByRole('button', { name: '退出/跳过', exact: true }).click();
    await page.getByText('结束剧情教学？', { exact: true }).waitFor();
    assert.equal(await page.locator('.tutorial-floating-choices').getAttribute('inert'), '', 'exit confirmation locks replies');
    await page.getByRole('button', { name: '取消', exact: true }).click();
    const before = await page.locator(".board-stage").boundingBox();
    await page.locator(".tutorial-floating-choices button").first().click();
    await page.getByText("这一步完成了。", { exact: true }).waitFor();
    assert.equal(await page.locator('.tutorial-choice-backdrop').count(), 0, 'dimming ends with reply selection');
    assert.deepEqual(await page.locator(".board-stage").boundingBox(), before, "choice removal must not shift board");
    const logButton = page.locator(".room-header-quick-actions .chat-toggle-button");
    await logButton.waitFor({ state: "visible" });
    assert.equal(await logButton.count(), 1, "one story record button in header");
    const logBox = await logButton.boundingBox();
    const exitBox = await page.locator(".room-mobile-exit").boundingBox();
    assert.ok(logBox.x + logBox.width <= exitBox.x && Math.abs(logBox.y - exitBox.y) < 1, "record button beside exit and vertically aligned");
    const visualProperties = ["width", "height", "borderRadius", "borderWidth", "borderStyle", "boxShadow", "transform", "padding", "transition"];
    const readButtonStyle = locator => locator.evaluate((el, keys) => { const style = getComputedStyle(el); return Object.fromEntries(keys.map(key => [key, style[key]])); }, visualProperties);
    assert.deepEqual(await readButtonStyle(logButton), await readButtonStyle(page.locator(".room-mobile-exit")), "header record and exit share geometry, border, shadow and motion");
    await logButton.click();
    const logPanel = page.locator('.tutorial-story-log-popover[data-open="true"]');
    await logPanel.waitFor({ state: "visible" });
    const logPanelBox = await logPanel.boundingBox();
    assert.ok(logPanelBox.y >= logBox.y + logBox.height && logPanelBox.y + logPanelBox.height <= height, "record panel opens below header within viewport");
    assert.match(await logPanel.innerText(), /先看看棋盘/);
    if (width === 1440) await snap(page, "preview-header-desktop.png");
    await page.getByRole("button", { name: "关闭剧情记录" }).click();
    await logPanel.waitFor({ state: "hidden" });
  }
  await page.goto(`${base}scene.html?scenario=quiz`);
  await page.locator('.tutorial-floating-choices[data-ready="true"]').waitFor();
  await page.getByRole("button", { name: "先随便下一步", exact: true }).click();
  await page.getByText("再看看连接的方向。", { exact: true }).waitFor();
  await page.getByRole("button", { name: "连接自己的棋子", exact: true }).click();
  await page.getByText("这一步完成了。", { exact: true }).waitFor();
  await page.goto(`${base}scene.html?scenario=continue`);
  const nativeContinue = page.locator('.battle-arcade-controls').getByRole('button', { name: '继续', exact: true });
  await nativeContinue.waitFor();
  assert.equal(await page.locator('.tutorial-floating-choices').count(), 0, 'single continue stays in the normal control bar');
  await nativeContinue.click();
  await page.getByText("这一步完成了。", { exact: true }).waitFor();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => window.postMessage({ source: "choice-review", action: "replay", scenario: "normal" }, location.origin));
  await page.locator('.tutorial-floating-choices[data-ready="true"]').waitFor();
  assert.equal(await page.locator(".tutorial-floating-choices button").first().evaluate(el => getComputedStyle(el.parentElement).animationName), "none");
  await page.locator(".tutorial-floating-choices button").first().focus();
  await page.keyboard.press("Enter");
  await page.getByText("这一步完成了。", { exact: true }).waitFor();
  await page.goto(base);
  const iframe = page.frameLocator("#scene");
  await iframe.locator('[data-ready="true"]').waitFor();
  await page.getByRole("button", { name: "小屏手机" }).click();
  await page.locator("#scenario").selectOption("long");
  await iframe.locator('.tutorial-floating-choices[data-ready="true"]').waitFor();
  assert.equal(await iframe.locator(".tutorial-floating-choices button").count(), 4);
  await page.getByRole("button", { name: "隐藏选项" }).click();
  await iframe.locator(".tutorial-floating-choices button").first().waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "显示选项" }).click();
  await iframe.locator(".tutorial-floating-choices button").first().waitFor();
  await page.locator("#scenario").selectOption("normal");
  await page.getByRole("button", { name: "手机竖屏" }).click();
  await iframe.locator('.tutorial-floating-choices[data-ready="true"]').waitFor();
  await snap(page, "preview-review.png");
  assert.deepEqual(errors, []);
  await writeFile(new URL("./verification.json", import.meta.url), JSON.stringify({ results, errors, checks: ["16 viewport-content combinations", "twenty percent viewport backdrop below replies and above header", "mobile dialogue close below header", "history and exit remain usable through dimming", "unclipped horizontal shadow extents including reserved scrollbar gutter", "unchanged board on choice removal", "scroll-last-choice reachable", "wrong answer retry and correct branch", "single native continuation", "keyboard Enter", "reduced motion", "review controls", "desktop/mobile header log placement and open/close"] }, null, 2));
  console.log(JSON.stringify(results.map(({width, height, scenario, scroll, font}) => ({width, height, scenario, scroll, font})), null, 2));
} finally { await browser.close(); }
