import { describe, expect, test, vi } from "vitest";
import { COLORS } from "../src/shared/game.js";
import {
  broadcastRoom,
  broadcastRoomClock,
  broadcastRoomPatch,
  broadcastToast,
  emitRoomClosed,
  roomClockPayload,
  roomParticipants
} from "./roomBroadcasts.js";

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

function testRoom() {
  return {
    code: "12345",
    players: [
      {
        socketId: "black-socket",
        user: { id: "black-user" },
        color: COLORS.black,
        time: { main: 299, byoYomi: 30, periodRemaining: 30, periods: 3 }
      },
      {
        socketId: null,
        user: { id: "white-user" },
        color: COLORS.white,
        time: { main: 300, byoYomi: 30, periodRemaining: 30, periods: 3 }
      }
    ],
    spectators: [
      { socketId: "spectator-socket", user: { id: "spectator-user" } }
    ],
    game: { turn: COLORS.black }
  };
}

describe("roomBroadcasts", () => {
  test("lists room participants in player then spectator order", () => {
    expect(roomParticipants(testRoom()).map((participant) => participant.user.id)).toEqual([
      "black-user",
      "white-user",
      "spectator-user"
    ]);
  });

  test("broadcasts room updates with viewer-specific room views and forced persistence", () => {
    const io = fakeIo();
    const persistRoom = vi.fn();
    const roomViewFn = vi.fn((room, viewerId) => ({ code: room.code, viewerId }));

    broadcastRoom(io, testRoom(), { persistRoom, roomViewFn });

    expect(persistRoom).toHaveBeenCalledWith(expect.objectContaining({ code: "12345" }), { force: true });
    expect(roomViewFn).toHaveBeenCalledTimes(2);
    expect(roomViewFn).toHaveBeenNthCalledWith(1, expect.objectContaining({ code: "12345" }), "black-user");
    expect(roomViewFn).toHaveBeenNthCalledWith(2, expect.objectContaining({ code: "12345" }), "spectator-user");
    expect(io.messages).toEqual([
      {
        socketId: "black-socket",
        event: "room:update",
        payload: { code: "12345", viewerId: "black-user" }
      },
      {
        socketId: "spectator-socket",
        event: "room:update",
        payload: { code: "12345", viewerId: "spectator-user" }
      }
    ]);
  });

  test("broadcasts lightweight clock payloads with throttled persistence", () => {
    const io = fakeIo();
    const persistRoom = vi.fn();
    const room = testRoom();

    broadcastRoomClock(io, room, { persistRoom });

    expect(persistRoom).toHaveBeenCalledWith(room);
    expect(io.messages.map((message) => message.event)).toEqual(["room:clock", "room:clock"]);
    expect(io.messages[0].payload).toMatchObject({
      roomCode: "12345",
      activeColor: COLORS.black,
      players: [
        { color: COLORS.black, time: { main: 299 } },
        { color: COLORS.white, time: { main: 300 } }
      ]
    });
  });

  test("broadcasts lightweight room patches with forced persistence", () => {
    const io = fakeIo();
    const persistRoom = vi.fn();
    const room = testRoom();

    broadcastRoomPatch(io, room, { type: "chat:append", message: { id: "chat-1" } }, { persistRoom });

    expect(persistRoom).toHaveBeenCalledWith(room, { force: true });
    expect(io.messages).toEqual([
      {
        socketId: "black-socket",
        event: "room:patch",
        payload: { roomCode: "12345", type: "chat:append", message: { id: "chat-1" } }
      },
      {
        socketId: "spectator-socket",
        event: "room:patch",
        payload: { roomCode: "12345", type: "chat:append", message: { id: "chat-1" } }
      }
    ]);
  });

  test("builds clock payloads without sharing mutable player time objects", () => {
    const room = testRoom();
    const payload = roomClockPayload(room);

    payload.players[0].time.main = 1;

    expect(room.players[0].time.main).toBe(299);
  });

  test("broadcasts toast and close events only to connected participants", () => {
    const io = fakeIo();
    const room = testRoom();

    broadcastToast(io, room, "hello");
    emitRoomClosed(io, room, { roomCode: room.code, reason: "done" });

    expect(io.messages).toEqual([
      { socketId: "black-socket", event: "error:toast", payload: "hello" },
      { socketId: "spectator-socket", event: "error:toast", payload: "hello" },
      { socketId: "black-socket", event: "room:closed", payload: { roomCode: "12345", reason: "done" } },
      { socketId: "spectator-socket", event: "room:closed", payload: { roomCode: "12345", reason: "done" } }
    ]);
  });
});
