// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import DesktopViewportGate, {
  COMPACT_VIEWPORT_RANGE,
  DESKTOP_MINIMUM_VIEWPORT,
  NARROW_PORTRAIT_VIEWPORT_RANGE,
  isCompactViewport,
  shouldBlockDesktopViewport
} from "./DesktopViewportGate.jsx";

function setViewport({
  height,
  width
}) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
}

describe("DesktopViewportGate", () => {
  afterEach(() => {
    cleanup();
  });

  it("uses inclusive 1440 by 768 desktop boundaries", () => {
    expect(DESKTOP_MINIMUM_VIEWPORT).toEqual({ width: 1440, height: 768 });
    expect(shouldBlockDesktopViewport({ width: 1440, height: 768 })).toBe(false);
    expect(shouldBlockDesktopViewport({ width: 1439, height: 768 })).toBe(true);
    expect(shouldBlockDesktopViewport({ width: 1440, height: 767 })).toBe(true);
  });

  it("accepts the rotatable compact viewport range", () => {
    expect(COMPACT_VIEWPORT_RANGE).toEqual({
      minShortSide: 320,
      maxShortSide: 480,
      minLongSide: 568,
      maxLongSide: 1024
    });

    for (const [width, height] of [
      [320, 568],
      [360, 800],
      [390, 844],
      [412, 915],
      [430, 932],
      [480, 960],
      [932, 430]
    ]) {
      expect(isCompactViewport({ height, width })).toBe(true);
    }

    expect(isCompactViewport({ width: 319, height: 568 })).toBe(false);
    expect(isCompactViewport({ width: 481, height: 567 })).toBe(false);
    expect(isCompactViewport({ width: 1025, height: 480 })).toBe(false);
  });

  it("accepts the narrow portrait range without inspecting the device", () => {
    expect(NARROW_PORTRAIT_VIEWPORT_RANGE).toEqual({
      minWidth: 320,
      maxWidth: 520,
      minHeight: 568
    });
    expect(isCompactViewport({
      width: 496,
      height: 1047,
      userAgent: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)"
    })).toBe(true);
    expect(isCompactViewport({ width: 520, height: 568 })).toBe(true);
    expect(isCompactViewport({ width: 319, height: 1047 })).toBe(false);
    expect(isCompactViewport({ width: 521, height: 1047 })).toBe(false);
    expect(isCompactViewport({ width: 520, height: 567 })).toBe(false);

    expect(shouldBlockDesktopViewport({
      compactLayout: false,
      width: 390,
      height: 844
    })).toBe(true);
    expect(shouldBlockDesktopViewport({
      compactLayout: true,
      width: 390,
      height: 844
    })).toBe(false);
  });

  it("shows the exact notice on an undersized desktop and restores content after resize", () => {
    setViewport({ width: 1366, height: 768 });
    render(
      <DesktopViewportGate>
        <div>游戏内容</div>
      </DesktopViewportGate>
    );

    expect(screen.getByRole("alert").textContent).toContain("请用合适尺寸窗口进行游玩");
    expect(screen.queryByText("桌面端最低需要 1440 × 768 的可用窗口空间。")).toBeNull();
    expect(screen.getByRole("alert").querySelector("p")).toBeNull();
    expect(screen.queryByText("游戏内容")).toBeNull();

    setViewport({ width: 1440, height: 768 });
    fireEvent(window, new Event("resize"));

    expect(screen.getByText("游戏内容")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("lets a desktop browser enter the phone layout after narrowing", () => {
    setViewport({
      width: 496,
      height: 1047
    });
    render(
      <DesktopViewportGate>
        <div>移动端内容</div>
      </DesktopViewportGate>
    );

    expect(screen.getByText("移动端内容")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("blocks an intermediate viewport based only on its dimensions", () => {
    setViewport({
      width: 768,
      height: 1024
    });
    render(
      <DesktopViewportGate>
        <div>平板内容</div>
      </DesktopViewportGate>
    );

    expect(screen.getByRole("alert").textContent).toContain("请用合适尺寸窗口进行游玩");
    expect(screen.queryByText("平板内容")).toBeNull();
  });
});
