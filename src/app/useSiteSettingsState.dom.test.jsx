// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import { useSiteSettingsState } from "./useSiteSettingsState.js";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));
const initialSettings = { topAnnouncementEnabled: true, topAnnouncementText: "原公告" };
beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" }); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("live home site settings", () => {
  it("refreshes home entry, visible intervals and focus, retaining the last value on failure", async () => {
    api.mockResolvedValue({ settings: { ...initialSettings, topAnnouncementText: "新公告" } });
    const view = renderHook(({ home }) => useSiteSettingsState({ initialSettings, refreshWhileVisible: home }), { initialProps: { home: true } });
    await act(async () => {});
    expect(view.result.current.siteSettings.topAnnouncementText).toBe("新公告");
    api.mockRejectedValue(new Error("offline"));
    await act(async () => vi.advanceTimersByTimeAsync(30000));
    expect(api).toHaveBeenCalledTimes(2);
    expect(view.result.current.siteSettings.topAnnouncementText).toBe("新公告");
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    await act(async () => vi.advanceTimersByTimeAsync(30000));
    expect(api).toHaveBeenCalledTimes(2);
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    api.mockResolvedValue({ settings: { topAnnouncementEnabled: false, topAnnouncementText: "新公告" } });
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(view.result.current.siteSettings.topAnnouncementEnabled).toBe(false);
    view.rerender({ home: false });
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); window.dispatchEvent(new Event("focus")); });
    expect(api).toHaveBeenCalledTimes(3);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not let a pre-save read overwrite the admin save or a later refresh", async () => {
    let resolveOld;
    api.mockReturnValueOnce(new Promise((resolve) => { resolveOld = resolve; }));
    const { result } = renderHook(() => useSiteSettingsState({ initialSettings }));
    let oldRead;
    act(() => { oldRead = result.current.refreshSiteSettings(); });
    act(() => result.current.setSiteSettings({ ...initialSettings, topAnnouncementText: "刚保存" }));
    api.mockResolvedValueOnce({ settings: { ...initialSettings, topAnnouncementText: "刚保存" } });
    await act(async () => result.current.refreshSiteSettings());
    await act(async () => { resolveOld({ settings: initialSettings }); await oldRead; });
    expect(result.current.siteSettings.topAnnouncementText).toBe("刚保存");
    expect(api).toHaveBeenCalledTimes(2);
  });
});
