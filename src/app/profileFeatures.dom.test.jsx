// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import { useHomeUserRefresh } from "./useHomeUserRefresh.js";
import { useToastQueue } from "./useToastQueue.js";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));
afterEach(cleanup);

describe("internal-test profile availability", () => {
  it("refreshes the account without notifying achievement listeners", async () => {
    const user = { id: "user-1", coins: 200 };
    api.mockResolvedValue({ user, achievementUnlocks: [{ name: "首胜" }] });
    const updateUser = vi.fn();
    const onAchievementUnlocks = vi.fn();
    renderHook(() => useHomeUserRefresh({ token: "token", user, view: "home", updateUser, onAchievementUnlocks }));
    await waitFor(() => expect(updateUser).toHaveBeenCalledWith(user));
    expect(onAchievementUnlocks).not.toHaveBeenCalled();
  });

  it("suppresses achievement toasts from every caller while preserving ordinary feedback", () => {
    const { result } = renderHook(useToastQueue);
    act(() => {
      result.current.showToast("达成成就：首胜", "achievement");
      result.current.showToast("购买成功", "success");
      result.current.showToast("网络不可用", "danger");
    });
    expect(result.current.toasts.map(({ text, tone }) => ({ text, tone }))).toEqual([
      { text: "网络不可用", tone: "danger" },
      { text: "购买成功", tone: "success" }
    ]);
  });
});
