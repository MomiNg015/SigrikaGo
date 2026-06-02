import { describe, expect, it } from "vitest";
import { arePlayerInfoPropsEqual, disconnectBadgeForPlayer, playerCandyPortrait, PLAYER_INFO_TOOLTIPS, resultBadgeForPlayer } from "./PlayerInfo.jsx";
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

  it("does not show win/loss portrait badges for invalid finished games", () => {
    const game = {
      phase: "finished",
      winner: { winnerColor: COLORS.black, invalid: true }
    };

    expect(resultBadgeForPlayer({ color: COLORS.black }, game)).toBeNull();
    expect(resultBadgeForPlayer({ color: COLORS.white }, game)).toBeNull();
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
  });
});

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
