import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { limitToastQueue, duelProgressPercent, secondsUntilDuelRequestExpires } from "./FeedbackModals.jsx";

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

  it("keeps newest toasts at the top of the queue", () => {
    const queued = limitToastQueue([
      { id: 3, text: "third" },
      { id: 2, text: "second" },
      { id: 1, text: "first" }
    ], 2);

    expect(queued).toEqual([
      { id: 3, text: "third" },
      { id: 2, text: "second" }
    ]);
  });

  it("styles penalty toasts with a gray background", () => {
    const css = readFileSync(new URL("../styles/commerce-settings.css", import.meta.url), "utf8");
    const penaltyBlock = css.match(/\.toast\.penalty\s*\{[^}]+\}/)?.[0] ?? "";

    expect(penaltyBlock).toContain("background: linear-gradient(135deg, #8d9099, #5f636d)");
    expect(penaltyBlock).toContain("color: #ffffff");
  });
});
