import { describe, expect, it } from "vitest";
import { initialMatchSessionState, matchSessionView } from "./useMatchSessionState.js";

describe("match session state", () => {
  it("starts without pending or successful match transitions", () => {
    expect(initialMatchSessionState()).toEqual({
      matchStart: null,
      matchSuccess: null
    });
  });

  it("derives pending and transitioning flags from match session fields", () => {
    expect(matchSessionView(initialMatchSessionState())).toMatchObject({
      isMatchPending: false,
      isMatchTransitioning: false
    });
    expect(matchSessionView({
      matchStart: { startedAt: 123, mode: "spark" },
      matchSuccess: null
    })).toMatchObject({
      isMatchPending: true,
      isMatchTransitioning: false
    });
    expect(matchSessionView({
      matchStart: null,
      matchSuccess: { startedAt: 456, room: { code: "12345" } }
    })).toMatchObject({
      isMatchPending: false,
      isMatchTransitioning: true
    });
  });
});
