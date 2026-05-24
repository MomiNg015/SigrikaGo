import { describe, expect, it } from "vitest";
import { colorTextForPlayer, formatSignedDelta, secondsSinceStarted, secondsUntilTimestamp } from "./GameLifecycleModals.jsx";
import { COLORS } from "../shared/game.js";

describe("GameLifecycleModals helpers", () => {
  it("formats the player opening color", () => {
    expect(colorTextForPlayer({ color: COLORS.black })).toBe("黑");
    expect(colorTextForPlayer({ color: COLORS.white })).toBe("白");
    expect(colorTextForPlayer(null)).toBe("");
  });

  it("clamps lifecycle countdown values", () => {
    expect(secondsSinceStarted(1_000, 3_900)).toBe(2);
    expect(secondsUntilTimestamp(4_100, 1_000)).toBe(4);
    expect(secondsUntilTimestamp(900, 1_000)).toBe(0);
  });

  it("formats signed reward deltas", () => {
    expect(formatSignedDelta(20)).toBe("+20");
    expect(formatSignedDelta(0)).toBe("0");
    expect(formatSignedDelta(-20)).toBe("-20");
  });
});
