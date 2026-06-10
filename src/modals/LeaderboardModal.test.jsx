import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { leaderboardRankClass } from "./LeaderboardModal.jsx";
import LeaderboardRow from "./leaderboard/LeaderboardRow.jsx";

describe("LeaderboardModal layout", () => {
  it("exposes tactical rank classes for top-three leaderboard badges", () => {
    expect(leaderboardRankClass(1)).toBe("top-rank rank-1");
    expect(leaderboardRankClass(2)).toBe("top-rank rank-2");
    expect(leaderboardRankClass(3)).toBe("top-rank rank-3");
    expect(leaderboardRankClass(4)).toBe("");
  });

  it("shows player rank below the username instead of the character name", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardRow
        rank={2}
        characters={{
          sigrika: {
            id: "sigrika",
            name: "西格莉卡",
            portrait: "/assets/characters/sigrika.webp"
          }
        }}
        player={{
          id: "u1",
          username: "露露米",
          commonCharacter: "sigrika",
          rank: "3段",
          rating: 1160,
          totalGames: 32,
          wins: 15,
          losses: 17,
          draws: 0,
          itemEffects: {}
        }}
      />
    );

    expect(markup).toContain("露露米");
    expect(markup).toContain("3段");
    expect(markup).toContain("战绩 胜15 负17 和0");
    expect(markup).not.toContain(">西格莉卡<");
    expect(markup).not.toContain("alt=\"西格莉卡\"");
  });

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
    expect(phoneModalMedia).toContain(".leaderboard-heading");
    expect(phoneModalMedia).toContain("display: none");
    expect(phoneModalMedia).toContain(".leaderboard-row");
    expect(phoneModalMedia).toContain("grid-template-areas:");
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

  it("turns the leaderboard into mobile cards instead of a horizontally clipped table", () => {
    const modalCss = readFileSync(new URL("../styles/mobile-modals.css", import.meta.url), "utf8");
    const finalMobileCss = readFileSync(new URL("../styles/mobile-adaptive.css", import.meta.url), "utf8");
    const phoneModalMedia = mediaBlock(modalCss, "@media (max-width: 560px)");

    expect(phoneModalMedia).toContain(".leaderboard-modal");
    expect(phoneModalMedia).toContain(".leaderboard-table");
    expect(phoneModalMedia).toContain("overflow-x: hidden");
    expect(phoneModalMedia).toContain("grid-template-rows: minmax(0, 1fr) auto");
    expect(phoneModalMedia).toContain(".leaderboard-heading,");
    expect(phoneModalMedia).toContain(".leaderboard-row");
    expect(phoneModalMedia).toContain("min-width: 0");
    expect(phoneModalMedia).toContain("grid-template-areas:");
    expect(phoneModalMedia).toContain('"rank avatar player score"');
    expect(phoneModalMedia).toContain('"rank avatar player record"');
    expect(phoneModalMedia).toContain('"rank avatar player rate"');
    expect(phoneModalMedia).toContain("grid-template-columns: 34px 34px minmax(0, 1fr) minmax(96px, auto)");
    expect(phoneModalMedia).toContain("text-align: left");
    expect(phoneModalMedia).toContain(".leaderboard-row > span:nth-of-type");
    expect(phoneModalMedia).toContain(".leaderboard-mobile-record");
    expect(phoneModalMedia).toContain(".leaderboard-current .leaderboard-row");
    expect(phoneModalMedia).toContain("align-content: start");
    expect(phoneModalMedia).toContain("min-height: 72px");
    expect(phoneModalMedia).toContain(".friends-modal");
    expect(phoneModalMedia).toContain("grid-template-rows: auto minmax(0, 1fr)");
    expect(phoneModalMedia).toContain(".friends-list");
    expect(phoneModalMedia).toContain("overflow-y: auto");
    expect(phoneModalMedia).toContain(".friend-action-row");
    expect(phoneModalMedia).toContain("overflow-x: auto");
    expect(phoneModalMedia).toContain(".friends-modal button");
    expect(phoneModalMedia).toContain("justify-content: center");
    expect(finalMobileCss).toContain(".leaderboard-row.top-rank .leaderboard-rank");
    expect(finalMobileCss).toContain("border-radius: 50% !important");
    expect(finalMobileCss).toContain("clip-path: none !important");
    expect(finalMobileCss).toContain("grid-template-rows: minmax(0, 1fr) auto !important");
    expect(finalMobileCss).toContain('"rank avatar player score"');
    expect(finalMobileCss).toContain('"rank avatar player record"');
    expect(finalMobileCss).toContain('"rank avatar player rate"');
    expect(finalMobileCss).toContain("grid-template-columns: 34px 34px minmax(0, 1fr) minmax(96px, auto) !important");
    expect(finalMobileCss).toContain(".leaderboard-row > span:nth-of-type(5)");
    expect(finalMobileCss).toContain(".leaderboard-mobile-record");
    expect(finalMobileCss).toContain("border-radius: 999px !important");
    expect(finalMobileCss).toContain(".leaderboard-current .leaderboard-row");
    expect(finalMobileCss).toContain("align-content: start !important");
    expect(finalMobileCss).toContain("min-height: 72px !important");
  });
});

function mediaBlock(css, marker) {
  const start = css.indexOf(marker);
  if (start < 0) return "";
  const next = css.indexOf("\n@media", start + 1);
  return css.slice(start, next >= 0 ? next : undefined);
}
