// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useRoomSessionState } from "./useRoomSessionState.js";

describe("useRoomSessionState pending skill ownership", () => {
  it("preserves a same-room draft and clears it on the first render of another room", () => {
    const { result } = renderHook(() => useRoomSessionState());

    act(() => {
      result.current.setRoom({ code: "11111", role: "player", revision: 1 });
    });
    act(() => {
      result.current.setPendingSkill(true);
    });
    expect(result.current.pendingSkill).toBe(true);

    act(() => {
      result.current.setRoom((current) => ({ ...current, revision: 2 }));
    });
    expect(result.current.pendingSkill).toBe(true);

    act(() => {
      result.current.setRoom({ code: "22222", role: "player", revision: 1 });
    });
    expect(result.current.pendingSkill).toBe(false);

    act(() => {
      result.current.setRoom({ code: "11111", role: "player", revision: 3 });
    });
    expect(result.current.pendingSkill).toBe(false);
  });
});
