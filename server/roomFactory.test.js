import { describe, expect, test } from "vitest";
import { COLORS, GAME_PHASES } from "../src/shared/game.js";
import {
  MATCH_SUCCESS_DELAY_MS,
  OPENING_NOTICE_DELAY_MS,
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
  test("creates an opening room with deterministic colors and timing", () => {
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
      spectators: [],
      chat: [],
      createdAt: 1000,
      openingEndsAt: 1000 + MATCH_SUCCESS_DELAY_MS + OPENING_NOTICE_DELAY_MS,
      closesAt: null,
      countingDeadline: null,
      drawDeadline: null,
      timerId: null,
      timeoutIds: [],
      lastTick: 1000,
      recordSaved: false
    });
    expect(room.game.phase).toBe(GAME_PHASES.opening);
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
