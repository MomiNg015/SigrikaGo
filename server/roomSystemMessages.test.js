import { describe, expect, test } from "vitest";
import { GAME_PHASES } from "../src/shared/game.js";
import {
  appendNotices,
  appendSystem,
  ensureRestoredDisconnectedNotices
} from "./roomSystemMessages.js";

function testRoom(overrides = {}) {
  return {
    game: {
      phase: GAME_PHASES.playing,
      moveNumber: 7,
      ...(overrides.game ?? {})
    },
    players: overrides.players ?? [],
    chat: overrides.chat ?? []
  };
}

describe("roomSystemMessages", () => {
  test("appends system messages with room move context", () => {
    const room = testRoom();

    appendSystem(room, "hello", { kind: "notice" });

    expect(room.chat).toHaveLength(1);
    expect(room.chat[0]).toMatchObject({
      id: expect.any(String),
      type: "system",
      kind: "notice",
      moveNumber: 7,
      text: "hello",
      createdAt: expect.any(Number)
    });
  });

  test("appends notice lists as system messages", () => {
    const room = testRoom();

    appendNotices(room, ["one", "two"]);

    expect(room.chat.map((message) => message.text)).toEqual(["one", "two"]);
    expect(room.chat.every((message) => message.type === "system")).toBe(true);
  });

  test("restores missing disconnect notices for disconnected active-room players", () => {
    const room = testRoom({
      players: [
        { socketId: "", disconnectedAt: 1000, user: { username: "alice" } },
        { socketId: "socket-b", disconnectedAt: 1000, user: { username: "bob" } }
      ]
    });

    ensureRestoredDisconnectedNotices(room);

    expect(room.chat).toHaveLength(1);
    expect(room.chat[0]).toMatchObject({
      type: "system",
      kind: "disconnect",
      text: "alice断线中。"
    });
  });

  test("does not duplicate restored disconnect notices or modify finished rooms", () => {
    const existing = {
      type: "system",
      kind: "disconnect",
      text: "alice断线中。"
    };
    const room = testRoom({
      players: [{ socketId: "", disconnectedAt: 1000, user: { username: "alice" } }],
      chat: [existing]
    });
    const finishedRoom = testRoom({
      game: { phase: GAME_PHASES.finished },
      players: [{ socketId: "", disconnectedAt: 1000, user: { username: "carol" } }]
    });

    ensureRestoredDisconnectedNotices(room);
    ensureRestoredDisconnectedNotices(finishedRoom);

    expect(room.chat).toEqual([existing]);
    expect(finishedRoom.chat).toEqual([]);
  });
});
