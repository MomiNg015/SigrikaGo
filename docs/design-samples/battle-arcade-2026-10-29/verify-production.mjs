import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const url = "http://127.0.0.1:5173/docs/design-samples/battle-arcade-2026-10-29/production.html";
const out = new URL("./", import.meta.url);
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
const results = [];
try {
  for (const [width, height] of [[1440, 768], [1920, 1080], [390, 844], [320, 568]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(url);
    await page.locator(".battle-arcade-controls").waitFor();
    await page.evaluate(() => document.fonts.ready);
    const geometry = await page.evaluate(() => {
      const bar = document.querySelector(".battle-arcade-controls");
      const board = document.querySelector(".board-stage").getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        barBottom: bar.getBoundingClientRect().bottom,
        boardRatio: board.width / board.height,
        buttons: [...bar.querySelectorAll("button")].map(el => ({ name: el.className, width: el.offsetWidth, height: el.offsetHeight }))
      };
    });
    assert.equal(geometry.overflow, false);
    assert.ok(Math.abs(geometry.boardRatio - 1) < 0.02);
    assert.equal(geometry.buttons.length, 5);
    for (const button of geometry.buttons) assert.ok(button.width >= 44 && button.height >= 44, button.name);
    if (width >= 1440) assert.ok(geometry.barBottom < height, `desktop dock below screen: ${geometry.barBottom}`);
    for (const state of ["ready", "waiting", "spent", "long", "gomoku"]) {
      await page.locator(".arcade-preview-toolbar select").selectOption(state);
      await page.evaluate(() => document.fonts.ready);
      const skill = page.locator(".battle-arcade-controls .skill-action");
      const visual = await skill.evaluate(el => {
        const face = el.querySelector(".action-keycap");
        const label = el.querySelector(".action-label");
        const counter = el.querySelector(".skill-use-window");
        const a = face.getBoundingClientRect(), b = counter.getBoundingClientRect(), l = label.getBoundingClientRect();
        return { disabled: el.disabled, name: label.textContent, gradient: getComputedStyle(face).backgroundImage, counter: counter.textContent,
          font: getComputedStyle(counter).fontFamily, fontLoaded: document.fonts.check('18px "Sigrika Accent Latin"', "02"),
          fits: l.bottom <= a.bottom + 1 && l.top >= b.bottom - 1 && l.left >= a.left && l.right <= a.right,
          countFits: b.top >= a.top && b.right <= a.right };
      });
      assert.equal(visual.disabled, ["waiting", "spent", "gomoku"].includes(state));
      assert.equal(visual.gradient.includes("linear-gradient"), !["spent", "gomoku"].includes(state));
      assert.ok(visual.fits && visual.countFits, `${width}/${state} clipped text`);
      assert.match(visual.font, /Sigrika Accent Latin/);
      assert.ok(visual.fontLoaded);
      if (state === "ready" || state === "long" || state === "spent") {
        await skill.scrollIntoViewIfNeeded();
        await page.screenshot({ path: fileURLToPath(new URL(`production-${state}-${width}.png`, out)), fullPage: true });
      }
      results.push({ width, height, state, ...visual });
    }
    await page.locator(".arcade-preview-toolbar select").selectOption("ready");
    for (const className of ["pass-action", "counting-action", "draw-action", "resign-action", "skill-action"]) {
      const button = page.locator(`.battle-arcade-controls .${className}`);
      await button.scrollIntoViewIfNeeded();
      const r = await button.boundingBox();
      await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
      await page.mouse.down();
      await page.waitForFunction(className => new DOMMatrix(getComputedStyle(document.querySelector(`.${className} .action-keycap`)).transform).m42 >= 0.9, className);
      await page.mouse.up();
      if (await page.getByRole("dialog").count()) await page.getByRole("button", { name: "取消", exact: true }).click();
      await page.waitForFunction(() => !document.querySelector('[data-pressed="true"]'));
    }
    await page.locator(".arcade-preview-toolbar select").selectOption("spectator");
    assert.equal(await page.locator(".battle-arcade-controls").count(), 0);
    assert.equal(await page.locator(".replay-bar").count(), 1);
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await page.goto(url);
  await page.locator(".skill-action").tap();
  assert.equal(await page.locator(".skill-action").getAttribute("aria-pressed"), "true");
  await page.locator(".skill-action").tap();
  assert.equal(await page.locator(".skill-action").getAttribute("aria-pressed"), "false");
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await page.locator(".action-keycap").first().evaluate(el => getComputedStyle(el).transitionDuration), "0s");
  for (const query of ["?duel", "?corrupted", "?theme=classic"]) {
    await page.goto(url + query);
    const display = await page.locator(".action-keycap").first().evaluate(el => getComputedStyle(el).display);
    assert.equal(display, "contents", `${query} inherited arcade layout`);
  }
  await page.close();
  assert.deepEqual(errors, []);
  await writeFile(new URL("verification-production.json", out), JSON.stringify({ results, geometryAndPresses: "passed", touch: "passed", reducedMotion: "passed", protectedSurfaces: "passed", errors }, null, 2));
  console.log(`Passed ${results.length} real-component state/viewport cases, 20 measured presses, touch and protected surfaces.`);
} finally {
  await browser.close();
}
