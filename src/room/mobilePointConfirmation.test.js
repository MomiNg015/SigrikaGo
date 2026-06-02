import { describe, expect, it } from "vitest";
import {
  nextPointConfirmation,
  pointConfirmationMatches,
  shouldUsePointConfirmation
} from "./mobilePointConfirmation.js";

describe("mobile point confirmation", () => {
  it("uses confirmation for touch and coarse pointer devices only", () => {
    expect(shouldUsePointConfirmation({ pointerType: "touch" })).toBe(true);
    expect(shouldUsePointConfirmation({ pointerType: "pen" })).toBe(true);
    expect(shouldUsePointConfirmation({ pointerType: "mouse" })).toBe(false);
    expect(shouldUsePointConfirmation({
      pointerType: "",
      matchMedia: (query) => ({ matches: query === "(pointer: coarse)" })
    })).toBe(true);
  });

  it("marks a point on first tap and confirms the same point on second tap", () => {
    const first = nextPointConfirmation(null, { pointId: "3,3", actionType: "move" });
    expect(first).toEqual({
      confirmed: false,
      next: { pointId: "3,3", actionType: "move" }
    });

    const second = nextPointConfirmation(first.next, { pointId: "3,3", actionType: "move" });
    expect(second).toEqual({ confirmed: true, next: null });
  });

  it("moves the marker when the player taps a different target or action type", () => {
    const current = { pointId: "3,3", actionType: "move" };

    expect(nextPointConfirmation(current, { pointId: "4,4", actionType: "move" })).toEqual({
      confirmed: false,
      next: { pointId: "4,4", actionType: "move" }
    });
    expect(nextPointConfirmation(current, { pointId: "3,3", actionType: "skill" })).toEqual({
      confirmed: false,
      next: { pointId: "3,3", actionType: "skill" }
    });
    expect(pointConfirmationMatches(current, "3,3", "move")).toBe(true);
  });
});
