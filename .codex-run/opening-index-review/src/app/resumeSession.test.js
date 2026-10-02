import { describe, expect, test, vi } from "vitest";
import {
  DISMISSED_RESULT_ROOM_KEY,
  LAST_ROOM_CODE_KEY,
  buildRoomResumeRequest,
  clearLastRoomCode,
  dismissedResultRoomAfterResume,
  handleRoomResumePayload,
  handleMissingRoomResumePayload,
  readDismissedResultRoom,
  rememberDismissedResultRoom,
  rememberPlayerRoom,
  shouldClearRoomOnReplayExit,
  shouldShowResultModal
} from "./resumeSession.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

describe("resume session helpers", () => {
  test("stores only player room codes for reconnect resume", () => {
    const storage = memoryStorage();

    expect(rememberPlayerRoom({ code: "12345", role: "spectator" }, storage)).toBe(false);
    expect(buildRoomResumeRequest(storage)).toEqual({ roomCode: "" });

    expect(rememberPlayerRoom({ code: "54321", role: "player" }, storage)).toBe(true);
    expect(storage.getItem(LAST_ROOM_CODE_KEY)).toBe("54321");
    expect(buildRoomResumeRequest(storage)).toEqual({ roomCode: "54321" });
    expect(storage.getItem(DISMISSED_RESULT_ROOM_KEY)).toBeNull();

    expect(rememberPlayerRoom({ code: "54321", role: "player", game: { phase: "finished" } }, storage)).toBe(false);
    expect(buildRoomResumeRequest(storage)).toEqual({ roomCode: "" });

    expect(rememberPlayerRoom({ code: "54321", role: "player", game: { phase: "playing" } }, storage)).toBe(true);
    clearLastRoomCode(storage);
    expect(buildRoomResumeRequest(storage)).toEqual({ roomCode: "" });
  });

  test("persists dismissed finished rooms while clearing reconnect room memory", () => {
    const storage = memoryStorage();
    storage.setItem(LAST_ROOM_CODE_KEY, "67890");

    expect(rememberDismissedResultRoom("67890", storage)).toBe(true);

    expect(storage.getItem(LAST_ROOM_CODE_KEY)).toBeNull();
    expect(readDismissedResultRoom(storage)).toBe("67890");
  });

  test("handles finished room resume as a result modal restore", () => {
    const payload = { type: "result", room: { code: "67890", game: { phase: "finished" } } };
    const handlers = {
      closeAllOverlays: vi.fn(),
      setMatchStart: vi.fn(),
      setMatchSuccess: vi.fn(),
      setReplayStep: vi.fn(),
      setPendingSkill: vi.fn(),
      setDismissedResultRoom: vi.fn(),
      setRoom: vi.fn(),
      setView: vi.fn()
    };

    expect(handleRoomResumePayload(payload, handlers)).toBe(true);
    expect(handlers.closeAllOverlays).toHaveBeenCalledOnce();
    expect(handlers.setMatchStart).toHaveBeenCalledWith(null);
    expect(handlers.setMatchSuccess).toHaveBeenCalledWith(null);
    expect(handlers.setReplayStep).toHaveBeenCalledWith(null);
    expect(handlers.setPendingSkill).toHaveBeenCalledWith(false);
    expect(handlers.setDismissedResultRoom).toHaveBeenCalledWith(expect.any(Function));
    expect(handlers.setDismissedResultRoom.mock.calls[0][0]("")).toBe("");
    expect(handlers.setRoom).toHaveBeenCalledWith(payload.room);
    expect(handlers.setView).toHaveBeenCalledWith("home");
  });

  test("keeps dismissed finished result rooms dismissed across resume", () => {
    expect(dismissedResultRoomAfterResume(
      { type: "result", room: { code: "67890", game: { phase: "finished" } } },
      "67890"
    )).toBe("67890");

    expect(dismissedResultRoomAfterResume(
      { type: "result", room: { code: "67890", game: { phase: "finished" } } },
      "12345"
    )).toBe("");

    expect(dismissedResultRoomAfterResume(
      { type: "room", room: { code: "67890", game: { phase: "playing" } } },
      "67890"
    )).toBe("");
  });

  test("handles unfinished room resume as direct room recovery", () => {
    const payload = { type: "room", room: { code: "54321", game: { phase: "playing" } } };
    const handlers = {
      closeAllOverlays: vi.fn(),
      setMatchStart: vi.fn(),
      setMatchSuccess: vi.fn(),
      setReplayStep: vi.fn(),
      setPendingSkill: vi.fn(),
      setDismissedResultRoom: vi.fn(),
      setRoom: vi.fn(),
      setView: vi.fn()
    };

    expect(handleRoomResumePayload(payload, handlers)).toBe(true);
    expect(handlers.closeAllOverlays).toHaveBeenCalledOnce();
    expect(handlers.setMatchStart).toHaveBeenCalledWith(null);
    expect(handlers.setMatchSuccess).toHaveBeenCalledWith(null);
    expect(handlers.setReplayStep).toHaveBeenCalledWith(null);
    expect(handlers.setPendingSkill).toHaveBeenCalledWith(false);
    expect(handlers.setDismissedResultRoom).toHaveBeenCalledWith(expect.any(Function));
    expect(handlers.setDismissedResultRoom.mock.calls[0][0]("54321")).toBe("");
    expect(handlers.setRoom).toHaveBeenCalledWith({
      ...payload.room,
      __audioResumeBaseline: true
    });
    expect(handlers.setView).toHaveBeenCalledWith("room");
  });

  test("ignores non-result resume payloads", () => {
    const handlers = { setRoom: vi.fn() };

    expect(handleRoomResumePayload({ type: "none" }, handlers)).toBe(false);
    expect(handlers.setRoom).not.toHaveBeenCalled();
  });

  test("clears a stale live room when reconnect cannot resume it", () => {
    const storage = memoryStorage();
    storage.setItem(LAST_ROOM_CODE_KEY, "54321");
    const handlers = {
      clearLastRoomCode: vi.fn(() => clearLastRoomCode(storage)),
      setMatchStart: vi.fn(),
      setMatchSuccess: vi.fn(),
      setReplayStep: vi.fn(),
      setPendingSkill: vi.fn(),
      setRoom: vi.fn(),
      setView: vi.fn(),
      showToast: vi.fn()
    };

    expect(handleMissingRoomResumePayload(
      { type: "none" },
      { code: "54321", role: "player", game: { phase: "playing" } },
      handlers
    )).toBe(true);

    expect(handlers.clearLastRoomCode).toHaveBeenCalledOnce();
    expect(storage.getItem(LAST_ROOM_CODE_KEY)).toBeNull();
    expect(handlers.setMatchStart).toHaveBeenCalledWith(null);
    expect(handlers.setMatchSuccess).toHaveBeenCalledWith(null);
    expect(handlers.setReplayStep).toHaveBeenCalledWith(null);
    expect(handlers.setPendingSkill).toHaveBeenCalledWith(false);
    expect(handlers.setRoom).toHaveBeenCalledWith(null);
    expect(handlers.setView).toHaveBeenCalledWith("home");
    expect(handlers.showToast).toHaveBeenCalledWith("房间已不存在，可能是服务器重启或房间已关闭", "danger");
  });

  test("does not show result modal for invalid finished rooms", () => {
    expect(shouldShowResultModal({
      code: "12345",
      game: {
        phase: "finished",
        winner: { invalid: true }
      }
    }, "")).toBe(false);
  });

  test("shows result modal only for valid undiscarded finished rooms", () => {
    expect(shouldShowResultModal({ code: "12345", game: { phase: "playing" } }, "")).toBe(false);
    expect(shouldShowResultModal({ code: "12345", game: { phase: "finished", winner: {} } }, "12345")).toBe(false);
    expect(shouldShowResultModal({ code: "12345", game: { phase: "finished", winner: {} } }, "")).toBe(true);
  });

  test("does not show result modal while viewing a replay", () => {
    expect(shouldShowResultModal({
      code: "12345",
      game: { phase: "finished", winner: {} }
    }, "", 12)).toBe(false);
  });

  test("shows gomoku five-in-row result modals immediately outside replay", () => {
    const room = {
      code: "12345",
      game: {
        mode: "gomoku",
        phase: "finished",
        moveNumber: 9,
        winner: {
          winnerColor: "black",
          reason: "gomoku-five",
          winningLine: ["2,6", "3,6", "4,6", "5,6", "6,6"]
        }
      }
    };

    expect(shouldShowResultModal(room, "")).toBe(true);
    expect(shouldShowResultModal(room, "", 9)).toBe(false);
  });

  test("clears the replay room snapshot when exiting a replay", () => {
    expect(shouldClearRoomOnReplayExit(null)).toBe(false);
    expect(shouldClearRoomOnReplayExit(0)).toBe(true);
    expect(shouldClearRoomOnReplayExit(12)).toBe(true);
  });
});
