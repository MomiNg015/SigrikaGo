import { describe, expect, it } from "vitest";
import {
  COLORS,
  createGameState,
  erasePoint,
  getPoint,
  markDeadGroup,
  passMove,
  playMove,
  pointId,
  prepareScoringState,
  scoreGame,
  useSkill
} from "./game.js";

function forceStone(state, x, y, color) {
  getPoint(state, pointId(x, y)).stone = color;
}

function surroundWhiteBox(state) {
  for (let x = 1; x <= 5; x += 1) {
    forceStone(state, x, 1, COLORS.white);
    forceStone(state, x, 5, COLORS.white);
  }
  for (let y = 2; y <= 4; y += 1) {
    forceStone(state, 1, y, COLORS.white);
    forceStone(state, 5, y, COLORS.white);
  }
}

describe("SigrikaGo rules", () => {
  it("captures surrounded stones", () => {
    const state = createGameState();
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
    const state = createGameState();
    forceStone(state, 0, 1, COLORS.white);
    forceStone(state, 1, 0, COLORS.white);
    state.turn = COLORS.black;

    const result = playMove(state, COLORS.black, pointId(0, 0));

    expect(result.ok).toBe(false);
    expect(result.error).toBe("禁自杀");
  });

  it("creates a ko ban after single-stone capture", () => {
    const state = createGameState();
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
    expect(state.scoring.territory).toEqual({ black: [], white: [] });
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

  it("uses configured erase-point skill without consuming the turn", () => {
    const state = createGameState([{ color: COLORS.black }]);
    state.turn = COLORS.black;

    const result = useSkill(
      state,
      COLORS.black,
      {
        effectType: "erase-point",
        name: "星辰符文",
        uses: 1,
        freeTurn: true,
        targetRule: "empty-point",
        params: {}
      },
      pointId(6, 6)
    );

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(6, 6)).valid).toBe(false);
    expect(result.state.turn).toBe(COLORS.black);
  });

  it("uses configured flip-stone skill and consumes the turn", () => {
    const state = createGameState([{ color: COLORS.black }]);
    forceStone(state, 4, 4, COLORS.white);

    const result = useSkill(
      state,
      COLORS.black,
      {
        effectType: "flip-stone",
        name: "染移",
        uses: 1,
        freeTurn: false,
        targetRule: "stone",
        params: {}
      },
      pointId(4, 4)
    );

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(4, 4)).stone).toBe(COLORS.black);
    expect(result.state.turn).toBe(COLORS.white);
  });

  it("scores with black komi of 2.75 stones", () => {
    const state = createGameState();
    forceStone(state, 0, 0, COLORS.black);
    forceStone(state, 12, 12, COLORS.white);
    state.scoring = prepareScoringState(state);

    const result = scoreGame(state);

    expect(result.blackAfterKomi).toBe(-1.75);
    expect(result.whiteAfterKomi).toBe(1);
    expect(result.text).toBe("白胜2.75子");
  });

  it("marks connected potential dead stones inside the opponent territory", () => {
    const state = createGameState();
    surroundWhiteBox(state);
    forceStone(state, 2, 2, COLORS.black);
    forceStone(state, 4, 2, COLORS.black);
    state.scoring = prepareScoringState(state);

    const result = markDeadGroup(state, pointId(2, 2), COLORS.black);

    expect(result.ok).toBe(true);
    expect(result.state.scoring.deadStones).toContain(pointId(2, 2));
    expect(result.state.scoring.deadStones).toContain(pointId(4, 2));
    expect(result.state.scoring.deadStoneOwners[pointId(2, 2)]).toBe(COLORS.white);
    expect(result.state.scoring.deadStoneOwners[pointId(4, 2)]).toBe(COLORS.white);
  });

  it("only lets a player mark their own stones as dead", () => {
    const state = createGameState();
    surroundWhiteBox(state);
    forceStone(state, 2, 2, COLORS.black);
    state.scoring = prepareScoringState(state);

    const result = markDeadGroup(state, pointId(2, 2), COLORS.white);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("只能标记自己颜色的死子");
  });

  it("scores by temporarily removing marked dead stones and preserving board stones", () => {
    const state = createGameState();
    surroundWhiteBox(state);
    forceStone(state, 2, 2, COLORS.black);
    const inside = new Set([
      pointId(2, 2), pointId(3, 2), pointId(4, 2),
      pointId(2, 3), pointId(3, 3), pointId(4, 3),
      pointId(2, 4), pointId(3, 4), pointId(4, 4)
    ]);
    const neutralOutside = state.points
      .filter((point) => point.valid && !point.stone && !inside.has(point.id))
      .map((point) => point.id);
    state.scoring = {
      ...prepareScoringState(state),
      deadStones: [pointId(2, 2)],
      deadStoneOwners: { [pointId(2, 2)]: COLORS.white },
      neutralPoints: neutralOutside
    };

    const result = scoreGame(state);

    expect(result.whiteTerritory).toBe(9);
    expect(result.white).toBe(25);
    expect(getPoint(state, pointId(2, 2)).stone).toBe(COLORS.black);
  });
});
