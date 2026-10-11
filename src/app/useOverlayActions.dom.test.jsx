// @vitest-environment jsdom
import { act, renderHook, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useOverlayActions } from "./useOverlayActions.js";
import { DISMISSED_RESULT_ROOM_KEY, LAST_ROOM_CODE_KEY } from "./resumeSession.js";
afterEach(() => { cleanup(); localStorage.clear(); });
it.each(["player", "spectator"])("leaves a finished %s room and returns home", (role) => {
  const props = { room: { code: "ABC", role, game: { phase: "finished" } }, view: "room", socket: { emit: vi.fn() }, setRoom: vi.fn(), setView: vi.fn(), setReplayStep: vi.fn(), setPendingSkill: vi.fn(), setDismissedResultRoom: vi.fn() };
  localStorage.setItem(LAST_ROOM_CODE_KEY, "ABC");
  const { result } = renderHook(() => useOverlayActions(props));
  act(() => result.current.leaveResultRoom());
  expect(props.socket.emit).toHaveBeenCalledWith("room:leave", { roomCode: "ABC" });
  expect(props.setRoom).toHaveBeenCalledWith(null);
  expect(props.setView).toHaveBeenCalledWith("home");
  expect(props.setReplayStep).toHaveBeenCalledWith(null);
  expect(props.setPendingSkill).toHaveBeenCalledWith(null);
  expect(localStorage.getItem(LAST_ROOM_CODE_KEY)).toBeNull();
  expect(localStorage.getItem(DISMISSED_RESULT_ROOM_KEY)).toBe("ABC");
});
it("returning to the board dismisses only the result", () => {
  const props = { room: { code: "ABC" }, view: "room", setRoom: vi.fn(), setDismissedResultRoom: vi.fn() };
  const { result } = renderHook(() => useOverlayActions(props));
  act(() => result.current.closeResultModal());
  expect(props.setRoom).not.toHaveBeenCalled();
  expect(props.setDismissedResultRoom).toHaveBeenCalledWith("ABC");
});
