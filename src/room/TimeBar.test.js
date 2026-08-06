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

  it("renders the special duel as an unlimited corrupted digital clock", () => {
    const html = renderTimeBar({ unlimited: true });

    expect(html).toContain("unlimited-corrupted-timer");
    expect(html).toContain("时间数据损坏");
    expect(html).toContain("8?:?8");
    expect(html).toContain("本局不限时");
  });
});

function renderTimeBar(time) {
  return renderToStaticMarkup(createElement(TimeBar, { time }));
}
