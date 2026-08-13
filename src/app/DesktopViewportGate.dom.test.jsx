// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DesktopViewportGate, {
  DESKTOP_MINIMUM_VIEWPORT,
  MOBILE_INPUT_MEDIA_QUERY,
  PHONE_SCREEN_MAX_SHORT_SIDE,
  isCommonPhoneDevice,
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

  it("exempts common phone screen sizes in portrait and landscape", () => {
    expect(PHONE_SCREEN_MAX_SHORT_SIDE).toBe(480);

    for (const [screenWidth, screenHeight] of [
      [320, 568],
      [360, 800],
      [390, 844],
      [412, 915],
      [430, 932],
      [480, 960],
      [932, 430]
    ]) {
      expect(isCommonPhoneDevice({
        maxTouchPoints: 5,
        screenHeight,
        screenWidth
      })).toBe(true);
    }

    expect(isCommonPhoneDevice({
      screenHeight: 844,
      screenWidth: 390,
      userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 9) AppleWebKit/537.36 Mobile"
    })).toBe(true);
  });

  it("does not grant the phone exemption to tablets or narrowed desktop windows", () => {
    expect(isCommonPhoneDevice({
      mobileInput: true,
      screenHeight: 960,
      screenWidth: 480,
      userAgent: "Mozilla/5.0 (Linux; Android 14)"
    })).toBe(false);
    expect(isCommonPhoneDevice({
      maxTouchPoints: 5,
      screenHeight: 960,
      screenWidth: 481,
      userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel Fold) AppleWebKit/537.36 Mobile"
    })).toBe(false);
    expect(isCommonPhoneDevice({
      maxTouchPoints: 5,
      mobileInput: true,
      screenHeight: 1024,
      screenWidth: 768,
      userAgent: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)"
    })).toBe(false);
    expect(isCommonPhoneDevice({
      screenHeight: 1080,
      screenWidth: 1920
    })).toBe(false);
    expect(isCommonPhoneDevice({
      screenHeight: 844,
      screenWidth: 390,
      userAgentDataMobile: true
    })).toBe(true);

    expect(shouldBlockDesktopViewport({
      width: 390,
      height: 844,
      phoneDevice: false
    })).toBe(true);
    expect(shouldBlockDesktopViewport({
      width: 390,
      height: 844,
      phoneDevice: true
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

  it("keeps a phone visible when media-query input detection is unavailable", () => {
    setViewport({
      width: 390,
      height: 844,
      maxTouchPoints: 5,
      mobileInput: false,
      userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 9) AppleWebKit/537.36 Mobile"
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
