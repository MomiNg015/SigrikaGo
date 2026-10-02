import { describe, expect, it } from "vitest";
import {
  COLORS,
  GAME_PHASES,
  createGameState,
  getPoint,
  passMove,
  playMove,
  pointId,
  useSkill
} from "./game.js";

function forceStone(state, x, y, color) {
  getPoint(state, pointId(x, y)).stone = color;
}

describe("gomoku rules", () => {
  it("creates gomoku games on the 13-line no-skill board", () => {
    const state = createGameState([
      { color: COLORS.black, characterId: "sigrika" },
      { color: COLORS.white, characterId: "denia" }
    ], { mode: "gomoku" });

    expect(state.mode).toBe("gomoku");
    expect(state.size).toBe(13);
    expect(state.points).toHaveLength(13 * 13);
    expect(state.skillEnabled).toBe(false);
    expect(state.skillUses).toEqual({ black: 0, white: 0 });
  });

  it("finishes with winning-line metadata when a player makes exactly five in a row", () => {
    const state = createGameState([], { mode: "gomoku" });
    for (let x = 2; x <= 5; x += 1) forceStone(state, x, 6, COLORS.black);
    state.turn = COLORS.black;

    const result = playMove(state, COLORS.black, pointId(6, 6));
    const winningLine = [2, 3, 4, 5, 6].map((x) => pointId(x, 6));

    expect(result.ok).toBe(true);
    expect(result.state.phase).toBe(GAME_PHASES.finished);
    expect(result.state.winner).toMatchObject({
      winnerColor: COLORS.black,
      reason: "gomoku-five",
      winningLine
    });
    expect(result.state.history.at(-1).winningLine).toEqual(winningLine);
  });

  it("rejects black overlines without changing the board or turn", () => {
    const state = createGameState([], { mode: "gomoku" });
    for (let x = 1; x <= 5; x += 1) forceStone(state, x, 6, COLORS.black);
    state.turn = COLORS.black;

    const result = playMove(state, COLORS.black, pointId(6, 6));

    expect(result.ok).toBe(false);
    expect(result.error).toContain("长连");
    expect(getPoint(state, pointId(6, 6)).stone).toBeNull();
    expect(state.turn).toBe(COLORS.black);
  });

  it("rejects black double-four threats", () => {
    const state = createGameState([], { mode: "gomoku" });
    for (const [x, y] of [[4, 6], [5, 6], [7, 6], [6, 4], [6, 5], [6, 7]]) {
      forceStone(state, x, y, COLORS.black);
    }
    state.turn = COLORS.black;

    const result = playMove(state, COLORS.black, pointId(6, 6));

    expect(result.ok).toBe(false);
    expect(result.error).toContain("双四");
    expect(getPoint(state, pointId(6, 6)).stone).toBeNull();
  });

  it("rejects black double-threes made from live threes", () => {
    const state = createGameState([], { mode: "gomoku" });
    for (const [x, y] of [[4, 6], [5, 6], [6, 4], [6, 5]]) {
      forceStone(state, x, y, COLORS.black);
    }
    state.turn = COLORS.black;

    const result = playMove(state, COLORS.black, pointId(6, 6));

    expect(result.ok).toBe(false);
    expect(result.error).toContain("双三");
    expect(getPoint(state, pointId(6, 6)).stone).toBeNull();
  });

  it("does not count blocked fake threes as double-three bans", () => {
    const state = createGameState([], { mode: "gomoku" });
    forceStone(state, 3, 6, COLORS.white);
    for (const [x, y] of [[4, 6], [5, 6], [6, 4], [6, 5]]) {
      forceStone(state, x, y, COLORS.black);
    }
    state.turn = COLORS.black;

    const result = playMove(state, COLORS.black, pointId(6, 6));

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(6, 6)).stone).toBe(COLORS.black);
    expect(result.state.turn).toBe(COLORS.white);
  });

  it("rejects pass and skill actions in gomoku games", () => {
    const state = createGameState([{ color: COLORS.black, characterId: "sigrika" }], { mode: "gomoku" });

    expect(passMove(state, COLORS.black)).toMatchObject({ ok: false });
    expect(useSkill(state, COLORS.black, "sigrika", pointId(6, 6))).toMatchObject({ ok: false });
  });
});
