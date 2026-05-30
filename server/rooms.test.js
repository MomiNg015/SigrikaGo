import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { COLORS, GAME_PHASES, getPoint, pointId } from "../src/shared/game.js";
import { CHARACTERS } from "../src/shared/characters.js";
const prismaMocks = vi.hoisted(() => ({
  gameRecordCreate: vi.fn(),
  executeRaw: vi.fn(),
  queryRaw: vi.fn(),
  transaction: vi.fn(),
  userUpdate: vi.fn()
}));

vi.mock("./db.js", () => ({
  prisma: {
    gameRecord: {
      create: prismaMocks.gameRecordCreate
    },
    user: {
      update: prismaMocks.userUpdate
    },
    $executeRaw: prismaMocks.executeRaw,
    $queryRaw: prismaMocks.queryRaw,
    $transaction: prismaMocks.transaction
  }
}));

import {
  attachSocketToRoom,
  clearRoomsForTest,
  clearRoomTimers,
  completeRoomOpening,
  detachSocket,
  findRoomForUser,
  handleGameAction,
  handleScoringAction,
  joinMatchmaking,
  leaveRoom,
  listWaitingPlayers,
  listWatchRooms,
  matchmakingCount,
  requestCounting,
  requestDraw,
  restorePersistedRooms,
  respondCounting,
  respondDraw,
  roomView,
  startInitialPassiveSkillNow
} from "./rooms.js";

beforeEach(() => {
  prismaMocks.gameRecordCreate.mockReset();
  prismaMocks.gameRecordCreate.mockResolvedValue({ id: "record" });
  prismaMocks.executeRaw.mockReset();
  prismaMocks.executeRaw.mockResolvedValue(undefined);
  prismaMocks.queryRaw.mockReset();
  prismaMocks.queryRaw.mockResolvedValue([]);
  prismaMocks.userUpdate.mockReset();
  prismaMocks.userUpdate.mockImplementation((operation) => Promise.resolve(operation));
  prismaMocks.transaction.mockReset();
  prismaMocks.transaction.mockImplementation((operations) => Promise.all(operations));
});

function fakeIo() {
  return {
    messages: [],
    to(socketId) {
      return {
        emit: (event, payload) => {
          this.messages.push({ socketId, event, payload });
        }
      };
    }
  };
}

function user(id, selectedCharacter, characterConfig = null) {
  return {
    id,
    username: id,
    role: "player",
    status: "active",
    rank: "Rookie",
    rating: 1000,
    wins: 0,
    losses: 0,
    coins: 0,
    selectedCharacter,
    characterConfig,
    ownedCharacters: [selectedCharacter],
    ownedItems: [],
    ownedDecorations: []
  };
}

