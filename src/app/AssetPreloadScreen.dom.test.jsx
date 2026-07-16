// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AssetPreloadScreen from "./AssetPreloadScreen.jsx";

describe("AssetPreloadScreen progress motion", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("hops while idle or barely moving and pauses the hop during clear progress", () => {
    vi.useFakeTimers();
    const props = {
      character: { id: "sigrika", name: "西格莉卡", portrait: "/sigrika.webp" },
      showTips: false
    };
    const { rerender } = render(<AssetPreloadScreen {...props} progress={0.2} />);
    const progressbar = screen.getByRole("progressbar");

    expect(progressbar.classList.contains("is-idle")).toBe(true);
    rerender(<AssetPreloadScreen {...props} progress={0.5} />);
    expect(progressbar.classList.contains("is-idle")).toBe(false);

    act(() => vi.advanceTimersByTime(600));
    expect(progressbar.classList.contains("is-idle")).toBe(true);

    rerender(<AssetPreloadScreen {...props} progress={0.51} />);
    expect(progressbar.classList.contains("is-idle")).toBe(true);
  });
});
