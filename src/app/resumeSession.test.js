import { describe, expect, test, vi } from "vitest";
import {
  LAST_ROOM_CODE_KEY,
  buildRoomResumeRequest,
  clearLastRoomCode,
  handleRoomResumePayload,
  handleMissingRoomResumePayload,
  rememberPlayerRoom,
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

    clearLastRoomCode(storage);
    expect(buildRoomResumeRequest(storage)).toEqual({ roomCode: "" });
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
    expect(handlers.setDismissedResultRoom).toHaveBeenCalledWith("");
    expect(handlers.setRoom).toHaveBeenCalledWith(payload.room);
    expect(handlers.setView).toHaveBeenCalledWith("home");
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
    expect(handlers.setDismissedResultRoom).toHaveBeenCalledWith("");
    expect(handlers.setRoom).toHaveBeenCalledWith(payload.room);
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
});
