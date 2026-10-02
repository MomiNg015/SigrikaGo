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
    expect(html).toContain("8?:?8");
    expect(html).toContain('aria-label="本局不限时"');
    expect(html).not.toContain("时间数据损坏");
    expect(html).not.toContain(">本局不限时<");
  });

  it("keeps a zero-period 30-minute clock in main-time mode without byo-yomi", () => {
    const html = renderTimeBar({
      main: 0,
      mainTotal: 30 * 60,
      byoYomi: 0,
      periodRemaining: 0,
      periods: 0
    });

    expect(html).toContain("主时间");
    expect(html).toContain("0:00");
    expect(html).not.toContain("读秒");
  });
});

function renderTimeBar(time) {
  return renderToStaticMarkup(createElement(TimeBar, { time }));
}
