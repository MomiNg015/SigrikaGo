import { afterEach, expect, test, vi } from "vitest";
import { applyCountingResponse, applyDrawResponse } from "./roomScoringFlow.js";
import { createRoomClockLifecycle } from "./roomClockLifecycle.js";
import { serializePracticePositionToSgf } from "../src/shared/practiceBotPosition.js";
import { buildKataGoPositionCommands } from "./zhiziKataGoProtocol.js";

afterEach(() => vi.restoreAllMocks());
function clock() {
  vi.spyOn(Date, "now").mockReturnValue(0);
  const room = { code: "clock", game: { phase: "playing", turn: "black", moveNumber: 20 }, players: ["black", "white"].map((color) => ({ color, user: { username: color }, time: { main: 10, periods: 0 } })) };
  const lifecycle = createRoomClockLifecycle({ rooms: new Map([[room.code, room]]), scheduleRoomInterval: () => {}, clearRoomInterval: () => {}, arePlayersDisconnected: () => false, scheduleEmptyActiveRoomClose: () => {}, broadcastRoomClock: () => {}, broadcastRoom: () => {}, broadcastToast: () => {}, appendSystem: () => {}, scheduleRoomClose: () => {} });
  lifecycle.startGameClock(room, {});
  const tick = (now) => { Date.now.mockReturnValue(now); lifecycle.syncGameClock(room, {}); };
  return { room, tick };
}
test("early callbacks consume no forced second and jitter retains every fraction", () => {
  const { room, tick } = clock();
  tick(500); tick(990);
  expect(room.players[0].time.main).toBe(10);
  tick(1002); tick(2105); tick(5150);
  expect(room.players[0].time.main).toBe(5);
  expect(room.players[0].clockRemainderMs).toBe(150);
});
test("subsecond usage stays with each player across turn boundaries", () => {
  const { room, tick } = clock();
  tick(300); room.game.turn = "white";
  tick(900); room.game.turn = "black";
  tick(1400); tick(1600);
  expect(room.players[0].time.main).toBe(9);
  expect(room.players[1].time.main).toBe(10);
  expect(room.players[1].clockRemainderMs).toBe(600);
});
test("paused phases do not bill suspended time", () => {
  const { room, tick } = clock();
  tick(500); room.game.phase = "countingRequested";
  tick(10000); room.game.phase = "playing";
  tick(10500);
  expect(room.players[0].time.main).toBe(9);
});
test("GNU Go SGF and KataGo GTP both convert 2.75 internal komi to 5.5 points", () => {
  const game = { size: 13, komi: 2.75, points: [], history: [] };
  expect(serializePracticePositionToSgf(game, "black")).toContain("KM[5.5]");
  expect(buildKataGoPositionCommands(game).commands).toContain("komi 5.5");
});

test.each(["counting", "draw"])("resuming %s resets the baseline between interval callbacks", (kind) => {
  const { room, tick } = clock();
  tick(500);
  room.game.phase = kind === "counting" ? "countingRequested" : "drawRequested";
  room.game.scoring = { requestedBy: "opponent" };
  room.game.drawRequest = { requestedBy: "opponent" };
  Date.now.mockReturnValue(9980);
  const respond = kind === "counting" ? applyCountingResponse : applyDrawResponse;
  respond({ room, player: room.players[0], userId: "self", accepted: false, appendSystem: () => {} });
  tick(10000);
  expect(room.players[0].time.main).toBe(10);
  expect(room.players[0].clockRemainderMs).toBe(520);
});
