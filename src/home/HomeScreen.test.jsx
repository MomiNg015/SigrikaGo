import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, statSync } from "node:fs";
import HomeScreen from "./HomeScreen.jsx";
import MatchModeRuleText, { splitMatchModeRules } from "./MatchModeRuleText.jsx";
import { CHARACTERS } from "../shared/characters.js";
import { readCssWithImports } from "../styles/cssTestUtils.js";
import { decodeRgbaPng } from "../../scripts/pngTrim.mjs";

function renderHome(overrides = {}) {
  return renderToStaticMarkup(createElement(HomeScreen, {
    user: {
      username: "shop-test",
      rank: "2段",
      rating: 1000,
      modeStats: {
        spark: { rating: 1260, rank: "4段", recentResults: ["win", "loss"], wins: 3, losses: 1, draws: 0 },
        standard: { rating: 920, rank: "3段", recentResults: ["loss"], wins: 1, losses: 2, draws: 0 },
        gomoku: { rating: 1010, rank: "3段", recentResults: [], wins: 0, losses: 0, draws: 1 }
      },
      selectedCharacter: "sigrika",
      role: "player",
      ...overrides.user
    },
    characters: CHARACTERS,
    lobbyStats: { onlineCount: 2, matchmakingCount: 3, ...(overrides.lobbyStats ?? {}) },
    onLogout: () => {},
    onStartMatch: () => {},
    onOpenHouse: () => {},
    onOpenWarehouse: () => {},
    onOpenLeaderboard: () => {},
    onOpenWatch: () => {},
    onOpenShop: () => {},
    onOpenFriends: () => {},
    onOpenSettings: () => {},
    onOpenAnnouncements: () => {},
    onOpenMailbox: () => {},
    onOpenMessageBoard: () => {},
    onOpenOnboardingStory: () => {},
    onOpenAdmin: () => {},
    ...overrides
  }));
}

function isWebp(path) {
  const bytes = readFileSync(new URL(path, import.meta.url));
  return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
}

function pngDimensions(path) {
  const { width, height } = decodeRgbaPng(readFileSync(new URL(path, import.meta.url)));
  return { width, height };
}

function webpDimensions(path) {
  const bytes = readFileSync(new URL(path, import.meta.url));
  if (!isWebp(path)) throw new Error(`${path} is not a WebP file`);

  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const chunkType = bytes.toString("ascii", offset, offset + 4);
    const chunkLength = bytes.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;
    if (chunkType === "VP8X") {
      return {
        width: bytes.readUIntLE(dataOffset + 4, 3) + 1,
        height: bytes.readUIntLE(dataOffset + 7, 3) + 1
      };
    }
    offset = dataOffset + chunkLength + (chunkLength % 2);
  }
  throw new Error(`${path} does not include a VP8X size chunk`);
}

function readCssFixture(path) {
  return readCssWithImports(new URL(path, import.meta.url));
}

