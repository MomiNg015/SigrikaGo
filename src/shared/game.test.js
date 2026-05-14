import { describe, expect, it } from "vitest";
import {
  COLORS,
  createGameState,
  erasePoint,
  getPoint,
  passMove,
  playMove,
  pointId,
  scoreGame,
  useSkill
} from "./game.js";

function forceStone(state, x, y, color) {
  getPoint(state, pointId(x, y)).stone = color;
}

describe("SigrikaGo rules", () => {
  it("captures surrounded stones", () => {
    let state = createGameState();
    forceStone(state, 1, 1, COLORS.white);
    forceStone(state, 0, 1, COLORS.black);
    forceStone(state, 2, 1, COLORS.black);
    forceStone(state, 1, 0, COLORS.black);
    state.turn = COLORS.black;

    const result = playMove(state, COLORS.black, pointId(1, 2));

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(1, 1)).stone).toBe(null);
    expect(result.state.captures.black).toBe(1);
  });

  it("rejects suicide", () => {
    let state = createGameState();
    forceStone(state, 0, 1, COLORS.white);
    forceStone(state, 1, 0, COLORS.white);
    state.turn = COLORS.black;

    const result = playMove(state, COLORS.black, pointId(0, 0));

    expect(result.ok).toBe(false);
    expect(result.error).toBe("禁自杀");
  });

  it("creates a ko ban after single-stone capture", () => {
    let state = createGameState();
    forceStone(state, 1, 0, COLORS.white);
    forceStone(state, 0, 0, COLORS.black);
    forceStone(state, 2, 0, COLORS.black);
    forceStone(state, 0, 1, COLORS.white);
    forceStone(state, 2, 1, COLORS.white);
    forceStone(state, 1, 2, COLORS.white);
    state.turn = COLORS.black;

    const result = playMove(state, COLORS.black, pointId(1, 1));

    expect(result.ok).toBe(true);
    expect(result.state.ko).toBe(pointId(1, 0));
  });

  it("enters counting after two consecutive passes", () => {
    let state = createGameState();
    state = passMove(state, COLORS.black).state;
    state = passMove(state, COLORS.white).state;

    expect(state.phase).toBe("counting-requested");
    expect(state.scoring).toBeTruthy();
  });

  it("erases an empty intersection and disconnects neighbors", () => {
    const state = createGameState([{ color: COLORS.black }]);
    state.turn = COLORS.black;
    const result = erasePoint(state, COLORS.black, pointId(6, 6));

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(6, 6)).valid).toBe(false);
    expect(getPoint(result.state, pointId(6, 5)).neighbors).not.toContain(pointId(6, 6));
    expect(result.state.turn).toBe(COLORS.black);
  });

  it("flips a stone with Danea skill", () => {
    const state = createGameState([{ color: COLORS.black }]);
    forceStone(state, 4, 4, COLORS.white);

    const result = useSkill(state, COLORS.black, "danea", pointId(4, 4));

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(4, 4)).stone).toBe(COLORS.black);
    expect(result.state.skillUses.black).toBe(0);
    expect(result.state.turn).toBe(COLORS.white);
  });

  it("scores with black komi of 2.75 stones", () => {
    const state = createGameState();
    forceStone(state, 0, 0, COLORS.black);
    forceStone(state, 12, 12, COLORS.white);
    state.scoring = { deadStones: [], neutralPoints: [] };

    const result = scoreGame(state);

    expect(result.blackAfterKomi).toBe(-1.75);
    expect(result.whiteAfterKomi).toBe(1);
    expect(result.text).toBe("白胜2.75子");
  });
});
