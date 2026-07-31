import { describe, expect, it } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import LeaderboardModal, { isLeaderboardCurrentUser, leaderboardRankClass } from "./LeaderboardModal.jsx";
import LeaderboardRow from "./leaderboard/LeaderboardRow.jsx";

describe("LeaderboardModal layout", () => {
  it("renders a text-only leaderboard header", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardModal token="token" user={{ id: "u1" }} characters={{}} onClose={() => {}} />
    );

    expect(markup).toContain('<header class="leaderboard-header"><h2 id="leaderboard-modal-title">排行榜</h2></header>');
    expect(markup).not.toContain("至少完成一盘对局的注册用户");
    expect(markup).not.toContain("lucide-trophy");
  });

  it("exposes tactical rank classes for top-three leaderboard badges", () => {
    expect(leaderboardRankClass(1)).toBe("top-rank rank-1");
    expect(leaderboardRankClass(2)).toBe("top-rank rank-2");
    expect(leaderboardRankClass(3)).toBe("top-rank rank-3");
    expect(leaderboardRankClass(4)).toBe("");
  });

  it("matches the current leaderboard user across id shape and username fallback", () => {
    expect(isLeaderboardCurrentUser({ id: 7, username: "moming" }, { id: "7", username: "other" })).toBe(true);
    expect(isLeaderboardCurrentUser({ id: null, username: "moming" }, { id: "u1", username: "moming" })).toBe(true);
    expect(isLeaderboardCurrentUser({ id: 8, username: "moming" }, { id: 7, username: "other" })).toBe(false);
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
    expect(markup).toContain("text-rating-value");
    expect(markup).toContain("战绩 胜15 负17 和0");
    expect(markup).not.toContain(">西格莉卡<");
    expect(markup).not.toContain("alt=\"西格莉卡\"");
  });

  it("marks current-user leaderboard rows for distinct green treatment", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardRow
        rank={5}
        characters={{}}
        player={{
          id: "u1",
          username: "moming",
          commonCharacter: "sigrika",
          rank: "9段",
          rating: 1900,
          totalGames: 32,
          wins: 15,
          losses: 17,
          draws: 0,
          itemEffects: {}
        }}
        highlight
        pinned
      />
    );
    const brightSchoolCss = readCssWithImports(new URL("../styles/themes/bright-school/component-repairs.css", import.meta.url));
    const finalMobileCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));
    const rankBackgroundOwners = [
      [
        readFileSync(new URL("../styles/themes/bright-school/modals/leaderboard.css", import.meta.url), "utf8"),
        ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .leaderboard-row.current-user .leaderboard-rank"
      ],
      [
        readFileSync(new URL("../styles/themes/bright-school/component-repairs/lists-profile.css", import.meta.url), "utf8"),
        ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .leaderboard-row.current-user .leaderboard-rank"
      ],
      [
        readFileSync(new URL("../styles/mobile-adaptive/bright-school-overrides/leaderboard-cards/modal-list-shell.css", import.meta.url), "utf8"),
        ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .leaderboard-row.current-user .leaderboard-rank"
      ]
    ];

    expect(markup).toContain("leaderboard-row");
    expect(markup).toContain("leaderboard-avatar");
    expect(markup).toContain("data-character-id=\"sigrika\"");
    expect(markup).toContain("current-user");
    expect(markup).toContain("pinned");
    expect(brightSchoolCss).toContain(".leaderboard-row.current-user");
    expect(brightSchoolCss).toContain(".leaderboard-current .leaderboard-row");
    expect(brightSchoolCss).toContain("#73b79f");
    expect(finalMobileCss).toContain(".leaderboard-row.current-user");
    expect(finalMobileCss).toContain(".leaderboard-current .leaderboard-row");
    expect(finalMobileCss).toContain("linear-gradient(135deg, rgba(226, 255, 228, 0.96), rgba(246, 255, 241, 0.98))");
    for (const [css, selector] of rankBackgroundOwners) {
      const rankBlock = cssBlock(css, selector);
      expect(rankBlock).toContain("background: transparent !important;");
      expect(rankBlock).not.toContain("#dff5df");
    }
  });

  it("keeps column headings aligned with scrollable player rows", () => {
    const css = readCssWithImports(new URL("../styles/commerce-settings.css", import.meta.url));
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
    expect(listBlock).toContain("padding-right: 6px");
    expect(listBlock).toContain("padding-bottom: 6px");
    expect(listBlock).toContain("scroll-padding: 0 6px 6px 0");
    expect(currentBlock).toContain("padding-right: calc(var(--leaderboard-scroll-gutter) + 6px)");
    expect(currentBlock).toContain("padding-bottom: 6px");
  });

  it("keeps leaderboard and shared modals scrollable on phone-sized browsers", () => {
    const commerceCss = readCssWithImports(new URL("../styles/commerce-settings.css", import.meta.url));
    const modalCss = readCssWithImports(new URL("../styles/mobile-modals.css", import.meta.url));
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
    const modalCss = readCssWithImports(new URL("../styles/mobile-modals.css", import.meta.url));
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

  it("uses one-line short labels for leaderboard mode tabs", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardModal token="token" user={{ id: "u1" }} characters={{}} onClose={() => {}} />
    );
    const modalCss = readCssWithImports(new URL("../styles/modals.css", import.meta.url));

    expect(markup).toContain(">五子棋</button>");
    expect(markup).not.toContain(">来下五子棋吗？</button>");
    expect(modalCss).toContain("grid-template-columns: repeat(3, minmax(0, 1fr));");
    expect(modalCss).toContain("white-space: nowrap;");
    expect(modalCss).toContain("word-break: keep-all;");
  });

  it("turns the leaderboard into mobile cards instead of a horizontally clipped table", () => {
    const modalCss = readCssWithImports(new URL("../styles/mobile-modals.css", import.meta.url));
    const finalMobileCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));
    const phoneModalMedia = mediaBlock(modalCss, "@media (max-width: 560px)");

    expect(phoneModalMedia).toContain(".leaderboard-modal");
    expect(phoneModalMedia).toContain(".leaderboard-table");
    expect(phoneModalMedia).toContain("overflow-x: hidden");
    expect(phoneModalMedia).toContain("grid-template-rows: minmax(0, 1fr) auto");
    expect(phoneModalMedia).toContain(".leaderboard-heading,");
    expect(phoneModalMedia).toContain(".leaderboard-row");
    expect(phoneModalMedia).toContain("min-width: 0");
    expect(phoneModalMedia).toContain("padding-right: 6px");
    expect(phoneModalMedia).toContain("padding-bottom: 6px");
    expect(phoneModalMedia).toContain("scroll-padding: 0 6px 6px 0");
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
    expect(phoneModalMedia).toContain("grid-template-rows: auto auto minmax(0, 1fr)");
    expect(phoneModalMedia).toContain(".friends-list");
    expect(phoneModalMedia).toContain("overflow-y: auto");
    expect(phoneModalMedia).toContain(".friend-action-row");
    expect(phoneModalMedia).toContain("overflow-x: auto");
    expect(phoneModalMedia).toContain(".friends-modal button");
    expect(phoneModalMedia).toContain("justify-content: center");
    expect(finalMobileCss).toContain(".leaderboard-row.top-rank .leaderboard-rank");
    expect(finalMobileCss).toContain("border-radius: 0 !important");
    expect(finalMobileCss).toContain("background: transparent !important");
    expect(finalMobileCss).toContain("clip-path: none !important");
    expect(finalMobileCss).toContain("grid-template-rows: minmax(0, 1fr) auto !important");
    expect(finalMobileCss).toContain(".leaderboard-current");
    expect(finalMobileCss).toContain("padding: 4px 6px 6px 0 !important");
    expect(finalMobileCss).toContain("padding-right: 6px !important");
    expect(finalMobileCss).toContain("padding-bottom: 6px !important");
    expect(finalMobileCss).toContain('"rank avatar player score"');
    expect(finalMobileCss).toContain('"rank avatar player record"');
    expect(finalMobileCss).toContain('"rank avatar player rate"');
    expect(finalMobileCss).toContain("grid-template-columns: 30px 42px minmax(0, 1fr) minmax(96px, auto) !important");
    expect(finalMobileCss).toContain("padding: 8px 8px 8px 0 !important");
    expect(finalMobileCss).toContain("width: 40px !important");
    expect(finalMobileCss).toContain("height: 44px !important");
    expect(finalMobileCss).toContain(".leaderboard-player .user-identity");
    expect(finalMobileCss).toContain("justify-items: center !important");
    expect(finalMobileCss).toContain("justify-content: center !important");
    expect(finalMobileCss).toContain(".leaderboard-player .user-identity.compact .user-identity-name");
    expect(finalMobileCss).not.toContain("user-identity-fit-font-size");
    expect(finalMobileCss).toContain("text-overflow: clip !important");
    expect(finalMobileCss).toContain(".leaderboard-player > span");
    expect(finalMobileCss).toContain("width: auto !important");
    expect(finalMobileCss).toContain("margin-left: 0 !important");
    expect(finalMobileCss).toContain(".leaderboard-row > span:nth-of-type(5)");
    expect(finalMobileCss).toContain(".leaderboard-mobile-record");
    expect(finalMobileCss).toContain("border-radius: 999px !important");
    expect(finalMobileCss).toContain(".leaderboard-current .leaderboard-row");
    expect(finalMobileCss).toContain("align-content: start !important");
    expect(finalMobileCss).toContain("min-height: 72px !important");
    expect(finalMobileCss).toContain("width: 34px !important");
    expect(finalMobileCss).toContain("font-size: 17px !important");
  });

  it("uses textured row-level gold, silver, and bronze highlights instead of top-rank number triangles", () => {
    const commerceCss = readCssWithImports(new URL("../styles/commerce-settings.css", import.meta.url));
    const brightSchoolCss = readCssWithImports(new URL("../styles/themes/bright-school.css", import.meta.url));
    const finalMobileCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));
    const topRankBadgeBlock = commerceCss.match(/\.leaderboard-row\.top-rank \.leaderboard-rank\s*\{[^}]+\}/)?.[0] ?? "";

    expect(commerceCss).toContain(".leaderboard-row.rank-1");
    expect(commerceCss).toContain('url("/assets/leaderboard/top-rank-gold.webp")');
    expect(commerceCss).toContain(".leaderboard-row.rank-2");
    expect(commerceCss).toContain('url("/assets/leaderboard/top-rank-silver.webp")');
    expect(commerceCss).toContain(".leaderboard-row.rank-3");
    expect(commerceCss).toContain('url("/assets/leaderboard/top-rank-bronze.webp")');
    expect(topRankBadgeBlock).toContain("background: transparent");
    expect(topRankBadgeBlock).toContain("clip-path: none");
    expect(topRankBadgeBlock).not.toContain("polygon(50% 100%, 0 0, 100% 0)");
    expect(brightSchoolCss).toContain(".leaderboard-row.rank-1");
    expect(brightSchoolCss).toContain('url("/assets/leaderboard/top-rank-gold.webp")');
    expect(brightSchoolCss).toContain(".leaderboard-row.rank-2");
    expect(brightSchoolCss).toContain('url("/assets/leaderboard/top-rank-silver.webp")');
    expect(brightSchoolCss).toContain(".leaderboard-row.rank-3");
    expect(brightSchoolCss).toContain('url("/assets/leaderboard/top-rank-bronze.webp")');
    expect(brightSchoolCss).toContain("align-items: center !important");
    expect(brightSchoolCss).toContain("align-self: center !important");
    expect(brightSchoolCss).toContain("line-height: 1 !important");
    expect(brightSchoolCss).toContain("@media (min-width: 761px)");
    expect(brightSchoolCss).toContain(".leaderboard-avatar");
    expect(brightSchoolCss).toContain("transform: translateY(-6px) !important");
    expect(finalMobileCss).toContain(".leaderboard-row.rank-1");
    expect(finalMobileCss).toContain("background: transparent !important");
    expect(finalMobileCss).toContain("border-radius: 0 !important");
    expect(statSync(new URL("../../public/assets/leaderboard/top-rank-gold.webp", import.meta.url)).size).toBeLessThan(30_000);
    expect(statSync(new URL("../../public/assets/leaderboard/top-rank-silver.webp", import.meta.url)).size).toBeLessThan(30_000);
    expect(statSync(new URL("../../public/assets/leaderboard/top-rank-bronze.webp", import.meta.url)).size).toBeLessThan(30_000);
  });
});

function mediaBlock(css, marker) {
  const blocks = [];
  let start = css.indexOf(marker);
  while (start >= 0) {
    const next = css.indexOf("\n@media", start + 1);
    blocks.push(css.slice(start, next >= 0 ? next : undefined));
    start = css.indexOf(marker, start + marker.length);
  }
  return blocks.join("\n");
}

function cssBlock(css, selector) {
  const source = css.replace(/\r\n/g, "\n");
  const start = source.indexOf(selector);
  if (start === -1) return "";
  const bodyStart = source.indexOf("{", start);
  const bodyEnd = source.indexOf("}", bodyStart);
  return source.slice(bodyStart + 1, bodyEnd);
}

function readCssWithImports(url, seen = new Set()) {
  const key = url.href;
  if (seen.has(key)) return "";
  seen.add(key);

  const css = readFileSync(url, "utf8");
  return css.replace(/@import\s+"([^"]+)";/g, (_match, importPath) => {
    return readCssWithImports(new URL(importPath, url), seen);
  });
}
