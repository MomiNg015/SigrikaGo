import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, statSync } from "node:fs";
import HomeScreen from "./HomeScreen.jsx";
import MatchModeRuleText, { splitMatchModeRules } from "./MatchModeRuleText.jsx";
import { CHARACTERS } from "../shared/characters.js";
import { readCssWithImports } from "../styles/cssTestUtils.js";

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
    expect(html).toContain("home-brand-subtitle");
    expect(html).toContain("连罗伊人的都爱玩的智力游戏");
    expect(html).toContain("home-online-tag");
    expect(html).toContain("在线人数：2");
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

  it("uses a compact WebP match image instead of the source PNG", () => {
    const webpUrl = new URL("../../public/assets/home/fantasy-match-entry.webp", import.meta.url);
    const pngUrl = new URL("../../public/assets/home/fantasy-match-entry.png", import.meta.url);
    const desktopPanelUrl = new URL("../../public/assets/home/home-main-panel-desktop.webp", import.meta.url);
    const mobilePanelUrl = new URL("../../public/assets/home/home-main-panel-mobile.webp", import.meta.url);

    expect(isWebp("../../public/assets/home/fantasy-match-entry.webp")).toBe(true);
    expect(isWebp("../../public/assets/home/home-main-panel-desktop.webp")).toBe(true);
    expect(isWebp("../../public/assets/home/home-main-panel-mobile.webp")).toBe(true);
    expect(statSync(webpUrl).size).toBeLessThan(statSync(pngUrl).size / 8);
    expect(statSync(desktopPanelUrl).size).toBeGreaterThan(0);
    expect(statSync(mobilePanelUrl).size).toBeGreaterThan(0);
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
    const brightToolboxEntry = readCssFixture("../styles/themes/bright-school/home/utility-toolbox.css");
    const brightUtilityCss = readCssFixture("../styles/themes/bright-school/contrast-purge/home-utility-tabs.css");
    const narrowDesktopCss = readCssFixture("../styles/mobile-adaptive/home-narrow-desktop.css");
    const brightPlaqueBlock = brightHomeCss.match(/\.home-player-plaque\.tactical-id-card\s*\{[^}]+\}/)?.[0] ?? "";
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
    const brightShortHeightMedia = brightHomeCss.match(/@media \(min-width: 701px\) and \(max-height: 760px\)\s*\{[\s\S]+?\n\}/)?.[0] ?? "";
    const brightNarrowDesktopMedia = brightHomeCss.match(/@media \(min-width: 701px\) and \(max-width: 1180px\)\s*\{[\s\S]+?@media \(max-width: 700px\)/)?.[0] ?? "";

    expect(html).toContain("home-player-row tactical-id-row");
    expect(html).toContain("home-player-plaque tactical-id-card");
    expect(html).toContain('aria-label="打开履历"');
    expect(html).toContain("plaque-mode-stat plaque-mode-stat-spark");
    expect(html).toContain("plaque-mode-stat plaque-mode-stat-standard");
    expect(html).toContain("plaque-mode-stat plaque-mode-stat-gomoku");
    expect(html).toContain("plaque-mode-name text-display-accent");
    expect(html).toContain("plaque-mode-rating text-rating-value");
    expect(html).toContain("1260分");
    expect(html).toContain("920分");
    expect(html).toContain("1010分");
    expect(html).toContain("utility-entry-icon");
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
    expect(brightPlaqueBlock).toContain("grid-template-columns: 72px minmax(0, 1fr) minmax(108px, 116px)");
    expect(brightPlaqueBlock).toContain("overflow: hidden");
    expect(brightPlaqueStrongBlock).toContain("padding-right: 6px");
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
    expect(brightStatsBlock).toContain("width: 100%");
    expect(brightStatsBlock).toContain("min-width: 0");
    expect(brightStatsBlock).toContain("box-sizing: border-box");
    expect(brightStatsBlock).toContain("container-type: inline-size");
    expect(brightStatsBlock).toContain("place-content: center stretch");
    expect(brightHomeCss).toContain("grid-template-columns: minmax(0, 0.9fr) minmax(0, 0.7fr) minmax(0, 1fr)");
    expect(brightHomeCss).toContain("font-size: clamp(9px, 9cqw, 13px)");
    expect(brightHomeCss).toContain(".plaque-mode-rating");
    expect(brightHomeCss).toContain("justify-self: center");
    expect(brightShortHeightMedia).not.toContain("max-height: calc(100dvh - 128px)");
    expect(brightShortHeightMedia).toContain("min-height: auto");
    expect(brightShortHeightMedia).toContain("height: clamp(220px, 36dvh, 286px)");
    expect(brightShortHeightMedia).toContain("height: clamp(270px, 50dvh, 356px)");
    expect(brightNarrowDesktopMedia).not.toContain("width: clamp(318px, 36vw, 386px)");
    expect(brightNarrowDesktopMedia).toContain("width: 100%");
    expect(brightNarrowDesktopMedia).toContain("--home-plaque-name-column-min: calc(12ch + 1.2em)");
    expect(brightNarrowDesktopMedia).toContain("grid-template-columns: 62px minmax(0, 1fr) minmax(96px, clamp(100px, 26%, 110px))");
    expect(brightNarrowDesktopMedia).toContain("font-size: clamp(20px, 2.1vw, 24px)");
    expect(brightNarrowDesktopMedia).toContain("grid-template-columns: minmax(0, 0.9fr) minmax(0, 0.7fr) minmax(0, 1fr)");
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
    expect(brightToolboxEntry).toContain("transform: translateY(-4px) rotate(calc(var(--utility-tilt, 0deg) - 0.45deg)) scale(1.018) !important");
    expect(brightUtilityCss).toContain(".utility-entry:hover:not(:disabled)");
    expect(brightUtilityCss).toContain("transform: translateY(-3px) scale(1.018) !important;");
    expect(brightUtilityCss).toContain(".utility-entry:active:not(:disabled)");
    expect(brightUtilityCss).toContain("transform: translateY(2px) scale(0.985) !important;");
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
    expect(brightMobileCss).toContain(".home-mobile-menu");
    expect(brightMobileCss).toContain(".home-mobile-menu-panel");
    expect(brightMobileCss).toContain("main.home-screen.home-terminal-screen > section.home-main-panel.home-terminal-main");
    expect(brightMobileCss).toContain('--home-main-panel-bg: url("/assets/home/home-main-panel-mobile.webp")');
    expect(brightMobileCss).toContain("padding: clamp(34px, 9.8vw, 46px) clamp(32px, 9vw, 44px) clamp(30px, 8.6vw, 42px) !important");
    expect(brightMobileCss).not.toContain("main.home-screen.home-terminal-screen > section.home-orientation-guard");
    expect(brightMobileCss).toContain('"player"\n      "match"\n      "manual"\n      "utility" !important');
    expect(brightMobileCss).toContain("grid-template-rows: minmax(188px, clamp(210px, 58vw, 270px)) !important");
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
    expect(finalMobileCss).toContain("font-size: clamp(22px, 6.7vw, 32px) !important");
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
    expect(finalMobileCss).toContain("grid-template-columns: 62px minmax(0, 1fr) minmax(106px, 116px) !important");
    expect(finalMobileCss).toContain("font-size: clamp(18px, 1.45vw, 21px) !important");
    expect(finalMobileCss).toContain("@media (min-width: 701px) and (max-width: 1023px)");
    expect(finalMobileCss).toContain("--home-micro-stage-width: 960px");
    expect(finalMobileCss).toContain("overflow-x: auto !important");
    expect(finalMobileCss).toContain("overscroll-behavior-inline: contain");
    expect(finalMobileCss).toContain("scrollbar-gutter: stable both-edges");
    expect(finalMobileCss).toContain("width: var(--home-micro-stage-width) !important");
    expect(finalMobileCss).toContain("--home-plaque-name-column-min: calc(12ch + 1.2em)");
    expect(finalMobileCss).toContain("grid-template-columns: clamp(54px, 7vw, 64px) minmax(0, 1fr) minmax(100px, 27%) !important");
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

  it("renders the recruitment entry as an enabled home utility action with a ready background alert", () => {
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
    expect(source).not.toContain("成员补给");
    expect(source).not.toContain("utility-entry-description");
    expect(source).not.toContain("<strong>扭蛋</strong>");
    expect(mobileCss).toContain(".utility-entry:active:not(:disabled)");
    expect(stageSource).toContain("onOpenRecruitment");
    expect(routeSource).toContain("setShowRecruitment(true)");
    expect(overlaySource).toContain("RecruitmentModal");
    const alertCss = readCssFixture("../styles/home-terminal/recruitment-alert.css");
    const brightUtilityCss = readCssFixture("../styles/themes/bright-school/contrast-purge/home-utility-tabs.css");
    expect(alertCss).toContain(".recruitment-entry.has-alert");
    expect(alertCss).toContain("background: linear-gradient(90deg");
    expect(alertCss).not.toContain("home-entry-red-dot");
    expect(brightUtilityCss).toContain(".recruitment-entry.has-alert");
    expect(brightUtilityCss).toContain("background: #ff9ebb !important;");
    expect(brightUtilityCss).not.toContain("home-entry-red-dot");
  });

  it("renders mailbox actions in desktop topbar and mobile menu with badge hooks", () => {
    const html = renderHome({ mailboxBadgeCount: 3 });
    const homeCss = readCssFixture("../styles/home-terminal.css");
    const mobileBadgeRule = homeCss.match(/\.home-mobile-mailbox-action \.mailbox-badge\s*\{[^}]+\}/)?.[0] ?? "";

    expect(html).toContain("mailbox-action");
    expect(html).toContain("home-mobile-mailbox-action");
    expect(html).toContain("mailbox-badge");
    expect(html).toContain(">3</span>");
    expect(html).toContain("aria-label=\"打开邮箱，3封未处理邮件\"");
    expect(mobileBadgeRule).toContain("position: absolute");
    expect(mobileBadgeRule).toContain("top: -7px");
    expect(mobileBadgeRule).toContain("right: -7px");
    expect(mobileBadgeRule).not.toContain("position: static");
    expect(mobileBadgeRule).not.toContain("margin-left: auto");
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
