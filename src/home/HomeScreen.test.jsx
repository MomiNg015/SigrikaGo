import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, statSync } from "node:fs";
import HomeScreen from "./HomeScreen.jsx";
import { CHARACTERS } from "../shared/characters.js";

function renderHome(overrides = {}) {
  return renderToStaticMarkup(createElement(HomeScreen, {
    user: {
      username: "shop-test",
      rank: "2段",
      rating: 1000,
      modeStats: {
        spark: { rating: 1260, wins: 3, losses: 1, draws: 0 },
        standard: { rating: 920, wins: 1, losses: 2, draws: 0 }
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
    onOpenMessageBoard: () => {},
    onOpenAdmin: () => {},
    ...overrides
  }));
}

function isWebp(path) {
  const bytes = readFileSync(new URL(path, import.meta.url));
  return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
}

function readTextFixture(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
}

describe("HomeScreen", () => {
  it("renders the lobby as a Startorch tactical terminal shell", () => {
    const html = renderHome();
    const css = readTextFixture("../styles/home-terminal.css");
    const appShellBlock = css.match(/\.app-shell:has\(\.home-screen\)\s*\{[^}]+\}/)?.[0] ?? "";
    const appShellBeforeBlock = css.match(/\.app-shell:has\(\.home-screen\)::before\s*\{[^}]+\}/)?.[0] ?? "";
    const appShellAfterBlock = css.match(/\.app-shell:has\(\.home-screen\)::after\s*\{[^}]+\}/)?.[0] ?? "";
    const screenBlock = css.match(/\.home-screen\s*\{[^}]+\}/g)?.find((block) => block.includes("--home-terminal-bg")) ?? "";

    expect(html).toContain('class="home-screen home-terminal-screen"');
    expect(html).not.toContain("home-terminal-status");
    expect(html).not.toContain("SYSTEM: ACTIVE // IN_LOBBY");
    expect(html).toContain("home-brand-title");
    expect(html).toContain("home-brand-subtitle");
    expect(html).toContain("连罗伊人的都爱玩的智力游戏");
    expect(html).toContain("home-online-tag");
    expect(html).toContain("在线人数：2");
    expect(html).toContain("home-mobile-menu");
    expect(html).toContain("home-mobile-menu-toggle");
    expect(html).toContain("home-mobile-menu-panel");
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
    expect(screenBlock).toContain("min-width: 1180px");
  });

  it("uses a compact WebP match image instead of the source PNG", () => {
    const webpUrl = new URL("../../public/assets/home/fantasy-match-entry.webp", import.meta.url);
    const pngUrl = new URL("../../public/assets/home/fantasy-match-entry.png", import.meta.url);

    expect(isWebp("../../public/assets/home/fantasy-match-entry.webp")).toBe(true);
    expect(statSync(webpUrl).size).toBeLessThan(statSync(pngUrl).size / 8);
  });

  it("renders hologram entry pods without changing the primary click targets", () => {
    const html = renderHome();
    const css = readTextFixture("../styles/home-terminal.css");
    const stageBlock = css.match(/\.home-grid-featured\s*\{[^}]+\}/g)?.find((block) => block.includes("minmax(240px, 0.72fr)")) ?? "";
    const imageEntryBlock = css.match(/\.home-image-entry\s*\{[^}]+\}/)?.[0] ?? "";
    const hoverBlock = css.match(/\.home-image-entry:hover,[\s\S]+?\.home-image-entry:focus-visible\s*\{[^}]+\}/)?.[0] ?? "";
    const tacticalTextBlock = css.match(/\.home-image-entry::after\s*\{[^}]+\}/)?.[0] ?? "";
    const manualBlock = css.match(/\.house-manual-entry\s*\{[^}]+\}/)?.[0] ?? "";
    const matchBlock = css.match(/\.match-image-entry\s*\{[^}]+\}/g)?.find((block) => block.includes("border-color: rgba(0, 191, 255, 0.32)")) ?? "";

    expect(html).toContain('class="home-grid-featured home-stage home-terminal-stage"');
    expect(html).toContain('class="home-image-entry house-manual-entry hologram-entry"');
    expect(html).toContain('class="home-image-entry match-image-entry hologram-entry"');
    expect(html).toContain('src="/assets/home/book-entry.webp"');
    expect(html).toContain('src="/assets/home/fantasy-match-entry.webp"');
    expect(html).toContain("当前匹配人数：3");
    expect(stageBlock).toContain("grid-template-columns: minmax(240px, 0.72fr) minmax(360px, 1.28fr)");
    expect(stageBlock).toContain("overflow: visible");
    expect(imageEntryBlock).toContain("background: rgba(10, 28, 38, 0.52)");
    expect(imageEntryBlock).toContain("border: 1px solid rgba(0, 255, 190, 0.28)");
    expect(imageEntryBlock).toContain("clip-path: polygon");
    expect(imageEntryBlock).toContain("transition: transform 260ms");
    expect(hoverBlock).toContain("transform: translateY(-10px)");
    expect(hoverBlock).toContain("border-color: var(--home-terminal-cyan)");
    expect(css).toContain(".match-image-entry:hover::after,\n.match-image-entry:focus-visible::after {\n  animation: none;");
    expect(tacticalTextBlock).toContain("content: attr(data-hud)");
    expect(html).toContain('data-hud="部员手册"');
    expect(html).toContain('data-hud="匹配对局"');
    expect(matchBlock).toContain("border-color: rgba(0, 191, 255, 0.32)");
  });

  it("uses a tactical ID card and skewed navigation cards", () => {
    const html = renderHome();
    const css = readTextFixture("../styles/home-terminal.css");
    const plaqueBlock = css.match(/\.home-player-zone \.home-player-plaque\s*\{[^}]+\}/)?.[0] ?? "";
    const statsBlock = css.match(/\.home-player-zone \.plaque-stats\s*\{[^}]+\}/)?.[0] ?? "";
    const utilityBlock = css.match(/\.home-grid-featured > \.home-utility-grid\s*\{[^}]+\}/g)?.find((block) => block.includes("grid-template-columns: 1fr")) ?? "";
    const utilityEntryBlock = css.match(/\.home-grid-featured > \.home-utility-grid \.utility-entry\s*\{[^}]+\}/)?.[0] ?? "";
    const utilityTextBlock = css.match(/\.home-grid-featured > \.home-utility-grid \.utility-entry > \*\s*\{[^}]+\}/)?.[0] ?? "";
    const utilityHoverBeforeBlock = css.match(/\.home-grid-featured > \.home-utility-grid \.utility-entry:hover::before,[\s\S]+?\.utility-entry:focus-visible::before\s*\{[^}]+\}/)?.[0] ?? "";

    expect(html).toContain("home-player-row tactical-id-row");
    expect(html).toContain("home-player-plaque tactical-id-card");
    expect(html).toContain('aria-label="打开履历"');
    expect(html).toContain("plaque-mode-stat plaque-mode-stat-spark");
    expect(html).toContain("plaque-mode-stat plaque-mode-stat-standard");
    expect(html).toContain("1260分");
    expect(html).toContain("920分");
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
    expect(utilityBlock).toContain("grid-template-columns: 1fr");
    expect(utilityEntryBlock).toContain("grid-template-columns: 28px minmax(0, 1fr)");
    expect(utilityEntryBlock).toContain("transform: skewX(-15deg)");
    expect(utilityEntryBlock).toContain("border-left: 4px solid var(--home-terminal-cyan)");
    expect(utilityEntryBlock).toContain("clip-path: polygon");
    expect(css).toContain(".home-grid-featured > .home-utility-grid .utility-entry strong {\n  display: block");
    expect(utilityTextBlock).toContain("transform: skewX(15deg)");
    expect(utilityHoverBeforeBlock).toContain("animation: home-nav-flow");
  });

  it("keeps the HUD footer minimal and rewrites the mobile lobby layout", () => {
    const html = renderHome();
    const css = readTextFixture("../styles/home-terminal.css");
    const footerBlock = css.match(/\.home-footer-strip\s*\{[^}]+\}/)?.[0] ?? "";
    const footerSpanBlock = css.match(/\.home-footer-strip span\s*\{[^}]+\}/)?.[0] ?? "";
    const mobileMedia = css.match(/@media \(max-width: 768px\)\s*\{[\s\S]+?\.home-grid-featured > \.home-utility-grid \.utility-entry > \*\s*\{[^}]+\}[\s\S]+?\}/)?.[0] ?? "";

    expect(html).toContain("Copyright ©KURO GAMES. ALL RIGHTS RESERVED.");
    expect(html).toContain("浙ICP备2026035038号");
    expect(html).toContain("请横屏使用");
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

    const brightMobileCss = readTextFixture("../styles/themes/bright-school/mobile.css");
    expect(brightMobileCss).toContain(".home-mobile-menu");
    expect(brightMobileCss).toContain(".home-mobile-menu-panel");
    expect(brightMobileCss).toContain("grid-template-columns: 22px max-content !important");
    expect(brightMobileCss).toContain("word-break: keep-all !important");
    expect(brightMobileCss).toContain(".topbar-actions > .icon-button");
    expect(brightMobileCss).toContain("padding: 12px 12px 48px !important");
    expect(brightMobileCss).toContain("bottom: 10px !important");
    expect(brightMobileCss).toContain("max-width: calc(100% - 28px) !important");
    expect(brightMobileCss).toContain("font-family: \"Arial Rounded MT Bold\", \"Microsoft YaHei UI\", \"Microsoft YaHei\", system-ui, sans-serif !important");

    const finalMobileCss = readTextFixture("../styles/mobile-adaptive.css");
    expect(finalMobileCss).toContain(":has(.modal-backdrop) .home-mobile-menu");
    expect(finalMobileCss).toContain("pointer-events: none !important");
    expect(finalMobileCss).toContain(".home-mobile-menu-panel button");
    expect(finalMobileCss).toContain("white-space: nowrap !important");
    expect(finalMobileCss).toContain(".home-brand-title");
    expect(finalMobileCss).toContain("font-size: clamp(22px, 6.7vw, 32px) !important");
    expect(finalMobileCss).toContain("text-overflow: clip !important");
    expect(finalMobileCss).toContain(".home-footer-strip");
    expect(finalMobileCss).toContain("position: static !important");
    expect(finalMobileCss).toContain(".leaderboard-header h2");
    expect(finalMobileCss).toContain(".owned-decoration-header h3");
    expect(finalMobileCss).toContain("white-space: nowrap !important");
  });
});