describe("room game record persistence", () => {
  afterEach(() => {
    clearRoomsForTest();
    vi.useRealTimers();
  });

  test("persists winner and loser coin rewards for decisive finished games", () => {
    vi.useFakeTimers();
    const io = fakeIo();
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    joinMatchmaking({ user: user("winner", "sigrika"), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("loser", "sigrika"), socketId: "socket-b" }, io);
    Math.random.mockRestore();
    completeRoomOpening(room, io);

    const loser = room.players.find((player) => player.color === COLORS.white);
    room.game.moveNumber = 11;
    const result = handleGameAction(room.code, loser.user.id, { type: "resign" }, io);

    expect(result.ok).toBe(true);
    expect(result.room.players.find((player) => player.user.id === "winner").user).toMatchObject({
      wins: 1,
      rating: 1020,
      coins: 50
    });
    expect(result.room.players.find((player) => player.user.id === "loser").user).toMatchObject({
      losses: 1,
      rating: 980,
      coins: 20
    });
    const savedSnapshot = JSON.parse(prismaMocks.gameRecordCreate.mock.calls[0][0].data.snapshot);
    expect(savedSnapshot.players.find((player) => player.user.id === "winner").user).toMatchObject({
      wins: 1,
      rating: 1020,
      coins: 50
    });
    expect(savedSnapshot.players.find((player) => player.user.id === "loser").user).toMatchObject({
      losses: 1,
      rating: 980,
      coins: 20
    });
    expect(prismaMocks.userUpdate).toHaveBeenCalledTimes(2);
    const updatesByUserId = new Map(prismaMocks.userUpdate.mock.calls.map(([operation]) => [operation.where.id, operation]));
    expect(updatesByUserId.get("winner").data).toMatchObject({
      wins: { increment: 1 },
      rating: { increment: 20 },
      coins: { increment: 50 }
    });
    expect(updatesByUserId.get("loser").data).toMatchObject({
      losses: { increment: 1 },
      rating: { increment: -20 },
      coins: { increment: 20 }
    });
  });

  test("clears rainbow candy effects after matching valid games", () => {
    vi.useFakeTimers();
    const io = fakeIo();
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    joinMatchmaking({
      user: {
        ...user("sigrika-candy", "denia"),
        itemEffects: { sigrikaCandyDisabled: true }
      },
      socketId: "socket-a"
    }, io);
    const room = joinMatchmaking({
      user: {
        ...user("denia-candy", "denia"),
        itemEffects: { deniaRainbowGlow: true }
      },
      socketId: "socket-b"
    }, io);
    Math.random.mockRestore();
    completeRoomOpening(room, io);

    const loser = room.players.find((player) => player.color === COLORS.white);
    room.game.moveNumber = 11;
    const result = handleGameAction(room.code, loser.user.id, { type: "resign" }, io);

    expect(result.ok).toBe(true);
    expect(result.room.players.find((player) => player.user.id === "denia-candy").user.itemEffects).toEqual({});
    const updatesByUserId = new Map(prismaMocks.userUpdate.mock.calls.map(([operation]) => [operation.where.id, operation]));
    expect(updatesByUserId.get("sigrika-candy").data.itemEffects).toBe("{}");
    expect(updatesByUserId.get("denia-candy").data.itemEffects).toBe("{}");
  });

  test("keeps rainbow candy effects after invalid games", async () => {
    vi.useFakeTimers();
    const io = fakeIo();
    joinMatchmaking({
      user: {
        ...user("early-candy", "denia"),
        itemEffects: { deniaRainbowGlow: true }
      },
      socketId: "socket-a"
    }, io);
    const room = joinMatchmaking({ user: user("early-other", "sigrika"), socketId: "socket-b" }, io);
    completeRoomOpening(room, io);
    room.game.moveNumber = 10;

    const loser = room.players.find((player) => player.color === COLORS.white);
    const result = handleGameAction(room.code, loser.user.id, { type: "resign" }, io);
    await Promise.resolve();

    expect(result.ok).toBe(true);
    expect(prismaMocks.userUpdate).not.toHaveBeenCalled();
  });

  test("persists draw records without updating user rewards", () => {
    vi.useFakeTimers();
    const io = fakeIo();
    joinMatchmaking({ user: user("draw-alice", "sigrika"), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("draw-bob", "sigrika"), socketId: "socket-b" }, io);
    completeRoomOpening(room, io);
    room.game.moveNumber = 11;

    const requester = room.players[0];
    const responder = room.players[1];
    expect(requestDraw(room.code, requester.user.id, io).ok).toBe(true);
    const result = respondDraw(room.code, responder.user.id, true, io);

    expect(result.ok).toBe(true);
    expect(prismaMocks.gameRecordCreate).toHaveBeenCalledTimes(1);
    expect(prismaMocks.userUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.transaction).not.toHaveBeenCalled();
  });

  test("treats draws through move 10 as invalid games without records or rewards", async () => {
    vi.useFakeTimers();
    const io = fakeIo();
    joinMatchmaking({ user: user("early-draw-alice", "sigrika"), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("early-draw-bob", "sigrika"), socketId: "socket-b" }, io);
    completeRoomOpening(room, io);
    room.game.moveNumber = 10;

    const requester = room.players[0];
    const responder = room.players[1];
    expect(requestDraw(room.code, requester.user.id, io).ok).toBe(true);
    const result = respondDraw(room.code, responder.user.id, true, io);
    await Promise.resolve();

    expect(result.ok).toBe(true);
    expect(room.game.winner).toMatchObject({
      winnerColor: null,
      reason: "agreement",
      invalid: true
    });
    expect(prismaMocks.gameRecordCreate).not.toHaveBeenCalled();
    expect(prismaMocks.userUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.transaction).not.toHaveBeenCalled();
    expect(io.messages.some((message) => message.event === "error:toast" && message.payload === "对局不超过10手结束，对局无效")).toBe(true);
  });

  test("treats resignations through move 10 as invalid games without records or rewards", async () => {
    vi.useFakeTimers();
    const io = fakeIo();
    joinMatchmaking({ user: user("early-black", "sigrika"), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("early-white", "sigrika"), socketId: "socket-b" }, io);
    completeRoomOpening(room, io);
    room.game.moveNumber = 10;

    const white = room.players.find((player) => player.color === COLORS.white);
    const result = handleGameAction(room.code, white.user.id, { type: "resign" }, io);
    await Promise.resolve();

    expect(result.ok).toBe(true);
    expect(room.game.winner).toMatchObject({
      winnerColor: COLORS.black,
      reason: "resign",
      invalid: true
    });
    expect(prismaMocks.gameRecordCreate).not.toHaveBeenCalled();
    expect(prismaMocks.userUpdate).not.toHaveBeenCalled();
    expect(prismaMocks.transaction).not.toHaveBeenCalled();
    expect(io.messages.some((message) => message.event === "error:toast" && message.payload === "对局不超过10手结束，对局无效")).toBe(true);
  });
});

