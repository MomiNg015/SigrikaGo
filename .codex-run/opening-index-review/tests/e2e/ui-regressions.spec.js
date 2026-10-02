import { expect, test } from "@playwright/test";

test("loads the app and exposes guarded room UI semantics", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#root")).toBeVisible();

  const css = await page.evaluate(async () => {
    const response = await fetch("/src/styles/themes/theme-components.css");
    return response.text();
  });

  expect(css).toContain(".replay-table-row.outcome-win:hover");
  expect(css).toContain(".replay-table-row.outcome-loss:focus-visible");
  expect(css).toContain("background: linear-gradient(135deg, #fff4bd, #fffbe7) !important");
  expect(css).toContain(".result-badge.win");
  expect(css).toContain("color: #d91528 !important");
  expect(css).toContain(".skill-chip.spent");
  expect(css).toContain("linear-gradient(135deg, #ece7e3, #d8d7d6 52%, #f5f1ea) padding-box");
});

test("loads Bright School targeting and scoring marker repair rules", async ({ page }) => {
  await page.goto("/");

  const css = await page.evaluate(async () => {
    const response = await fetch("/src/styles/themes/bright-school/effects.css");
    return response.text();
  });

  expect(css).toContain("bright-school-skill-action-glow");
  expect(css).toContain("bright-school-board-targeting-glow");
  expect(css).toContain(".board :is(.territory-mark, .dead-mark, .neutral-mark)");
  expect(css).toContain("transform: translate(-50%, -50%) !important");
});
