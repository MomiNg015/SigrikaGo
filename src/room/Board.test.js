import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { areBoardPropsEqual } from "./Board.jsx";

describe("areBoardPropsEqual", () => {
  test("keeps the board memoized when only handler references change", () => {
    const game = { phase: "playing", points: [], history: [] };
    const previous = boardProps({ game, onPoint: () => "before" });
    const next = boardProps({ game, onPoint: () => "after" });

    expect(areBoardPropsEqual(previous, next)).toBe(true);
  });

  test("keeps the board memoized when timer ticks replace the same preview player", () => {
    const game = { phase: "playing", points: [], history: [] };
    const previous = boardProps({
      game,
      previewPlayer: { color: "black", characterId: "sigrika", character: null, time: { main: 300 } }
    });
    const next = boardProps({
      game,
      previewPlayer: { color: "black", characterId: "sigrika", character: null, time: { main: 299 } }
    });

    expect(areBoardPropsEqual(previous, next)).toBe(true);
  });

  test("rerenders when board state or decorations change", () => {
    const game = { phase: "playing", points: [], history: [] };

    expect(areBoardPropsEqual(
      boardProps({ game }),
      boardProps({ game: { ...game } })
    )).toBe(false);
    expect(areBoardPropsEqual(
      boardProps({ game, stoneDecorations: { black: "plain", white: "" } }),
      boardProps({ game, stoneDecorations: { black: "paw", white: "" } })
    )).toBe(false);
  });

  test("uses strong skill-effect halos on affected stones", () => {
    const css = readFileSync(new URL("../styles/room.css", import.meta.url), "utf8");
    const exposedBlock = css.match(/\.exposed-hidden-hand \.stone\s*\{[^}]+\}/)?.[0] ?? "";
    const flippedBlock = css.match(/\.flipped-stone \.stone\s*\{[^}]+\}/)?.[0] ?? "";

    expect(exposedBlock).toContain("rgba(8, 174, 84, 0.95)");
    expect(exposedBlock).toContain("rgba(0, 142, 72, 0.96)");
    expect(flippedBlock).toContain("rgba(126, 30, 255, 0.95)");
    expect(flippedBlock).toContain("rgba(112, 24, 214, 0.96)");
  });

  test("marks the latest move with a red stone outline instead of a center dot", () => {
    const css = readFileSync(new URL("../styles/room.css", import.meta.url), "utf8");
    const latestMoveBlock = css.match(/\.stone i\s*\{[^}]+\}/)?.[0] ?? "";

    expect(latestMoveBlock).toContain("inset: -3px");
    expect(latestMoveBlock).toContain("border: 3px solid #e13b4f");
    expect(latestMoveBlock).toContain("background: transparent");
    expect(latestMoveBlock).not.toContain("width: 9px");
    expect(latestMoveBlock).not.toContain("height: 9px");
  });
});

function boardProps(overrides = {}) {
  return {
    game: { phase: "playing", points: [], history: [] },
    showCoords: true,
    showMoves: false,
    pendingSkill: false,
    previewPlayer: null,
    stoneDecorations: { black: "", white: "" },
    onPoint: () => {},
    onScoringPoint: null,
    onNeutral: () => {},
    ...overrides
  };
}