describe("room matchmaking queue", () => {
  afterEach(() => {
    clearRoomsForTest();
    vi.useRealTimers();
  });

  test("keeps blacklisted users from pairing and matches the next compatible player", () => {
    vi.useFakeTimers();
    const io = fakeIo();

    joinMatchmaking({ user: user("blocked-a", "sigrika"), socketId: "socket-a" }, io);
    const blockedRoom = joinMatchmaking(
      { user: user("blocked-b", "sigrika"), socketId: "socket-b" },
      io,
      { canPair: () => false }
    );

    expect(blockedRoom).toBeNull();
    expect(matchmakingCount()).toBe(2);
    expect(listWaitingPlayers().map((player) => player.user.id)).toEqual(["blocked-a", "blocked-b"]);

    const room = joinMatchmaking(
      { user: user("compatible", "sigrika"), socketId: "socket-c" },
      io,
      { canPair: (candidate) => candidate.user.id === "blocked-b" }
    );

    expect(room).toBeTruthy();
    expect(matchmakingCount()).toBe(1);
    expect(listWaitingPlayers().map((player) => player.user.id)).toEqual(["blocked-a"]);
  });
});

describe("rooms character integration", () => {
  afterEach(() => {
    clearRoomsForTest();
    vi.useRealTimers();
  });

  test("uses room player character config for skill handling and notices", () => {
    const characterConfig = {
      id: "sigrika",
      name: "Admin Sigrika",
      portrait: "/custom.png",
      palette: "#123456",
      skill: {
        id: "custom-erase",
        effectType: "erase-point",
        name: "Admin Rune",
        uses: 1,
        description: "Custom admin skill",
        systemMessage: "{fromColor}{player} uses {character} {skill}; to {toColor}; target {point}",
        freeTurn: true,
        targetRule: "empty-point",
        params: {}
      }
    };
    const io = fakeIo();
    joinMatchmaking({ user: user("alice", "sigrika", characterConfig), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("bob", "sigrika", characterConfig), socketId: "socket-b" }, io);
    completeRoomOpening(room, io);
    clearRoomTimers(room);

    const black = room.players.find((player) => player.color === COLORS.black);
    const result = handleGameAction(room.code, black.user.id, { type: "skill", pointId: pointId(3, 3) }, io);

    expect(result.ok).toBe(true);
    expect(black.character).toEqual(black.user.characterConfig);
    expect(room.game.phase).toBe(GAME_PHASES.skillPreview);
    expect(room.game.history).toHaveLength(0);
    expect(room.chat.at(-1)).toMatchObject({ kind: "skill" });
    expect(room.chat.at(-1).text).toContain(black.character.name);
    expect(room.chat.at(-1).text).toContain(black.character.skill.name);
    expect(room.chat.at(-1).text).toContain("黑棋");
    expect(room.chat.at(-1).text).toContain("白棋");
    expect(room.chat.at(-1).text).toContain("target D-10");
  });

  test("renders targetColor from the targeted stone before a skill mutates it", () => {
    const characterConfig = {
      id: "danea",
      name: "Admin Danea",
      portrait: "/custom.png",
      palette: "#123456",
      skill: {
        id: "custom-flip",
        effectType: "flip-stone",
        name: "Admin Flip",
        uses: 1,
        description: "Custom flip skill",
        systemMessage: "{targetColor} becomes {toColor}",
        freeTurn: false,
        targetRule: "stone",
        params: {}
      }
    };
    const io = fakeIo();
    joinMatchmaking({ user: user("alice", "danea", characterConfig), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("bob", "danea", characterConfig), socketId: "socket-b" }, io);
    completeRoomOpening(room, io);
    clearRoomTimers(room);

    const black = room.players.find((player) => player.color === COLORS.black);
    const targetId = pointId(3, 3);
    getPoint(room.game, targetId).stone = COLORS.white;
    const result = handleGameAction(room.code, black.user.id, { type: "skill", pointId: targetId }, io);
    const targetDuringPreview = getPoint(room.game, targetId).stone;

    expect(result.ok).toBe(true);
    expect(targetDuringPreview).toBe(COLORS.white);
    expect(room.chat.at(-1).text).toContain("白棋 becomes 黑棋");
  });

  test("uses Baconbits board clicks as release confirmation instead of blast centers", () => {
    vi.useFakeTimers();
    const io = fakeIo();
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    joinMatchmaking({ user: user("bacon", "baconbits"), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("other", "sigrika"), socketId: "socket-b" }, io);
    Math.random.mockRestore();
    completeRoomOpening(room, io);
    clearRoomTimers(room);

    const bacon = room.players.find((player) => player.user.selectedCharacter === "baconbits");
    room.game.turn = bacon.color;
    getPoint(room.game, pointId(4, 4)).stone = COLORS.black;
    getPoint(room.game, pointId(9, 9)).stone = COLORS.white;

    vi.spyOn(Math, "random").mockReturnValue(0);
    const result = handleGameAction(room.code, bacon.user.id, { type: "skill", pointId: pointId(12, 12) }, io);
    Math.random.mockRestore();

    expect(result.ok).toBe(true);
    expect(room.game.phase).toBe(GAME_PHASES.skillPreview);
    expect(room.game.history).toHaveLength(0);
    expect(room.chat.at(-1).text).toContain("无目标");

    vi.advanceTimersByTime(2000);

    expect(room.game.history.at(-1)).toMatchObject({
      effectType: "random-blast",
      id: pointId(4, 4)
    });
    expect(getPoint(room.game, pointId(4, 4)).stone).toBeNull();
    expect(getPoint(room.game, pointId(12, 12)).stone).toBeNull();
    expect(getPoint(room.game, pointId(12, 12)).skillEffect).toBeFalsy();
  });
});

