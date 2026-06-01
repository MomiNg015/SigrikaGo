import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("LeaderboardModal layout", () => {
  it("keeps column headings aligned with scrollable player rows", () => {
    const css = readFileSync(new URL("../styles/commerce-settings.css", import.meta.url), "utf8");
    const tableBlock = css.match(/\.leaderboard-table\s*\{[^}]+\}/)?.[0] ?? "";
    const headingRowBlock = css.match(/\.leaderboard-heading,\s*\.leaderboard-row\s*\{[^}]+\}/)?.[0] ?? "";
    const headingBlock = css.match(/\.leaderboard-heading\s*\{[^}]+\}/)?.[0] ?? "";
    const listBlock = css.match(/\.leaderboard-list\s*\{[^}]+\}/)?.[0] ?? "";
    const currentBlock = css.match(/\.leaderboard-current\s*\{[^}]+\}/)?.[0] ?? "";

    expect(tableBlock).toContain("--leaderboard-grid-columns");
    expect(tableBlock).toContain("--leaderboard-scroll-gutter");
    expect(headingRowBlock).toContain("grid-template-columns: var(--leaderboard-grid-columns)");
    expect(headingBlock).toContain("padding-right: calc(14px + var(--leaderboard-scroll-gutter))");
    expect(listBlock).toContain("scrollbar-gutter: stable");
    expect(currentBlock).toContain("padding-right: var(--leaderboard-scroll-gutter)");
  });
});
