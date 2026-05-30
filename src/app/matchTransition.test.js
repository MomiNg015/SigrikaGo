import { describe, expect, it, vi } from "vitest";
import { completePendingMatchRoom, syncPendingMatchRoom } from "./matchTransition.js";

describe("match transition room sync", () => {
  it("keeps the latest pending room in a ref for completion before React rerenders", () => {
    const openingRoom = { code: "12345", game: { phase: "opening" } };
    const playingRoom = { code: "12345", game: { phase: "playing" } };
    const matchSuccessRef = {
      current: {
        room: openingRoom,
        startedAt: 1000
      }
    };
    const setMatchSuccess = vi.fn();

    expect(syncPendingMatchRoom(matchSuccessRef, setMatchSuccess, playingRoom)).toBe(true);

    expect(matchSuccessRef.current.room).toBe(playingRoom);
    expect(completePendingMatchRoom(matchSuccessRef, openingRoom)).toBe(playingRoom);
  });

  it("does not consume room updates after the match transition has completed", () => {
    const setMatchSuccess = vi.fn();

    expect(syncPendingMatchRoom({ current: null }, setMatchSuccess, { code: "12345" })).toBe(false);
    expect(setMatchSuccess).not.toHaveBeenCalled();
  });
});