describe("rooms removable test tools", () => {
  afterEach(() => {
    clearRoomsForTest();
  });

  test("handles random layout and skill restore actions", () => {
    const characterConfig = {
      id: "aemeath",
      name: "Aemeath",
      portrait: "/custom.png",
      palette: "#123456",
      skill: {
        id: "hidden-hand",
        effectType: "hidden-hand",
        name: "Hidden",
        uses: 2,
        description: "Hidden",
        systemMessage: "{player}",
        freeTurn: false,
        targetRule: "empty-point",
        params: {}
      }
    };
    const io = fakeIo();
    joinMatchmaking({ user: user("test-alice", "aemeath", characterConfig), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("test-bob", "aemeath", characterConfig), socketId: "socket-b" }, io);
    completeRoomOpening(room, io);
    clearRoomTimers(room);

    const black = room.players.find((player) => player.color === COLORS.black);
    room.game.skillUses[black.color] = 0;

    const restoreResult = handleGameAction(room.code, black.user.id, { type: "test-restore-skill" }, io);
    expect(restoreResult.ok).toBe(true);
    expect(room.game.skillUses[black.color]).toBe(2);

    const layoutResult = handleGameAction(room.code, black.user.id, { type: "test-random-layout" }, io);
    expect(layoutResult.ok).toBe(true);
    expect(room.game.points.filter((point) => point.stone === COLORS.black)).toHaveLength(50);
    expect(room.game.points.filter((point) => point.stone === COLORS.white)).toHaveLength(50);
  });

  test("test tool can force the acting player into byo-yomi", () => {
    const io = fakeIo();
    joinMatchmaking({ user: user("test-alice", "sigrika"), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("test-bob", "sigrika"), socketId: "socket-b" }, io);
    completeRoomOpening(room, io);
    clearRoomTimers(room);

    const white = room.players.find((player) => player.color === COLORS.white);
    white.time.main = 123;
    white.time.periodRemaining = 9;

    const result = handleGameAction(room.code, white.user.id, { type: "test-enter-byo-yomi" }, io);

    expect(result.ok).toBe(true);
    expect(white.time.main).toBe(0);
    expect(white.time.periodRemaining).toBe(white.time.byoYomi);
    expect(room.chat.at(-1).text).toContain("测试工具");
  });

  test("rejects removable test tool actions in production", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const io = fakeIo();
      joinMatchmaking({ user: user("test-alice", "aemeath"), socketId: "socket-a" }, io);
      const room = joinMatchmaking({ user: user("test-bob", "aemeath"), socketId: "socket-b" }, io);
      completeRoomOpening(room, io);
      clearRoomTimers(room);

      const black = room.players.find((player) => player.color === COLORS.black);
      const result = handleGameAction(room.code, black.user.id, { type: "test-enter-byo-yomi" }, io);

      expect(result.ok).toBe(false);
      expect(result.error).toBe("测试工具仅开发环境可用");
    } finally {
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalNodeEnv;
    }
  });

  test("delays Nabomo passive until after the opening sequence", () => {
    const io = fakeIo();
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    joinMatchmaking({ user: user("alice", "nabomo", CHARACTERS.nabomo), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("bob", "sigrika", CHARACTERS.sigrika), socketId: "socket-b" }, io);
    Math.random.mockRestore();

    const nabomo = room.players.find((player) => player.characterId === "nabomo");
    expect(room.game.phase).toBe(GAME_PHASES.opening);

    completeRoomOpening(room, io);
    clearRoomTimers(room);
    expect(room.game.phase).toBe(GAME_PHASES.playing);

    expect(startInitialPassiveSkillNow(room, io)).toBe(true);
    expect(room.game.phase).toBe(GAME_PHASES.skillPreview);
    expect(room.game.pendingSkill).toMatchObject({
      color: nabomo.color,
      skillName: CHARACTERS.nabomo.skill.name
    });
  });
});

