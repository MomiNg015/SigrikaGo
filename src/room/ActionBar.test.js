import { describe, expect, it } from "vitest";
import { canRequestOpponentDecision } from "./ActionBar.jsx";

describe("ActionBar helpers", () => {
  it("disables opponent decision requests while the opponent is disconnected", () => {
    expect(canRequestOpponentDecision({ phase: "playing", opponentConnected: true })).toBe(true);
    expect(canRequestOpponentDecision({ phase: "playing", opponentConnected: false })).toBe(false);
    expect(canRequestOpponentDecision({ phase: "playing", hasAnyStones: false })).toBe(false);
    expect(canRequestOpponentDecision({ phase: "finished", opponentConnected: true })).toBe(false);
  });
});
