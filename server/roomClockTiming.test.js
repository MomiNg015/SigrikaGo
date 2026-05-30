import { describe, expect, it } from "vitest";
import { resetByoYomi, tickPlayerClock } from "./roomClockTiming.js";

describe("room clock timing", () => {
  it("spends main time before byo-yomi time", () => {
    const player = playerWithTime({ main: 3, periodRemaining: 30, periods: 3 });

    tickPlayerClock(player, 5);

    expect(player.time).toMatchObject({
      main: 0,
      periodRemaining: 28,
      periods: 3
    });
  });

  it("rolls through byo-yomi periods and resets each period", () => {
    const player = playerWithTime({ main: 0, periodRemaining: 2, periods: 2 });

    tickPlayerClock(player, 3);

    expect(player.time).toMatchObject({
      main: 0,
      periodRemaining: 29,
      periods: 1
    });
  });

  it("resets period remaining after a valid move in byo-yomi", () => {
    const player = playerWithTime({ main: 0, periodRemaining: 9, periods: 2 });

    resetByoYomi(player);

    expect(player.time.periodRemaining).toBe(30);
  });
});

function playerWithTime(overrides = {}) {
  return {
    time: {
      main: 300,
      byoYomi: 30,
      periodRemaining: 30,
      periods: 3,
      ...overrides
    }
  };
}