describe("room opening sequence", () => {
  afterEach(() => {
    clearRoomsForTest();
    vi.useRealTimers();
  });

  test("delays playing phase, clock ticking, and initial passive until after the opening notice", () => {
    const io = fakeIo();
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    joinMatchmaking({ user: user("opening-alice", "nabomo", CHARACTERS.nabomo), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("opening-bob", "sigrika", CHARACTERS.sigrika), socketId: "socket-b" }, io);
    Math.random.mockRestore();

    const view = roomView(room, room.players[0].user.id);
    expect(room.game.phase).toBe(GAME_PHASES.opening);
    expect(view.openingEndsAt).toBeGreaterThan(Date.now());
    expect(handleGameAction(room.code, room.players[0].user.id, { type: "move", pointId: pointId(4, 4) }, io).ok).toBe(false);

    completeRoomOpening(room, io);
    clearRoomTimers(room);
    expect(room.game.phase).toBe(GAME_PHASES.playing);
    expect(room.chat.at(-1)).toMatchObject({ kind: "game-start" });

    expect(startInitialPassiveSkillNow(room, io)).toBe(true);
    expect(room.game.phase).toBe(GAME_PHASES.skillPreview);
  });

  test("broadcasts lightweight clock ticks without full room updates during play", () => {
    vi.useFakeTimers();
    const io = fakeIo();
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    joinMatchmaking({ user: user("clock-alice", "sigrika"), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("clock-bob", "sigrika"), socketId: "socket-b" }, io);
    Math.random.mockRestore();
    completeRoomOpening(room, io);
    io.messages = [];

    vi.advanceTimersByTime(1000);

    expect(io.messages.map((message) => message.event)).toEqual(["room:clock", "room:clock"]);
    expect(io.messages[0].payload).toMatchObject({
      roomCode: room.code,
      activeColor: COLORS.black,
      players: [
        { color: COLORS.black, time: { main: 299, byoYomi: 30, periodRemaining: 30, periods: 3 } },
        { color: COLORS.white, time: { main: 300, byoYomi: 30, periodRemaining: 30, periods: 3 } }
      ]
    });
  });
});

