import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { arePlayerInfoPropsEqual, disconnectBadgeForPlayer, playerCandyPortrait, PLAYER_INFO_TOOLTIPS, resultBadgeForPlayer, tooltipPointFromEvent } from "./PlayerInfo.jsx";
import { COLORS } from "../shared/game.js";
import { DENIA_CANDY_PORTRAIT } from "../shared/candyPortraits.js";

const noop = () => {};
const characters = {};

describe("PlayerInfo labels", () => {
  it("defines hover explanations for skill removal and overclock counters", () => {
    expect(PLAYER_INFO_TOOLTIPS.skillRemovals).toBe(
      "除子：因技能影响而从棋盘上移除的对方棋子数。数目时+除子*1的数值。"
    );
    expect(PLAYER_INFO_TOOLTIPS.overclock).toBe(
      "超频：角色发动技能所造成的代价。数目时-超频*2的数值。"
    );
  });

  it("anchors mobile tap explanations to the tapped point within the viewport", () => {
    expect(tooltipPointFromEvent({ clientX: 188, clientY: 126 }, { innerWidth: 375, innerHeight: 667 })).toEqual({
      x: 188,
      y: 126,
      placement: "above"
    });
    expect(tooltipPointFromEvent({ clientX: 2, clientY: 800 }, { innerWidth: 375, innerHeight: 667 })).toEqual({
      x: 132,
      y: 651,
      placement: "above"
    });
    expect(tooltipPointFromEvent({ clientX: 370, clientY: 20 }, { innerWidth: 375, innerHeight: 667 })).toEqual({
      x: 243,
      y: 20,
      placement: "below"
    });
  });

  it("hides go and skill counters from gomoku player panels", () => {
    const source = readFileSync(new URL("./PlayerInfo.jsx", import.meta.url), "utf8");

    expect(source).toContain("gameModeFamily(game.mode) === \"gomoku\"");
    expect(source).toContain("showGoStats");
    expect(source).toContain("{showGoStats && <div className=\"captures\">");
  });

  it("does not show win/loss portrait badges for invalid finished games", () => {
    const game = {
      phase: "finished",
      winner: { winnerColor: COLORS.black, invalid: true }
    };

    expect(resultBadgeForPlayer({ color: COLORS.black }, game)).toBeNull();
    expect(resultBadgeForPlayer({ color: COLORS.white }, game)).toBeNull();
  });

  it("shows win loss and draw portrait badges for valid finished games", () => {
    const finished = { phase: "finished", winner: { winnerColor: COLORS.black } };

    expect(resultBadgeForPlayer({ color: COLORS.black }, finished, { isWinner: true })).toEqual({
      label: "胜",
      tone: "win"
    });
    expect(resultBadgeForPlayer({ color: COLORS.white }, finished)).toEqual({
      label: "负",
      tone: "loss"
    });
    expect(resultBadgeForPlayer({ color: COLORS.white }, { phase: "finished", winner: { winnerColor: null } }, { isDrawResult: true })).toEqual({
      label: "和",
      tone: "draw"
    });
  });

  it("shows disconnect badge only before a game has a result", () => {
    const disconnected = { connected: false, disconnectedAt: 123 };
    expect(disconnectBadgeForPlayer(disconnected, { phase: "playing" })).toBe("断线中");
    expect(disconnectBadgeForPlayer({ ...disconnected, connected: true }, { phase: "playing" })).toBeNull();
    expect(disconnectBadgeForPlayer(disconnected, { phase: "finished" })).toBeNull();
  });

  it("swaps Denia portraits to the candy gif while the effect is active", () => {
    expect(playerCandyPortrait(
      { id: "denia", portrait: "/assets/Danea_centered.webp" },
      {
        characterId: "denia",
        user: { itemEffects: { deniaRainbowGlow: true } }
      }
    )).toBe(DENIA_CANDY_PORTRAIT);
    expect(playerCandyPortrait(
      { id: "sigrika", portrait: "/assets/sigrika_centered.webp" },
      {
        characterId: "sigrika",
        user: { itemEffects: { deniaRainbowGlow: true } }
      }
    )).toBe("/assets/sigrika_centered.webp");
  });

  it("keeps overclock text red and timer tracks state-colored across themes", () => {
    const roomCss = readCssWithImports(new URL("../styles/room.css", import.meta.url));
    const roomTerminalCss = readCssWithImports(new URL("../styles/room-terminal.css", import.meta.url));
    const themesCss = readFileSync(new URL("../styles/themes.css", import.meta.url), "utf8");
    const themeComponentsCss = readFileSync(new URL("../styles/themes/theme-components.css", import.meta.url), "utf8");
    const sharedCss = readFileSync(new URL("../styles/themes/shared.css", import.meta.url), "utf8");
    const brightSchoolCss = readCssWithImports(new URL("../styles/themes/bright-school/qa-guard.css", import.meta.url));

    expect(roomCss).toContain("--timer-track-fill: linear-gradient(90deg, #5d7fe8, #69c3ff)");
    expect(roomCss).toContain(".timer.warning-byo-yomi");
    expect(roomCss).toContain("--timer-track-fill: linear-gradient(90deg, #ff3f3f, #c8173b)");
    expect(roomCss).toContain(".timer.final-byo-yomi");
    expect(roomCss).toContain("--timer-track-fill: linear-gradient(90deg, #ff3434, #ffbd2e, #42d66b, #3a8cff, #b44dff)");
    expect(roomCss).toContain(".captures .cost-stat strong");
    expect(roomCss).toContain(".mobile-tap-tooltip");
    expect(roomCss).toContain("box-sizing: border-box");
    expect(roomCss).toContain("width: min(232px, calc(100vw - 32px))");
    expect(roomCss).toContain("left: var(--tooltip-x)");
    expect(roomCss).toContain("top: var(--tooltip-y)");
    expect(roomCss).toContain("max-height: min(38dvh, calc(100dvh - 32px))");
    expect(roomCss).toContain("overflow: auto");
    expect(roomCss).toContain("white-space: normal");
    expect(roomCss).toContain("overflow-wrap: anywhere");
    expect(roomCss).toContain("word-break: break-word");
    expect(roomCss).toContain('[data-placement="below"]');
    expect(roomCss).toContain(".mobile-room-screen .captures .info-stat::after");
    expect(roomCss).toContain("content: none");
    const metaTagBlock = cssBlock(roomCss, ".meta-tag");
    expect(metaTagBlock).toContain("display: inline-flex");
    expect(metaTagBlock).toContain("align-items: center");
    expect(metaTagBlock).toContain("justify-content: center");
    const activeTurnBlock = cssBlock(roomCss, ".player-info.active-turn");
    expect(activeTurnBlock).toContain("#fff0a6");
    expect(activeTurnBlock).toContain("border-color: rgba(218, 152, 26, 0.72)");
    expect(roomCss).toContain(".player-info.active-turn .name-button");
    const terminalActiveTurnBlock = cssBlock(roomTerminalCss, ".player-info.active-turn");
    expect(terminalActiveTurnBlock).toContain("rgba(255, 225, 102, 0.92)");
    expect(terminalActiveTurnBlock).toContain("border-color: #ffd34f");
    expect(roomCss).toContain("color: #d93645 !important");
    expect(roomCss).toContain(".result-badge.draw");
    expect(roomCss).toContain("--skill-chip-accent");
    expect(roomCss).toContain(".skill-chip.spent");
    expect(roomCss).toContain(".timer.byo-yomi .timer-primary");
    expect(themesCss).toContain('@import "./themes/theme-components.css";');
    expect(themeComponentsCss).toContain(".app-shell.player-theme-enabled .skill-chip.spent");
    expect(themeComponentsCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .player-info .skill-chip");
    expect(themeComponentsCss).toContain("var(--skill-chip-accent");
    expect(themeComponentsCss).toContain("linear-gradient(135deg, #ece7e3, #d8d7d6 52%, #f5f1ea) padding-box");
    expect(themeComponentsCss).toContain(".app-shell.player-theme-enabled .result-badge.win");
    expect(themeComponentsCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .result-badge.win");
    expect(themeComponentsCss).toContain("color: #d91528 !important");
    expect(themeComponentsCss).toContain("border-color: #d91528 !important");
    expect(themeComponentsCss).toContain(".app-shell.player-theme-enabled .result-badge.loss");
    expect(themeComponentsCss).toContain("color: #121217 !important");
    expect(themeComponentsCss).toContain(".app-shell.player-theme-enabled .result-badge.draw");
    expect(themeComponentsCss).toContain("color: #138a46 !important");
    expect(sharedCss).toContain("background: var(--timer-track-fill");
    expect(brightSchoolCss).toContain(".timer-track span");
    expect(brightSchoolCss).toContain("background: var(--timer-track-fill");
    expect(brightSchoolCss).toContain(".captures .cost-stat");
    expect(brightSchoolCss).toContain(".player-info.active-turn");
    expect(brightSchoolCss).toContain("background-color: #fff0a6 !important");
    expect(brightSchoolCss).toContain("border-color: #d18b17 !important");
  });

  it("colors room portrait backgrounds by the player's stone color in Bright School", () => {
    const playerInfoSource = readFileSync(new URL("./PlayerInfo.jsx", import.meta.url), "utf8");
    const componentRepairsCss = readCssWithImports(new URL("../styles/themes/bright-school/component-repairs.css", import.meta.url));
    const brightSchoolCss = readCssWithImports(new URL("../styles/themes/bright-school/qa-guard.css", import.meta.url));
    const roomPortraitImageBlocks = brightSchoolCss.match(/\.player-info \.portrait-wrap img\s*\{[^}]+\}/g) ?? [];
    const finalRoomPortraitImageBlock = roomPortraitImageBlocks.at(-1) ?? "";

    expect(playerInfoSource).toContain("data-mobile-tooltip-trigger");
    expect(playerInfoSource).toContain("openTapTooltip(event, PLAYER_INFO_TOOLTIPS.skillRemovals");
    expect(playerInfoSource).toContain("openTapTooltip(event, PLAYER_INFO_TOOLTIPS.overclock");
    expect(playerInfoSource).toContain("openTapTooltip(event, skillTooltipText(character)");
    expect(playerInfoSource).toContain("black-portrait");
    expect(playerInfoSource).toContain("white-portrait");
    expect(componentRepairsCss).toContain(".player-info .portrait-wrap.black-portrait");
    expect(componentRepairsCss).toContain("background: #2b2b2b !important");
    expect(componentRepairsCss).toContain(".player-info .portrait-wrap.white-portrait");
    expect(componentRepairsCss).toContain("background: #ffffff !important");
    expect(finalRoomPortraitImageBlock).toContain("filter: none !important");
  });

  it("skips rerendering unchanged player panels during unrelated clock updates", () => {
    const game = {
      phase: "playing",
      turn: COLORS.black,
      skillUses: { black: 1, white: 1 },
      skillCosts: { black: 0, white: 0 },
      skillRemovals: { black: 0, white: 0 },
      winner: null
    };
    const player = {
      color: COLORS.white,
      characterId: "denia",
      user: { itemEffects: { deniaRainbowGlow: true } },
      time: { main: 300, byoYomi: 30, periodRemaining: 30, periods: 3 }
    };

    expect(arePlayerInfoPropsEqual(
      playerInfoProps({ player, game }),
      playerInfoProps({ player, game: { ...game } })
    )).toBe(true);
    expect(arePlayerInfoPropsEqual(
      playerInfoProps({ player, game }),
      playerInfoProps({ player: { ...player, time: { ...player.time, main: 299 } }, game })
    )).toBe(false);
    expect(arePlayerInfoPropsEqual(
      playerInfoProps({ player, game }),
      playerInfoProps({ player: { ...player, connected: false, disconnectedAt: 123 }, game })
    )).toBe(false);
    expect(arePlayerInfoPropsEqual(
      playerInfoProps({ player, game, floatingLayerZ: 91 }),
      playerInfoProps({ player, game, floatingLayerZ: 92 })
    )).toBe(false);
  });
});

function readCssWithImports(url, seen = new Set()) {
  const key = url.href;
  if (seen.has(key)) return "";
  seen.add(key);

  const css = readFileSync(url, "utf8");
  return css.replace(/@import\s+"([^"]+)";/g, (_match, importPath) => {
    return readCssWithImports(new URL(importPath, url), seen);
  });
}

function cssBlock(css, selector) {
  const index = css.indexOf(`${selector} {`);
  if (index === -1) return "";
  const start = css.indexOf("{", index);
  const end = css.indexOf("}", start);
  return css.slice(start + 1, end);
}

function playerInfoProps(overrides = {}) {
  return {
    player: {
      color: COLORS.black,
      characterId: "sigrika",
      user: { itemEffects: {} },
      captures: 0,
      time: { main: 300, byoYomi: 30, periodRemaining: 30, periods: 3 }
    },
    game: {
      phase: "playing",
      turn: COLORS.black,
      skillUses: { black: 1, white: 1 },
      skillCosts: { black: 0, white: 0 },
      skillRemovals: { black: 0, white: 0 },
      winner: null
    },
    characters,
    align: "self",
    viewColor: COLORS.black,
    canSwitchView: false,
    onViewColor: noop,
    isWinner: false,
    isActiveTurn: false,
    isDrawResult: false,
    isSkillTargeting: false,
    ...overrides
  };
}
