import { describe, expect, it } from "vitest";
import { matchSuccessCountdownCompletedTransition } from "./useMatchActions.js";

describe("match success action helpers", () => {
  it("uses the latest pending match room when the countdown completes", () => {
    const staleTransition = {
      startedAt: 1000,
      countdownComplete: false,
      room: { code: "12345", game: { phase: "preloading" } }
    };
    const latestTransition = {
      ...staleTransition,
      room: { code: "12345", game: { phase: "opening" } }
    };

    expect(matchSuccessCountdownCompletedTransition(staleTransition, latestTransition)).toEqual({
      ...latestTransition,
      countdownComplete: true
    });
  });
});
