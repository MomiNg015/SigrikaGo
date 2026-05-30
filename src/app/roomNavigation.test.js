import { describe, expect, it } from "vitest";
import { planRoomBackNavigation } from "./roomNavigation.js";

describe("room back navigation plan", () => {
  it("clears replay rooms without emitting a room leave", () => {
    expect(planRoomBackNavigation({
      room: { code: "12345", role: "player", game: { phase: "finished" } },
      replayStep: 12
    })).toEqual({
      clearRoom: true,
      leaveRoomCode: "",
      nextReplayStep: null,
      nextView: "home"
    });
  });

  it("leaves live spectator and finished review rooms before returning home", () => {
    expect(planRoomBackNavigation({
      room: { code: "54321", role: "spectator", game: { phase: "playing" } },
      replayStep: null
    })).toMatchObject({
      clearRoom: true,
      leaveRoomCode: "54321"
    });

    expect(planRoomBackNavigation({
      room: { code: "98765", role: "player", game: { phase: "finished" } },
      replayStep: null
    })).toMatchObject({
      clearRoom: true,
      leaveRoomCode: "98765"
    });
  });

  it("keeps an active player room snapshot when returning home without replay", () => {
    expect(planRoomBackNavigation({
      room: { code: "11111", role: "player", game: { phase: "playing" } },
      replayStep: null
    })).toMatchObject({
      clearRoom: false,
      leaveRoomCode: ""
    });
  });
});
