import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import HomeScreen from "./HomeScreen.jsx";
import { CHARACTERS } from "../shared/characters.js";

function renderHome(overrides = {}) {
  return renderToStaticMarkup(createElement(HomeScreen, {
    user: {
      username: "shop-test",
      rank: "2段",
      rating: 1000,
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

function readPngBorderAlpha(path) {
  const bytes = readFileSync(new URL(path, import.meta.url));
  let offset = 8;
  let width = 0;
  let height = 0;
  const idat = [];

  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (type === "IHDR") {
      width = bytes.readUInt32BE(dataStart);
      height = bytes.readUInt32BE(dataStart + 4);
      expect(bytes[dataStart + 8]).toBe(8);
      expect(bytes[dataStart + 9]).toBe(6);
    } else if (type === "IDAT") {
      idat.push(bytes.subarray(dataStart, dataEnd));
    } else if (type === "IEND") {
      break;
    }
    offset = dataEnd + 4;
  }

  const inflated = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const rows = [];
  let sourceOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;
    const row = Buffer.from(inflated.subarray(sourceOffset, sourceOffset + stride));
    sourceOffset += stride;
    const prev = rows[y - 1];
    for (let x = 0; x < stride; x += 1) {
      const left = x >= 4 ? row[x - 4] : 0;
      const up = prev ? prev[x] : 0;
      const upLeft = prev && x >= 4 ? prev[x - 4] : 0;
      if (filter === 1) row[x] = (row[x] + left) & 255;
      else if (filter === 2) row[x] = (row[x] + up) & 255;
      else if (filter === 3) row[x] = (row[x] + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        row[x] = (row[x] + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft)) & 255;
      }
    }
    rows.push(row);
  }

  const alphas = [];
  for (let x = 0; x < width; x += 1) {
    alphas.push(rows[0][x * 4 + 3], rows[height - 1][x * 4 + 3]);
  }
  for (let y = 0; y < height; y += 1) {
    alphas.push(rows[y][3], rows[y][(width - 1) * 4 + 3]);
  }
  return alphas;
}

describe("HomeScreen", () => {
  it("renders brand subtitle and online count in the top strip", () => {
    const html = renderHome();
    const css = readFileSync(new URL("../styles/base.css", import.meta.url), "utf8");
    const onlineTagBlock = css.match(/\.home-online-tag\s*\{[^}]+\}/)?.[0] ?? "";

    expect(html).toContain("home-brand-title");
    expect(html).toContain("home-brand-subtitle");
    expect(html).toContain("连罗伊人的都爱玩的智力游戏");
    expect(html).toContain("home-online-tag");
    expect(html).toContain("home-player-row");
    expect(html).toContain("home-player-plaque");
    expect(html.indexOf("home-top-brand")).toBeLessThan(html.indexOf("home-online-tag"));
    expect(html.indexOf("home-online-tag")).toBeLessThan(html.indexOf("topbar-actions"));
    expect(html).not.toContain("plaque-online-tag");
    expect(html).toContain("在线人数：2");
    expect(onlineTagBlock).toContain("border: 1px solid rgba(128, 102, 142, 0.16)");
    expect(onlineTagBlock).toContain("background: rgba(247, 247, 249, 0.88)");
  });

  it("uses image buttons for the match and house manual primary entries", () => {
    const html = renderHome();

    expect(html).toContain('class="home-grid-featured home-stage"');
    expect(html).toContain('class="home-image-entry match-image-entry"');
    expect(html).toContain('src="/assets/home/fantasy-match-entry.png"');
    expect(html).toContain('class="home-image-entry house-manual-entry"');
    expect(html).toContain('src="/assets/home/book-entry.png"');
    expect(html).toContain("当前匹配人数：3");
    expect(html).not.toContain("<h2>空想对局</h2>");
  });

  it("shows concise match rules and time settings inside the hover popup", () => {
    const html = renderHome();
    const css = readFileSync(new URL("../styles/base.css", import.meta.url), "utf8");
    const popupBlock = css.match(/\.matchmaking-popup\s*\{[^}]+\}/)?.[0] ?? "";
    const popupLineBlock = css.match(/\.matchmaking-popup span\s*\{[^}]+\}/)?.[0] ?? "";

    expect(html).not.toContain('class="match-rule-card"');
    expect(html).toContain('id="matchmaking-count-popup"');
    expect(html).toContain("路数：13路");
    expect(html).toContain("用时：5分钟30秒3次");
    expect(html).toContain("规则：黑贴2又3/4子，中国数子规则");
    expect(html.indexOf("当前匹配人数：3")).toBeLessThan(html.indexOf("路数：13路"));
    expect(html.indexOf("路数：13路")).toBeLessThan(html.indexOf("用时：5分钟30秒3次"));
    expect(html.indexOf("用时：5分钟30秒3次")).toBeLessThan(html.indexOf("规则：黑贴2又3/4子，中国数子规则"));
    expect(popupBlock).toContain("position: absolute");
    expect(popupBlock).toContain("display: grid");
    expect(popupBlock).toContain("backdrop-filter: blur(14px)");
    expect(popupLineBlock).toContain("display: block");
  });

  it("renders separate top and footer chrome around the home layout", () => {
    const html = renderHome();

    expect(html).toContain("home-top-strip");
    expect(html).toContain("home-main-panel");
    expect(html).toContain("home-footer-strip");
    expect(html).toContain("Copyright ©KURO GAMES. ALL RIGHTS RESERVED.");
    expect(html).toContain("浙ICP备2026035038号");
    expect(html).toContain("home-orientation-guard");
    expect(html).toContain("请横屏使用");
    expect(html).not.toContain("home-title-lockup");
  });

  it("keeps primary image entries stable inside one bounded stage", () => {
    const css = readFileSync(new URL("../styles/base.css", import.meta.url), "utf8");
    const stageBlock = css.match(/\.home-grid-featured\s*\{[^}]+\}/g)?.at(-1) ?? "";
    const matchFeatureBlock = css.match(/\.home-match-feature\s*\{[^}]+\}/g)?.at(-1) ?? "";
    const imageEntryBlock = css.match(/\.home-image-entry\s*\{[^}]+\}/)?.[0] ?? "";
    const appShellHomeBlock = css.match(/\.app-shell:has\(\.home-screen\)\s*\{[^}]+\}/)?.[0] ?? "";
    const appShellHomeBeforeBlock = css.match(/\.app-shell:has\(\.home-screen\)::before\s*\{[^}]+\}/)?.[0] ?? "";

    expect(stageBlock).toContain("aspect-ratio: 1480 / 620");
    expect(stageBlock).toContain("width: 100%");
    expect(stageBlock).toContain("display: block");
    expect(matchFeatureBlock).toContain("position: absolute");
    expect(matchFeatureBlock).toContain("overflow: visible");
    expect(imageEntryBlock).toContain("transition: none");
    expect(imageEntryBlock).not.toContain("filter");
    expect(imageEntryBlock).toContain("contain: layout paint style");
    expect(imageEntryBlock).not.toContain("will-change");
    expect(appShellHomeBlock).toContain("background: #f4f3f6");
    expect(appShellHomeBeforeBlock).toContain("background-image: url(\"/assets/home/multipurpose-classroom-bg.jpg\")");
    expect(appShellHomeBeforeBlock).toContain("filter: blur(14px) saturate(0.95)");
  });

  it("uses one game-menu coordinate stage with absolute zones", () => {
    const html = renderHome();
    const css = readFileSync(new URL("../styles/base.css", import.meta.url), "utf8");
    const homeScreenBlock = css.match(/\.home-screen\s*\{[^}]+\}/g)?.find((block) => block.includes("--home-stage-min-w")) ?? "";
    const mainPanelBlock = css.match(/\.home-main-panel\s*\{[^}]+\}/)?.[0] ?? "";
    const featuredBlock = css.match(/\.home-grid-featured\s*\{[^}]+\}/g)?.at(-1) ?? "";
    const playerZoneBlock = css.match(/\.home-player-zone\s*\{[^}]+\}/)?.[0] ?? "";
    const playerRowBlock = css.match(/\.home-player-zone \.home-player-row\s*\{[^}]+\}/)?.[0] ?? "";
    const playerPlaqueBlock = css.match(/\.home-player-zone \.home-player-plaque\s*\{[^}]+\}/)?.[0] ?? "";
    const playerStatsBlock = css.match(/\.home-player-zone \.plaque-stats\s*\{[^}]+\}/)?.[0] ?? "";
    const playerAvatarBlock = css.match(/\.home-player-zone \.plaque-avatar\s*\{[^}]+\}/)?.[0] ?? "";
    const playerAvatarImageBlock = css.match(/\.home-player-zone \.plaque-avatar img\s*\{[^}]+\}/)?.[0] ?? "";
    const manualBlock = css.match(/\.house-manual-entry\s*\{[^}]+\}/)?.[0] ?? "";
    const utilityBlock = css.match(/\.home-grid-featured > \.home-utility-grid\s*\{[^}]+\}/)?.[0] ?? "";
    const matchFeatureBlock = css.match(/\.home-match-feature\s*\{[^}]+\}/g)?.at(-1) ?? "";

    expect(html.indexOf("home-player-zone")).toBeLessThan(html.indexOf("house-manual-entry"));
    expect(html.indexOf("house-manual-entry")).toBeLessThan(html.indexOf("home-match-feature"));
    expect(html.indexOf("home-match-feature")).toBeLessThan(html.indexOf("home-utility-grid"));
    expect(homeScreenBlock).toContain("--home-stage-min-w: 1200px");
    expect(homeScreenBlock).toContain("--home-stage-min-h: 503px");
    expect(homeScreenBlock).toContain("--home-stage-max-w: 1920px");
    expect(homeScreenBlock).toContain("width: clamp(var(--home-stage-min-w), calc(100vw - (var(--page-pad) * 2)), var(--home-stage-max-w))");
    expect(homeScreenBlock).toContain("min-height: 100dvh");
    expect(homeScreenBlock).toContain("height: auto");
    expect(homeScreenBlock).toContain("overflow: visible");
    expect(mainPanelBlock).toContain("container-type: inline-size");
    expect(mainPanelBlock).toContain("grid-template-rows: minmax(0, 1fr)");
    expect(mainPanelBlock).toContain("place-items: start center");
    expect(mainPanelBlock).toContain("overflow: visible");
    expect(mainPanelBlock).toContain("min-height: var(--home-stage-min-h)");
    expect(featuredBlock).toContain("aspect-ratio: 1480 / 620");
    expect(featuredBlock).toContain("min-width: var(--home-stage-min-w)");
    expect(featuredBlock).toContain("min-height: var(--home-stage-min-h)");
    expect(featuredBlock).toContain("max-width: var(--home-stage-max-w)");
    expect(featuredBlock).toContain("position: relative");
    expect(featuredBlock).toContain("display: block");
    expect(playerZoneBlock).toContain("position: absolute");
    expect(playerZoneBlock).toContain("left: 2%");
    expect(playerZoneBlock).toContain("top: 0");
    expect(playerZoneBlock).toContain("width: 36%");
    expect(playerRowBlock).toContain("width: min(470px, 100%)");
    expect(playerRowBlock).toContain("gap: 12px");
    expect(playerPlaqueBlock).toContain("min-height: 62px");
    expect(playerPlaqueBlock).toContain("grid-template-columns: 54px minmax(0, 1fr) auto");
    expect(playerPlaqueBlock).toContain("gap: 13px");
    expect(playerStatsBlock).toContain("display: inline-flex");
    expect(playerStatsBlock).toContain("white-space: nowrap");
    expect(playerAvatarBlock).toContain("width: 54px");
    expect(playerAvatarImageBlock).toContain("width: 51px");
    expect(manualBlock).toContain("position: absolute");
    expect(manualBlock).toContain("left: calc(2% + 50px)");
    expect(manualBlock).toContain("top: calc(15% + 5px)");
    expect(matchFeatureBlock).toContain("position: absolute");
    expect(matchFeatureBlock).toContain("left: 40%");
    expect(matchFeatureBlock).toContain("top: calc(4% - 6px)");
    expect(utilityBlock).toContain("position: absolute");
    expect(utilityBlock).toContain("left: 2%");
    expect(utilityBlock).toContain("bottom: 1.5%");
  });

  it("keeps middle zones unframed and makes image targets cover the visible artwork box", () => {
    const css = readFileSync(new URL("../styles/base.css", import.meta.url), "utf8");
    const playerZoneBlock = css.match(/\.home-player-zone\s*\{[^}]+\}/)?.[0] ?? "";
    const utilityBlock = css.match(/\.home-grid-featured > \.home-utility-grid\s*\{[^}]+\}/)?.[0] ?? "";
    const manualBlock = css.match(/\.house-manual-entry\s*\{[^}]+\}/)?.[0] ?? "";
    const matchBlock = css.match(/\.match-image-entry\s*\{[^}]+\}/g)?.at(-1) ?? "";
    const imageEntryBlock = css.match(/\.home-image-entry\s*\{[^}]+\}/)?.[0] ?? "";

    expect(playerZoneBlock).toContain("background: transparent");
    expect(playerZoneBlock).toContain("border: 0");
    expect(utilityBlock).toContain("background: transparent");
    expect(utilityBlock).toContain("border: 0");
    expect(imageEntryBlock).toContain("width: 100%");
    expect(imageEntryBlock).toContain("height: 100%");
    expect(manualBlock).toContain("aspect-ratio: 782 / 894");
    expect(manualBlock).toContain("height: 66%");
    expect(manualBlock).toContain("width: auto");
    expect(matchBlock).toContain("aspect-ratio: 2674 / 2023");
    expect(matchBlock).toContain("width: 100%");
    expect(matchBlock).toContain("height: 100%");
  });

  it("keeps utility dock large enough on compact desktop viewports", () => {
    const css = readFileSync(new URL("../styles/base.css", import.meta.url), "utf8");
    const matchFeatureBlock = css.match(/\.home-match-feature\s*\{[^}]+\}/g)?.at(-1) ?? "";
    const utilityBlock = css.match(/\.home-grid-featured > \.home-utility-grid\s*\{[^}]+\}/)?.[0] ?? "";
    const utilityEntryBlock = css.match(/\.home-grid-featured > \.home-utility-grid \.utility-entry\s*\{[^}]+\}/)?.[0] ?? "";
    const imageHoverBlock = css.match(/\.home-image-entry:hover,\s*\.home-image-entry:focus-visible\s*\{[^}]+\}/)?.[0] ?? "";
    const imageBlock = css.match(/\.home-image-entry img\s*\{[^}]+\}/)?.[0] ?? "";
    const manualImageHoverBlock = css.match(/\.house-manual-entry:hover img,\s*\.house-manual-entry:focus-visible img\s*\{[^}]+\}/)?.[0] ?? "";
    const matchImageHoverBlock = css.match(/\.match-image-entry:hover img,\s*\.match-image-entry:focus-visible img\s*\{[^}]+\}/)?.[0] ?? "";

    expect(matchFeatureBlock).toContain("left: 40%");
    expect(matchFeatureBlock).toContain("width: 52.5%");
    expect(matchFeatureBlock).toContain("aspect-ratio: 2674 / 2023");
    expect(matchFeatureBlock).toContain("height: auto");
    expect(utilityBlock).toContain("grid-template-columns: repeat(5, minmax(0, 1fr))");
    expect(utilityBlock).toContain("gap: clamp(8px, 0.9vw, 16px)");
    expect(utilityEntryBlock).toContain("width: clamp(54px, 5.1cqw, 78px)");
    expect(utilityEntryBlock).toContain("height: clamp(54px, 5.1cqw, 78px)");
    expect(utilityEntryBlock).toContain("box-shadow: none");
    expect(imageHoverBlock).not.toContain("filter");
    expect(imageHoverBlock).not.toContain("drop-shadow");
    expect(imageHoverBlock).not.toContain("rotate");
    expect(imageHoverBlock).not.toContain("translateY");
    expect(imageBlock).toContain("transition: transform");
    expect(manualImageHoverBlock).toContain("translate3d(0, -3px, 0) rotate(-1.4deg)");
    expect(matchImageHoverBlock).toContain("translate3d(0, -4px, 0) rotate(1.2deg)");
    expect(manualImageHoverBlock).not.toContain("filter");
    expect(matchImageHoverBlock).not.toContain("filter");
  });

  it("keeps the match image transparent at the PNG border", () => {
    const borderAlpha = readPngBorderAlpha("../../public/assets/home/fantasy-match-entry.png");

    expect(Math.max(...borderAlpha)).toBe(0);
  });

  it("gives non-image buttons a shared hover target cue", () => {
    const css = readFileSync(new URL("../styles/base.css", import.meta.url), "utf8");
    const sharedTransitionBlock = css.match(/\.primary-action,[\s\S]+?\.toggle\s*\{[^}]+\}/)?.[0] ?? "";
    const sharedHoverBlock = css.match(/:is\(\.primary-action,[\s\S]+?\.toggle\):not\(\.home-image-entry\):not\(:disabled\):hover,[\s\S]+?\{[^}]+\}/)?.[0] ?? "";

    expect(sharedTransitionBlock).toContain("transition: transform");
    expect(sharedHoverBlock).toContain("transform: translateY(-2px)");
    expect(sharedHoverBlock).toContain("outline: 2px solid rgba(93, 127, 232, 0.42)");
    expect(sharedHoverBlock).toContain("outline-offset: 3px");
    expect(sharedHoverBlock).toContain("filter: brightness(1.04) saturate(1.04)");
    expect(sharedHoverBlock).not.toContain(".home-image-entry:hover");
  });

  it("uses the original wide stage dimensions and a portrait phone guard", () => {
    const css = readFileSync(new URL("../styles/base.css", import.meta.url), "utf8");
    const screenBlock = css.match(/\.home-screen\s*\{[^}]+\}/g)?.find((block) => block.includes("--home-stage-min-w")) ?? "";
    const mainPanelBlock = css.match(/\.home-main-panel\s*\{[^}]+\}/)?.[0] ?? "";
    const orientationBlock = css.match(/\.home-orientation-guard\s*\{[^}]+\}/)?.[0] ?? "";
    const portraitMedia = css.match(/@media \(max-width: 900px\) and \(orientation: portrait\)\s*\{[\s\S]+?\.home-orientation-guard\s*\{[^}]+\}[\s\S]+?\}/)?.[0] ?? "";
    const landscapeMedia = css.match(/@media \(max-width: 900px\) and \(orientation: landscape\)\s*\{[\s\S]+?\.home-screen\s*\{[^}]+\}[\s\S]+?\}/)?.[0] ?? "";

    expect(screenBlock).toContain("--home-stage-min-w: 1200px");
    expect(screenBlock).toContain("--home-stage-min-h: 503px");
    expect(screenBlock).toContain("--home-stage-max-w: 1920px");
    expect(screenBlock).toContain("width: clamp(var(--home-stage-min-w), calc(100vw - (var(--page-pad) * 2)), var(--home-stage-max-w))");
    expect(mainPanelBlock).toContain("min-height: var(--home-stage-min-h)");
    expect(mainPanelBlock).toContain("overflow: visible");
    expect(orientationBlock).toContain("display: none");
    expect(portraitMedia).toContain(".home-main-panel");
    expect(portraitMedia).toContain("display: none");
    expect(portraitMedia).toContain(".home-orientation-guard");
    expect(portraitMedia).toContain("display: grid");
    expect(portraitMedia).toContain("width: calc(100vw - (var(--page-pad) * 2))");
    expect(landscapeMedia).toContain("--home-stage-min-w: 960px");
    expect(landscapeMedia).toContain("--home-stage-min-h: 402px");
  });
});
