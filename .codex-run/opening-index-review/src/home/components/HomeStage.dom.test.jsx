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

it("pulls the ID into the bounded desktop composition and releases its anchor on portrait mobile", () => {
  let resize;
  let stageLeft = 550;
  vi.stubGlobal("innerWidth", 2542);
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback) { resize = callback; }
    observe() {}
    disconnect() {}
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function () {
    if (this.matches(".test-board")) return { left: 58, width: 2426 };
    if (this.matches(".home-stage")) return { left: stageLeft };
    if (this.matches(".home-student-id-zone")) return { right: 840 };
    if (this.matches(".home-match-feature")) return { left: 1200 };
    return { left: 860, width: 320 };
  });
  vi.spyOn(window, "getComputedStyle").mockImplementation(() => ({ paddingLeft: "26px", translate: "none" }));
  const { container, unmount } = render(<section className="test-board"><div className="home-student-id-zone" /><HomeStage /></section>);
  const board = container.querySelector(".test-board");
  expect(board.style.getPropertyValue("--home-student-id-left")).toBe("518px");
  resize();
  expect(board.style.getPropertyValue("--home-student-id-left")).toBe("518px");
  stageLeft = 150;
  resize();
  expect(Number.parseFloat(board.style.getPropertyValue("--home-student-id-left"))).toBeCloseTo(194.08);
  vi.stubGlobal("innerWidth", 390);
  resize();
  expect(board.style.getPropertyValue("--home-student-id-left")).toBe("");
  vi.stubGlobal("innerWidth", 2542);
  resize();
  unmount();
  expect(board.style.getPropertyValue("--home-student-id-left")).toBe("");
});
