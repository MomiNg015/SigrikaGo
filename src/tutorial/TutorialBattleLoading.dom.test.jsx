// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import AssetPreloadScreen from "../app/AssetPreloadScreen.jsx";
import { TutorialBattleLoading } from "./TutorialBattleScreen.jsx";
vi.mock("../app/AssetPreloadScreen.jsx", () => ({ default: vi.fn(() => null) }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); });
it("never renders the previous segment's completed progress on a new segment", () => {
  vi.useFakeTimers();
  const props = { characters: {}, players: [], user: {} };
  const { rerender } = render(<TutorialBattleLoading {...props} loading={{ id: "entry", text: "进入" }} />);
  expect(AssetPreloadScreen.mock.calls[0][0].progress).toBe(0);
  act(() => vi.advanceTimersByTime(3100));
  expect(AssetPreloadScreen.mock.lastCall[0].progress).toBe(1);
  const previousCalls = AssetPreloadScreen.mock.calls.length;
  rerender(<TutorialBattleLoading {...props} loading={{ id: "exit", text: "返回" }} />);
  expect(AssetPreloadScreen.mock.calls.slice(previousCalls).every(([props]) => props.progress === 0)).toBe(true);
  act(() => vi.advanceTimersByTime(1500));
  expect(AssetPreloadScreen.mock.lastCall[0].progress).toBeGreaterThan(0);
  expect(AssetPreloadScreen.mock.lastCall[0].progress).toBeLessThan(1);
});
