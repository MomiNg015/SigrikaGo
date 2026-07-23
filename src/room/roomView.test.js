import { describe, expect, test } from "vitest";
import { CHARACTERS } from "../shared/characters.js";
import {
  aemeathRainbowMoveEffectForRoom,
  buildBoardLines,
  coordLabel,
  formatClock,
  canPreviewPoint,
  replayGameAt,
  replayRoomAt,
  roomPeople,
  signedStoneTerm,
  stoneDecorationsForRoom,
  voiceCharacterForPlayer
} from "./roomView.js";
import { COLORS, GAME_PHASES, createGameState, getPoint, pointId, useSkill } from "../shared/game.js";

describe("roomView helpers", () => {
  test("formats room members from players and spectators", () => {
    const room = {
      players: [
        {
          color: COLORS.black,
          user: { id: "user-black", username: "black-player", rank: "9段", rating: 2020 }
        },
        {
          color: COLORS.white,
          user: { id: "user-white", username: "white-player", rank: "3段", rating: 1160 }
        }
      ],
      spectators: [
        { user: { id: "watcher", username: "watcher-name", rank: "1级", rating: 850 } }
      ]
    };

    expect(roomPeople(room)).toEqual([
      {
        id: "player-black-user-black",
        userId: "user-black",
        role: "player",
        color: COLORS.black,
        username: "black-player",
        rank: "9段",
        rating: 2020,
        achievementEquipment: null,
        achievementEquipmentAssets: null
      },
      {
        id: "player-white-user-white",
        userId: "user-white",
        role: "player",
        color: COLORS.white,
        username: "white-player",
        rank: "3段",
        rating: 1160,
        achievementEquipment: null,
        achievementEquipmentAssets: null
      },
      {
        id: "spectator-watcher",
        userId: "watcher",
        role: "spectator",
        color: null,
        username: "watcher-name",
        rank: "1级",
        rating: 850,
        achievementEquipment: null,
        achievementEquipmentAssets: null
      }
    ]);
  });

  test("collects each player's selected stone decoration by color", () => {
    const room = {
      players: [
        { color: COLORS.black, user: { selectedStoneDecoration: "paw-stone" } },
        { color: COLORS.white, user: {} }
      ]
    };

    expect(stoneDecorationsForRoom(room)).toEqual({
      black: "paw-stone",
      white: ""
    });
  });

  test("formats board labels and timer text", () => {
    expect(coordLabel(0, 0)).toBe("A13");
    expect(coordLabel(8, 12)).toBe("J1");
    expect(formatClock(181)).toBe("3:01");
  });

  test("formats signed scoring terms as fractions", () => {
    expect(signedStoneTerm(-2.75, "贴目")).toBe("- 贴目 2又3/4");
    expect(signedStoneTerm(1.5, "对方超频")).toBe("+ 对方超频 1又1/2");
    expect(signedStoneTerm(0, "己方超频")).toBe("+ 己方超频 0");
  });

  test("draws continuous board lines and marks first-line lines as edges", () => {
    const points = Array.from({ length: 13 * 13 }, (_, index) => {
      const x = index % 13;
      const y = Math.floor(index / 13);
      return { id: `${x},${y}`, x, y, valid: true };
    });

    const lines = buildBoardLines(points);
    const edgeLines = lines.filter((line) => line.edge);

    expect(lines).toHaveLength(26);
    expect(edgeLines).toHaveLength(4);
    expect(lines.find((line) => line.key === "row-0-0-12")?.edge).toBe(true);
    expect(lines.find((line) => line.key === "col-0-0-12")?.edge).toBe(true);
    expect(lines.find((line) => line.key === "row-6-0-12")?.edge).toBe(false);
  });

  test("breaks board lines only around invalid intersections", () => {
    const points = Array.from({ length: 13 * 13 }, (_, index) => {
      const x = index % 13;
      const y = Math.floor(index / 13);
      return { id: `${x},${y}`, x, y, valid: !(x === 6 && y === 6) };
    });

    const lines = buildBoardLines(points);

    expect(lines.map((line) => line.key)).toContain("row-6-0-5");
    expect(lines.map((line) => line.key)).toContain("row-6-7-12");
    expect(lines.map((line) => line.key)).toContain("col-6-0-5");
    expect(lines.map((line) => line.key)).toContain("col-6-7-12");
    expect(lines.map((line) => line.key)).not.toContain("row-6-0-12");
    expect(lines.map((line) => line.key)).not.toContain("col-6-0-12");
  });

  test("carries player item effects into the character used for voice resolution", () => {
    const character = voiceCharacterForPlayer({
      characterId: "lynae",
      user: { itemEffects: { lynaeContraryVoice: true } }
    }, CHARACTERS);

    expect(character).toMatchObject({
      id: "lynae",
      itemEffects: { lynaeContraryVoice: true }
    });
  });

  test("selects a rainbow move marker only for the latest move by affected Aemeath", () => {
    const room = {
      players: [
        { color: COLORS.black, characterId: "aemeath", user: { itemEffects: { aemeathRainbowMove: true } } },
        { color: COLORS.white, characterId: "sigrika", user: { itemEffects: {} } }
      ],
      game: {
        moveNumber: 3,
        history: [
          { type: "move", color: COLORS.white, id: "1,1", moveNumber: 2 },
          { type: "move", color: COLORS.black, id: "3,4", moveNumber: 3 }
        ]
      }
    };

    expect(aemeathRainbowMoveEffectForRoom(room)).toEqual({
      pointId: "3,4",
      key: "3:black:3,4"
    });
    expect(aemeathRainbowMoveEffectForRoom({
      ...room,
      game: { ...room.game, history: [...room.game.history, { type: "pass", color: COLORS.white }] }
    })).toBeNull();
    expect(aemeathRainbowMoveEffectForRoom({
      ...room,
      players: room.players.map((player) => ({ ...player, user: { itemEffects: {} } }))
    })).toBeNull();
  });

  test("hides Chisa removal-marked points from ordinary move previews for the forbidden color", () => {
    const game = {
      phase: GAME_PHASES.playing,
      turn: COLORS.white,
      libertyPurgeMarks: [{
        effectType: "liberty-purge",
        owner: COLORS.black,
        clearAfterColor: COLORS.white,
        pointIds: [pointId(3, 3)]
      }]
    };
    const player = { color: COLORS.white };

    expect(canPreviewPoint(
      game,
      player,
      { id: pointId(3, 3), valid: true, stone: null },
      false,
      false
    )).toBe(false);
    expect(canPreviewPoint(
      { ...game, turn: COLORS.black },
      { color: COLORS.black },
      { id: pointId(3, 3), valid: true, stone: null },
      false,
      false
    )).toBe(true);
  });

  test("opens replay snapshots that do not contain chat history", () => {
    const players = [
      { color: COLORS.black, user: { id: "black", username: "black", rank: "1段", rating: 1000 } },
      { color: COLORS.white, user: { id: "white", username: "white", rank: "1段", rating: 1000 } }
    ];
    const room = {
      code: "12345",
      role: "player",
      players,
      game: createGameState(players)
    };

    expect(replayRoomAt(room, 0)).toMatchObject({
      role: "spectator",
      chat: []
    });
  });

  test("keeps finished replay winner metadata while replaying moves", () => {
    const room = {
      players: [
        { color: COLORS.black, user: { id: "black" } },
        { color: COLORS.white, user: { id: "white" } }
      ],
      game: {
        ...createGameState([
          { color: COLORS.black },
          { color: COLORS.white }
        ]),
        phase: GAME_PHASES.finished,
        winner: { winnerColor: COLORS.white, text: "白中盘胜" },
        history: [
          { type: "move", color: COLORS.black, id: pointId(3, 3) }
        ]
      }
    };

    expect(replayRoomAt(room, 1).game).toMatchObject({
      phase: GAME_PHASES.finished,
      winner: { winnerColor: COLORS.white, text: "白中盘胜" }
    });
  });

  test("reconstructs gomoku winning-line metadata for replay board highlights", () => {
    const players = [
      { color: COLORS.black, user: { id: "black" } },
      { color: COLORS.white, user: { id: "white" } }
    ];
    const history = [
      { type: "move", color: COLORS.black, id: pointId(2, 6) },
      { type: "move", color: COLORS.white, id: pointId(0, 0) },
      { type: "move", color: COLORS.black, id: pointId(3, 6) },
      { type: "move", color: COLORS.white, id: pointId(0, 1) },
      { type: "move", color: COLORS.black, id: pointId(4, 6) },
      { type: "move", color: COLORS.white, id: pointId(0, 2) },
      { type: "move", color: COLORS.black, id: pointId(5, 6) },
      { type: "move", color: COLORS.white, id: pointId(0, 3) },
      { type: "move", color: COLORS.black, id: pointId(6, 6) }
    ];
    const room = {
      players,
      game: {
        ...createGameState(players, { mode: "gomoku" }),
        phase: GAME_PHASES.finished,
        winner: null,
        history
      }
    };

    expect(replayRoomAt(room, history.length).game.winner).toMatchObject({
      winnerColor: COLORS.black,
      reason: "gomoku-five",
      winningLine: [2, 3, 4, 5, 6].map((x) => pointId(x, 6))
    });
  });

  test("replays Lynae spray random target from history instead of rerolling", () => {
    const targetId = pointId(3, 3);
    const firstCandidateId = pointId(4, 3);
    const otherCandidateId = pointId(5, 3);
    const recordedRandomTargetId = pointId(6, 3);
    const history = [
      { type: "move", color: COLORS.black, id: targetId },
      { type: "move", color: COLORS.white, id: firstCandidateId },
      { type: "move", color: COLORS.black, id: otherCandidateId },
      { type: "move", color: COLORS.white, id: recordedRandomTargetId },
      {
        type: "skill",
        effectType: "spray-stone",
        skill: CHARACTERS.lynae.skill.name,
        color: COLORS.black,
        id: targetId,
        randomTargetId: recordedRandomTargetId
      }
    ];
    const players = [
      { color: COLORS.black, characterId: "lynae", character: CHARACTERS.lynae, user: { id: "black" } },
      { color: COLORS.white, characterId: "sigrika", character: CHARACTERS.sigrika, user: { id: "white" } }
    ];
    const room = {
      players,
      game: {
        ...createGameState(players),
        history
      }
    };
    const originalRandom = Math.random;
    Math.random = () => 0;

    try {
      const replay = replayRoomAt(room, history.length).game;

      expect(replay.points.find((point) => point.id === targetId)?.stone).toBe("spray");
      expect(replay.points.find((point) => point.id === recordedRandomTargetId)?.stone).toBe("spray");
      expect(replay.points.find((point) => point.id === firstCandidateId)?.stone).toBe(COLORS.white);
      expect(replay.points.find((point) => point.id === otherCandidateId)?.stone).toBe(COLORS.black);
    } finally {
      Math.random = originalRandom;
    }
  });

  test("reconstructs Voyage Star erased points from history without requiring live derived-skill availability", () => {
    const players = [
      { color: COLORS.black, characterId: "aemeath", character: CHARACTERS.aemeath, user: { id: "black" } },
      { color: COLORS.white, characterId: "sigrika", character: CHARACTERS.sigrika, user: { id: "white" } }
    ];
    const centerId = pointId(6, 6);
    let game = createGameState(players);
    const hiddenHandResult = useSkill(game, COLORS.black, "aemeath", centerId);
    expect(hiddenHandResult.ok).toBe(true);
    game = hiddenHandResult.state;
    game.turn = COLORS.black;
    const voyageResult = useSkill(game, COLORS.black, game.derivedSkills.black, null);
    expect(voyageResult.ok).toBe(true);
    const voyageEntry = voyageResult.state.history.find((entry) => entry.effectType === "voyage-star");
    const room = {
      players,
      game: {
        ...createGameState(players),
        history: [
          {
            ...voyageEntry,
            erasedPointIds: voyageEntry.erasedPointIds,
            directRemovals: [],
            removedByColor: {},
            secondaryRemovals: [],
            cleanupRemovals: []
          }
        ]
      }
    };

    const replay = replayGameAt(room, 1);

    expect(getPoint(replay, centerId)).toMatchObject({
      valid: false,
      skillEffect: "voyage-star-crater-point",
      skillEffectOwner: COLORS.black
    });
    expect(getPoint(replay, pointId(5, 6))).toMatchObject({
      valid: false,
      skillEffect: "voyage-star-erased-point",
      skillEffectOwner: COLORS.black
    });
    expect(replay.history.at(-1)).toMatchObject({
      effectType: "voyage-star",
      id: centerId
    });
  });

  test("converts replay skill removal color counts into capture-credit owners once", () => {
    const players = [
      { color: COLORS.black, characterId: "aemeath", character: CHARACTERS.aemeath, user: { id: "black" } },
      { color: COLORS.white, characterId: "sigrika", character: CHARACTERS.sigrika, user: { id: "white" } }
    ];
    const room = {
      players,
      game: {
        ...createGameState(players),
        history: [
          {
            type: "skill",
            effectType: "voyage-star",
            skill: CHARACTERS.aemeath.skill.name,
            color: COLORS.black,
            id: pointId(6, 6),
            erasedPointIds: [pointId(6, 6)],
            removedByColor: { white: 2, black: 1, spray: 3 },
            cleanupRemovals: [
              { color: COLORS.white, stones: [pointId(4, 4)], owner: COLORS.black }
            ]
          }
        ]
      }
    };

    const replay = replayGameAt(room, 1);

    expect(replay.skillRemovals).toEqual({ black: 3, white: 1 });
  });
});