describe("room request timers", () => {
  afterEach(() => {
    clearRoomsForTest();
    vi.useRealTimers();
  });

  test("tracks counting request timeouts in the room timer registry", () => {
    vi.useFakeTimers();
    const io = fakeIo();
    joinMatchmaking({ user: user("counting-timer-black", "sigrika"), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("counting-timer-white", "sigrika"), socketId: "socket-b" }, io);
    completeRoomOpening(room, io);
    clearRoomTimers(room);

    const requester = room.players[0];
    expect(requestCounting(room.code, requester.user.id, io).ok).toBe(true);

    expect(room.timeoutIds).toHaveLength(1);
  });

  test("tracks draw request timeouts in the room timer registry", () => {
    vi.useFakeTimers();
    const io = fakeIo();
    joinMatchmaking({ user: user("draw-timer-black", "sigrika"), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("draw-timer-white", "sigrika"), socketId: "socket-b" }, io);
    completeRoomOpening(room, io);
    clearRoomTimers(room);

    const requester = room.players[0];
    expect(requestDraw(room.code, requester.user.id, io).ok).toBe(true);

    expect(room.timeoutIds).toHaveLength(1);
  });

  test("tracks result review timeouts in the room timer registry", () => {
    vi.useFakeTimers();
    const io = fakeIo();
    joinMatchmaking({ user: user("result-timer-black", "sigrika"), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("result-timer-white", "sigrika"), socketId: "socket-b" }, io);
    completeRoomOpening(room, io);
    clearRoomTimers(room);

    const [requester, responder] = room.players;
    expect(requestCounting(room.code, requester.user.id, io).ok).toBe(true);
    expect(respondCounting(room.code, responder.user.id, true).ok).toBe(true);
    clearRoomTimers(room);

    expect(handleScoringAction(room.code, requester.user.id, { type: "confirm-dead" }, io).ok).toBe(true);
    expect(handleScoringAction(room.code, responder.user.id, { type: "confirm-dead" }, io).ok).toBe(true);

    expect(room.timeoutIds).toHaveLength(1);
  });
});

