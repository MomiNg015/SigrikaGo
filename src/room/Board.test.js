import { describe, expect, test } from "vitest";
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
