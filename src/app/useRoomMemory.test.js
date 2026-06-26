import { describe, expect, it } from "vitest";
import { roomToRememberForResume } from "./useRoomMemory.js";

describe("room resume memory", () => {
  it("prefers the active room but falls back to a pending match room", () => {
    const activeRoom = { code: "active", role: "player" };
    const pendingRoom = { code: "pending", role: "player", game: { phase: "preloading" } };

    expect(roomToRememberForResume(activeRoom, pendingRoom)).toBe(activeRoom);
    expect(roomToRememberForResume(null, pendingRoom)).toBe(pendingRoom);
    expect(roomToRememberForResume(null, null)).toBeNull();
  });

  it("does not remember finished player rooms for reconnect resume", () => {
    const finishedRoom = { code: "finished", role: "player", game: { phase: "finished" } };
    const pendingRoom = { code: "pending", role: "player", game: { phase: "preloading" } };

    expect(roomToRememberForResume(finishedRoom, null)).toBeNull();
    expect(roomToRememberForResume(finishedRoom, pendingRoom)).toBe(pendingRoom);
  });
});
