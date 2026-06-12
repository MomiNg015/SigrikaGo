import { describe, expect, test } from "vitest";
import {
  COLORS,
  createGameState,
  getPoint,
  pointId
} from "../src/shared/game.js";
import { CHARACTERS } from "../src/shared/characters.js";
import {
  describeSkillUse,
  formatPointLabel,
  renderSkillMessage,
  stoneLabel
} from "./roomSkillMessages.js";

function roomWithPlayers(players) {
  return {
    game: createGameState(players.map((player) => ({
      userId: player.user.id,
      color: player.color,
      characterId: player.characterId,
      character: player.character
    })))
  };
}

function roomPlayer({ color = COLORS.black, characterId = "sigrika", character = null } = {}) {
  return {
    color,
    characterId,
    character,
    user: { id: `${color}-user`, username: `${color}-player` }
  };
}

describe("roomSkillMessages", () => {
  test("formats board point labels", () => {
    expect(formatPointLabel(pointId(3, 3))).toBe("D-10");
    expect(formatPointLabel(pointId(12, 12))).toBe("N-1");
  });

  test("formats stone color labels", () => {
    expect(stoneLabel(COLORS.black)).toBe("黑棋");
    expect(stoneLabel(COLORS.white)).toBe("白棋");
    expect(stoneLabel(null)).toBe("棋子");
  });

  test("renders custom skill message templates", () => {
    expect(renderSkillMessage("{fromColor}{player}->{toColor} at {point} with {skill}", {
      player: "alice",
      character: "Sigrika",
      skill: "Rune",
      point: "D-10",
      color: "黑",
      fromColor: "黑棋",
      toColor: "白棋",
      targetColor: "棋子"
    })).toBe("黑棋alice->白棋 at D-10 with Rune");
  });

  test("describes custom skill messages with point and color placeholders", () => {
    const character = {
      ...CHARACTERS.sigrika,
      name: "Admin Sigrika",
      skill: {
        ...CHARACTERS.sigrika.skill,
        name: "Admin Rune",
        systemMessage: "{fromColor}{player} uses {character} {skill}; to {toColor}; target {point}"
      }
    };
    const player = roomPlayer({ characterId: "sigrika", character });
    const room = roomWithPlayers([player, roomPlayer({ color: COLORS.white })]);

    expect(describeSkillUse(room, player, pointId(3, 3))).toBe(
      "黑棋black-player uses Admin Sigrika Admin Rune; to 白棋; target D-10"
    );
  });

  test("describes erase-point fallback messages", () => {
    const character = {
      ...CHARACTERS.sigrika,
      skill: {
        ...CHARACTERS.sigrika.skill,
        effectType: "erase-point",
        systemMessage: null
      }
    };
    const player = roomPlayer({ characterId: "sigrika", character });
    const room = roomWithPlayers([player, roomPlayer({ color: COLORS.white })]);

    expect(describeSkillUse(room, player, pointId(3, 3))).toContain(
      "从天而降破坏了D-10的点位，铛！"
    );
  });

  test("describes flip-stone messages from the target stone before mutation", () => {
    const character = {
      ...CHARACTERS.danea,
      id: "denia",
      skill: {
        ...CHARACTERS.danea.skill,
        effectType: "flip-stone",
        systemMessage: null
      }
    };
    const player = roomPlayer({ characterId: "denia", character });
    const room = roomWithPlayers([player, roomPlayer({ color: COLORS.white })]);
    getPoint(room.game, pointId(4, 4)).stone = COLORS.white;

    expect(describeSkillUse(room, player, pointId(4, 4))).toContain(
      "诅咒了E-9的白棋，将其从白棋变成了黑棋。"
    );
  });

  test("describes hidden hand without a target", () => {
    const character = {
      ...CHARACTERS.aemeath,
      skill: {
      ...CHARACTERS.aemeath.skill,
        effectType: "hidden-hand",
        systemMessage: null
      }
    };
    const player = roomPlayer({ characterId: "aemeath", character });
    const room = roomWithPlayers([player, roomPlayer({ color: COLORS.white })]);

    expect(describeSkillUse(room, player, null)).toContain(
      "落下了电子幽灵般的一手，应该不会被发现吧..."
    );
  });
});
