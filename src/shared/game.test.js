import { describe, expect, it } from "vitest";
import { CHARACTERS } from "./characters.js";
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
  randomBlast,
  randomLayout,
  restoreSkillUse,
  resignGame,
  scoreGame,
  useSkill
} from "./game.js";

function forceStone(state, x, y, color) {
  getPoint(state, pointId(x, y)).stone = color;
}

function collectTestGroup(state, startId) {
  const start = getPoint(state, startId);
  const stones = [];
  const liberties = new Set();
  const queue = [startId];
  const visited = new Set();
  while (queue.length) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    const point = getPoint(state, id);
    if (!point || point.stone !== start.stone) continue;
    stones.push(id);
    for (const neighborId of point.neighbors) {
      const neighbor = getPoint(state, neighborId);
      if (!neighbor?.valid) continue;
      if (!neighbor.stone) liberties.add(neighbor.id);
      else if (neighbor.stone === start.stone && !visited.has(neighbor.id)) queue.push(neighbor.id);
    }
  }
  return { stones, liberties };
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
    expect(result.state.history.at(-1).skill).toBe(CHARACTERS.danea.skill.name);
  });

  it("initializes configured skill uses from player character skills", () => {
    const state = createGameState([
      {
        color: COLORS.black,
        character: {
          skill: {
            effectType: "erase-point",
            name: "Locked Rune",
            uses: 0,
            freeTurn: true
          }
        }
      },
      {
        color: COLORS.white,
        character: {
          skill: {
            effectType: "flip-stone",
            name: "Double Hex",
            uses: 2,
            freeTurn: false
          }
        }
      }
    ]);

    expect(state.skillUses.black).toBe(0);
    expect(state.skillUses.white).toBe(2);
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

  it("adds configured numeric skill costs when a dynamic skill is used", () => {
    const state = createGameState([{ color: COLORS.black }]);
    state.turn = COLORS.black;

    const result = useSkill(
      state,
      COLORS.black,
      {
        effectType: "erase-point",
        name: "Costly Rune",
        uses: 1,
        freeTurn: true,
        targetRule: "empty-point",
        costType: "numeric",
        costValue: "5",
        params: {}
      },
      pointId(6, 6)
    );

    expect(result.ok).toBe(true);
    expect(result.state.skillCosts.black).toBe(5);
    expect(result.state.skillCostNotes.at(-1)).toMatchObject({
      color: COLORS.black,
      costType: "numeric",
      costValue: "5"
    });
  });

  it("keeps special skill costs as notes without changing numeric scoring cost", () => {
    const state = createGameState([{ color: COLORS.black }]);
    state.turn = COLORS.black;

    const result = useSkill(
      state,
      COLORS.black,
      {
        effectType: "erase-point",
        name: "Story Rune",
        uses: 1,
        freeTurn: true,
        targetRule: "empty-point",
        costType: "special",
        costValue: "下次读秒缩短",
        params: {}
      },
      pointId(6, 6)
    );

    expect(result.ok).toBe(true);
    expect(result.state.skillCosts.black).toBe(0);
    expect(result.state.skillCostNotes.at(-1)).toMatchObject({
      color: COLORS.black,
      costType: "special",
      costValue: "下次读秒缩短"
    });
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
    expect(result.state.history.at(-1)).toMatchObject({
      type: "skill",
      effectType: "flip-stone",
      id: pointId(4, 4)
    });
  });

  it("uses configured flip-stone skill without consuming a free turn", () => {
    const state = createGameState([{ color: COLORS.black }]);
    forceStone(state, 4, 4, COLORS.white);

    const result = useSkill(
      state,
      COLORS.black,
      {
        effectType: "flip-stone",
        name: "Free Hex",
        uses: 1,
        freeTurn: true,
        targetRule: "stone",
        params: {}
      },
      pointId(4, 4)
    );

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, pointId(4, 4)).stone).toBe(COLORS.black);
    expect(result.state.turn).toBe(COLORS.black);
    expect(result.state.moveNumber).toBe(0);
  });

  it("uses configured random blast skill to remove stones in a random 3x3 area without consuming the turn", () => {
    const state = createGameState([{ color: COLORS.black }]);
    state.turn = COLORS.black;
    forceStone(state, 4, 4, COLORS.black);
    forceStone(state, 5, 4, COLORS.white);
    forceStone(state, 6, 6, COLORS.black);
    forceStone(state, 9, 9, COLORS.white);
    const originalRandom = Math.random;
    Math.random = () => 4 / 13;

    try {
      const result = useSkill(
        state,
        COLORS.black,
        {
          effectType: "random-blast",
          name: "猪小仙爆炸",
          uses: 1,
          freeTurn: true,
          targetRule: "any-point",
          costType: "numeric",
          costValue: "0",
          params: { size: 3 }
        },
        pointId(0, 0)
      );

      expect(result.ok).toBe(true);
      expect(getPoint(result.state, pointId(4, 4)).stone).toBeNull();
      expect(getPoint(result.state, pointId(5, 4)).stone).toBeNull();
      expect(getPoint(result.state, pointId(6, 6)).stone).toBe(COLORS.black);
      expect(getPoint(result.state, pointId(9, 9)).stone).toBe(COLORS.white);
      expect(getPoint(result.state, pointId(4, 4)).skillEffect).toBe("blast-marker");
      expect(getPoint(result.state, pointId(4, 4)).skillEffectOwner).toBe(COLORS.black);
      expect(result.state.history.at(-1).effectType).toBe("random-blast");
      expect(result.state.history.at(-1).marked).toHaveLength(9);
      expect(result.state.skillUses.black).toBe(0);
      expect(result.state.skillCosts.black).toBe(0);
      expect(result.state.turn).toBe(COLORS.black);
      expect(result.state.moveNumber).toBe(0);
      expect(result.state.history.at(-1).skill).toBe("猪小仙爆炸");
      const moveResult = playMove(result.state, COLORS.black, pointId(4, 4));
      expect(moveResult.ok).toBe(true);
      expect(getPoint(moveResult.state, pointId(4, 4)).stone).toBe(COLORS.black);
      expect(getPoint(moveResult.state, pointId(4, 4)).skillEffect).toBeNull();
      expect(getPoint(moveResult.state, pointId(5, 4)).skillEffect).toBeNull();
    } finally {
      Math.random = originalRandom;
    }
  });

  it("keeps random blast effects as a complete 3x3 area near board edges", () => {
    const state = createGameState([{ color: COLORS.black }]);
    const originalRandom = Math.random;
    Math.random = () => 0;

    try {
      const result = randomBlast(state, COLORS.black, {
        skill: {
          params: { size: 3 },
          costType: "numeric",
          costValue: "0"
        }
      });

      expect(result.ok).toBe(true);
      expect(result.state.history.at(-1).id).toBe(pointId(1, 1));
      expect(result.state.history.at(-1).marked).toHaveLength(9);
      expect(result.state.history.at(-1).marked).toContain(pointId(0, 0));
      expect(result.state.history.at(-1).marked).toContain(pointId(2, 2));
    } finally {
      Math.random = originalRandom;
    }
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

  it("creates a random test layout with 50 black and 50 white stones and no dead groups", () => {
    const state = createGameState();

    const result = randomLayout(state, { black: 50, white: 50 });

    expect(result.ok).toBe(true);
    expect(result.state.points.filter((point) => point.stone === COLORS.black)).toHaveLength(50);
    expect(result.state.points.filter((point) => point.stone === COLORS.white)).toHaveLength(50);
    for (const point of result.state.points.filter((candidate) => candidate.stone)) {
      expect(result.state.points.some((candidate) => candidate.id === point.id)).toBe(true);
      expect(result.state.points.find((candidate) => candidate.id === point.id)).toBe(point);
    }
    const visited = new Set();
    for (const point of result.state.points.filter((candidate) => candidate.stone)) {
      if (visited.has(point.id)) continue;
      const group = collectTestGroup(result.state, point.id);
      group.stones.forEach((stone) => visited.add(stone));
      expect(group.liberties.size).toBeGreaterThan(0);
    }
  });

  it("restores the current player's configured skill uses", () => {
    const state = createGameState([{ color: COLORS.black, character: { skill: { effectType: "erase-point", uses: 2 } } }]);
    state.skillUses.black = 0;

    const result = restoreSkillUse(state, COLORS.black);

    expect(result.ok).toBe(true);
    expect(result.state.skillUses.black).toBe(2);
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
