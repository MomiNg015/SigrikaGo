// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { api } from "../../api/client.js";
import { useRecruitmentCatalog } from "./useRecruitmentCatalog.js";

vi.mock("../../api/client.js", () => ({ api: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

it("updates the acceleration countdown without a success Toast but still reports request errors", async () => {
  const user = { id: "player" };
  const task = { id: "task", status: "pending", readyAt: new Date(Date.now() + 120_000).toISOString() };
  const nextTask = { ...task, fastForwarded: true };
  const onNotice = vi.fn();
  const onStatusChange = vi.fn();
  api.mockResolvedValueOnce({ task }).mockResolvedValueOnce({ task: nextTask, user }).mockRejectedValueOnce(new Error("加速请求失败"));
  const { result } = renderHook(() => useRecruitmentCatalog({ token: "test-token", user, onNotice, onStatusChange }));
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(() => result.current.fastForward());
  expect(result.current.fastForwardPresentation?.taskId).toBe(task.id);
  expect(onStatusChange).toHaveBeenLastCalledWith(nextTask);
  expect(onNotice).not.toHaveBeenCalled();
  await act(() => result.current.fastForward());
  expect(onNotice).toHaveBeenCalledExactlyOnceWith("加速请求失败", "danger");
});
