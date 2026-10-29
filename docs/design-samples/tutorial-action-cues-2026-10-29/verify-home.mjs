import { chromium } from "playwright";
import { HOME_ONBOARDING_STEPS } from "../../../src/home/onboarding/homeOnboardingScript.js";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const base = "http://127.0.0.1:5173/docs/design-samples/tutorial-action-cues-2026-10-29/";
const output = process.env.CUE_ARTIFACT_DIR || fileURLToPath(new URL(".", import.meta.url));
await mkdir(output, { recursive: true });
const artifact = name => resolve(output, name);
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [], tours = [], errors = [], apiRequests = [];
const advance = async page => {
  const id = await page.locator('.home-onboarding').getAttribute('data-step');
  const step = HOME_ONBOARDING_STEPS.find(entry => entry.id === id);
  if (step.text) {
    await page.waitForFunction(expected => document.querySelector('.home-guide-panel p')?.textContent === expected, step.text);
  }
  await page.locator(step.action ? '.home-guide-target' : step.choice ? '.home-guide-choice' : '.tutorial-battle-dialogue').click();
  await page.waitForFunction(previous => document.querySelector('.home-onboarding')?.dataset.step !== previous, id);
};
const checkComponent = async page => {
  const id = await page.locator('.home-onboarding').getAttribute('data-step');
  const step = HOME_ONBOARDING_STEPS.find(entry => entry.id === id);
  const selector = step.target ? `[data-home-guide="${step.target}"]` : step.surface;
  await page.waitForFunction(selector => {
    const layer = document.querySelector('.home-guide-highlight');
    const copy = layer?.querySelector('[data-guide-paint-node="0"]');
    const source = [...document.querySelectorAll(selector)].find(el => { const r = el.getBoundingClientRect(); return r.width && r.height && !el.closest('[aria-hidden="true"], [inert]'); });
    if (layer?.dataset.guideSource !== selector || !copy || !source || Number(getComputedStyle(copy).opacity) < .99) return false;
    const a = copy.getBoundingClientRect(), b = source.getBoundingClientRect();
    return ['x', 'y', 'width', 'height'].every(key => Math.abs(a[key] - b[key]) < 1)
      && getComputedStyle(copy).backgroundColor === getComputedStyle(source).backgroundColor;
  }, selector);
};
const checkCue = async (page, label) => {
  await page.locator('.home-guide-spotlight').waitFor();
  await page.waitForFunction(() => {
    const a = document.querySelector('.guide-focus-marker')?.getBoundingClientRect();
    const b = (document.querySelector('.home-guide-target') || document.querySelector('.home-guide-spotlight'))?.getBoundingClientRect();
    return a && b && ['x', 'y', 'width', 'height'].every(key => Math.abs(a[key] - b[key]) < .5);
  });
  const checks = await page.evaluate(() => {
    const cue = document.querySelector('.guide-focus-marker');
    const proxy = document.querySelector('.home-guide-target');
    const target = proxy || document.querySelector('.home-guide-spotlight');
    const rect = target.getBoundingClientRect();
    const frames = [0, 380, 620, 1500].map(time => {
      cue.getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = time; });
      const art = cue.querySelector('.guide-focus-corners').getBoundingClientRect();
      return art.left >= 1 && art.right <= innerWidth - 1 && art.top >= 1 && art.bottom <= innerHeight - 1;
    });
    return { frames, hit: !proxy || document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) === target,
      bounds: rect.toJSON(), overflow: document.documentElement.scrollWidth > innerWidth,
      markerOnly: document.querySelectorAll('.home-guide-spotlight .guide-focus-corners').length === 1,
      noRectCutout: !document.querySelector('.home-guide-scrim path'),
      componentCopy: Boolean(document.querySelector('.home-guide-highlight [data-guide-paint-node="0"]')) };
  });
  assert.ok(checks.frames.every(Boolean), `paint bounds: ${label} ${JSON.stringify(checks.bounds)}`);
  assert.ok(checks.hit, `target proxy owns click: ${label}`);
  assert.ok(checks.markerOnly, `avoid duplicate action decorations: ${label}`);
  assert.ok(checks.noRectCutout && checks.componentCopy, `highlight component pixels: ${label}`);
  assert.equal(checks.overflow, false);
  return checks;
};
try {
  const page = await browser.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url()); });
  for (const [width, height] of [[390, 844], [320, 568], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    for (const target of ['home-handbook', 'home-details', 'home-match', 'home-mailbox', 'home-resume']) {
      await page.goto(`${base}scene.html?target=${target}&variant=focus`);
      await page.locator('.home-cue-scene.is-ready').waitFor();
      await page.evaluate(() => document.fonts.ready);
      await checkComponent(page);
      const checks = await checkCue(page, `${width}/${target}`);
      if (width !== 320) await page.screenshot({ path: artifact(`preview-${target}-${width > 900 ? 'desktop' : 'phone'}.png`) });
      await advance(page);
      if (target === 'home-handbook') {
        assert.equal(await page.locator('.home-onboarding').getAttribute('data-step'), 'handbook-intro');
        await checkCue(page, `${width}/member-card`);
        await advance(page);
      }
      const nextId = await page.locator('.home-onboarding').getAttribute('data-step');
      const nextStep = HOME_ONBOARDING_STEPS.find(entry => entry.id === nextId);
      if (nextStep.target || nextStep.surface) {
        await checkComponent(page);
        await checkCue(page, `${width}/${nextId}`);
      } else {
        await page.locator('.guide-focus-marker').waitFor({ state: 'detached' });
        await page.locator('.home-guide-highlight').waitFor({ state: 'detached' });
      }
      if (target === 'home-handbook' && width !== 320) await page.screenshot({ path: artifact(`preview-home-window-${width > 900 ? 'desktop' : 'phone'}.png`) });
      results.push({ width, height, target, ...checks, nextStep: await page.locator('.home-onboarding').getAttribute('data-step') });
    }
  }
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}scene.html?target=home-handbook&variant=focus`);
    await page.locator('.home-cue-scene.is-ready').waitFor();
    for (const step of HOME_ONBOARDING_STEPS.slice(1)) {
      await page.waitForFunction(id => document.querySelector('.home-onboarding')?.dataset.step === id, step.id);
      if (step.target || step.surface) {
        await checkComponent(page);
        await checkCue(page, `${width}/tour/${step.id}`);
        tours.push({ width, step: step.id, fullBrightness: true, cue: true });
      } else {
        await page.locator('.guide-focus-marker').waitFor({ state: 'detached' });
      }
      await advance(page);
    }
    await page.locator('.home-onboarding').waitFor({ state: 'detached' });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base);
  const frame = page.frameLocator('#scene');
  await frame.locator('.home-guide-spotlight').waitFor();
  await page.locator('#pause').click();
  await frame.locator('.guide-focus-corners').evaluate(el => new Promise(resolve => {
    const check = () => getComputedStyle(el).animationPlayState === 'paused' ? resolve() : requestAnimationFrame(check);
    check();
  }));
  assert.equal(await frame.locator('.guide-focus-corners').evaluate(el => getComputedStyle(el).animationPlayState), 'paused');
  await page.selectOption('#target', 'skill');
  await frame.locator('.tutorial-action-focus').waitFor();
  await page.selectOption('#target', 'home-match');
  await frame.locator('.home-guide-spotlight').waitFor();
  await page.locator('#replay').click();
  await frame.locator('.home-cue-scene.is-ready').waitFor();
  assert.equal(await frame.locator('.home-onboarding').getAttribute('data-step'), 'match-intro');
  await page.selectOption('#target', 'home-handbook');
  await frame.locator('.home-cue-scene.is-ready').waitFor();
  await page.locator('#pause').click();
  await page.screenshot({ path: artifact('preview-review.png') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${base}scene.html?target=home-handbook`);
  await page.locator('.guide-focus-marker').waitFor();
  assert.equal(await page.locator('.guide-focus-marker').evaluate(el => el.getAnimations({ subtree: true }).length), 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(apiRequests, []);
  await writeFile(artifact('verification-home.json'), JSON.stringify({ cases: results, tours, controls: 'home/battle switch, pause, replay, reduced motion passed', errors, apiRequests }, null, 2) + '\n');
  console.log(`Passed ${results.length} home checkpoint cases, ${tours.length} full-tour highlights, controls; no API traffic.`);
} finally { await browser.close(); }
