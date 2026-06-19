import { describe, expect, it } from "vitest";
import { applyRoomPatch, roomPatchNeedsResume } from "./roomPatch.js";

describe("room patch updates", () => {
  it("appends chat messages while preserving unchanged room slices", () => {
    const game = { phase: "playing" };
    const players = [{ user: { id: "u1" } }];
    const room = {
      code: "12345",
      revision: 0,
      game,
      players,
      chat: [{ id: "chat-1", text: "first" }]
    };
    const message = { id: "chat-2", text: "second" };

    const nextRoom = applyRoomPatch(room, {
      roomCode: "12345",
      type: "chat:append",
      baseRevision: 0,
      revision: 1,
      message
    });

    expect(nextRoom).not.toBe(room);
    expect(nextRoom.game).toBe(game);
    expect(nextRoom.players).toBe(players);
    expect(nextRoom.chat).toEqual([...room.chat, message]);
    expect(nextRoom.revision).toBe(1);
  });

  it("advances the revision when a continuous chat patch is already reflected in the snapshot", () => {
    const message = { id: "chat-2", text: "second" };
    const room = {
      code: "12345",
      revision: 1,
      game: { phase: "playing" },
      chat: [message]
    };

    const nextRoom = applyRoomPatch(room, {
      roomCode: "12345",
      type: "chat:append",
      baseRevision: 1,
      revision: 2,
      message
    });

    expect(nextRoom).not.toBe(room);
    expect(nextRoom.chat).toBe(room.chat);
    expect(nextRoom.revision).toBe(2);
  });

  it("updates room presence while preserving game state", () => {
    const game = { phase: "playing" };
    const chat = [{ id: "system-1", type: "system", text: "reconnected" }];
    const room = {
      code: "12345",
      revision: 2,
      game,
      players: [{ color: "black", connected: false }],
      spectators: [],
      spectatorCount: 0,
      chat: []
    };
    const players = [{ color: "black", connected: true }];
    const spectators = [{ user: { id: "spectator-user" } }];

    const nextRoom = applyRoomPatch(room, {
      roomCode: "12345",
      type: "presence:update",
      baseRevision: 2,
      revision: 3,
      players,
      spectators,
      spectatorCount: 1,
      chat
    });

    expect(nextRoom).not.toBe(room);
    expect(nextRoom.game).toBe(game);
    expect(nextRoom.players).toBe(players);
    expect(nextRoom.spectators).toBe(spectators);
    expect(nextRoom.spectatorCount).toBe(1);
    expect(nextRoom.chat).toBe(chat);
    expect(nextRoom.revision).toBe(3);
  });

  it("ignores duplicate, stale, and unknown room patches", () => {
    const room = {
      code: "12345",
      revision: 1,
      chat: [{ id: "chat-1", text: "first" }]
    };

    expect(applyRoomPatch(room, {
      roomCode: "12345",
      type: "chat:append",
      baseRevision: 0,
      revision: 1,
      message: { id: "chat-1", text: "first" }
    })).toBe(room);
    expect(applyRoomPatch(room, {
      roomCode: "99999",
      type: "chat:append",
      message: { id: "chat-2", text: "stale" }
    })).toBe(room);
    expect(applyRoomPatch(room, { roomCode: "12345", type: "unknown" })).toBe(room);
  });

  it("detects patch gaps so the socket layer can resume the authoritative room", () => {
    const room = {
      code: "12345",
      revision: 2,
      chat: []
    };
    const gapPatch = {
      roomCode: "12345",
      type: "chat:append",
      baseRevision: 4,
      revision: 5,
      message: { id: "chat-5", text: "late" }
    };

    expect(roomPatchNeedsResume(room, gapPatch)).toBe(true);
    expect(applyRoomPatch(room, gapPatch)).toBe(room);
    expect(roomPatchNeedsResume(room, { ...gapPatch, baseRevision: 2, revision: 3 })).toBe(false);
    expect(roomPatchNeedsResume(room, { ...gapPatch, roomCode: "99999" })).toBe(false);
  });
});
