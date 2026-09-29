// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useHomeOnboarding } from "./useHomeOnboarding.js";
import { api } from "../../api/client.js";
vi.mock("../../api/client.js", () => ({ api: vi.fn() }));
beforeEach(() => vi.stubEnv("DEV", false));
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllEnvs(); });
function props() {
  return { token: "t", userId: "u", available: true, overlaysOpen: false,
    overlaySetters: {}, refreshMailboxSummary: vi.fn(async () => {}), showToast: vi.fn() };
}
function eligible() {
  api.mockImplementation(async (path) => path.endsWith("/start") ? { status: "active" } : { status: "pending", eligible: true });
}
describe("home tour lifecycle", () => {
  it("waits for blocking surfaces, starts when free, and restarts after interruption", async () => {
    eligible();
    const initial = props();
    const { result, rerender } = renderHook(useHomeOnboarding, { initialProps: { ...initial, available: false } });
    expect(api).not.toHaveBeenCalled();
    rerender(initial);
    await waitFor(() => expect(result.current.active).toBe(true));
    rerender({ ...initial, available: false });
    expect(result.current.active).toBe(false);
    rerender(initial);
    await waitFor(() => expect(result.current.active).toBe(true));
  });
  it("retries failed settlement without consuming the tour or showing success", async () => {
    eligible();
    const initial = props();
    const { result } = renderHook(useHomeOnboarding, { initialProps: initial });
    await waitFor(() => expect(result.current.active).toBe(true));
    api.mockRejectedValueOnce(new Error("网络中断"));
    await act(() => result.current.finish("skipped"));
    expect(result.current.error).toBe("网络中断");
    expect(result.current.active).toBe(true);
    expect(initial.showToast).not.toHaveBeenCalled();
    api.mockResolvedValueOnce({ status: "skipped", awarded: true });
    await act(() => result.current.finish("skipped"));
    expect(result.current.active).toBe(false);
    expect(initial.refreshMailboxSummary).toHaveBeenCalledTimes(1);
    expect(initial.showToast).toHaveBeenCalledTimes(1);
  });
  it("ignores an old account's in-flight start", async () => {
    let resolveOld;
    api.mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }));
    const initial = props();
    const { result, rerender } = renderHook(useHomeOnboarding, { initialProps: initial });
    api.mockResolvedValue({ status: "completed", eligible: false });
    rerender({ ...initial, userId: "other", token: "other" });
    await act(async () => resolveOld({ status: "pending", eligible: true }));
    expect(result.current.active).toBe(false);
    expect(api.mock.calls.some(([path]) => path.endsWith("/start"))).toBe(false);
  });
  it("persists story exit before checking home eligibility", async () => {
    api.mockResolvedValue({ status: "pending", eligible: false });
    const initial = props();
    const { result, rerender } = renderHook(useHomeOnboarding, { initialProps: { ...initial, available: false } });
    act(() => result.current.onStoryExited());
    eligible();
    rerender(initial);
    await waitFor(() => expect(result.current.active).toBe(true));
    expect(api.mock.calls.map(([path]) => path)).toEqual([
      "/api/onboarding-story/exited", "/api/home-onboarding", "/api/home-onboarding/start"
    ]);
  });
});

it.each(["completed", "skipped"])("development replays after each story exit for %s accounts without awarding again", async (status) => {
  vi.stubEnv("DEV", true);
  api.mockResolvedValue({ status, eligible: false, awarded: false });
  const initial = props();
  const { result, rerender } = renderHook(useHomeOnboarding, { initialProps: initial });
  await act(async () => {});
  expect(result.current.active).toBe(false);
  for (const outcome of ["completed", "skipped"]) {
    rerender({ ...initial, available: false });
    act(() => result.current.onStoryExited());
    expect(result.current.active).toBe(false);
    rerender(initial);
    await waitFor(() => expect(result.current.active).toBe(true));
    await act(() => result.current.finish(outcome));
    expect(result.current.active).toBe(false);
  }
  expect(api.mock.calls.filter(([path]) => path.endsWith("/start"))).toHaveLength(0);
  expect(api.mock.calls.filter(([path]) => path.endsWith("/finish"))).toHaveLength(2);
  expect(initial.showToast).not.toHaveBeenCalled();
});

it("production does not replay a settled tour after story exit", async () => {
  api.mockResolvedValue({ status: "completed", eligible: false });
  const { result } = renderHook(useHomeOnboarding, { initialProps: props() });
  await act(async () => {});
  await act(async () => result.current.onStoryExited());
  expect(result.current.active).toBe(false);
  expect(api.mock.calls.some(([path]) => path.endsWith("/start"))).toBe(false);
});

it("does not transfer a pending development replay to another account", async () => {
  vi.stubEnv("DEV", true);
  api.mockResolvedValue({ status: "completed", eligible: false });
  const initial = props();
  const { result, rerender } = renderHook(useHomeOnboarding, { initialProps: { ...initial, available: false } });
  act(() => result.current.onStoryExited());
  rerender({ ...initial, userId: "other", token: "other" });
  await act(async () => {});
  expect(result.current.active).toBe(false);
});
