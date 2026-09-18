// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import HomeStage from "./HomeStage.jsx";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("centers the desktop handbook between its neighbors without accumulating offsets, and resets on mobile", () => {
  let resize;
  let matchLeft = 1000;
  const disconnect = vi.fn();
  vi.stubGlobal("innerWidth", 1920);
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback) { resize = callback; }
    observe() {}
    disconnect = disconnect;
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function () {
    if (this.matches(".home-student-id-zone")) return { right: 400 };
    if (this.matches(".home-match-feature")) return { left: matchLeft };
    return { left: 700 + (Number.parseFloat(this.style.getPropertyValue("--home-manual-center-offset")) || 0), width: 200 };
  });
  vi.spyOn(window, "getComputedStyle").mockImplementation((element) => ({
    translate: element.style.getPropertyValue("--home-manual-center-offset") || "none"
  }));
  const { container, unmount } = render(<section><div className="home-student-id-zone" /><HomeStage /></section>);
  const manual = container.querySelector(".house-manual-entry");
  const offset = () => manual.style.getPropertyValue("--home-manual-center-offset");
  expect(offset()).toBe("-100px");
  resize();
  expect(offset()).toBe("-100px");
  matchLeft = 1200;
  resize();
  expect(offset()).toBe("0px");
  vi.stubGlobal("innerWidth", 390);
  resize();
  expect(offset()).toBe("");
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
});
