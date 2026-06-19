import { describe, expect, it, vi } from "vitest";
import { completePendingMatchRoom, syncPendingMatchRoom } from "./matchTransition.js";

describe("match transition room sync", () => {
  it("keeps the latest pending room in a ref for completion before React rerenders", () => {
    const openingRoom = { code: "12345", role: "player", game: { phase: "opening" } };
    const playingRoom = { code: "12345", role: "player", game: { phase: "playing" } };
    const matchSuccessRef = {
      current: {
        room: openingRoom,
        startedAt: 1000
      }
    };
    const setMatchSuccess = vi.fn();

    expect(syncPendingMatchRoom(matchSuccessRef, setMatchSuccess, playingRoom)).toBe(true);

    expect(matchSuccessRef.current.room).toEqual(playingRoom);
    expect(completePendingMatchRoom(matchSuccessRef, openingRoom)).toBe(matchSuccessRef.current.room);
  });

  it("structurally shares pending match room snapshots", () => {
    const pointA = { id: "A1", stone: null };
    const pointB = { id: "A2", stone: null };
    const currentRoom = {
      code: "12345",
      role: "player",
      game: { phase: "playing", points: [pointA, pointB] },
      players: [{ color: "black", time: { main: 30 } }]
    };
    const incomingRoom = {
      code: "12345",
      role: "player",
      game: { phase: "playing", points: [{ id: "A1", stone: "black" }, { id: "A2", stone: null }] },
      players: [{ color: "black", time: { main: 30 } }]
    };
    const matchSuccessRef = {
      current: {
        room: currentRoom,
        startedAt: 1000
      }
    };
    const setMatchSuccess = vi.fn();

    expect(syncPendingMatchRoom(matchSuccessRef, setMatchSuccess, incomingRoom)).toBe(true);

    const nextRoom = matchSuccessRef.current.room;
    expect(nextRoom).not.toBe(currentRoom);
    expect(nextRoom.game.points[0]).toEqual({ id: "A1", stone: "black" });
    expect(nextRoom.game.points[1]).toBe(pointB);
    expect(nextRoom.players).toBe(currentRoom.players);

    const stateUpdater = setMatchSuccess.mock.calls[0][0];
    const nextState = stateUpdater({ room: currentRoom, startedAt: 1000 });
    expect(nextState.room.game.points[1]).toBe(pointB);
    expect(nextState.room.players).toBe(currentRoom.players);
  });

  it("shares the pending room with the current room when completing the transition", () => {
    const player = { color: "black", time: { main: 30 } };
    const currentRoom = {
      code: "12345",
      role: "player",
      game: { phase: "playing" },
      players: [player]
    };
    const matchSuccessRef = {
      current: {
        room: {
          code: "12345",
          role: "player",
          game: { phase: "playing" },
          players: [{ color: "black", time: { main: 30 } }]
        },
        startedAt: 1000
      }
    };

    expect(completePendingMatchRoom(matchSuccessRef, null, currentRoom)).toBe(currentRoom);
  });

  it("does not consume room updates after the match transition has completed", () => {
    const setMatchSuccess = vi.fn();

    expect(syncPendingMatchRoom({ current: null }, setMatchSuccess, { code: "12345" })).toBe(false);
    expect(setMatchSuccess).not.toHaveBeenCalled();
  });
});
