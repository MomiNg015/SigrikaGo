import { describe, expect, it } from "vitest";
import { COLORS, GAME_PHASES, createGameState, getPoint, playMove, pointId, suspendUnexposedHiddenHands, useSkill } from "../src/shared/game.js";
import { replayGameAt } from "../src/room/roomView.js";
import { buildRoomView } from "./roomView.js";
import { createRoomCreationLifecycle } from "./roomCreationLifecycle.js";
import { createRuntimeServiceState } from "./runtimeServiceState.js";
import { registerPracticeSocketEvents } from "./socketPracticeEvents.js";

const noop = () => {};
function player(id, color, characterId = "aemeath") {
  return { color, characterId, socketId: id, user: { id, username: id, selectedCharacter: characterId, rank: "Rookie", rating: 1000 } };
}
function hiddenRoom() {
  const players = [player("black", COLORS.black), player("white", COLORS.white, "sigrika")];
  const game = useSkill(createGameState(players), COLORS.black, "aemeath", pointId(4, 4)).state;
  return { code: "test", players, spectators: [], chat: [], game };
}

describe("public hidden-hand boundaries", () => {
  it.each(["white", "observer"])("conceals history and replays later public turns for %s", (viewer) => {
    const room = hiddenRoom();
    room.game = playMove(room.game, COLORS.white, pointId(1, 1)).state;
    const original = structuredClone(room.game);
    const view = buildRoomView(room, viewer);
    expect(view.game.history[0]).toMatchObject({ id: null, concealed: true });
    expect(getPoint(view.game, pointId(4, 4)).stone).toBeNull();
    expect(view.game.derivedSkills.black.sourceHiddenHandId).toBeNull();
    const replay = replayGameAt(view, 2);
    expect(replay.moveNumber).toBe(2);
    expect(getPoint(replay, pointId(1, 1)).stone).toBe(COLORS.white);
    expect(getPoint(replay, pointId(4, 4)).stone).toBeNull();
    expect(room.game).toEqual(original);
    expect(buildRoomView(room, "black").game.history[0].id).toBe(pointId(4, 4));
  });

  it("conceals suspended positions and pending skill previews, but preserves finished history", () => {
    const room = hiddenRoom();
    suspendUnexposedHiddenHands(room.game);
    const view = buildRoomView(room, "observer");
    expect(view.game.suspendedHiddenHands).toEqual([]);
    expect(view.game.history[0].id).toBeNull();
    room.game.pendingSkill = { effectType: "hidden-hand", color: COLORS.black, targetId: "4,4", affectedPointIds: ["4,4"] };
    expect(buildRoomView(room, "white").game.pendingSkill).toMatchObject({ targetId: null, affectedPointIds: [] });
    room.game.phase = GAME_PHASES.finished;
    expect(buildRoomView(room, "observer").game.history[0].id).toBe("4,4");
  });

  it("makes a revealed location available again", () => {
    const room = hiddenRoom();
    room.game = playMove(room.game, COLORS.white, "4,4").state;
    expect(buildRoomView(room, "observer").game.history[0].id).toBe("4,4");
  });
});

it("rechecks capacity after concurrent practice authentication and rejects drain at the creation boundary", async () => {
  const rooms = new Map();
  const io = { to: () => ({ emit: noop }) };
  const runtime = createRuntimeServiceState({ env: { MAX_ACTIVE_ROOMS: "1" }, activeRoomCount: () => rooms.size, performanceMetrics: { snapshot: () => ({}) } });
  const lifecycle = createRoomCreationLifecycle({ rooms, matchmakingQueue: { removeUser: noop },
    isRoomCodeTaken: (code) => rooms.has(code), persistRoom: noop, startGameClock: noop,
    roomView: (room) => ({ code: room.code }), appendSystem: noop, admitRoom: () => runtime.admission("match") });
  let release;
  const refresh = new Promise((resolve) => { release = resolve; });
  const handlers = [], results = [];
  for (const id of ["alice", "bob"]) {
    const socket = { id, user: player(id).user, on: (event, callback) => { if (event === "practice:start") handlers.push(callback); } };
    registerPracticeSocketEvents(socket, { io, characterSelectionData: noop,
      refreshSocketUser: () => refresh, createPracticeRoom: lifecycle.createPracticeRoom,
      isUserInActiveRoom: () => false, leaveMatchmaking: noop, runtimeServiceState: runtime });
  }
  const requests = handlers.map((handle) => handle({ difficulty: "beginner", playerColor: "black" }, (result) => results.push(result)));
  release();
  await Promise.all(requests);
  expect(rooms.size).toBe(1);
  expect(results.filter((result) => result.ok)).toHaveLength(1);
  expect(results.find((result) => !result.ok)).toMatchObject({ code: "room_admission_rejected", error: "当前对局人数较多，请稍后再匹配" });
  rooms.clear();
  runtime.beginDrain();
  expect(() => lifecycle.createDirectRoom(player("c"), player("d"), io)).toThrow("服务器正在维护");
  expect(rooms.size).toBe(0);
});
