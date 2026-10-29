import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const url = "http://127.0.0.1:5173/docs/design-samples/battle-arcade-2026-10-29/tutorial.html";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
const errors = [];
const expected = {
  dialogue: { count: 1, focus: "" },
  automatic: { count: 5, focus: "", action: "" },
  choices: { count: 2, focus: "choices" },
  move: { count: 5, focus: "board", action: "" },
  skill: { count: 5, focus: "actions", action: "skill" },
  counting: { count: 5, focus: "actions", action: "counting" },
  resign: { count: 5, focus: "actions", action: "resign" },
  pass: { count: 5, focus: "actions", action: "pass" },
  draw: { count: 5, focus: "actions", action: "draw" }
};
try {
  for (const [width, height] of [[1440, 768], [390, 844], [320, 568]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(url);
    await page.locator(".tutorial-battle-root .action-bar").waitFor();
    await page.evaluate(() => document.fonts.ready);
    for (const [state, contract] of Object.entries(expected)) {
      await page.locator(".tutorial-preview-toolbar select").selectOption(state);
      await page.waitForFunction(({ count, focus, action }) => {
        const bar = document.querySelector(".tutorial-battle-root .action-bar");
        return bar?.querySelectorAll("button").length === count
          && (bar.dataset.tutorialAction || "") === (action || "")
          && (document.querySelector(".tutorial-input-focus")?.dataset.focusMode || "") === focus;
      }, contract);
      const bar = page.locator(".tutorial-battle-root .action-bar");
      const geometry = await bar.evaluate(bar => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        arcade: bar.classList.contains("battle-arcade-controls"),
        counter: Boolean(bar.querySelector(".skill-use-window")),
        enabled: [...bar.querySelectorAll("button:not(:disabled)")].map(button => button.className),
        buttons: [...bar.querySelectorAll("button")].map(button => ({ text: button.textContent, width: button.offsetWidth, height: button.offsetHeight }))
      }));
      assert.equal(geometry.overflow, false, `${width}/${state} overflow`);
      assert.equal(geometry.arcade, contract.count === 5);
      assert.equal(geometry.counter, contract.count === 5);
      if (contract.count === 5) {
        assert.equal(geometry.enabled.length, contract.action ? 1 : 0);
        if (contract.action) assert.ok(geometry.enabled[0].includes(`${contract.action}-action`));
      }
      for (const button of geometry.buttons) assert.ok(button.width >= 44 && button.height >= 42);
      if (state === "choices" && width < 900) {
        const bounds = await bar.locator("button").evaluateAll(buttons => buttons.map(button => {
          const label = button.querySelector("span"), r = button.getBoundingClientRect();
          return { x: r.x, width: r.width, labelWidth: label.offsetWidth, labelHeight: label.offsetHeight };
        }));
        assert.ok(bounds.every(rect => rect.width >= width - 80 && rect.labelWidth >= width - 180 && rect.labelHeight < 90));
      }
      await bar.scrollIntoViewIfNeeded();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      if (["choices", "actions"].includes(contract.focus)) {
        const cutouts = await page.locator(".tutorial-input-focus mask path").evaluateAll(paths => paths.map(path => path.getAttribute("d")));
        assert.equal(cutouts.length, contract.focus === "choices" ? 2 : 1);
        assert.ok(cutouts.every(path => path.includes(" A ")), "cutouts must follow actual corner arcs");
      }
      await page.screenshot({ path: fileURLToPath(new URL(`tutorial-${state}-${width}.png`, import.meta.url)), fullPage: true });
      results.push({ width, height, state, focus: contract.focus, ...geometry });
    }
    await page.locator(".tutorial-preview-toolbar select").selectOption("skill");
    await page.locator(".battle-arcade-controls .skill-action").click();
    await page.locator('.tutorial-input-focus[data-focus-mode="board"]').waitFor();
    assert.equal(await page.locator(".battle-arcade-controls button").count(), 5);
    assert.equal(await page.locator(".battle-arcade-controls button:not(:disabled)").count(), 0);
    await page.locator('.point[data-point-id="6,6"]').click();
    await page.locator(".tutorial-action-bar").getByRole("button", { name: "继续", exact: true }).waitFor({ timeout: 15000 });
    await page.getByRole("button", { name: "重置此步" }).click();
    await page.locator('.skill-action[data-tutorial-target="true"]').waitFor();
    await page.locator(".tutorial-preview-toolbar select").selectOption("pass");
    await page.locator('.pass-action[data-tutorial-target="true"]').evaluate(button => { button.click(); button.click(); });
    await page.locator(".tutorial-action-bar").getByRole("button", { name: "继续", exact: true }).waitFor();
    assert.equal(await page.locator(".room-move-placard strong").innerText(), "1");
    for (const state of ["counting", "draw", "resign"]) {
      await page.locator(".tutorial-preview-toolbar select").selectOption(state);
      await page.locator(`[data-tutorial-target="true"].${state}-action`).click();
      await page.locator(".tutorial-action-bar").getByRole("button", { name: "继续", exact: true }).waitFor();
    }
    await page.locator(".tutorial-preview-toolbar select").selectOption("choices");
    await page.locator(".tutorial-action-bar").getByRole("button", { name: "准备好了，开始落子" }).click();
    await page.locator('.tutorial-input-focus[data-focus-mode="board"]').waitFor();
    await page.locator('.point[data-point-id="6,6"]').click();
    await page.locator(".tutorial-action-bar").getByRole("button", { name: "继续", exact: true }).waitFor();
    assert.equal(await page.locator(".tutorial-input-focus").count(), 0);
    if (width < 900) {
      await page.locator(".tutorial-preview-toolbar select").selectOption("dialogue");
      const trigger = page.locator(".room-header-story-log");
      assert.equal(await trigger.innerText(), "");
      const logRect = await trigger.boundingBox(), exitRect = await page.locator(".room-mobile-exit").boundingBox();
      assert.ok(logRect.x + logRect.width <= exitRect.x && Math.abs(logRect.y - exitRect.y) <= 2);
      assert.equal(await page.locator(".room-story-log-entry").count(), 0);
      await trigger.click();
      const popup = page.locator('.chat-popover[data-open="true"]');
      await popup.waitFor();
      await page.waitForFunction(() => {
        const popup = document.querySelector('.chat-popover[data-open="true"]');
        return popup && getComputedStyle(popup).transform === "none";
      });
      const rect = await popup.boundingBox();
      assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= width && rect.y + rect.height <= height);
      assert.ok((await popup.innerText()).includes("先看看棋盘"));
      await page.screenshot({ path: fileURLToPath(new URL(`tutorial-log-${width}.png`, import.meta.url)) });
      await page.keyboard.press("Escape");
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");
      assert.ok(await trigger.evaluate(el => el === document.activeElement));
      await trigger.click();
      await page.locator(".room-move-placard").click();
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    }
    await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(new URL("verification-tutorial.json", import.meta.url), JSON.stringify({ results, transitions: "all five guided actions, duplicate-pass guard, skill-to-board retention, replacement choices, move-to-continue and mobile header-log passed", errors }, null, 2));
  console.log(`Passed ${results.length} tutorial states and real transitions at desktop, 390px and 320px.`);
} finally {
  await browser.close();
}
