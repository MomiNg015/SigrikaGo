import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { canRequestOpponentDecision } from "./ActionBar.jsx";

describe("ActionBar helpers", () => {
  it("disables opponent decision requests while the opponent is disconnected", () => {
    expect(canRequestOpponentDecision({ phase: "playing", opponentConnected: true })).toBe(true);
    expect(canRequestOpponentDecision({ phase: "playing", opponentConnected: false })).toBe(false);
    expect(canRequestOpponentDecision({ phase: "playing", hasAnyStones: false })).toBe(false);
    expect(canRequestOpponentDecision({ phase: "finished", opponentConnected: true })).toBe(false);
  });

  it("pairs player actions with compactable icon labels", () => {
    const source = readFileSync(new URL("./ActionBar.jsx", import.meta.url), "utf8");

    expect(source).toContain("Hand");
    expect(source).toContain("Calculator");
    expect(source).toContain("Handshake");
    expect(source).toContain("action-label");
    expect(source).toContain("<Hand size={18}");
    expect(source).toContain("<Calculator size={18}");
    expect(source).toContain("<Handshake size={18}");
  });

  it("marks result review decisions so mobile can scroll the scoring calculation above the action buttons", () => {
    const source = readFileSync(new URL("./ActionBar.jsx", import.meta.url), "utf8");
    const mobileCss = readFileSync(new URL("../styles/mobile-room.css", import.meta.url), "utf8");
    const portraitMedia = mediaBlock(mobileCss, "@media (max-width: 760px) and (orientation: portrait), (max-width: 420px)");

    expect(source).toContain("result-review-decision");
    expect(portraitMedia).toContain(".mobile-room-screen .decision-bar.result-review-decision");
    expect(portraitMedia).toContain("grid-template-rows: minmax(0, 1fr) auto");
    expect(portraitMedia).toContain(".mobile-room-screen .decision-bar.result-review-decision .decision-copy");
    expect(portraitMedia).toContain("overflow: auto");
    expect(portraitMedia).toContain(".mobile-room-screen .decision-bar.result-review-decision .decision-actions");
    expect(portraitMedia).toContain("position: sticky");
  });
});

function mediaBlock(css, marker) {
  const start = css.indexOf(marker);
  if (start < 0) return "";
  const next = css.indexOf("\n@media", start + 1);
  return css.slice(start, next >= 0 ? next : undefined);
}
