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
    const battleStageSource = readFileSync(new URL("./RoomBattleStage.jsx", import.meta.url), "utf8");
    const replaySource = readFileSync(new URL("./actionBar/ReplayActionBar.jsx", import.meta.url), "utf8");

    expect(source).toContain("Hand");
    expect(source).toContain("Calculator");
    expect(source).toContain("Handshake");
    expect(source).toContain("action-label");
    expect(source).toContain("<Hand size={18}");
    expect(source).toContain("<Calculator size={18}");
    expect(source).toContain("<Handshake size={18}");
    expect(source).toContain(">弃手</span>");
    expect(source).toContain(">数子</span>");
    expect(source).toContain(">和棋</span>");
    expect(source).not.toContain(">弃一手</span>");
    expect(source).not.toContain(">申请数子</span>");
    expect(source).not.toContain(">申请和棋</span>");
    expect(source).not.toContain("className=\"exit-action\"");
    expect(replaySource).toContain("className=\"action-bar replay-bar\"");
    expect(replaySource).not.toContain("DoorOpen");
    expect(replaySource).not.toContain("className=\"exit-action\"");
    expect(battleStageSource).not.toContain("trailingAction={");
    expect(battleStageSource).not.toContain("className=\"chat-exit-action exit-action\"");
  });

  it("keeps timed opponent decisions out of the action bar", () => {
    const source = readFileSync(new URL("./ActionBar.jsx", import.meta.url), "utf8");

    const decisionGate = source.slice(source.indexOf("const hasDecision"), source.indexOf("if (hasDecision)"));
    expect(decisionGate).toContain("GAME_PHASES.markingDead");
    expect(decisionGate).not.toContain("GAME_PHASES.drawRequested");
    expect(decisionGate).not.toContain("GAME_PHASES.countingRequested");
    expect(decisionGate).not.toContain("GAME_PHASES.resultReview");
  });

  it("keeps Bright School skill targeting visibly active", () => {
    const css = readCssWithImports(new URL("../styles/themes/bright-school/qa-guard.css", import.meta.url));
    const targetingBlock = css.slice(css.indexOf("Bright School skill targeting repair."));

    expect(targetingBlock).toContain(".action-bar .skill-action.active");
    expect(targetingBlock).toContain("--bright-school-skill-active-bg-0");
    expect(targetingBlock).toContain("--bright-school-skill-active-shadow-0");
    expect(targetingBlock).toContain("animation: bright-school-skill-action-glow 1.1s linear infinite !important");
    expect(targetingBlock).toContain("animation: bright-school-skill-action-aura 1.1s linear infinite !important");
    expect(targetingBlock).toContain("box-shadow:");
    expect(targetingBlock).toContain("@keyframes bright-school-skill-action-glow");
    expect(targetingBlock).toContain("@keyframes bright-school-skill-action-aura");
    expect(targetingBlock).toContain("0% {");
    expect(targetingBlock).toContain("50% {");
    expect(targetingBlock).toContain("100% {");
  });

  it("keeps removable test tools behind an explicit dev flag", () => {
    const source = readFileSync(new URL("./RoomBattleStage.jsx", import.meta.url), "utf8");

    expect(source).toContain("import.meta.env.DEV && import.meta.env.VITE_ENABLE_TEST_TOOLS === \"true\"");
  });
});

function mediaBlock(css, marker) {
  const start = css.indexOf(marker);
  if (start < 0) return "";
  const next = css.indexOf("\n@media", start + 1);
  return css.slice(start, next >= 0 ? next : undefined);
}

function readCssWithImports(url, seen = new Set()) {
  const key = url.href;
  if (seen.has(key)) return "";
  seen.add(key);

  const css = readFileSync(url, "utf8");
  return css.replace(/@import\s+"([^"]+)";/g, (_match, importPath) =>
    readCssWithImports(new URL(importPath, url), seen),
  );
}
