import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TimeBar from "./TimeBar.jsx";

describe("TimeBar", () => {
  it("marks main time, warning byo-yomi, and final byo-yomi states", () => {
    expect(renderTimeBar({ main: 231, byoYomi: 30, periodRemaining: 30, periods: 3 }))
      .toContain("main-time");
    expect(renderTimeBar({ main: 231, byoYomi: 30, periodRemaining: 30, periods: 3 }))
      .toContain("timer-digits text-clock-value");
    expect(renderTimeBar({ main: 0, byoYomi: 30, periodRemaining: 24, periods: 3 }))
      .toContain("warning-byo-yomi");
    expect(renderTimeBar({ main: 0, byoYomi: 30, periodRemaining: 24, periods: 2 }))
      .toContain("warning-byo-yomi");
    expect(renderTimeBar({ main: 0, byoYomi: 30, periodRemaining: 24, periods: 1 }))
      .toContain("final-byo-yomi");
  });
});

function renderTimeBar(time) {
  return renderToStaticMarkup(createElement(TimeBar, { time }));
}
