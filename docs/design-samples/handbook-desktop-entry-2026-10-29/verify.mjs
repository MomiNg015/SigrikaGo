import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const output = resolve(process.env.HANDBOOK_ENTRY_OUTPUT || ".tmp/handbook-entry-check");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [], errors = [], apiRequests = [];
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }, { width: 360, height: 640 }]) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => { if (new URL(request.url()).pathname.startsWith("/api/")) apiRequests.push(request.url()); });
    await page.goto("http://127.0.0.1:5173/docs/design-samples/handbook-desktop-entry-2026-10-29/");
    await page.locator(".handbook-puzzle-piece").first().waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll(".handbook-puzzle-portrait")].every(img => img.complete && img.naturalWidth > 0));
    const pieces = page.locator(".handbook-puzzle-piece");
    assert.equal(await pieces.count(), 10);
    if (viewport.width > 768) {
      const directions = await pieces.evaluateAll(nodes => nodes.map((node, index) => {
        const animation = node.getAnimations().find(a => a.animationName?.startsWith("handbook-strip-from-"));
        const timing = animation.effect.getTiming();
        animation.pause();
        animation.currentTime = timing.delay + 45;
        return { index, duration: timing.duration, delay: timing.delay, y: new DOMMatrix(getComputedStyle(node).transform).m42 };
      }));
      for (const { index, duration, delay, y } of directions) {
        assert.equal(duration, 300);
        assert.equal(delay, index * 40);
        assert.ok(index % 2 ? y > 0 : y < 0, `strip ${index} has the wrong direction`);
      }
      // Sample one shared time so the screenshot shows the actual stagger.
      await pieces.evaluateAll(nodes => nodes.forEach(node => {
        const animation = node.getAnimations().find(a => a.animationName?.startsWith("handbook-strip-from-"));
        animation.currentTime = 160;
      }));
      await page.screenshot({ path: resolve(output, `entry-${viewport.width}.png`) });
      await page.getByRole("button", { name: "重播入场" }).click();
      await page.waitForFunction(() => [...document.querySelectorAll(".handbook-puzzle-piece")].every(el => {
        const animation = el.getAnimations().find(a => a.animationName?.startsWith("handbook-strip-from-"));
        return animation?.playState === "finished" && Math.abs(new DOMMatrix(getComputedStyle(el).transform).m42) < .01;
      }));
      await page.screenshot({ path: resolve(output, `settled-${viewport.width}.png`) });
      await pieces.first().hover();
      await page.waitForFunction(() => document.querySelector(".handbook-puzzle-piece")?.classList.contains("is-expanded"));
      await page.getByRole("button", { name: "慢速观察" }).click();
      const duration = await pieces.first().evaluate(el => el.getAnimations().find(a => a.animationName?.startsWith("handbook-strip-from-")).effect.getTiming().duration);
      assert.equal(duration, 750);
      await page.getByRole("button", { name: "慢速观察" }).click();
    } else {
      assert.equal(await pieces.evaluateAll(nodes => nodes.flatMap(el => el.getAnimations()).filter(a => a.animationName?.startsWith("handbook-strip-from-")).length), 0);
      await page.screenshot({ path: resolve(output, `mobile-${viewport.width}.png`) });
      await pieces.last().scrollIntoViewIfNeeded();
      const last = await pieces.last().boundingBox();
      const footer = await page.locator(".entry-review-note").boundingBox();
      assert.ok(last.y + last.height <= footer.y, "last mobile strip must remain reachable above review footer");
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('.handbook-puzzle-tile[data-character-key="sigrika"]').click();
    await page.locator(".character-details-modal").waitFor();
    await page.keyboard.press("Escape");
    await page.locator(".character-details-modal").waitFor({ state: "detached" });
    await page.getByRole("button", { name: "关闭部员手册", exact: true }).click();
    await page.getByRole("button", { name: "打开部员手册", exact: true }).click();
    assert.equal(await pieces.count(), 10);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByRole("button", { name: "重播入场" }).click();
    assert.equal(await pieces.evaluateAll(nodes => nodes.flatMap(el => el.getAnimations()).filter(a => a.animationName?.startsWith("handbook-strip-from-")).length), 0);
    assert.equal(await page.evaluate(async () => (await fetch("/api/costumes/equip", { method: "POST" })).status), 403);
    results.push({ viewport, alternatingEntry: viewport.width > 768, replay: true, details: true, reducedMotion: true });
    await page.close();
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(apiRequests, []);
  await writeFile(resolve(output, "verification.json"), JSON.stringify({ results, errors, apiRequests }, null, 2));
  console.log(JSON.stringify({ passed: results.length, errors, apiRequests, output }));
} finally {
  await browser.close();
}
