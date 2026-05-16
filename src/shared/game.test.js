import { describe, expect, it } from "vitest";
import {
  COLORS,
  createDrawResult,
  createGameState,
  createTimeoutResult,
  erasePoint,
  getPoint,
  markDeadGroup,
  passMove,
  playMove,
  pointId,
  prepareScoringState,
  resignGame,
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
    expect(result.state.skillCosts.black).toBe(3);
    expect(result.state.turn).toBe(COLORS.black);
  });

  it("flips a stone with Danea skill", () => {
    const state = createGameState([{ color: COLORS.black }]);
    forceStone(state, 4, 4, COLORS.white);

    const result = useSkill(state, COLORS.black, "danea", pointId(4, 4));

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(4, 4)).stone).toBe(COLORS.black);
    expect(result.state.skillUses.black).toBe(0);
    expect(result.state.skillCosts.black).toBe(3);
    expect(result.state.turn).toBe(COLORS.white);
  });

  it("places a hidden hand with Aemeath skill", () => {
    const state = createGameState([{ color: COLORS.black }]);

    const result = useSkill(state, COLORS.black, "aemeath", pointId(4, 4));

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(4, 4)).stone).toBe(COLORS.black);
    expect(getPoint(result.state, pointId(4, 4)).hiddenHand).toEqual({
      owner: COLORS.black,
      exposed: false,
      effect: "hidden-hand"
    });
    expect(result.state.skillUses.black).toBe(0);
    expect(result.state.skillCosts.black).toBe(0);
    expect(result.state.turn).toBe(COLORS.white);
  });

  it("reveals a hidden hand when it participates in a capture", () => {
    const state = createGameState([{ color: COLORS.black }]);
    forceStone(state, 4, 3, COLORS.black);
    forceStone(state, 3, 4, COLORS.black);
    forceStone(state, 5, 4, COLORS.black);
    forceStone(state, 4, 4, COLORS.white);
    state.turn = COLORS.black;

    const result = useSkill(state, COLORS.black, "aemeath", pointId(4, 5));

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(4, 4)).stone).toBe(null);
    expect(getPoint(result.state, pointId(4, 5)).hiddenHand.exposed).toBe(true);
    expect(result.notices).toContain("发现隐藏手了！");
  });

  it("reveals a separate hidden hand that helps surround a captured group", () => {
    const state = createGameState();
    forceStone(state, 4, 3, COLORS.black);
    getPoint(state, pointId(4, 3)).hiddenHand = {
      owner: COLORS.black,
      exposed: false,
      effect: "hidden-hand"
    };
    forceStone(state, 3, 4, COLORS.black);
    forceStone(state, 5, 4, COLORS.black);
    forceStone(state, 4, 4, COLORS.white);
    state.turn = COLORS.black;

    const result = playMove(state, COLORS.black, pointId(4, 5));

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(4, 4)).stone).toBe(null);
    expect(getPoint(result.state, pointId(4, 3)).hiddenHand.exposed).toBe(true);
    expect(result.notices).toContain("发现隐藏手了！");
  });

  it("reveals a hidden hand when the opponent tries to play on it without consuming the turn", () => {
    let state = createGameState([{ color: COLORS.black }, { color: COLORS.white }]);
    state = useSkill(state, COLORS.black, "aemeath", pointId(6, 6)).state;

    const result = playMove(state, COLORS.white, pointId(6, 6));

    expect(result.ok).toBe(true);
    expect(result.state.turn).toBe(COLORS.white);
    expect(result.state.moveNumber).toBe(1);
    expect(getPoint(result.state, pointId(6, 6)).stone).toBe(COLORS.black);
    expect(getPoint(result.state, pointId(6, 6)).hiddenHand.exposed).toBe(true);
    expect(result.notices).toContain("发现隐藏手了！");
  });

  it("temporarily removes unexposed hidden hands when counting starts", () => {
    let state = createGameState([{ color: COLORS.black }, { color: COLORS.white }]);
    state = useSkill(state, COLORS.black, "aemeath", pointId(3, 3)).state;
    state = passMove(state, COLORS.white).state;

    const result = passMove(state, COLORS.black);

    expect(result.ok).toBe(true);
    expect(result.state.phase).toBe("counting-requested");
    expect(getPoint(result.state, pointId(3, 3)).stone).toBe(null);
    expect(result.state.suspendedHiddenHands).toEqual([
      { id: pointId(3, 3), color: COLORS.black }
    ]);
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

  it("subtracts numeric skill cost before deciding the scoring winner", () => {
    const state = createGameState();
    forceStone(state, 0, 0, COLORS.black);
    forceStone(state, 1, 0, COLORS.black);
    forceStone(state, 12, 12, COLORS.white);
    state.skillCosts.black = 3;
    state.scoring = prepareScoringState(state);

    const result = scoreGame(state);

    expect(result.blackSkillCost).toBe(3);
    expect(result.black).toBe(-1);
    expect(result.blackAfterKomi).toBe(-3.75);
    expect(result.winnerColor).toBe(COLORS.white);
  });

  it("describes resignation as a midgame win for the opponent", () => {
    const state = createGameState();

    const result = resignGame(state, COLORS.white);

    expect(result.ok).toBe(true);
    expect(result.state.winner.winnerColor).toBe(COLORS.black);
    expect(result.state.winner.text).toBe("黑中盘胜");
  });

  it("creates a draw result without a winner color", () => {
    const result = createDrawResult("agreement");

    expect(result).toEqual({
      winnerColor: null,
      reason: "agreement",
      text: "和棋"
    });
  });

  it("describes timeout as a timeout win for the opponent", () => {
    const result = createTimeoutResult(COLORS.white);

    expect(result).toEqual({
      winnerColor: COLORS.black,
      reason: "timeout",
      text: "黑超时胜"
    });
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
