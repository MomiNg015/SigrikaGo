import { afterEach, describe, expect, test, vi } from "vitest";
import { COLORS, GAME_PHASES, getPoint, pointId } from "../src/shared/game.js";
import { CHARACTERS } from "../src/shared/characters.js";
import { clearRoomsForTest, clearRoomTimers, completeRoomOpening, handleGameAction, joinMatchmaking, roomView, startInitialPassiveSkillNow } from "./rooms.js";

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
      const result = handleGameAction(room.code, black.user.id, { type: "test-random-layout" }, io);

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
});
