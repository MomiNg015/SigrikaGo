import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const url = "http://127.0.0.1:5173/docs/design-samples/battle-arcade-2026-10-29/tutorial.html";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
const errors = [];
const expected = {
  dialogue: { buttons: ["继续"], focus: "" },
  choices: { buttons: ["准备好了，开始落子", "再讲解一下"], focus: "choices" },
  move: { buttons: [], focus: "board" },
  skill: { buttons: ["星辉符文"], focus: "actions" },
  counting: { buttons: ["数目"], focus: "actions" },
  resign: { buttons: ["认输"], focus: "actions" }
};
try {
  for (const [width, height] of [[1440, 900], [390, 844], [320, 568]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(url);
    await page.locator(".tutorial-action-bar").waitFor();
    await page.evaluate(() => document.fonts.ready);
    for (const [state, contract] of Object.entries(expected)) {
      await page.locator(".tutorial-preview-toolbar select").selectOption(state);
      await page.waitForFunction(({ buttons, focus }) => {
        const actual = [...document.querySelectorAll(".tutorial-action-bar button")].map(button => button.textContent.trim());
        return JSON.stringify(actual) === JSON.stringify(buttons)
          && (document.querySelector(".tutorial-input-focus")?.dataset.focusMode || "") === focus;
      }, contract);
      const geometry = await page.locator(".tutorial-action-bar").evaluate(bar => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        arcade: bar.classList.contains("battle-arcade-controls"),
        counter: Boolean(bar.querySelector(".skill-use-window")),
        buttons: [...bar.querySelectorAll("button")].map(button => ({ text: button.textContent, width: button.offsetWidth, height: button.offsetHeight }))
      }));
      assert.equal(geometry.overflow, false, `${width}/${state} overflow`);
      assert.equal(geometry.arcade, false);
      assert.equal(geometry.counter, false);
      for (const button of geometry.buttons) assert.ok(button.width >= 44 && button.height >= 42);
      await page.locator(".tutorial-action-bar").scrollIntoViewIfNeeded();
      if (state === "move") await page.locator('.point[data-point-id="6,6"]').scrollIntoViewIfNeeded();
      await page.screenshot({ path: fileURLToPath(new URL(`tutorial-${state}-${width}.png`, import.meta.url)), fullPage: true });
      results.push({ width, height, state, focus: contract.focus, ...geometry });
    }
    await page.locator(".tutorial-preview-toolbar select").selectOption("skill");
    await page.locator(".tutorial-action-bar .skill-action").click();
    await page.locator('.tutorial-input-focus[data-focus-mode="board"]').waitFor();
    assert.equal(await page.locator(".tutorial-action-bar button").count(), 0);
    await page.getByRole("button", { name: "重置此步" }).click();
    await page.locator(".tutorial-action-bar .skill-action").waitFor();
    await page.locator(".tutorial-preview-toolbar select").selectOption("choices");
    await page.locator(".tutorial-action-bar").getByRole("button", { name: "准备好了，开始落子" }).click();
    await page.locator('.tutorial-input-focus[data-focus-mode="board"]').waitFor();
    await page.locator('.point[data-point-id="6,6"]').click();
    await page.locator(".tutorial-action-bar").getByRole("button", { name: "继续", exact: true }).waitFor();
    assert.equal(await page.locator(".tutorial-input-focus").count(), 0);
    await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(new URL("verification-tutorial.json", import.meta.url), JSON.stringify({ results, transitions: "skill to board, reset, choice to move, valid move to continue passed at every viewport", errors }, null, 2));
  console.log(`Passed ${results.length} tutorial states and real transitions at desktop, 390px and 320px.`);
} finally {
  await browser.close();
}
