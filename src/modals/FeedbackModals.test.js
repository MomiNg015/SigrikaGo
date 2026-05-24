import { describe, expect, it } from "vitest";
import { duelProgressPercent, secondsUntilDuelRequestExpires } from "./FeedbackModals.jsx";

describe("FeedbackModals helpers", () => {
  it("clamps duel request countdown seconds", () => {
    expect(secondsUntilDuelRequestExpires(21_000, 1_000)).toBe(20);
    expect(secondsUntilDuelRequestExpires(500, 1_000)).toBe(0);
  });

  it("formats duel request progress percent", () => {
    expect(duelProgressPercent(20)).toBe("100%");
    expect(duelProgressPercent(10)).toBe("50%");
    expect(duelProgressPercent(-1)).toBe("0%");
    expect(duelProgressPercent(30)).toBe("100%");
  });
});
