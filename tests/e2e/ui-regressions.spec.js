import { expect, test } from "@playwright/test";

async function resolvedCss(page, entry) {
  return page.evaluate(async (entry) => {
    const visited = new Set();
    async function read(url) {
      if (visited.has(url)) return "";
      visited.add(url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`CSS ${url}: ${response.status}`);
      const css = await response.text();
      const imports = [...css.matchAll(/@import\s+["']([^"']+)["']/g)];
      const children = await Promise.all(imports.map((match) => read(new URL(match[1], url).href)));
      return [css, ...children].join("\n");
    }
    return read(new URL(entry, location.origin).href);
  }, entry);
}


test("loads the app and exposes guarded room UI semantics", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("textbox", { name: /用户名/ })).toBeVisible({ timeout: 30_000 });

  const css = await resolvedCss(page, "/src/styles/themes/theme-components.css");

  expect(css).toContain(".replay-table-row.outcome-win:hover");
  expect(css).toContain(".replay-table-row.outcome-loss:focus-visible");
  expect(css).toContain("background: linear-gradient(135deg, #fff4bd, #fffbe7) !important");
  expect(css).toContain(".result-badge.win");
  expect(css).toContain("color: #d91528 !important");
  expect(css).toContain(".skill-chip.spent");
  expect(css).toContain("linear-gradient(135deg, #ece7e3, #d8d7d6 52%, #f5f1ea) padding-box");
});

test("loads Bright School targeting and scoring marker repair rules", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const css = await resolvedCss(page, "/src/styles/themes/bright-school/effects.css");

  expect(css).toContain("bright-school-skill-action-glow");
  expect(css).toContain("bright-school-board-targeting-glow");
  expect(css).toContain(".board :is(.territory-mark, .dead-mark, .neutral-mark)");
  expect(css).toContain("transform: translate(-50%, -50%) !important");
});
