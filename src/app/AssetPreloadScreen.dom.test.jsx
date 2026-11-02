// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AssetPreloadScreen from "./AssetPreloadScreen.jsx";

describe("AssetPreloadScreen progress motion", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it.each(["plain", "brush"])("announces only the active %s tip while reserving every tip's height", (tipStyle) => {
    vi.useFakeTimers();
    const { container } = render(<AssetPreloadScreen progress={0.4} tipsText={"短提示\n这是一条需要更多行的长提示，用来预留布局空间。"} tipStyle={tipStyle} />);
    const stage = container.querySelector(".preload-tips");
    const copies = [...stage.querySelectorAll('[aria-hidden="true"]')];
    expect(copies).toHaveLength(2);
    expect(copies.every(copy => !copy.hasAttribute("aria-live"))).toBe(true);
    expect(stage.querySelectorAll('[aria-live="polite"]')).toHaveLength(1);
    act(() => vi.advanceTimersByTime(10000));
    expect(container.querySelector(".preload-tips")).toBe(stage);
    expect([...stage.querySelectorAll('[aria-hidden="true"]')]).toEqual(copies);
    expect(stage.querySelectorAll('[aria-live="polite"]')).toHaveLength(1);
  });

  it("breathes while idle and enters rolling state during meaningful progress", () => {
    vi.useFakeTimers();
    const props = {
      character: { id: "sigrika", name: "西格莉卡", portrait: "/sigrika.webp" },
      showTips: false
    };
    const { rerender } = render(<AssetPreloadScreen {...props} progress={0.2} />);
    const progressbar = screen.getByRole("progressbar");

    expect(progressbar.classList.contains("is-idle")).toBe(true);
    expect(progressbar.style.getPropertyValue("--preload-mask-size")).toBe("20%");
    expect(progressbar.style.getPropertyValue("--preload-mascot-rotation")).toBe("144deg");
    rerender(<AssetPreloadScreen {...props} progress={0.5} />);
    expect(progressbar.classList.contains("is-idle")).toBe(false);
    expect(progressbar.style.getPropertyValue("--preload-mask-size")).toBe("50%");
    expect(progressbar.style.getPropertyValue("--preload-mascot-rotation")).toBe("360deg");
    expect(progressbar.querySelector(".preload-mascot-roll")).not.toBeNull();

    act(() => vi.advanceTimersByTime(600));
    expect(progressbar.classList.contains("is-idle")).toBe(true);

    rerender(<AssetPreloadScreen {...props} progress={0.51} />);
    expect(progressbar.classList.contains("is-idle")).toBe(true);
  });
});
