import { describe, expect, it } from "vitest";
import { applyRoomPatch, roomPatchCanUpdate, roomPatchNeedsResume } from "./roomPatch.js";

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
    expect(nextRoom.players).toEqual(players);
    expect(nextRoom.spectators).toEqual(spectators);
    expect(nextRoom.spectatorCount).toBe(1);
    expect(nextRoom.chat).toEqual(chat);
    expect(nextRoom.revision).toBe(3);
  });

  it("structurally shares unchanged presence entries", () => {
    const unchangedWhite = {
      color: "white",
      connected: true,
      user: { id: "white-user", username: "White" },
      time: { main: 300 }
    };
    const spectator = { user: { id: "spectator-user", username: "Spectator" } };
    const chatMessage = { id: "system-1", type: "system", text: "joined" };
    const room = {
      code: "12345",
      revision: 3,
      game: { phase: "playing" },
      players: [
        { color: "black", connected: true, user: { id: "black-user", username: "Black" } },
        unchangedWhite
      ],
      spectators: [spectator],
      spectatorCount: 1,
      chat: [chatMessage]
    };

    const nextRoom = applyRoomPatch(room, {
      roomCode: "12345",
      type: "presence:update",
      baseRevision: 3,
      revision: 4,
      players: [
        { color: "black", connected: false, disconnectedAt: 123, user: { id: "black-user", username: "Black" } },
        { color: "white", connected: true, user: { id: "white-user", username: "White" }, time: { main: 300 } }
      ],
      spectators: [{ user: { id: "spectator-user", username: "Spectator" } }],
      spectatorCount: 1,
      chat: [{ id: "system-1", type: "system", text: "joined" }]
    });

    expect(nextRoom.players).not.toBe(room.players);
    expect(nextRoom.players[0]).not.toBe(room.players[0]);
    expect(nextRoom.players[1]).toBe(unchangedWhite);
    expect(nextRoom.spectators).toBe(room.spectators);
    expect(nextRoom.spectators[0]).toBe(spectator);
    expect(nextRoom.chat).toBe(room.chat);
    expect(nextRoom.chat[0]).toBe(chatMessage);
    expect(nextRoom.game).toBe(room.game);
    expect(nextRoom.revision).toBe(4);
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

  it("identifies patches worth scheduling before entering React state", () => {
    const room = {
      code: "12345",
      revision: 2,
      chat: []
    };

    expect(roomPatchCanUpdate(room, {
      roomCode: "12345",
      type: "chat:append",
      baseRevision: 2,
      revision: 3,
      message: { id: "chat-3" }
    })).toBe(true);
    expect(roomPatchCanUpdate(room, {
      roomCode: "12345",
      type: "presence:update",
      baseRevision: 2,
      revision: 3,
      players: []
    })).toBe(true);
    expect(roomPatchCanUpdate(room, {
      roomCode: "99999",
      type: "chat:append",
      message: { id: "chat-3" }
    })).toBe(false);
    expect(roomPatchCanUpdate(room, {
      roomCode: "12345",
      type: "chat:append",
      revision: 2,
      message: { id: "chat-2" }
    })).toBe(false);
    expect(roomPatchCanUpdate(room, {
      roomCode: "12345",
      type: "unknown",
      revision: 3
    })).toBe(false);
    expect(roomPatchCanUpdate(room, {
      roomCode: "12345",
      type: "chat:append",
      baseRevision: 2,
      revision: 3
    })).toBe(false);
    expect(roomPatchCanUpdate(null, {
      roomCode: "12345",
      type: "presence:update"
    })).toBe(false);
  });
});
