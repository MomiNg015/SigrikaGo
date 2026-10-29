import { chromium } from "playwright";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const base = "http://127.0.0.1:5173/docs/design-samples/tutorial-action-cues-2026-10-29/";
const output = process.env.CUE_ARTIFACT_DIR || fileURLToPath(new URL(".", import.meta.url));
await mkdir(output, { recursive: true });
const artifact = name => resolve(output, name);
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [], errors = [];
const snapshot = (page, name) => page.screenshot({ path: artifact(name) });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("pageerror", error => errors.push(error.message));
  for (const [width, height] of [[390, 844], [320, 568], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    for (const target of ["skill", "move", "counting"]) {
      for (const variant of ["focus", "halo", "hand"]) {
        await page.goto(`${base}scene.html?variant=${variant}&target=${target}`);
        const cueSelector = variant === "focus" ? ".tutorial-action-focus" : ".action-cue";
        await page.locator(cueSelector).waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.mouse.move(0, 0);
        await page.waitForFunction(() => {
          const cue = document.querySelector('.action-cue, .tutorial-action-focus');
          const button = document.querySelector('.battle-arcade-controls [data-tutorial-target="true"]');
          const target = document.querySelector('.tutorial-input-focus')?.dataset.focusMode === 'board' ? document.querySelector('.point[data-point-id="6,6"]') : button?.querySelector('.action-keycap');
          if (!cue || !target) return false;
          const a = cue.getBoundingClientRect(), b = target.getBoundingClientRect();
          return cue.classList.contains('tutorial-action-focus') ? a.left <= b.left && a.right >= b.right && a.top <= b.top && a.bottom >= b.bottom : ['x', 'y', 'width', 'height'].every(key => Math.abs(a[key] - b[key]) < .5);
        });
        // Inspect a deterministic point in the repeating cue without freezing production layout.
        await page.evaluate(() => document.querySelector(".action-cue, .tutorial-action-focus").getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = 380; }));
        const result = await page.evaluate(() => {
          const cue = document.querySelector(".action-cue, .tutorial-action-focus");
          const targetButton = document.querySelector('.battle-arcade-controls [data-tutorial-target="true"]:not(:disabled)');
          const targetElement = document.querySelector(".tutorial-input-focus").dataset.focusMode === "board" ? document.querySelector('.point[data-point-id="6,6"]') : targetButton.querySelector(".action-keycap");
          const a = cue.getBoundingClientRect(), b = targetElement.getBoundingClientRect();
          const art = cue.querySelector(".pointing-hand, .focus-corners, .guide-focus-corners, .halo-edge").getBoundingClientRect();
          const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
          return {
            aligned: cue.classList.contains("tutorial-action-focus") ? a.left <= b.left && a.right >= b.right && a.top <= b.top && a.bottom >= b.bottom : ["x", "y", "width", "height"].every(key => Math.abs(a[key] - b[key]) < 1),
            inputPasses: (targetButton || targetElement).contains(hit),
            visible: art.left >= 0 && art.right <= innerWidth && art.top >= 0 && art.bottom <= innerHeight,
            overflow: document.documentElement.scrollWidth > innerWidth,
            maskOpacity: document.querySelector('.tutorial-input-focus > rect').getAttribute("fill-opacity"),
            rect: a.toJSON(), art: art.toJSON()
          };
        });
        assert.ok(result.aligned, `target tracking: ${width}/${target}/${variant}`);
        assert.ok(result.inputPasses, `click through: ${width}/${target}/${variant}`);
        assert.ok(result.visible, `cue clipped: ${width}/${target}/${variant} ${JSON.stringify(result.art)}`);
        assert.equal(result.overflow, false);
        assert.equal(result.maskOpacity, "0.2");
        if (width === 390 && target !== "counting") await snapshot(page, `preview-${variant}-${target}-phone.png`);
        if (width === 1440 && target === "skill") await snapshot(page, `preview-${variant}-desktop.png`);
        if (target === "skill") {
          await page.locator('.battle-arcade-controls [data-tutorial-target="true"]').click();
          await page.locator('.tutorial-input-focus[data-focus-mode="board"]').waitFor();
        }
        if (target !== "counting") await page.locator('.point[data-point-id="6,6"]').click();
        else await page.locator('.battle-arcade-controls [data-tutorial-target="true"]').click();
        await page.locator('.action-cue, .tutorial-action-focus').waitFor({ state: "detached" });
        results.push({ width, height, target, variant, ...result, completed: true });
      }
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base);
  const scene = page.frameLocator("#scene");
  await scene.locator('.home-guide-spotlight').waitFor();
  await page.selectOption('#target', 'skill');
  await scene.locator(".tutorial-action-focus").waitFor();
  for (const variant of ["halo", "hand", "focus"]) {
    await page.locator(`[data-variant="${variant}"]`).click();
    await scene.locator(variant === "focus" ? ".tutorial-action-focus" : `.action-cue[data-cue-variant="${variant}"]`).waitFor();
  }
  await page.locator('#pause').click();
  await scene.locator('.guide-focus-corners').evaluate(el => new Promise(resolve => {
    const check = () => getComputedStyle(el).animationPlayState === 'paused' ? resolve() : requestAnimationFrame(check);
    check();
  }));
  assert.equal(await scene.locator('.guide-focus-corners').evaluate(el => getComputedStyle(el).animationPlayState), "paused");
  await scene.locator('.battle-arcade-controls [data-tutorial-target="true"]').click();
  await scene.locator('.tutorial-input-focus[data-focus-mode="board"]').waitFor();
  await page.locator('#replay').click();
  await scene.locator('.tutorial-input-focus[data-focus-mode="actions"]').waitFor();
  await page.locator('#pause').click();
  await snapshot(page, 'preview-review.png');
  for (const variant of ["focus", "halo", "hand"]) {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${base}scene.html?variant=${variant}`);
    await page.locator(variant === 'focus' ? '.tutorial-action-focus' : '.action-cue').waitFor();
    assert.equal(await page.locator(variant === 'focus' ? '.tutorial-action-focus' : '.action-cue').evaluate(el => el.getAnimations({ subtree: true }).length), 0);
  }
  assert.deepEqual(errors, []);
  await writeFile(artifact("verification.json"), JSON.stringify({ cases: results, controls: "variant switch, pause, replay, skill-to-point, completion, reduced motion passed", errors }, null, 2) + "\n");
  console.log(`Passed ${results.length} viewport/target/variant cases, controls and reduced motion.`);
} finally { await browser.close(); }
