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

  it("keeps leaderboard and shared modals scrollable on phone-sized browsers", () => {
    const commerceCss = readFileSync(new URL("../styles/commerce-settings.css", import.meta.url), "utf8");
    const modalCss = readFileSync(new URL("../styles/mobile-modals.css", import.meta.url), "utf8");
    const stylesEntry = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
    const backdropBlock = modalCss.match(/\.modal-backdrop\s*\{[^}]+\}/)?.[0] ?? "";
    const mobileModalMedia = mediaBlock(modalCss, "@media (max-width: 760px), (max-height: 520px)");

    expect(stylesEntry.indexOf("./styles/responsive.css")).toBeLessThan(stylesEntry.indexOf("./styles/mobile-modals.css"));
    expect(backdropBlock).toContain("overflow: auto");
    expect(backdropBlock).toContain("align-items: start");
    expect(mobileModalMedia).toContain(".leaderboard-modal");
    expect(mobileModalMedia).toContain("--mobile-modal-max-height");
    expect(mobileModalMedia).toContain("max-height: var(--mobile-modal-max-height)");
    expect(mobileModalMedia).toContain(".leaderboard-table");
    expect(mobileModalMedia).toContain("overflow-x: auto");
    expect(mobileModalMedia).toContain(".settings-modal");
    expect(mobileModalMedia).toContain(".message-board-modal");
    expect(mobileModalMedia).toContain("overscroll-behavior: contain");
    expect(mobileModalMedia).toContain("-webkit-overflow-scrolling: touch");
    expect(commerceCss).toContain("--leaderboard-grid-columns");
  });

  it("adapts all lobby utility windows for narrow mobile browsers", () => {
    const modalCss = readFileSync(new URL("../styles/mobile-modals.css", import.meta.url), "utf8");
    const phoneModalMedia = mediaBlock(modalCss, "@media (max-width: 560px)");

    expect(phoneModalMedia).toContain(".shop-modal");
    expect(phoneModalMedia).toContain(".shop-layout");
    expect(phoneModalMedia).toContain("grid-template-columns: 1fr");
    expect(phoneModalMedia).toContain(".leaderboard-modal");
    expect(phoneModalMedia).toContain(".leaderboard-table");
    expect(phoneModalMedia).toContain(".friends-modal");
    expect(phoneModalMedia).toContain(".friends-list");
    expect(phoneModalMedia).toContain(".house-modal");
    expect(phoneModalMedia).toContain(".warehouse-modal");
    expect(phoneModalMedia).toContain(".warehouse-grid");
    expect(phoneModalMedia).toContain(".small-modal.watch-list-modal");
    expect(phoneModalMedia).toContain(".watch-room-table");
    expect(phoneModalMedia).toContain("overflow: auto");
    expect(phoneModalMedia).toContain(".room-floating-modal.user-profile-modal");
    expect(phoneModalMedia).toContain("max-height: var(--mobile-modal-max-height)");
    expect(phoneModalMedia).toContain(".profile-replay-dialog");
    expect(phoneModalMedia).toContain(".replay-table");
    expect(phoneModalMedia).toContain("overflow-x: auto");
  });

  it("keeps the leaderboard table in its desktop column model on phones and scrolls it horizontally", () => {
    const modalCss = readFileSync(new URL("../styles/mobile-modals.css", import.meta.url), "utf8");
    const phoneModalMedia = mediaBlock(modalCss, "@media (max-width: 560px)");

    expect(phoneModalMedia).toContain(".leaderboard-modal");
    expect(phoneModalMedia).toContain(".leaderboard-table");
    expect(phoneModalMedia).toContain("overflow-x: auto");
    expect(phoneModalMedia).toContain(".leaderboard-heading,");
    expect(phoneModalMedia).toContain(".leaderboard-row");
    expect(phoneModalMedia).toContain("min-width: 680px");
    expect(phoneModalMedia).not.toContain("grid-template-areas:");
    expect(phoneModalMedia).not.toContain(".leaderboard-row > span:nth-of-type");
    expect(phoneModalMedia).toContain(".friends-modal");
    expect(phoneModalMedia).toContain("grid-template-rows: auto minmax(0, 1fr)");
    expect(phoneModalMedia).toContain(".friends-list");
    expect(phoneModalMedia).toContain("overflow-y: auto");
    expect(phoneModalMedia).toContain(".friend-action-row");
    expect(phoneModalMedia).toContain("overflow-x: auto");
    expect(phoneModalMedia).toContain(".friends-modal button");
    expect(phoneModalMedia).toContain("justify-content: center");
  });
});

function mediaBlock(css, marker) {
  const start = css.indexOf(marker);
  if (start < 0) return "";
  const next = css.indexOf("\n@media", start + 1);
  return css.slice(start, next >= 0 ? next : undefined);
}
