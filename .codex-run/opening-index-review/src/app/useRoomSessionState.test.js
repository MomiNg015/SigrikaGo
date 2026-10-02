import { describe, expect, it } from "vitest";
import {
  initialRoomSessionState,
  pendingSkillValueForRoom,
  roomIdentityForLocalState,
  roomSessionView,
  updatePendingSkillDraft
} from "./useRoomSessionState.js";

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

  it("shows gomoku five-in-row results immediately outside replay", () => {
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
    }).resultModalOpen).toBe(true);
    expect(roomSessionView({
      ...initialRoomSessionState(),
      room: finishedRoom,
      replayStep: 9
    }).resultModalOpen).toBe(false);
  });

  it("keeps pending skill selection in its owning room only", () => {
    const roomA = { code: "11111", role: "player", revision: 1 };
    const updatedRoomA = { ...roomA, revision: 2 };
    const roomB = { code: "22222", role: "player", revision: 1 };
    const roomAIdentity = roomIdentityForLocalState(roomA);
    const selectedDraft = updatePendingSkillDraft(undefined, true, roomAIdentity);

    expect(pendingSkillValueForRoom(selectedDraft, roomAIdentity)).toBe(true);
    expect(pendingSkillValueForRoom(
      selectedDraft,
      roomIdentityForLocalState(updatedRoomA)
    )).toBe(true);
    expect(pendingSkillValueForRoom(
      selectedDraft,
      roomIdentityForLocalState(roomB)
    )).toBe(false);
    expect(pendingSkillValueForRoom(selectedDraft, "")).toBe(false);
  });

  it("supports the existing setter updater shape without reviving another room's draft", () => {
    const roomAIdentity = roomIdentityForLocalState({ code: "11111", role: "player" });
    const roomBIdentity = roomIdentityForLocalState({ code: "22222", role: "player" });
    const selectedDraft = updatePendingSkillDraft(undefined, true, roomAIdentity);

    const selectedInRoomB = updatePendingSkillDraft(
      selectedDraft,
      (current) => !current,
      roomBIdentity
    );
    expect(pendingSkillValueForRoom(selectedInRoomB, roomAIdentity)).toBe(false);
    expect(pendingSkillValueForRoom(selectedInRoomB, roomBIdentity)).toBe(true);

    const cancelled = updatePendingSkillDraft(selectedInRoomB, false, roomBIdentity);
    expect(pendingSkillValueForRoom(cancelled, roomBIdentity)).toBe(false);
  });
});