describe("room participants view", () => {
  afterEach(() => {
    clearRoomsForTest();
    vi.useRealTimers();
  });

  test("includes spectator user details for the in-room people list", () => {
    const io = fakeIo();
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    joinMatchmaking({ user: user("black-player", "sigrika"), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("white-player", "danea"), socketId: "socket-b" }, io);
    Math.random.mockRestore();

    const spectator = { ...user("watcher", "aemeath"), username: "watcher-name", rank: "3段", rating: 1160 };
    attachSocketToRoom(room.code, { id: "socket-watch", join: vi.fn() }, spectator);

    const view = roomView(room, room.players[0].user.id);

    expect(view.spectators).toHaveLength(1);
    expect(view.spectators[0].user).toMatchObject({
      username: "watcher-name",
      rank: "3段",
      rating: 1160
    });
  });

  test("lists watchable rooms with online counts and compact player summaries", () => {
    const io = fakeIo();
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    joinMatchmaking({ user: user("watch-black", "sigrika"), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("watch-white", "denia"), socketId: "socket-b" }, io);
    Math.random.mockRestore();
    attachSocketToRoom(room.code, { id: "socket-watch", join: vi.fn() }, user("watcher", "aemeath"));
    detachSocket("socket-b", io);

    const rooms = listWatchRooms();

    expect(rooms).toHaveLength(1);
    expect(rooms[0]).toMatchObject({
      code: room.code,
      onlineCount: 2,
      moveNumber: room.game.moveNumber,
      status: "playing",
      closesAt: null,
      black: {
        characterId: "sigrika",
        connected: true,
        user: { username: "watch-black" }
      },
      white: {
        characterId: "denia",
        connected: false,
        user: { username: "watch-white" }
      }
    });
  });

  test("removes spectators when they explicitly leave a room", () => {
    const io = fakeIo();
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    joinMatchmaking({ user: user("leave-black", "sigrika"), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("leave-white", "denia"), socketId: "socket-b" }, io);
    Math.random.mockRestore();
    attachSocketToRoom(room.code, { id: "socket-watch", join: vi.fn() }, user("leaving-watcher", "aemeath"));

    const changedRoom = leaveRoom(room.code, "leaving-watcher", "socket-watch");

    expect(changedRoom).toBe(room);
    expect(room.spectators).toHaveLength(0);
    expect(room.chat.at(-1)).toMatchObject({
      type: "system",
      kind: "spectator-leave"
    });
    expect(listWatchRooms()[0].onlineCount).toBe(2);
  });

  test("removes finished-room players from online counts when they leave", () => {
    const io = fakeIo();
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    joinMatchmaking({ user: user("finished-leave-black", "sigrika"), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("finished-leave-white", "denia"), socketId: "socket-b" }, io);
    Math.random.mockRestore();
    room.game.phase = GAME_PHASES.finished;

    const changedRoom = leaveRoom(room.code, "finished-leave-black", "socket-a");

    expect(changedRoom).toBe(room);
    expect(room.players.find((player) => player.user.id === "finished-leave-black")).toMatchObject({
      socketId: null,
      disconnectedAt: null
    });
    expect(room.spectators).toHaveLength(0);
    expect(listWatchRooms()[0].onlineCount).toBe(1);
  });

  test("records disconnect and reconnect system notices for players", () => {
    const io = fakeIo();
    joinMatchmaking({ user: user("disconnect-black", "sigrika"), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("disconnect-white", "sigrika"), socketId: "socket-b" }, io);
    completeRoomOpening(room, io);

    detachSocket("socket-a", io);
    const disconnectedPlayer = room.players.find((player) => player.user.id === "disconnect-black");
    expect(disconnectedPlayer).toMatchObject({ socketId: null });
    expect(disconnectedPlayer.disconnectedAt).toEqual(expect.any(Number));
    expect(room.chat.at(-1)).toMatchObject({
      type: "system",
      kind: "disconnect"
    });
    expect(room.chat.at(-1).text).toContain("断线中");

    attachSocketToRoom(room.code, { id: "socket-new", join: vi.fn() }, disconnectedPlayer.user);
    expect(disconnectedPlayer).toMatchObject({ socketId: "socket-new", disconnectedAt: null });
    expect(room.chat.at(-1)).toMatchObject({
      type: "system",
      kind: "reconnect"
    });
    expect(room.chat.at(-1).text).toContain("已重新连接");
  });

  test("finds a user's unfinished room for reconnect recovery", () => {
    const io = fakeIo();
    joinMatchmaking({ user: user("recover-black", "sigrika"), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("recover-white", "sigrika"), socketId: "socket-b" }, io);

    expect(findRoomForUser("recover-black", room.code)).toBe(room);
    expect(findRoomForUser("recover-black", "99999")).toBeNull();
  });

  test("restores a persisted room without stale socket ids", async () => {
    vi.useFakeTimers();
    const io = fakeIo();
    joinMatchmaking({ user: user("persist-black", "sigrika"), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("persist-white", "sigrika"), socketId: "socket-b" }, io);
    const snapshot = prismaMocks.executeRaw.mock.calls.find((call) => call[1] === room.code && typeof call[3] === "string")?.[3];
    expect(snapshot).toBeTruthy();

    clearRoomsForTest();
    prismaMocks.queryRaw.mockResolvedValue([{ code: room.code, status: "active", snapshot }]);
    await restorePersistedRooms(io);

    const restored = findRoomForUser("persist-black", room.code);
    expect(restored).toBeTruthy();
    expect(restored.players.every((player) => player.socketId == null)).toBe(true);
    expect(restored.players.every((player) => player.disconnectedAt)).toBe(true);
    expect(restored.chat.filter((message) => message.kind === "disconnect")).toHaveLength(2);
    expect(attachSocketToRoom(room.code, { id: "socket-new", join: vi.fn() }, user("persist-black", "sigrika"))).toBe(restored);
    expect(restored.players.find((player) => player.user.id === "persist-black").socketId).toBe("socket-new");
    expect(restored.players.find((player) => player.user.id === "persist-white").disconnectedAt).toEqual(expect.any(Number));
    expect(restored.chat.at(-1)).toMatchObject({ kind: "reconnect" });
  });

  test("closes active rooms as invalid after both players are absent for five minutes", () => {
    vi.useFakeTimers();
    const io = fakeIo();
    joinMatchmaking({ user: user("empty-black", "sigrika"), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("empty-white", "sigrika"), socketId: "socket-b" }, io);
    completeRoomOpening(room, io);
    clearRoomTimers(room);

    detachSocket("socket-a", io);
    detachSocket("socket-b", io);
    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(room.game.winner).toMatchObject({
      winnerColor: null,
      reason: "empty-room",
      invalid: true
    });
    expect(findRoomForUser("empty-black", room.code)).toBeNull();
    expect(prismaMocks.gameRecordCreate).not.toHaveBeenCalled();
  });

  test("sends a toast payload when finished rooms close after five minutes", () => {
    vi.useFakeTimers();
    const io = fakeIo();
    joinMatchmaking({ user: user("close-black", "sigrika"), socketId: "socket-a" }, io);
    const room = joinMatchmaking({ user: user("close-white", "sigrika"), socketId: "socket-b" }, io);
    completeRoomOpening(room, io);
    room.game.moveNumber = 11;

    const white = room.players.find((player) => player.color === COLORS.white);
    const result = handleGameAction(room.code, white.user.id, { type: "resign" }, io);
    expect(result.ok).toBe(true);
    vi.advanceTimersByTime(5 * 60 * 1000);

    expect(io.messages.some((message) => (
      message.socketId === "socket-a"
      && message.event === "room:closed"
      && message.payload?.message === "房间因空置5分钟以上而被关闭"
    ))).toBe(true);
    expect(findRoomForUser("close-black", room.code)).toBeNull();
  });
});
