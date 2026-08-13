// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DesktopViewportGate, {
  DESKTOP_MINIMUM_VIEWPORT,
  MOBILE_INPUT_MEDIA_QUERY,
  PHONE_VIEWPORT_RANGE,
  isCommonPhoneViewport,
  shouldUsePhoneLayout,
  shouldBlockDesktopViewport
} from "./DesktopViewportGate.jsx";

function setViewport({
  height,
  maxTouchPoints = 0,
  mobileInput = false,
  width,
  screenHeight = height,
  screenWidth = width,
  userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
  Object.defineProperty(window.screen, "width", { configurable: true, value: screenWidth });
  Object.defineProperty(window.screen, "height", { configurable: true, value: screenHeight });
  Object.defineProperty(window.navigator, "maxTouchPoints", {
    configurable: true,
    value: maxTouchPoints
  });
  Object.defineProperty(window.navigator, "userAgent", {
    configurable: true,
    value: userAgent
  });
  vi.stubGlobal("matchMedia", vi.fn((query) => ({
    matches: query === MOBILE_INPUT_MEDIA_QUERY && mobileInput,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  })));
}

describe("DesktopViewportGate", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("uses inclusive 1440 by 768 desktop boundaries", () => {
    expect(DESKTOP_MINIMUM_VIEWPORT).toEqual({ width: 1440, height: 768 });
    expect(shouldBlockDesktopViewport({ width: 1440, height: 768 })).toBe(false);
    expect(shouldBlockDesktopViewport({ width: 1439, height: 768 })).toBe(true);
    expect(shouldBlockDesktopViewport({ width: 1440, height: 767 })).toBe(true);
  });

  it("exempts common phone-sized viewports in portrait and landscape", () => {
    expect(PHONE_VIEWPORT_RANGE).toEqual({
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
      expect(isCommonPhoneViewport({ height, width })).toBe(true);
    }

    expect(isCommonPhoneViewport({ width: 319, height: 568 })).toBe(false);
    expect(isCommonPhoneViewport({ width: 481, height: 960 })).toBe(false);
    expect(isCommonPhoneViewport({ width: 480, height: 567 })).toBe(false);
    expect(isCommonPhoneViewport({ width: 480, height: 1025 })).toBe(false);
  });

  it("lets a narrowed desktop use the phone layout while excluding tablets", () => {
    expect(shouldUsePhoneLayout({
      width: 390,
      height: 844,
      screenWidth: 1920,
      screenHeight: 1080,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    })).toBe(true);
    expect(shouldUsePhoneLayout({
      maxTouchPoints: 5,
      mobileInput: true,
      width: 390,
      height: 844,
      screenHeight: 1024,
      screenWidth: 768,
      userAgent: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)"
    })).toBe(false);
    expect(shouldUsePhoneLayout({
      maxTouchPoints: 5,
      mobileInput: true,
      width: 390,
      height: 844,
      screenHeight: 1366,
      screenWidth: 1024,
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1"
    })).toBe(false);
    expect(shouldUsePhoneLayout({
      width: 390,
      height: 430,
      screenHeight: 844,
      screenWidth: 390,
      userAgentDataMobile: true,
      userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 9) AppleWebKit/537.36 Mobile"
    })).toBe(true);

    expect(shouldBlockDesktopViewport({
      width: 390,
      height: 844,
      phoneLayout: false
    })).toBe(true);
    expect(shouldBlockDesktopViewport({
      width: 390,
      height: 844,
      phoneLayout: true
    })).toBe(false);
  });

  it("shows the exact notice on an undersized desktop and restores content after resize", () => {
    setViewport({ width: 1366, height: 768 });
    render(
      <DesktopViewportGate>
        <div>游戏内容</div>
      </DesktopViewportGate>
    );

    expect(screen.getByRole("alert").textContent).toContain("请用更大尺寸窗口进行游玩");
    expect(screen.queryByText("游戏内容")).toBeNull();

    setViewport({ width: 1440, height: 768 });
    fireEvent(window, new Event("resize"));

    expect(screen.getByText("游戏内容")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("lets a desktop browser enter the phone layout after narrowing", () => {
    setViewport({
      width: 390,
      height: 844,
      screenWidth: 1920,
      screenHeight: 1080,
      mobileInput: false,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    });
    render(
      <DesktopViewportGate>
        <div>移动端内容</div>
      </DesktopViewportGate>
    );

    expect(screen.getByText("移动端内容")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("blocks a tablet even when it reports touch and mobile input", () => {
    setViewport({
      width: 768,
      height: 1024,
      maxTouchPoints: 5,
      mobileInput: true,
      userAgent: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)"
    });
    render(
      <DesktopViewportGate>
        <div>平板内容</div>
      </DesktopViewportGate>
    );

    expect(screen.getByRole("alert").textContent).toContain("请用更大尺寸窗口进行游玩");
    expect(screen.queryByText("平板内容")).toBeNull();
  });
});
