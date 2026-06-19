import { describe, expect, it } from "vitest";
import { initialRoomSessionState, roomSessionView } from "./useRoomSessionState.js";

describe("room session state", () => {
  it("starts without room, replay, pending skill, or dismissed result", () => {
    expect(initialRoomSessionState()).toEqual({
      room: null,
      pendingSkill: false,
      replayStep: null,
      dismissedResultRoom: ""
    });
  });

  it("derives result modal visibility from room session fields", () => {
    const finishedRoom = { code: "12345", game: { phase: "finished", winner: { color: "black" } } };

    expect(roomSessionView({
      ...initialRoomSessionState(),
      room: finishedRoom
    }).resultModalOpen).toBe(true);
    expect(roomSessionView({
      ...initialRoomSessionState(),
      room: finishedRoom,
      replayStep: 0
    }).resultModalOpen).toBe(false);
    expect(roomSessionView({
      ...initialRoomSessionState(),
      room: finishedRoom,
      dismissedResultRoom: "12345"
    }).resultModalOpen).toBe(false);
  });

  it("keeps gomoku five-in-row result hidden until reveal animation is ready", () => {
    const finishedRoom = {
      code: "12345",
      game: {
        mode: "gomoku",
        phase: "finished",
        winner: {
          winnerColor: "black",
          reason: "gomoku-five",
          winningLine: ["2,6", "3,6", "4,6", "5,6", "6,6"]
        }
      }
    };

    expect(roomSessionView({
      ...initialRoomSessionState(),
      room: finishedRoom,
      resultRevealReady: false
    }).resultModalOpen).toBe(false);
    expect(roomSessionView({
      ...initialRoomSessionState(),
      room: finishedRoom,
      resultRevealReady: true
    }).resultModalOpen).toBe(true);
  });
});