describe("HomeScreen", () => {
  it("renders the lobby as a Startorch tactical terminal shell", () => {
    const html = renderHome();
    const css = readCssFixture("../styles/home-terminal.css");
    const appShellBlock = css.match(/\.app-shell:has\(\.home-screen\)\s*\{[^}]+\}/)?.[0] ?? "";
    const appShellBeforeBlock = css.match(/\.app-shell:has\(\.home-screen\)::before\s*\{[^}]+\}/)?.[0] ?? "";
    const appShellAfterBlock = css.match(/\.app-shell:has\(\.home-screen\)::after\s*\{[^}]+\}/)?.[0] ?? "";
    const screenBlock = css.match(/\.home-screen\s*\{[^}]+\}/g)?.find((block) => block.includes("--home-terminal-bg")) ?? "";

    expect(html).toContain('class="home-screen home-terminal-screen"');
    expect(html).not.toContain("home-terminal-status");
    expect(html).not.toContain("SYSTEM: ACTIVE // IN_LOBBY");
    expect(html).toContain("home-brand-title text-display-accent");
    expect(html).toContain("home-brand-subtitle text-display-accent");
    expect(html).toContain("连罗伊人的都爱玩的智力游戏");
    expect(html).toContain("home-online-tag");
    expect(html).toContain("aria-label=\"在线人数 2\"");
    expect(html).toContain("<b>2</b>");
    expect(html).not.toContain("在线人数：2");
    expect(html).toContain("home-mobile-menu");
    expect(html).toContain("home-mobile-menu-toggle");
    expect(html).toContain("home-mobile-menu-panel");
    expect(html).toContain("announcement-action");
    expect(html).toContain("onboarding-action");
    expect(html).toContain("\u5f15\u5bfc");
    expect(html).toContain("\u516c\u544a");
    expect(html).not.toContain("home-lobby-status");
    expect(html).not.toContain("LOBBY_ROOM");
    expect(appShellBlock).toContain("overflow-x: hidden");
    expect(appShellBlock).toContain("background: #04080c");
    expect(appShellBeforeBlock).toContain('background-image: url("/assets/home/multipurpose-classroom-bg.webp")');
    expect(appShellBeforeBlock).toContain("background-size: cover");
    expect(appShellBeforeBlock).toContain("background-position: center");
    expect(appShellBeforeBlock).not.toContain("filter: blur");
    expect(appShellAfterBlock).toContain("background-size: 100% 4px");
    expect(appShellAfterBlock).toContain("repeating-linear-gradient");
    expect(screenBlock).toContain("--home-terminal-bg: rgba(10, 22, 30, 0.75)");
    expect(screenBlock).toContain("--home-terminal-cyan: #00ffbe");
    expect(screenBlock).toContain("--home-terminal-blue: #00bfff");
    expect(screenBlock).toContain("min-width: 0");
  });

  it("shows an unread red dot on the announcement toolbar action", () => {
    const html = renderHome({ announcementUnread: true });

    expect(html).toContain("announcement-action has-unread");
    expect(html).toContain("announcement-badge-dot");
    expect(html).toContain("\u6253\u5f00\u516c\u544a");
  });

  it("keeps the home header subtitle and online count scaled from the title", () => {
    const terminalCss = readCssFixture("../styles/home-terminal.css");
    const brightSchoolCss = readCssFixture("../styles/themes/bright-school.css");
    const brightSchoolMobileCss = readCssFixture("../styles/themes/bright-school/mobile.css");
    const finalMobileCss = readCssFixture("../styles/mobile-adaptive.css");
    const expectedSubtitleScale = "--home-brand-subtitle-size: calc(var(--home-brand-title-size) * 2 / 3)";
    const expectedOnlineSize = "font-size: var(--home-brand-subtitle-size)";

    for (const css of [terminalCss, brightSchoolCss, brightSchoolMobileCss, finalMobileCss]) {
      expect(css).toContain("--home-brand-title-size");
      expect(css).toContain(expectedSubtitleScale);
      expect(css).toContain(expectedOnlineSize);
      expect(css).toContain("align-self: flex-end");
      expect(css).toContain(".home-online-tag svg");
      expect(css).toContain("width: 1em");
      expect(css).toContain("height: 1em");
    }
  });

  it("uses alpha-trimmed compact WebP home entry images instead of source PNGs", () => {
    const webpUrl = new URL("../../public/assets/home/fantasy-match-entry.webp", import.meta.url);
    const pngUrl = new URL("../../public/assets/home/fantasy-match-entry.png", import.meta.url);
    const bookWebpUrl = new URL("../../public/assets/home/book-entry.webp", import.meta.url);
    const bookPngUrl = new URL("../../public/assets/home/book-entry.png", import.meta.url);
    const desktopPanelUrl = new URL("../../public/assets/home/home-main-panel-desktop.webp", import.meta.url);
    const mobilePanelUrl = new URL("../../public/assets/home/home-main-panel-mobile.webp", import.meta.url);
    const utilityAssets = [
      "home-utility-recruitment",
      "home-utility-shop",
      "home-utility-warehouse",
      "home-utility-leaderboard",
      "home-utility-watch",
      "home-utility-friends"
    ];

    expect(isWebp("../../public/assets/home/fantasy-match-entry.webp")).toBe(true);
    expect(isWebp("../../public/assets/home/book-entry.webp")).toBe(true);
    expect(isWebp("../../public/assets/home/home-main-panel-desktop.webp")).toBe(true);
    expect(isWebp("../../public/assets/home/home-main-panel-mobile.webp")).toBe(true);
    expect(pngDimensions("../../public/assets/home/fantasy-match-entry.png")).toEqual({ width: 2374, height: 1960 });
    expect(pngDimensions("../../public/assets/home/book-entry.png")).toEqual({ width: 705, height: 850 });
    expect(webpDimensions("../../public/assets/home/fantasy-match-entry.webp")).toEqual({ width: 2374, height: 1960 });
    expect(webpDimensions("../../public/assets/home/book-entry.webp")).toEqual({ width: 705, height: 850 });
    expect(statSync(webpUrl).size).toBeLessThan(statSync(pngUrl).size / 8);
    expect(statSync(bookWebpUrl).size).toBeLessThan(statSync(bookPngUrl).size / 4);
    expect(statSync(desktopPanelUrl).size).toBeGreaterThan(0);
    expect(statSync(mobilePanelUrl).size).toBeGreaterThan(0);
    for (const asset of utilityAssets) {
      const utilityWebp = `../../public/assets/home/${asset}.webp`;
      const utilityPng = `../../public/assets/home/${asset}.png`;
      expect(isWebp(utilityWebp)).toBe(true);
      expect(statSync(new URL(utilityWebp, import.meta.url)).size).toBeLessThan(
        statSync(new URL(utilityPng, import.meta.url)).size / 4
      );
    }
  });

  it("renders hologram entry pods without changing the primary click targets", () => {
    const html = renderHome();
    const css = readCssFixture("../styles/home-terminal.css");
    const stageBlock = css.match(/\.home-grid-featured\s*\{[^}]+\}/g)?.find((block) => block.includes("grid-template-areas")) ?? "";
    const narrowDesktopMedia = css.match(/@media \(min-width: 1024px\) and \(max-width: 1180px\)\s*\{[\s\S]+?\.home-player-zone \.plaque-stats\s*\{[^}]+\}[\s\S]+?\}/)?.[0] ?? "";
    const imageEntryBlock = css.match(/\.home-image-entry\s*\{[^}]+\}/)?.[0] ?? "";
    const hoverBlock = css.match(/\.home-image-entry:hover,[\s\S]+?\.home-image-entry:focus-visible\s*\{[^}]+\}/)?.[0] ?? "";
    const activeBlock = css.match(/\.home-image-entry:active\s*\{[^}]+\}/)?.[0] ?? "";
    const projectionBlock = css.match(/\.home-image-entry::after\s*\{[^}]+\}/)?.[0] ?? "";
    const manualBlock = css.match(/\.house-manual-entry\s*\{[^}]+\}/)?.[0] ?? "";
    const matchBlock = css.match(/\.match-image-entry\s*\{[^}]+\}/g)?.find((block) => block.includes("border-color: rgba(0, 191, 255, 0.32)")) ?? "";

    expect(html).toContain('class="home-grid-featured home-stage home-terminal-stage"');
    expect(html).toContain('class="home-image-entry house-manual-entry hologram-entry"');
    expect(html).toContain('class="home-image-entry match-image-entry hologram-entry"');
    expect(html).toContain('src="/assets/home/book-entry.webp"');
    expect(html).toContain('src="/assets/home/fantasy-match-entry.webp"');
    expect(html).toContain('aria-label="部员手册"');
    expect(html).toContain('aria-label="星炬对弈"');
    expect(html).toContain('<img src="/assets/home/book-entry.webp" alt="" aria-hidden="true" decoding="async"/>');
    expect(html).toContain('<img src="/assets/home/fantasy-match-entry.webp" alt="" aria-hidden="true" decoding="async"/>');
    expect(html).not.toContain("home-match-mode-tickets");
    expect(html).not.toContain("home-match-mode-ticket");
    expect(html).not.toContain("home-match-mode-count");
    expect(html).not.toContain("matchmaking-popup");
    expect(html).not.toContain("当前匹配人数：3");
    expect(html).not.toContain("aria-describedby=\"matchmaking-count-popup\"");
    expect(stageBlock).toContain('"player match"');
    expect(stageBlock).toContain('"manual match"');
    expect(stageBlock).toContain('"utility match"');
    expect(stageBlock).toContain("grid-template-columns: minmax(360px, 0.72fr) minmax(620px, 1.28fr)");
    expect(stageBlock).toContain("grid-template-rows: auto minmax(280px, auto) auto");
    expect(stageBlock).toContain("gap: clamp(12px, 1.6vw, 24px) clamp(18px, 2.4vw, 36px)");
    expect(stageBlock).toContain("min-width: 0");
    expect(narrowDesktopMedia).toContain(".home-grid-featured");
    expect(narrowDesktopMedia).toContain("grid-template-columns: minmax(320px, 0.72fr) minmax(520px, 1.28fr)");
    expect(narrowDesktopMedia).toContain('"utility match"');
    expect(narrowDesktopMedia).toContain(".home-player-zone .plaque-stats");
    expect(narrowDesktopMedia).toContain("min-width: 0");
    expect(stageBlock).toContain("overflow: visible");
    expect(manualBlock).toContain("width: clamp(250px, 28vw, 430px)");
    expect(manualBlock).toContain("height: clamp(280px, 40vh, 450px)");
    expect(imageEntryBlock).toContain("background: rgba(10, 28, 38, 0.52)");
    expect(imageEntryBlock).toContain("border: 1px solid rgba(0, 255, 190, 0.28)");
    expect(imageEntryBlock).toContain("clip-path: polygon");
    expect(imageEntryBlock).toContain("transition: transform 260ms");
    expect(imageEntryBlock).toContain("will-change: transform");
    expect(hoverBlock).toContain("transform: rotate(2deg)");
    expect(hoverBlock).toContain("border-color: var(--home-terminal-cyan)");
    expect(hoverBlock).not.toContain("0 0 34px");
    expect(activeBlock).toContain("transform: translateY(-2px)");
    expect(projectionBlock).toContain('content: ""');
    expect(projectionBlock).toContain("background: transparent");
    expect(projectionBlock).toContain("box-shadow: none");
    expect(css).not.toContain(".matchmaking-popup");
    expect(css).not.toContain("content: attr(data-hud)");
    expect(html).not.toContain("data-hud");
    expect(matchBlock).toContain("border-color: rgba(0, 191, 255, 0.32)");
    expect(matchBlock).toContain("height: clamp(560px, 72vh, 760px)");
  });

  it("wires desktop match intent prewarm through the match entry and mode options", () => {
    const homeSource = readFileSync(new URL("./HomeScreen.jsx", import.meta.url), "utf8");
    const stageSource = readFileSync(new URL("./components/HomeStage.jsx", import.meta.url), "utf8");
    const entriesSource = readFileSync(new URL("./components/HomeImageEntries.jsx", import.meta.url), "utf8");

    expect(homeSource).toContain("onPreloadPlayableReady");
    expect(homeSource).toContain("onPreloadPlayableReady?.()");
    expect(homeSource).toContain("onPreloadPlayableReady?.(mode.id)");
    expect(stageSource).toContain("onPreloadPlayableReady");
    expect(entriesSource).toContain("onPointerEnter={onPreloadPlayableReady}");
    expect(entriesSource).toContain("onFocus={onPreloadPlayableReady}");
  });

  it("uses a tactical ID card and skewed navigation cards", () => {
    const html = renderHome();
    const css = readCssFixture("../styles/home-terminal.css");
    const plaqueBlock = css.match(/\.home-player-zone \.home-player-plaque\s*\{[^}]+\}/g)?.find((block) => block.includes("background: rgba(10, 22, 30, 0.75)")) ?? "";
    const statsBlock = css.match(/\.home-player-zone \.plaque-stats\s*\{[^}]+\}/g)?.find((block) => block.includes("font-family: ui-monospace")) ?? "";
    const utilityBlock = css.match(/\.home-grid-featured > \.home-utility-grid\s*\{[^}]+\}/g)?.find((block) => block.includes("repeat(3, minmax(0, 1fr))")) ?? "";
    const utilityEntryBlock = css.match(/\.home-grid-featured > \.home-utility-grid \.utility-entry\s*\{[^}]+\}/)?.[0] ?? "";
    const utilityTextBlock = css.match(/\.home-grid-featured > \.home-utility-grid \.utility-entry > \*\s*\{[^}]+\}/)?.[0] ?? "";
    const utilityHoverBeforeBlock = css.match(/\.home-grid-featured > \.home-utility-grid \.utility-entry:hover::before,[\s\S]+?\.utility-entry:focus-visible::before\s*\{[^}]+\}/)?.[0] ?? "";
    const brightHomeCss = readCssFixture("../styles/themes/bright-school/home.css");
    const finalThemeCss = readCssFixture("../styles/themes.css");
    const brightMobilePlayerCss = readCssFixture("../styles/themes/bright-school/mobile/home-shell/player-plaque.css");
    const brightToolboxEntry = readCssFixture("../styles/themes/bright-school/home/utility-toolbox.css");
    const brightUtilityCss = readCssFixture("../styles/themes/bright-school/surface-contracts/home-utility-tabs.css");
    const narrowDesktopCss = readCssFixture("../styles/mobile-adaptive/home-narrow-desktop.css");
    const finalPortraitPlayerCss = readCssFixture("../styles/mobile-adaptive/bright-school-portrait/home-player-plaque.css");
    const studentIdImageShadow = "drop-shadow(5px 6px 0 rgba(61, 43, 37, 0.3))";
    const brightPlaqueBlock = brightHomeCss.match(/\.home-player-plaque\.tactical-id-card\s*\{[^}]+\}/)?.[0] ?? "";
    const brightPlaqueHoverBlock = brightHomeCss.match(/\.home-player-plaque\.tactical-id-card:hover,[\s\S]+?\.home-player-plaque\.tactical-id-card:focus-visible\s*\{[^}]+\}/)?.[0] ?? "";
    const finalPlaqueBackgroundBlocks = finalThemeCss.match(/\.app-shell\.player-theme-enabled\.theme-bright-school\.theme-bright-school \.home-player-plaque\.tactical-id-card\s*\{[^}]+background:[^}]+\}/g) ?? [];
    const finalPlaqueBackgroundBlock = finalPlaqueBackgroundBlocks[finalPlaqueBackgroundBlocks.length - 1] ?? "";
    const narrowDesktopPlaqueBlock = narrowDesktopCss.match(/\.app-shell\.player-theme-enabled\.theme-bright-school\.theme-bright-school \.home-player-plaque\.tactical-id-card\s*\{[^}]+\}/g)?.find((block) => block.includes("--home-student-id-shell-bg")) ?? "";
    const narrowDesktopAvatarBlock = narrowDesktopCss.match(/\.app-shell\.player-theme-enabled\.theme-bright-school\.theme-bright-school \.home-player-plaque\.tactical-id-card \.plaque-avatar\s*\{[^}]+\}/g)?.find((block) => block.includes("display: grid")) ?? "";
    const brightMobilePlaqueBlock = brightMobilePlayerCss.match(/\.home-player-plaque\.tactical-id-card\s*\{[^}]+\}/)?.[0] ?? "";
    const finalPortraitPlaqueBlock = finalPortraitPlayerCss.match(/\.app-shell\.player-theme-enabled\.theme-bright-school\.theme-bright-school \.home-player-plaque\.tactical-id-card\s*\{[^}]+\}/)?.[0] ?? "";
    const finalPortraitAvatarBlock = finalPortraitPlayerCss.match(/\.home-player-plaque\.tactical-id-card \.plaque-avatar\s*\{[^}]+\}/)?.[0] ?? "";
    const brightRowClipBlocks = brightHomeCss.match(/\.home-player-row\.tactical-id-row::before,[\s\S]+?\.home-player-row\.tactical-id-row::after\s*\{[^}]+\}/g) ?? [];
    const brightDisabledRowClipBlock = brightRowClipBlocks.find((block) => block.includes("content: none !important")) ?? "";
    const brightAvatarBlock = brightHomeCss.match(/\.home-player-plaque\.tactical-id-card \.plaque-avatar\s*\{[^}]+\}/)?.[0] ?? "";
    const brightAvatarImgBlock = brightHomeCss.match(/\.home-player-plaque\.tactical-id-card \.plaque-avatar img\s*\{[^}]+\}/)?.[0] ?? "";
    const brightPlaqueStrongBlock = brightHomeCss.match(/\.home-player-plaque\.tactical-id-card strong\s*\{[^}]+\}/)?.[0] ?? "";
    const brightPlaqueStrongClipBlock = brightHomeCss.match(/\.home-player-plaque\.tactical-id-card > strong\s*\{[^}]+\}/)?.[0] ?? "";
    const brightPlaqueIdentityBlock = brightHomeCss.match(/\.home-player-plaque\.tactical-id-card \.user-identity,[\s\S]+?max-width: 100% !important;[\s\S]+?\}/)?.[0] ?? "";
    const brightPlaqueNameSizingBlock = brightHomeCss.match(/\.home-player-plaque\.tactical-id-card \.user-identity-main\s*\{[^}]+\}/)?.[0] ?? "";
    const brightPlaqueNameTagBlock = brightHomeCss.match(/\.home-player-plaque\.tactical-id-card \.user-identity-name-tag\s*\{[^}]+\}/g)?.find((block) => block.includes("box-sizing: border-box")) ?? "";
    const brightPlaqueFixedNameplateBlock = brightHomeCss.match(/\.home-player-plaque\.tactical-id-card \.user-identity\.has-nameplate \.user-identity-name-tag\s*\{[^}]+\}/)?.[0] ?? "";
    const brightPlaqueNameOverflowBlock = brightHomeCss.match(/\.home-player-plaque\.tactical-id-card \.user-identity-name\s*\{[^}]+\}/g)?.find((block) => block.includes("overflow: visible")) ?? "";
    const brightPanelBlock = brightHomeCss.match(/main\.home-screen\.home-terminal-screen > section\.home-main-panel\.home-terminal-main\s*\{[^}]+\}/)?.[0] ?? "";
    const brightStageBlock = brightHomeCss.match(/main\.home-screen\.home-terminal-screen > section\.home-main-panel\.home-terminal-main > section\.home-grid-featured\.home-stage\s*\{[^}]+\}/)?.[0] ?? "";
    const brightStatsBlock = brightHomeCss.match(/\.home-player-plaque\.tactical-id-card \.plaque-stats\s*\{[^}]+\}/)?.[0] ?? "";
    const brightModeStatBlock = brightHomeCss.match(/\.home-player-plaque\.tactical-id-card \.plaque-mode-stat\s*\{[^}]+\}/)?.[0] ?? "";
    const brightModeIconBlock = brightHomeCss.match(/\.home-player-plaque\.tactical-id-card \.plaque-mode-icon\s*\{[^}]+\}/)?.[0] ?? "";
    const brightModeRankBlock = brightHomeCss.match(/\.home-player-plaque\.tactical-id-card \.plaque-mode-rank\s*\{[^}]+\}/)?.[0] ?? "";
    const brightModeRankDanBlock = brightHomeCss.match(/\.home-player-plaque\.tactical-id-card \.plaque-mode-rank-dan\s*\{[^}]+\}/)?.[0] ?? "";
    const brightModeRankKyuBlock = brightHomeCss.match(/\.home-player-plaque\.tactical-id-card \.plaque-mode-rank-kyu\s*\{[^}]+\}/)?.[0] ?? "";
    const brightMobileStatsBlock = brightMobilePlayerCss.match(/\.home-player-plaque\.tactical-id-card \.plaque-stats\s*\{[^}]+\}/)?.[0] ?? "";
    const brightMobileModeIconBlock = brightMobilePlayerCss.match(/\.home-player-plaque\.tactical-id-card \.plaque-mode-icon\s*\{[^}]+\}/)?.[0] ?? "";
    const brightMobileModeRankBlock = brightMobilePlayerCss.match(/\.home-player-plaque\.tactical-id-card \.plaque-mode-rank\s*\{[^}]+\}/)?.[0] ?? "";
    const finalPortraitStatsBlock = finalPortraitPlayerCss.match(/\.home-player-plaque\.tactical-id-card \.plaque-stats\s*\{[^}]+\}/)?.[0] ?? "";
    const finalPortraitModeIconBlock = finalPortraitPlayerCss.match(/\.home-player-plaque\.tactical-id-card \.plaque-mode-icon\s*\{[^}]+\}/)?.[0] ?? "";
    const finalPortraitModeRankBlock = finalPortraitPlayerCss.match(/\.home-player-plaque\.tactical-id-card \.plaque-mode-rank\s*\{[^}]+\}/)?.[0] ?? "";
    const brightShortHeightMedia = brightHomeCss.match(/@media \(min-width: 701px\) and \(max-height: 760px\)\s*\{[\s\S]+?\n\}/)?.[0] ?? "";
    const brightNarrowDesktopMedia = brightHomeCss.match(/@media \(min-width: 701px\) and \(max-width: 1180px\)\s*\{[\s\S]+?@media \(max-width: 700px\)/)?.[0] ?? "";

    expect(html).toContain("home-player-row tactical-id-row");
    expect(html).toContain("home-player-plaque tactical-id-card");
    expect(html).toContain('aria-label="打开履历"');
    expect(html).toContain("plaque-mode-stat plaque-mode-stat-spark");
    expect(html).toContain("plaque-mode-stat plaque-mode-stat-standard");
    expect(html).toContain("plaque-mode-stat plaque-mode-stat-gomoku");
    expect(html).toContain('aria-label="对弈模式段位"');
    expect(html).toContain("plaque-mode-icon");
    expect(html).toContain('src="/assets/match-modes/mode-spark.png"');
    expect(html).toContain('src="/assets/match-modes/mode-standard.png"');
    expect(html).toContain('src="/assets/match-modes/mode-gomoku.png"');
    expect(html).toContain("plaque-mode-rank");
    expect(html).toContain('aria-label="星炬 4段"');
    expect(html).toContain('<span class="plaque-mode-rank plaque-mode-rank-dan" aria-hidden="true">4</span>');
    expect(html).toContain('<span class="plaque-mode-rank plaque-mode-rank-dan" aria-hidden="true">3</span>');
    expect(html).not.toContain(">4段</span>");
    expect(html).not.toContain(">3段</span>");
    const gradeRankHtml = renderHome({
      user: {
        modeStats: {
          spark: { rating: 1260, rank: "4段", recentResults: [], wins: 3, losses: 1, draws: 0 },
          standard: { rating: 920, rank: "5级", recentResults: [], wins: 1, losses: 2, draws: 0 },
          gomoku: { rating: 1010, rank: "3段", recentResults: [], wins: 0, losses: 0, draws: 1 }
        }
      }
    });
    expect(gradeRankHtml).toContain('aria-label="标准 5级"');
    expect(gradeRankHtml).toContain('<span class="plaque-mode-rank plaque-mode-rank-kyu" aria-hidden="true">5</span>');
    expect(gradeRankHtml).not.toContain(">5级</span>");
    expect(html).not.toContain("plaque-mode-name");
    expect(html).not.toContain("plaque-mode-rating");
    expect(html).not.toContain("1260分");
    expect(html).not.toContain("920分");
    expect(html).not.toContain("1010分");
    expect(html).toContain("utility-image-entry");
    expect(html).toContain("utility-entry-art");
    expect(html).toContain("utility-entry-icon");
    expect(html).toContain('src="/assets/home/home-utility-recruitment.webp"');
    expect(html).toContain('src="/assets/home/home-utility-shop.webp"');
    expect(html).toContain('src="/assets/home/home-utility-warehouse.webp"');
    expect(html).toContain('src="/assets/home/home-utility-leaderboard.webp"');
    expect(html).toContain('src="/assets/home/home-utility-watch.webp"');
    expect(html).toContain('src="/assets/home/home-utility-friends.webp"');
    expect(html).toContain('aria-label="招募"');
    expect(html).toContain('aria-label="商店"');
    expect(html).toContain('aria-label="仓库"');
    expect(html).toContain('aria-label="排行"');
    expect(html).toContain('aria-label="观战"');
    expect(html).toContain('aria-label="好友"');
    expect(html).not.toContain("utility-entry-description");
    expect(html).not.toContain("成员补给");
    expect(html).not.toContain("物资购入");
    expect(html).not.toContain("道具管理");
    expect(html).not.toContain("天梯记录");
    expect(html).not.toContain("当前房间");
    expect(html).not.toContain("社交列表");
    expect(html).not.toContain("plaque-mode-results");
    expect(html).not.toContain("recent-result-marker");
    expect(html).not.toContain("recent-result-empty");
    expect(html).toContain("home-utility-grid tactical-nav-grid");
    expect(html).not.toContain("角色、物品、装饰即将开放");
    expect(html).not.toContain("查看并使用已经获得的道具");
    expect(html).not.toContain("积分、胜负与常用角色");
    expect(html).not.toContain("输入5位房间号进入观战席");
    expect(html).not.toContain("好友与黑名单");
    expect(plaqueBlock).toContain("background: rgba(10, 22, 30, 0.75)");
    expect(plaqueBlock).toContain("border: 1px solid var(--home-terminal-blue)");
    expect(plaqueBlock).toContain("clip-path: polygon");
    expect(plaqueBlock).toContain("box-shadow");
    expect(statsBlock).toContain("font-family: ui-monospace");
    expect(statsBlock).toContain("min-width: 154px");
    expect(css).toContain(".home-player-zone .plaque-mode-stat");
    expect(brightPlaqueBlock).toContain("--home-plaque-name-column-min: calc(12ch + 1.2em)");
    expect(brightPlaqueBlock).toContain('url("/assets/home/student-id-nameplate.webp")');
    expect(brightPlaqueBlock).toContain('url("/assets/home/student-id-nameplate.png")');
    expect(brightPlaqueBlock).toContain("--home-student-id-avatar-center-x: 14.7%");
    expect(brightPlaqueBlock).toContain("--home-student-id-avatar-center-y: 46%");
    expect(brightPlaqueBlock).toContain("--home-student-id-avatar-size: 72px");
    expect(brightPlaqueBlock).toContain("--home-student-id-stats-center-x: 88%");
    expect(brightPlaqueBlock).toContain("--home-student-id-stats-center-y: 52%");
    expect(brightPlaqueBlock).toContain("--home-student-id-stats-width: clamp(104px, 24%, 126px)");
    expect(brightPlaqueBlock).toContain("--home-student-id-stats-height: 70px");
    expect(brightPlaqueBlock).toContain("background-origin: border-box");
    expect(brightPlaqueBlock).toContain("background-clip: border-box");
    expect(finalThemeCss).toContain('url("/assets/home/student-id-nameplate.webp")');
    expect(finalThemeCss).toContain('url("/assets/home/student-id-nameplate.png")');
    expect(finalThemeCss).toContain("--home-student-id-shell-bg");
    expect(finalPlaqueBackgroundBlock).toContain("var(--home-student-id-shell-bg)");
    expect(finalPlaqueBackgroundBlock).not.toContain("radial-gradient(circle at 16% 45%");
    expect(finalThemeCss).not.toContain("linear-gradient(135deg, rgba(255, 241, 247");
    expect(finalThemeCss).not.toContain("linear-gradient(135deg, #ffe5ee");
    expect(brightDisabledRowClipBlock).toContain("content: none !important");
    expect(brightDisabledRowClipBlock).toContain("display: none !important");
    expect(brightPlaqueBlock).toContain("grid-template-columns: 72px minmax(0, 1fr) var(--home-student-id-stats-width)");
    expect(brightPlaqueBlock).toContain("overflow: hidden");
    expect(brightPlaqueBlock).toContain("appearance: none !important");
    expect(brightPlaqueBlock).toContain("background-color: transparent !important");
    expect(brightPlaqueBlock).toContain("border: 0 !important");
    expect(brightPlaqueBlock).toContain("border-radius: 0 !important");
    expect(brightPlaqueBlock).toContain("box-shadow: none !important");
    expect(brightPlaqueBlock).toContain(`filter: ${studentIdImageShadow} !important`);
    expect(brightPlaqueBlock).not.toContain("0 0 0 1px #ffffff");
    expect(brightPlaqueBlock).not.toContain("0 0 0 2px var(--bright-border)");
    expect(brightPlaqueHoverBlock).toContain("transform: rotate(2deg) !important");
    expect(brightPlaqueHoverBlock).not.toContain("translateY(-2px)");
    expect(brightPlaqueHoverBlock).not.toContain("box-shadow: none");
    expect(narrowDesktopPlaqueBlock).toContain("var(--home-student-id-shell-bg)");
    expect(narrowDesktopPlaqueBlock).toContain("background-color: transparent");
    expect(narrowDesktopPlaqueBlock).toContain("border: 0");
    expect(narrowDesktopPlaqueBlock).toContain("border-radius: 0");
    expect(narrowDesktopPlaqueBlock).toContain("box-shadow: none");
    expect(brightMobilePlaqueBlock).toContain("--home-student-id-stats-center-x: 88%");
    expect(brightMobilePlaqueBlock).toContain("--home-student-id-stats-width: clamp(82px, 24%, 96px)");
    expect(brightMobilePlaqueBlock).toContain("--home-student-id-stats-height: 60px");
    expect(brightMobilePlaqueBlock).toContain("box-shadow: none !important");
    expect(finalPortraitPlaqueBlock).toContain("var(--home-student-id-shell-bg)");
    expect(finalPortraitPlaqueBlock).toContain("--home-student-id-stats-center-x: 88%");
    expect(finalPortraitPlaqueBlock).toContain("--home-student-id-stats-width: clamp(82px, 24%, 96px)");
    expect(finalPortraitPlaqueBlock).toContain("--home-student-id-stats-height: 60px");
    expect(finalPortraitPlaqueBlock).toContain("background-color: transparent");
    expect(finalPortraitPlaqueBlock).toContain("border: 0");
    expect(finalPortraitPlaqueBlock).toContain("border-radius: 0");
    expect(finalPortraitPlaqueBlock).toContain("box-shadow: none");
    expect(brightAvatarBlock).toContain("background: transparent !important");
    expect(brightAvatarBlock).toContain("border: 0 !important");
    expect(brightAvatarBlock).toContain("box-shadow: none !important");
    expect(brightAvatarBlock).toContain("position: absolute !important");
    expect(brightAvatarBlock).toContain("left: var(--home-student-id-avatar-center-x) !important");
    expect(brightAvatarBlock).toContain("top: var(--home-student-id-avatar-center-y) !important");
    expect(brightAvatarBlock).toContain("width: var(--home-student-id-avatar-size) !important");
    expect(brightAvatarBlock).toContain("height: var(--home-student-id-avatar-size) !important");
    expect(brightAvatarBlock).toContain("display: grid !important");
    expect(brightAvatarBlock).toContain("place-items: center !important");
    expect(brightAvatarBlock).toContain("transform: translate(-50%, -50%) !important");
    expect(narrowDesktopAvatarBlock).toContain("background: transparent");
    expect(narrowDesktopAvatarBlock).toContain("border: 0");
    expect(narrowDesktopAvatarBlock).toContain("box-shadow: none");
    expect(narrowDesktopAvatarBlock).toContain("position: absolute");
    expect(narrowDesktopAvatarBlock).toContain("left: var(--home-student-id-avatar-center-x)");
    expect(narrowDesktopAvatarBlock).toContain("top: var(--home-student-id-avatar-center-y)");
    expect(narrowDesktopAvatarBlock).toContain("display: grid");
    expect(narrowDesktopAvatarBlock).toContain("place-items: center");
    expect(narrowDesktopAvatarBlock).toContain("transform: translate(-50%, -50%)");
    expect(finalPortraitAvatarBlock).toContain("background: transparent");
    expect(finalPortraitAvatarBlock).toContain("border: 0");
    expect(finalPortraitAvatarBlock).toContain("box-shadow: none");
    expect(finalPortraitAvatarBlock).toContain("position: absolute");
    expect(finalPortraitAvatarBlock).toContain("left: var(--home-student-id-avatar-center-x)");
    expect(finalPortraitAvatarBlock).toContain("top: var(--home-student-id-avatar-center-y)");
    expect(finalPortraitAvatarBlock).toContain("width: var(--home-student-id-avatar-size) !important");
    expect(finalPortraitAvatarBlock).toContain("height: var(--home-student-id-avatar-size) !important");
    expect(finalPortraitAvatarBlock).toContain("display: grid");
    expect(finalPortraitAvatarBlock).toContain("place-items: center");
    expect(finalPortraitAvatarBlock).toContain("transform: translate(-50%, -50%)");
    expect(brightAvatarImgBlock).toContain("width: auto !important");
    expect(brightAvatarImgBlock).toContain("height: auto !important");
    expect(brightAvatarImgBlock).toContain("max-width: 100% !important");
    expect(brightAvatarImgBlock).toContain("max-height: 100% !important");
    expect(brightAvatarImgBlock).toContain("margin: auto !important");
    expect(brightAvatarImgBlock).toContain("object-position: center center !important");
    expect(brightPlaqueStrongBlock).toContain("padding-right: 6px");
    expect(brightPlaqueStrongBlock).toContain("grid-column: 2");
    expect(brightPlaqueStrongClipBlock).toContain("overflow: hidden");
    expect(brightPlaqueStrongClipBlock).toContain("text-overflow: clip");
    expect(brightPlaqueIdentityBlock).toContain("max-width: 100%");
    expect(brightHomeCss).toContain("--user-nameplate-scale: 1.12");
    expect(brightHomeCss).toContain(".home-player-plaque.tactical-id-card .user-identity {\n  --user-nameplate-scale: 1.12;\n  width: 100% !important;\n  min-width: 0 !important;\n  overflow: hidden !important;");
    expect(brightPlaqueNameSizingBlock).toContain("width: 100%");
    expect(brightPlaqueNameSizingBlock).toContain("min-width: 0");
    expect(brightPlaqueNameSizingBlock).toContain("flex: 1 1 auto");
    expect(brightPlaqueNameTagBlock).toContain("box-sizing: border-box");
    expect(brightPlaqueNameTagBlock).toContain("overflow: hidden");
    expect(brightPlaqueFixedNameplateBlock).toContain("width: var(--user-nameplate-width)");
    expect(brightPlaqueFixedNameplateBlock).toContain("flex: 0 0 auto");
    expect(brightPlaqueNameOverflowBlock).toContain("overflow: visible");
    expect(brightPlaqueNameOverflowBlock).toContain("text-overflow: clip");
    expect(brightPlaqueNameOverflowBlock).toContain("font-size: var(--user-nameplate-font-size) !important");
    expect(brightPlaqueNameOverflowBlock).not.toContain("user-identity-fit-font-size");
    expect(brightPanelBlock).toContain('--home-main-panel-bg: url("/assets/home/home-main-panel-desktop.webp")');
    expect(brightPanelBlock).toContain("background-image: var(--home-main-panel-bg) !important");
    expect(brightPanelBlock).toContain("background-size: 100% 100% !important");
    expect(brightPanelBlock).toContain("border: 0 !important");
    expect(brightPanelBlock).toContain("box-shadow: none !important");
    expect(brightHomeCss).toContain("padding-top: clamp(44px, 7.2dvh, 58px) !important");
    expect(brightHomeCss).toContain("padding-bottom: clamp(38px, 6.6dvh, 52px) !important");
    expect(narrowDesktopCss).toContain("padding: clamp(48px, 5vw, 68px) clamp(58px, 6vw, 80px) clamp(42px, 4.6vw, 62px) !important");
    expect(narrowDesktopCss).toContain("padding: clamp(44px, 5vw, 56px) clamp(52px, 6vw, 64px) clamp(38px, 4.5vw, 52px) !important");
    expect(narrowDesktopCss).not.toContain("padding: clamp(12px, 2vw, 20px) !important");
    expect(narrowDesktopCss).not.toContain("padding: clamp(16px, 2.6vw, 24px) !important");
    expect(brightStageBlock).toContain("padding-top: clamp(28px, 3vw, 48px)");
    expect(brightStatsBlock).toContain("position: absolute");
    expect(brightStatsBlock).toContain("left: var(--home-student-id-stats-center-x)");
    expect(brightStatsBlock).toContain("top: var(--home-student-id-stats-center-y)");
    expect(brightStatsBlock).toContain("width: var(--home-student-id-stats-width)");
    expect(brightStatsBlock).toContain("height: var(--home-student-id-stats-height)");
    expect(brightStatsBlock).toContain("min-width: 0");
    expect(brightStatsBlock).toContain("box-sizing: border-box");
    expect(brightStatsBlock).toContain("grid-column: 1 / -1");
    expect(brightStatsBlock).toContain("container-type: inline-size");
    expect(brightStatsBlock).toContain("place-content: center");
    expect(brightStatsBlock).toContain("transform: translate(-50%, -50%)");
    expect(brightStatsBlock).toContain("background: transparent !important");
    expect(brightStatsBlock).toContain("border: 0 !important");
    expect(brightStatsBlock).toContain("box-shadow: none !important");
    expect(brightStatsBlock).toContain("overflow: visible !important");
    expect(brightMobileStatsBlock).toContain("background: transparent !important");
    expect(brightMobileStatsBlock).toContain("border: 0 !important");
    expect(brightMobileStatsBlock).toContain("box-shadow: none !important");
    expect(brightMobileStatsBlock).toContain("width: var(--home-student-id-stats-width) !important");
    expect(brightMobileStatsBlock).toContain("transform: translate(-50%, -50%) !important");
    expect(finalPortraitStatsBlock).toContain("background: transparent !important");
    expect(finalPortraitStatsBlock).toContain("border: 0 !important");
    expect(finalPortraitStatsBlock).toContain("border-radius: 0");
    expect(finalPortraitStatsBlock).toContain("box-shadow: none !important");
    expect(finalPortraitStatsBlock).toContain("width: var(--home-student-id-stats-width) !important");
    expect(finalPortraitStatsBlock).toContain("transform: translate(-50%, -50%)");
    expect(brightStatsBlock).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(brightModeStatBlock).toContain("grid-template-columns: minmax(0, 1fr) !important");
    expect(brightModeStatBlock).toContain("grid-template-rows: auto auto !important");
    expect(brightModeStatBlock).toContain("align-content: center !important");
    expect(brightModeIconBlock).toContain("width: clamp(24px, 22cqw, 30px) !important");
    expect(brightModeIconBlock).toContain("object-fit: contain !important");
    expect(brightModeRankBlock).toContain("font-family: var(--font-numeric-accent), var(--font-ui-default) !important");
    expect(brightModeRankBlock).toContain("font-size: clamp(18px, 17cqw, 24px) !important");
    expect(brightModeRankBlock).toContain("font-variant-numeric: tabular-nums !important");
    expect(brightMobileModeIconBlock).toContain("width: clamp(19.2px, 17.6cqw, 24px) !important");
    expect(brightMobileModeRankBlock).toContain("font-size: clamp(14.4px, 13.6cqw, 19.2px) !important");
    expect(finalPortraitModeIconBlock).toContain("width: clamp(19.2px, 17.6cqw, 24px) !important");
    expect(finalPortraitModeRankBlock).toContain("font-size: clamp(14.4px, 13.6cqw, 19.2px) !important");
    expect(brightModeRankDanBlock).toContain("color: #c4322e !important");
    expect(brightModeRankKyuBlock).toContain("color: #4a2772 !important");
    expect(brightHomeCss).not.toContain(".plaque-mode-rating");
    expect(brightHomeCss).toContain("justify-self: center");
    expect(brightShortHeightMedia).not.toContain("max-height: calc(100dvh - 128px)");
    expect(brightShortHeightMedia).toContain("min-height: auto");
    expect(brightShortHeightMedia).toContain("height: clamp(220px, 36dvh, 286px)");
    expect(brightShortHeightMedia).toContain("height: clamp(270px, 50dvh, 356px)");
    expect(brightNarrowDesktopMedia).not.toContain("width: clamp(318px, 36vw, 386px)");
    expect(brightNarrowDesktopMedia).toContain("width: 100%");
    expect(brightNarrowDesktopMedia).toContain("--home-plaque-name-column-min: calc(12ch + 1.2em)");
    expect(brightNarrowDesktopMedia).toContain("grid-template-columns: 62px minmax(0, 1fr) var(--home-student-id-stats-width)");
    expect(brightNarrowDesktopMedia).toContain("font-size: clamp(20px, 2.1vw, 24px)");
    expect(brightNarrowDesktopMedia).toContain("grid-template-rows: auto auto !important");
    expect(brightNarrowDesktopMedia).toContain("width: clamp(24px, 22cqw, 30px) !important");
    expect(brightNarrowDesktopMedia).toContain("font-size: clamp(18px, 17cqw, 24px) !important");
    expect(brightNarrowDesktopMedia).not.toContain("width: clamp(32px, 26cqw, 40px) !important");
    expect(brightNarrowDesktopMedia).not.toContain("font-size: clamp(22px, 20cqw, 30px) !important");
    expect(utilityBlock).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(utilityBlock).toContain("grid-area: utility");
    expect(utilityBlock).toContain("width: 100%");
    expect(utilityEntryBlock).toContain("grid-template-columns: 26px minmax(0, 1fr)");
    expect(utilityEntryBlock).toContain("min-height: 64px");
    expect(utilityEntryBlock).toContain("transform: skewX(-15deg)");
    expect(utilityEntryBlock).not.toContain(`border-${"left"}`);
    expect(utilityEntryBlock).toContain("linear-gradient(90deg, rgba(0, 255, 190, 0.12)");
    expect(utilityEntryBlock).toContain("clip-path: polygon");
    expect(css).toContain(".home-grid-featured > .home-utility-grid .utility-entry strong {\n  display: block");
    expect(css).not.toContain(".home-grid-featured > .home-utility-grid .utility-entry small {\n  display: block");
    expect(utilityTextBlock).toContain("transform: skewX(15deg)");
    expect(utilityHoverBeforeBlock).toContain("animation: home-nav-flow");
    expect(brightToolboxEntry).not.toContain(".home-match-mode-tickets");
    expect(brightToolboxEntry).toContain("grid-template-columns: repeat(3, minmax(0, 1fr)) !important");
    expect(brightToolboxEntry).toContain(".utility-tone-pink");
    expect(brightToolboxEntry).toContain("--utility-tilt: -1.15deg");
    expect(brightToolboxEntry).toContain("--utility-tilt: 0.7deg");
    expect(brightToolboxEntry).toContain("--utility-tilt: -0.4deg");
    expect(brightToolboxEntry).toContain("--utility-tilt: 1.05deg");
    expect(brightToolboxEntry).toContain("--utility-tilt: -0.8deg");
    expect(brightToolboxEntry).toContain("--utility-tilt: 0.5deg");
    expect(brightToolboxEntry).toContain("--utility-hover-tilt: -4.2deg");
    expect(brightToolboxEntry).toContain("--utility-hover-tilt: 4.1deg");
    expect(brightToolboxEntry).toContain("--utility-hover-tilt: -3.8deg");
    expect(brightToolboxEntry).toContain("--utility-hover-tilt: 4.4deg");
    expect(brightToolboxEntry).toContain("--utility-hover-tilt: -4deg");
    expect(brightToolboxEntry).toContain("--utility-hover-tilt: 3.9deg");
    expect(brightToolboxEntry).toContain("--utility-x: -2px");
    expect(brightToolboxEntry).toContain("--utility-y: -1px");
    expect(brightToolboxEntry).toContain("@media (min-width: 761px)");
    expect(brightToolboxEntry).toContain("grid-auto-rows: clamp(70px, 5.5vw, 84px) !important");
    expect(brightToolboxEntry).toContain("gap: clamp(4px, 0.55vw, 8px) !important");
    expect(narrowDesktopCss.match(/gap: clamp\(4px, 0\.55vw, 8px\) !important/g)?.length).toBeGreaterThanOrEqual(2);
    expect(brightToolboxEntry).toContain("transform: translate(var(--utility-x, 0), var(--utility-y, 0)) rotate(var(--utility-tilt, 0deg)) !important");
    expect(brightToolboxEntry).toContain(".utility-entry-art");
    expect(brightToolboxEntry).toContain("place-self: center !important");
    expect(brightToolboxEntry).toContain("width: 128% !important");
    expect(brightToolboxEntry).toContain("height: auto !important");
    expect(brightToolboxEntry).toContain("max-width: none !important");
    expect(brightToolboxEntry).toContain("filter: drop-shadow(5px 6px 0 rgba(61, 43, 37, 0.3)) !important");
    expect(brightToolboxEntry).toContain("will-change: transform");
    expect(brightToolboxEntry).toContain("outline: 0 solid transparent");
    expect(brightToolboxEntry).toContain(".utility-entry:is(:hover, :focus-visible):not(:disabled)");
    expect(brightToolboxEntry).toContain("z-index: 2");
    expect(brightToolboxEntry).toContain("transform: none !important");
    expect(brightToolboxEntry).toContain("rotate(var(--utility-hover-tilt, 4deg)) scale(1.015) !important");
    expect(brightToolboxEntry).toContain("calc(var(--utility-y, 0px) + 1px)");
    expect(brightToolboxEntry).toContain("rotate(1deg) scale(0.985) !important");
    expect(brightToolboxEntry).toContain("scale(0.985)");
    expect(brightToolboxEntry).not.toContain("calc(var(--utility-y, 0px) - 3px)");
    expect(brightToolboxEntry).not.toContain("calc(var(--utility-tilt, 0deg) + 1.4deg)");
    expect(brightToolboxEntry).toContain(".recruitment-entry.has-alert .utility-entry-art");
    expect(brightUtilityCss).toContain(".utility-entry:hover:not(:disabled)");
    expect(brightUtilityCss).toContain("transform: rotate(2deg) !important");
    expect(brightUtilityCss).toContain(".utility-entry:active:not(:disabled)");
    expect(brightUtilityCss).toContain("transform: translateY(1px) rotate(1deg) scale(0.985) !important");
    expect(brightUtilityCss).toContain("scale(0.985)");
    expect(brightUtilityCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(brightUtilityCss).toContain("transition-duration: 1ms !important;");
    expect(brightUtilityCss).not.toContain(".utility-entry:nth-child(3n),\n.app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .home-grid-featured > .home-utility-grid .utility-entry:hover");
  });

  it("renders equipped achievement nameplates on the player identity tag", () => {
    const html = renderHome({
      user: {
        achievementEquipment: {
          titleAssetId: "",
          badgeAssetId: "",
          nameplateAssetId: "reward-sigrika-spark-100-wins-nameplate"
        },
        achievementEquipmentAssets: {
          title: null,
          badge: null,
          nameplate: {
            id: "reward-sigrika-spark-100-wins-nameplate",
            type: "nameplate",
            imageUrl: "/assets/achievements/semantic-nameplate.png"
          }
        }
      }
    });

    expect(html).not.toContain("plaque-nameplate-bg");
    expect(html).toContain("user-identity has-nameplate");
    expect(html).toContain("user-identity-name-tag");
    expect(html).toContain("background-image:url(/assets/achievements/semantic-nameplate.png)");
  });

  it("keeps the HUD footer minimal and rewrites the mobile lobby layout", () => {
    const html = renderHome();
    const css = readCssFixture("../styles/home-terminal.css");
    const footerBlock = css.match(/\.home-footer-strip\s*\{[^}]+\}/)?.[0] ?? "";
    const footerSpanBlock = css.match(/\.home-footer-strip span\s*\{[^}]+\}/)?.[0] ?? "";
    const mobileMedia = css.match(/@media \(max-width: 768px\)\s*\{[\s\S]+?\.home-grid-featured > \.home-utility-grid \.utility-entry > \*\s*\{[^}]+\}[\s\S]+?\}/)?.[0] ?? "";

    expect(html).toContain("Copyright ©KURO GAMES. ALL RIGHTS RESERVED.");
    expect(html).toContain("浙ICP备2026035038号");
    expect(html).not.toContain("请横屏使用");
    expect(html).not.toContain("home-orientation-guard");
    expect(footerBlock).toContain("position: fixed");
    expect(footerBlock).toContain("right: clamp(12px, 2vw, 24px)");
    expect(footerBlock).toContain("bottom: clamp(8px, 1.4vw, 16px)");
    expect(footerBlock).toContain("font-family: ui-monospace");
    expect(footerBlock).toContain("opacity: 0.4");
    expect(footerSpanBlock).toContain("white-space: nowrap");
    expect(mobileMedia).toContain(".home-grid-featured");
    expect(mobileMedia).toContain("grid-template-columns: 1fr");
    expect(mobileMedia).toContain(".home-grid-featured > .home-utility-grid");
    expect(mobileMedia).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(mobileMedia).toContain("transform: none");

    const brightMobileCss = readCssFixture("../styles/themes/bright-school/mobile.css");
    const brightMobileTopStripBlock = brightMobileCss.match(/\.home-top-strip\s*\{[^}]+\}/)?.[0] ?? "";
    const brightMobileMenuBlock = brightMobileCss.match(/\.home-mobile-menu\s*\{[^}]+\}/)?.[0] ?? "";
    const brightMobileMenuPanelBlock = brightMobileCss.match(/\.home-mobile-menu-panel\s*\{[^}]+\}/)?.[0] ?? "";
    const brightMobileStageBlock = brightMobileCss.match(/section\.home-grid-featured\.home-stage\s*\{[^}]+\}/)?.[0] ?? "";
    const brightMobileMatchBlock = brightMobileCss.match(/\.home-match-feature\s*\{[^}]+\}/)?.[0] ?? "";
    const brightMobileManualBlock = brightMobileCss.match(/\.house-manual-entry\s*\{[^}]+\}/)?.[0] ?? "";
    const brightMobileManualImageBlock = brightMobileCss.match(/\.house-manual-entry\.home-image-entry\s*\{[^}]+\}/)?.[0] ?? "";
    const brightMobileUtilityGridBlock = brightMobileCss.match(/\.home-grid-featured > \.home-utility-grid\s*\{[^}]+\}/g)?.find((block) => block.includes("grid-area: utility")) ?? "";
    const brightMobileUtilityEntryBlock = brightMobileCss.match(/\.home-grid-featured > \.home-utility-grid \.utility-entry\s*\{[^}]+\}/)?.[0] ?? "";
    const brightMobileImageEntryBlock = brightMobileCss.match(/\.home-image-entry\s*\{[^}]+\}/)?.[0] ?? "";
    const brightMobileImageBlock = brightMobileCss.match(/\.home-image-entry img\s*\{[^}]+\}/)?.[0] ?? "";
    const brightMobileMatchImageBlock = brightMobileCss.match(/\.match-image-entry\s*\{[^}]+\}/)?.[0] ?? "";
    const brightMobileUtilityArtBlock = brightMobileCss.match(/\.home-grid-featured > \.home-utility-grid \.utility-entry-art\s*\{[^}]+\}/)?.[0] ?? "";
    expect(brightMobileCss).toContain(".home-mobile-menu");
    expect(brightMobileCss).toContain(".home-mobile-menu-panel");
    expect(brightMobileTopStripBlock).toContain("--home-floating-z: 120");
    expect(brightMobileTopStripBlock).toContain("position: relative !important");
    expect(brightMobileTopStripBlock).toContain("z-index: var(--home-floating-z) !important");
    expect(brightMobileMenuBlock).toContain("z-index: var(--home-floating-z) !important");
    expect(brightMobileMenuPanelBlock).toContain("z-index: var(--home-floating-z) !important");
    expect(brightMobileCss).toContain("main.home-screen.home-terminal-screen > section.home-main-panel.home-terminal-main");
    expect(brightMobileCss).toContain('--home-main-panel-bg: url("/assets/home/home-main-panel-mobile.webp")');
    expect(brightMobileCss).toContain("padding: clamp(34px, 9.8vw, 46px) clamp(32px, 9vw, 44px) clamp(30px, 8.6vw, 42px) !important");
    expect(brightMobileCss).not.toContain("main.home-screen.home-terminal-screen > section.home-orientation-guard");
    expect(brightMobileCss).toContain('"player"\n      "match"\n      "manual"\n      "utility" !important');
    expect(brightMobileStageBlock).toContain("grid-template-rows: auto clamp(176px, 52vw, 224px) clamp(148px, 42vw, 188px) auto !important");
    expect(brightMobileStageBlock).toContain("gap: 8px !important");
    expect(brightMobileCss).toContain('grid-template-areas: "brand online actions" !important');
    expect(brightMobileMatchBlock).toContain("height: clamp(176px, 52vw, 224px) !important");
    expect(brightMobileMatchBlock).toContain("grid-template-rows: minmax(0, 1fr) !important");
    expect(brightMobileManualBlock).toContain("height: clamp(148px, 42vw, 188px) !important");
    expect(brightMobileManualBlock).toContain("overflow: visible !important");
    expect(brightMobileManualImageBlock).toContain("max-height: clamp(148px, 42vw, 188px) !important");
    expect(brightMobileImageEntryBlock).toContain("overflow: visible !important");
    expect(brightMobileImageBlock).toContain("filter: drop-shadow(6px 8px 0 rgba(61, 43, 37, 0.42)) !important");
    expect(brightMobileMatchImageBlock).toContain("overflow: visible !important");
    expect(brightMobileUtilityGridBlock).toContain("gap: 8px !important");
    expect(brightMobileUtilityEntryBlock).toContain("min-height: 52px !important");
    expect(brightMobileUtilityEntryBlock).toContain("overflow: visible !important");
    expect(brightMobileUtilityArtBlock).toContain("overflow: visible !important");
    expect(brightMobileUtilityArtBlock).toContain("padding: 0 6px 6px 0 !important");
    expect(brightMobileCss).toContain("grid-template-columns: 22px max-content !important");
    expect(brightMobileCss).toContain("word-break: keep-all !important");
    expect(brightMobileCss).toContain(".topbar-actions > .icon-button");
    expect(brightMobileCss).toContain("padding: 12px !important");
    expect(brightMobileCss).toContain('content: "" !important');
    expect(brightMobileCss).toContain("bottom: -10px !important");
    expect(brightMobileCss).toContain("pointer-events: none !important");

    const finalMobileCss = readCssFixture("../styles/mobile-adaptive.css");
    expect(finalMobileCss).toContain(":has(.modal-backdrop) .home-mobile-menu");
    expect(finalMobileCss).toContain("pointer-events: none !important");
    expect(finalMobileCss).toContain(".home-mobile-menu-panel button");
    expect(finalMobileCss).toContain("white-space: nowrap !important");
    expect(finalMobileCss).toContain(".home-brand-title");
    expect(finalMobileCss).toContain("--home-brand-title-size: clamp(22px, 6.7vw, 32px) !important");
    expect(finalMobileCss).toContain("font-size: var(--home-brand-title-size) !important");
    expect(finalMobileCss).toContain("text-overflow: clip !important");
    expect(finalMobileCss).toContain("@media (min-width: 1181px) and (min-height: 960px)");
    expect(finalMobileCss).toContain(".home-screen.home-terminal-screen + .home-footer-strip");
    expect(finalMobileCss).toContain(".home-screen.home-terminal-screen > .home-footer-strip");
    expect(finalMobileCss).toContain("position: fixed !important");
    expect(finalMobileCss).toContain("bottom: clamp(8px, 1.4vw, 16px) !important");
    expect(finalMobileCss).toContain("pointer-events: none !important");
    expect(finalMobileCss).toContain(".home-footer-strip a");
    expect(finalMobileCss).toContain("pointer-events: auto !important");
    expect(finalMobileCss).toContain(".home-footer-strip");
    expect(finalMobileCss).toContain("position: static !important");
    expect(finalMobileCss).toContain(".leaderboard-header h2");
    expect(finalMobileCss).toContain(".owned-decoration-header h3");
    expect(finalMobileCss).toContain("white-space: nowrap !important");
    expect(finalMobileCss).toContain("@media (min-width: 1024px) and (max-width: 1180px), (min-width: 701px) and (max-height: 640px)");
    expect(finalMobileCss).toContain("@media (min-width: 1181px) and (max-width: 1500px)");
    expect(finalMobileCss).toContain("grid-template-columns: minmax(420px, 0.72fr) minmax(640px, 1.28fr) !important");
    expect(finalMobileCss).toContain("gap: clamp(10px, 1.25vw, 18px) clamp(18px, 2vw, 30px) !important");
    expect(finalMobileCss).toContain("height: clamp(300px, 42dvh, 460px) !important");
    expect(finalMobileCss).toContain("height: clamp(560px, 72dvh, 760px) !important");
    expect(finalMobileCss).toContain("width: 100% !important");
    expect(finalMobileCss).toContain("--home-plaque-name-column-min: calc(12ch + 1.4em)");
    expect(finalMobileCss).toContain("grid-template-columns: 62px minmax(0, 1fr) var(--home-student-id-stats-width) !important");
    expect(finalMobileCss).toContain("font-size: clamp(18px, 1.45vw, 21px) !important");
    expect(finalMobileCss).toContain("@media (min-width: 701px) and (max-width: 1023px)");
    expect(finalMobileCss).toContain("--home-micro-stage-width: 960px");
    expect(finalMobileCss).toContain("overflow-x: auto !important");
    expect(finalMobileCss).toContain("overscroll-behavior-inline: contain");
    expect(finalMobileCss).toContain("scrollbar-gutter: stable both-edges");
    expect(finalMobileCss).toContain("width: var(--home-micro-stage-width) !important");
    expect(finalMobileCss).toContain("--home-plaque-name-column-min: calc(12ch + 1.2em)");
    expect(finalMobileCss).toContain("grid-template-columns: clamp(54px, 7vw, 64px) minmax(0, 1fr) var(--home-student-id-stats-width) !important");
    expect(finalMobileCss).toContain("\"player match\"");
    expect(finalMobileCss).toContain("\"manual match\"");
    expect(finalMobileCss).toContain("\"utility match\"");
    expect(finalMobileCss).toContain("@media (min-width: 701px)");
    expect(finalMobileCss).toContain("transform: rotate(2deg) !important");
    expect(finalMobileCss).not.toContain("transform: translateY(-6px) !important");
    expect(finalMobileCss).toContain(".home-image-entry > img");
    expect(finalMobileCss).toContain("box-sizing: border-box !important");
    expect(finalMobileCss).toContain("max-height: 100% !important");
    expect(finalMobileCss).toContain("grid-template-areas:");
    expect(finalMobileCss).toContain("grid-template-columns: minmax(320px, 0.72fr) minmax(520px, 1.28fr) !important");
    expect(finalMobileCss).toContain(".home-player-zone,\n  .app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .house-manual-entry");
    expect(finalMobileCss).toContain("position: static !important");
    expect(finalMobileCss).toContain("@media (min-width: 1024px) and (max-height: 560px)");
  });

  it("renders configured footer text with safe markdown links", () => {
    const html = renderHome({
      siteSettings: {
        homeTitle: "棋境大厅",
        homeSubtitle: "测试服",
        aboutText: "关于",
        footerText: "棋境大厅\n[备案链接](https://beian.miit.gov.cn/)\n<script>alert(1)</script>"
      }
    });

    expect(html).toContain('class="home-footer-line"');
    expect(html).toContain("测试服");
    expect(html).toContain('<a href="https://beian.miit.gov.cn/" rel="noreferrer" target="_blank">备案链接</a>');
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("keeps match mode cancel actions separated from mode choices", () => {
    const modalCss = readCssFixture("../styles/modals.css");
    const finalMobileCss = readCssFixture("../styles/mobile-adaptive.css");

    expect(modalCss).toContain(".match-mode-modal .match-mode-options + .secondary-action");
    expect(modalCss).toContain("margin-top: 12px;");
    expect(finalMobileCss).toContain(".match-mode-modal .match-mode-options + .secondary-action");
    expect(finalMobileCss).toContain("margin-top: 14px !important;");
  });

  it("centers translucent mode icon watermarks inside match mode choices", () => {
    const html = renderHome({
      matchModePickerOpen: true,
      lobbyStats: {
        onlineCount: 2,
        matchmakingCounts: {
          spark: 3,
          standard: 0,
          gomoku: 1
        }
      }
    });
    const modalCss = readCssFixture("../styles/modals.css");
    const brightSchoolCss = readCssFixture("../styles/themes/bright-school.css");
    const finalMobileCss = readCssFixture("../styles/mobile-adaptive.css");
    const optionBlock = modalCss.match(/\.match-mode-option\s*\{[^}]+\}/)?.[0] ?? "";
    const watermarkBlock = modalCss.match(/\.match-mode-watermark\s*\{[^}]+\}/)?.[0] ?? "";
    const watermarkIconBlock = modalCss.match(/\.match-mode-watermark-icon\s*\{[^}]+\}/)?.[0] ?? "";
    const watermarkLabelBlock = modalCss.match(/\.match-mode-watermark-label\s*\{[^}]+\}/)?.[0] ?? "";
    const mobileWatermarkBlock = finalMobileCss.match(/\.match-mode-watermark\s*\{[^}]+\}/)?.[0] ?? "";
    const copyBlock = modalCss.match(/\.match-mode-copy\s*\{[^}]+\}/)?.[0] ?? "";
    const countBlock = modalCss.match(/\.match-mode-count\s*\{[^}]+\}/)?.[0] ?? "";
    const brightChildResetIndex = brightSchoolCss.lastIndexOf(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school button > *");
    const brightWatermarkBlock = brightSchoolCss.match(/\.app-shell\.player-theme-enabled\.theme-bright-school\.theme-bright-school \.match-mode-option > \.match-mode-watermark\s*\{[^}]+\}/)?.[0] ?? "";
    const brightWatermarkIndex = brightSchoolCss.indexOf(brightWatermarkBlock);

    expect(html).toContain("match-mode-watermark");
    expect(html).toContain("match-mode-watermark-label text-display-accent");
    expect(html).toContain('src="/assets/match-modes/mode-spark.png"');
    expect(html).toContain('src="/assets/match-modes/mode-standard.png"');
    expect(html).toContain('src="/assets/match-modes/mode-gomoku.png"');
    expect(html).toContain("SIGRIKAGO MODE");
    expect(html).toContain("STANDARD MODE");
    expect(html).toContain("GOMOKU MODE");
    expect(html).toContain("<strong>星炬对弈</strong>");
    expect(html).toContain("<strong>标准对弈</strong>");
    expect(html).toContain("<strong>来下五子棋吗？</strong>");
    expect(html).toContain('aria-label="匹配中 3 人"');
    expect(html).toContain('aria-label="匹配中 0 人"');
    expect(html).toContain('aria-label="匹配中 1 人"');
    expect(optionBlock).toContain("position: relative");
    expect(optionBlock).toContain("isolation: isolate");
    expect(optionBlock).toContain("overflow: hidden");
    expect(watermarkBlock).toContain("position: absolute");
    expect(watermarkBlock).toContain("top: 50%");
    expect(watermarkBlock).toContain("left: 50%");
    expect(watermarkBlock).toContain("opacity: 0.5");
    expect(watermarkBlock).toContain("pointer-events: none");
    expect(watermarkBlock).toContain("transform: translate(-50%, -50%)");
    expect(brightChildResetIndex).toBeGreaterThan(-1);
    expect(brightWatermarkIndex).toBeGreaterThan(brightChildResetIndex);
    expect(brightWatermarkBlock).toContain("transform: translate(-50%, -50%) !important");
    expect(watermarkIconBlock).toContain("object-fit: contain");
    expect(watermarkLabelBlock).toContain("font-size: clamp(2rem, 4.8vw, 3.05rem)");
    expect(watermarkLabelBlock).toContain("text-overflow: ellipsis");
    expect(copyBlock).toContain("z-index: 1");
    expect(countBlock).toContain("z-index: 1");
    expect(countBlock).toContain("justify-self: end");
    expect(finalMobileCss).toContain(".match-mode-watermark");
    expect(mobileWatermarkBlock).toContain("opacity: 0.2 !important");
    expect(finalMobileCss).toContain("max-width: min(58%, calc(100% - 132px)) !important;");
    expect(finalMobileCss).toContain(".match-mode-watermark-label");
    expect(finalMobileCss).toContain("font-size: clamp(1rem, 6.8vw, 1.45rem) !important;");
  });

  it("splits match mode rules into stable mobile lines without a trailing time separator", () => {
    const split = splitMatchModeRules("13路 · 5分钟30秒3次 · 黑贴2又3/4子");
    const html = renderToStaticMarkup(createElement(MatchModeRuleText, {
      rulesText: "13路 · 5分钟30秒3次 · 黑贴2又3/4子"
    }));

    expect(split).toEqual({
      primary: "13路 · 5分钟30秒3次",
      secondary: "黑贴2又3/4子"
    });
    expect(html).toContain("match-mode-rules");
    expect(html).toContain("<span class=\"match-mode-rule-line\">13路 · 5分钟30秒3次</span>");
    expect(html).toContain("<span class=\"match-mode-rule-line\">黑贴2又3/4子</span>");
    expect(html).not.toContain("5分钟30秒3次 ·</span>");
  });

  it("renders the recruitment entry as an enabled image utility action with a ready accent", () => {
    const source = readFileSync(new URL("./components/HomeUtilityDock.jsx", import.meta.url), "utf8");
    const mobileCss = readCssFixture("../styles/mobile-adaptive.css");
    const stageSource = readFileSync(new URL("./components/HomeStage.jsx", import.meta.url), "utf8");
    const routeSource = readFileSync(new URL("../app/AppRoutes.jsx", import.meta.url), "utf8");
    const overlaySource = readFileSync(new URL("../app/AppOverlays.jsx", import.meta.url), "utf8");

    expect(source).toContain("recruitment-entry");
    expect(source).toContain("onOpenRecruitment");
    expect(source).not.toContain("home-entry-red-dot");
    expect(source).toContain("has-alert");
    expect(source).toContain("recruitmentReady");
    expect(source).toContain("招募");
    expect(source).toContain("utility-image-entry");
    expect(source).toContain("utility-entry-art");
    expect(source).toContain("home-utility-recruitment.webp");
    expect(source).not.toContain("成员补给");
    expect(source).not.toContain("utility-entry-description");
    expect(source).not.toContain("<strong>扭蛋</strong>");
    expect(mobileCss).toContain(".utility-entry:active:not(:disabled)");
    const mobileUtilityContainerBlock = mobileCss.match(/:is\(\.utility-image-entry:hover:not\(:disabled\), \.utility-image-entry:focus-visible:not\(:disabled\), \.utility-image-entry:active:not\(:disabled\)\)\s*\{[^}]+\}/)?.[0] ?? "";
    const mobileUtilityHoverArtBlock = mobileCss.match(/:is\(\.utility-image-entry:hover:not\(:disabled\), \.utility-image-entry:focus-visible:not\(:disabled\)\) \.utility-entry-art\s*\{[^}]+\}/)?.[0] ?? "";
    const mobileUtilityActiveArtBlock = mobileCss.match(/\.utility-image-entry:active:not\(:disabled\) \.utility-entry-art\s*\{[^}]+\}/)?.[0] ?? "";
    expect(mobileUtilityContainerBlock).toContain("background: transparent !important");
    expect(mobileUtilityContainerBlock).toContain("border: 0 !important");
    expect(mobileUtilityContainerBlock).toContain("padding: 0 !important");
    expect(mobileUtilityContainerBlock).toContain("box-shadow: none !important");
    expect(mobileUtilityContainerBlock).toContain("overflow: visible !important");
    expect(mobileUtilityContainerBlock).toContain("transform: none !important");
    expect(mobileUtilityHoverArtBlock).toContain("brightness(1.04) saturate(1.06)");
    expect(mobileUtilityHoverArtBlock).toContain("transform: translateY(-1px) rotate(0.6deg) !important");
    expect(mobileUtilityActiveArtBlock).toContain("drop-shadow(3px 4px 0 rgba(61, 43, 37, 0.26))");
    expect(mobileUtilityActiveArtBlock).toContain("transform: translateY(1px) !important");
    expect(mobileUtilityActiveArtBlock).not.toContain("scale(");
    expect(stageSource).toContain("onOpenRecruitment");
    expect(routeSource).toContain("setShowRecruitment(true)");
    expect(overlaySource).toContain("RecruitmentModal");
    const alertCss = readCssFixture("../styles/home-terminal/recruitment-alert.css");
    const brightUtilityCss = readCssFixture("../styles/themes/bright-school/surface-contracts/home-utility-tabs.css");
    const brightToolboxCss = readCssFixture("../styles/themes/bright-school/home/utility-toolbox.css");
    expect(alertCss).toContain(".recruitment-entry.has-alert");
    expect(alertCss).toContain("background: linear-gradient(90deg");
    expect(alertCss).not.toContain("home-entry-red-dot");
    expect(brightUtilityCss).toContain(".recruitment-entry.has-alert");
    expect(brightUtilityCss).toContain("background: transparent !important;");
    expect(brightToolboxCss).toContain(".recruitment-entry.has-alert .utility-entry-art");
    expect(brightToolboxCss).toContain("drop-shadow(0 0 10px rgba(255, 95, 149, 0.18))");
    expect(brightUtilityCss).not.toContain("home-entry-red-dot");
  });

  it("renders mailbox actions in desktop topbar and mobile menu with badge hooks", () => {
    const html = renderHome({ mailboxBadgeCount: 3, announcementUnread: true });
    const homeCss = readCssFixture("../styles/home-terminal.css");
    const mobileBadgeRule = homeCss.match(/\.home-mobile-mailbox-action \.mailbox-badge\s*\{[^}]+\}/)?.[0] ?? "";
    const mobileAnnouncementBadgeRule = homeCss.match(/\.home-mobile-announcement-action \.announcement-badge-dot\s*\{[^}]+\}/)?.[0] ?? "";

    expect(html).toContain("mailbox-action");
    expect(html).toContain("home-mobile-mailbox-action");
    expect(html).toContain("mailbox-badge");
    expect(html).toContain("home-mobile-announcement-action has-unread");
    expect(html).toContain("announcement-badge-dot");
    expect(html).toContain(">3</span>");
    expect(html).toContain("aria-label=\"打开邮箱，3封未处理邮件\"");
    expect(mobileBadgeRule).toContain("position: absolute");
    expect(mobileBadgeRule).toContain("top: -7px");
    expect(mobileBadgeRule).toContain("right: -7px");
    expect(mobileBadgeRule).not.toContain("position: static");
    expect(mobileBadgeRule).not.toContain("margin-left: auto");
    expect(mobileAnnouncementBadgeRule).toContain("position: absolute");
    expect(mobileAnnouncementBadgeRule).toContain("top: -7px");
    expect(mobileAnnouncementBadgeRule).toContain("right: -7px");
    expect(mobileAnnouncementBadgeRule).not.toContain("position: static");
    expect(mobileAnnouncementBadgeRule).not.toContain("margin-left: auto");
  });

  it("renders onboarding replay actions in desktop topbar and mobile menu", () => {
    const html = renderHome();
    const desktopOnboardingAction = html.match(/<button class="icon-button onboarding-action"[\s\S]*?<\/button>/)?.[0] ?? "";

    expect(html).toContain("onboarding-action");
    expect(html).toContain("home-mobile-onboarding-action");
    expect(html).toContain("aria-label=\"打开新手引导\"");
    expect(desktopOnboardingAction).toContain("aria-label=\"打开新手引导\"");
    expect(desktopOnboardingAction).not.toContain("<span");
    expect(desktopOnboardingAction).not.toContain(">\u5f15\u5bfc<");
    expect(html).toContain(">引导</button>");
  });
});
