import { describe, expect, it } from "vitest";
import { applyRoomPatch } from "./roomPatch.js";

describe("room patch updates", () => {
  it("appends chat messages while preserving unchanged room slices", () => {
    const game = { phase: "playing" };
    const players = [{ user: { id: "u1" } }];
    const room = {
      code: "12345",
      game,
      players,
      chat: [{ id: "chat-1", text: "first" }]
    };
    const message = { id: "chat-2", text: "second" };

    const nextRoom = applyRoomPatch(room, { roomCode: "12345", type: "chat:append", message });

    expect(nextRoom).not.toBe(room);
    expect(nextRoom.game).toBe(game);
    expect(nextRoom.players).toBe(players);
    expect(nextRoom.chat).toEqual([...room.chat, message]);
  });

  it("ignores duplicate, stale, and unknown room patches", () => {
    const room = {
      code: "12345",
      chat: [{ id: "chat-1", text: "first" }]
    };

    expect(applyRoomPatch(room, {
      roomCode: "12345",
      type: "chat:append",
      message: { id: "chat-1", text: "first" }
    })).toBe(room);
    expect(applyRoomPatch(room, {
      roomCode: "99999",
      type: "chat:append",
      message: { id: "chat-2", text: "stale" }
    })).toBe(room);
    expect(applyRoomPatch(room, { roomCode: "12345", type: "unknown" })).toBe(room);
  });
});
