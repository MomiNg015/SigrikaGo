import { describe, expect, test } from "vitest";
import { initialIncomingDuelState } from "./useIncomingDuelState.js";

describe("useIncomingDuelState", () => {
  test("starts without a pending incoming duel request", () => {
    expect(initialIncomingDuelState()).toBeNull();
  });
});
