import { describe, expect, test } from "vitest";
import { COLORS, GAME_PHASES } from "../src/shared/game.js";
import {
  MATCH_PRELOAD_TIMEOUT_MS,
  createPracticeRoom,
  createRoom,
  modeStatsForUser,
  randomRoomCode,
  toRoomPlayer,
  userForRoomMode
} from "./roomFactory.js";

function user(id, overrides = {}) {
  return {
    id,
    username: id,
    rank: "Rookie",
    rating: 1000,
    wins: 1,
    losses: 2,
    selectedCharacter: "sigrika",
    characterConfig: null,
    ...overrides
  };
}

function queuePlayer(id, socketId, overrides = {}) {
  return {
    user: user(id, overrides.user ?? {}),
    socketId,
    mode: overrides.mode
  };
}

describe("roomFactory", () => {
  test("creates a preloading room with deterministic colors and timing", () => {
    const now = () => 1000;
    const room = createRoom(
      queuePlayer("first", "socket-a"),
      queuePlayer("second", "socket-b"),
      {
        modeInput: "standard",
        now,
        random: () => 0.75,
        isCodeTaken: () => false
      }
    );

    expect(room).toMatchObject({
      code: "77500",
      mode: "standard",
      rated: true,
      matchSource: "matchmaking",
      revision: 0,
      clockSeq: 0,
      spectators: [],
      chat: [],
      actionReceipts: {},
      createdAt: 1000,
      openingEndsAt: null,
      preload: {
        startedAt: 1000,
        deadlineAt: 1000 + MATCH_PRELOAD_TIMEOUT_MS,
        readyUserIds: [],
        readyCount: 0,
        requiredCount: 2
      },
      closesAt: null,
      countingDeadline: null,
      drawDeadline: null,
      timerId: null,
      timeoutIds: [],
      lastTick: 1000,
      recordSaved: false
    });
    expect(room.game.phase).toBe(GAME_PHASES.preloading);
    expect(room.game.mode).toBe("standard");
    expect(room.players.map((player) => [player.color, player.user.id, player.socketId])).toEqual([
      [COLORS.black, "first", "socket-a"],
      [COLORS.white, "second", "socket-b"]
    ]);
  });

  test("can reverse player colors from the random source", () => {
    const room = createRoom(
      queuePlayer("first", "socket-a"),
      queuePlayer("second", "socket-b"),
      { random: () => 0.25 }
    );

    expect(room.players.map((player) => [player.color, player.user.id])).toEqual([
      [COLORS.black, "second"],
      [COLORS.white, "first"]
    ]);
  });

  test("supports unrated direct room metadata", () => {
    const room = createRoom(
      queuePlayer("first", "socket-a"),
      queuePlayer("second", "socket-b"),
      {
        rated: false,
        matchSource: "duel",
        random: () => 0.75
      }
    );

    expect(room.rated).toBe(false);
    expect(room.matchSource).toBe("duel");
  });

  test("captures the selected character outfit as an immutable room snapshot", () => {
    const player = toRoomPlayer(queuePlayer("costumed", "socket-costumed", {
      user: {
        selectedCharacter: "denia",
        equippedCostumes: {
          denia: {
            id: "denia-costume-01",
            portraitUrl: "/assets/costumes/denia-01.webp",
            candyEffectPortraitUrl: "/assets/costumes/denia-01-candy.webp",
            portraitScalePercent: 88,
            portraitOffsetXPercent: -2,
            portraitOffsetYPercent: 3
          }
        }
      }
    }), COLORS.black);

    expect(player.costumeSnapshot).toEqual({
      id: "denia-costume-01",
      portraitUrl: "/assets/costumes/denia-01.webp",
      candyEffectPortraitUrl: "/assets/costumes/denia-01-candy.webp",
      portraitScalePercent: 88,
      portraitOffsetXPercent: -2,
      portraitOffsetYPercent: 3
    });
    player.user.equippedCostumes.denia.portraitUrl = "/assets/costumes/changed-later.webp";
    expect(player.costumeSnapshot.portraitUrl).toBe("/assets/costumes/denia-01.webp");
  });

  test("creates a no-skill practice room with requested color and bot preloaded", () => {
    const room = createPracticeRoom(queuePlayer("human", "socket-human"), {
      difficulty: "advanced",
      playerColor: "white",
      now: () => 1000,
      random: () => 0.5
    });

    expect(room).toMatchObject({
      mode: "spark",
      rated: false,
      matchSource: "practice",
      recordPolicy: "none",
      practice: {
        botId: "zhunshibao",
        difficulty: "advanced",
        captureResignThreshold: 22,
        humanColor: COLORS.white,
        botColor: COLORS.black
      },
      preload: { readyCount: 1, requiredCount: 2 }
    });
    const bot = room.players.find((player) => player.isBot);
    expect(bot).toMatchObject({
      color: COLORS.black,
      characterId: null,
      user: { username: "准时宝", rank: "高级陪练", rating: null }
    });
    expect(bot.botProfile.portraitUrl).toBe("/assets/characters/zhunshibao.png");
    expect(room.preload.readyUserIds).toEqual([bot.user.id]);
    expect(room.game.skillUses[COLORS.black]).toBe(0);
    expect(room.players.find((player) => !player.isBot).color).toBe(COLORS.white);
  });

  test("projects mode stats onto room users", () => {
    const modeStats = {
      standard: {
        rating: 1234,
        rank: "4段",
        recentResults: "win",
        wins: 5,
        losses: 6,
        draws: 7
      }
    };
    const sourceUser = user("mode-user", { modeStats });
    const projected = userForRoomMode(sourceUser, "standard");

    expect(projected).toMatchObject({
      id: "mode-user",
      rating: 1234,
      rank: "4段",
      wins: 5,
      losses: 6
    });
    expect(modeStatsForUser(sourceUser, "standard")).toMatchObject({
      rating: 1234,
      rank: "4段",
      recentResults: ["win"],
      wins: 5,
      losses: 6,
      draws: 7
    });
  });

  test("falls back to standard mode defaults without writing legacy stats", () => {
    expect(modeStatsForUser(user("standard-user"), "standard")).toMatchObject({
      rating: 1000,
      rank: "3段",
      wins: 0,
      losses: 0,
      draws: 0
    });
  });

  test("builds room player state from a queued player", () => {
    const characterConfig = { id: "custom-character" };
    expect(toRoomPlayer(queuePlayer("queued", "socket-a", {
      user: { selectedCharacter: "custom-character", characterConfig }
    }), COLORS.black)).toMatchObject({
      user: { id: "queued" },
      socketId: "socket-a",
      disconnectedAt: null,
      color: COLORS.black,
      characterId: "custom-character",
      character: characterConfig,
      time: {
        main: 300,
        byoYomi: 30,
        periodRemaining: 30,
        periods: 3
      }
    });
  });

  test("retries random room codes while a code is taken", () => {
    const values = [0, 0.5];
    const code = randomRoomCode({
      random: () => values.shift(),
      isCodeTaken: (candidate) => candidate === "10000"
    });

    expect(code).toBe("55000");
  });
});
