import { describe, expect, it } from "vitest";
import {
  COLORS,
  createGameState,
  gameViewForColor,
  getPoint,
  playMove
} from "../src/shared/game.js";
import { PRACTICE_DIFFICULTIES } from "../src/shared/practiceMode.js";
import {
  PRACTICE_CANDIDATE_LIMIT,
  choosePracticeAction,
  obviousDeadBotGroups,
  shouldPracticeBotPassLowValueMoves
} from "./practiceBotDecision.js";

function sequenceRandom(values) {
  let index = 0;
  return () => values[index++ % values.length];
}

describe("beginner practice bot decision", () => {
  it("is reproducible, bounded, and only returns a legal action", () => {
    const game = createGameState([
      { userId: "human", color: COLORS.black },
      { userId: "bot", color: COLORS.white }
    ]);
    const first = choosePracticeAction(game, COLORS.black, PRACTICE_DIFFICULTIES.beginner, {
      random: sequenceRandom([0.12, 0.84, 0.4, 0.65])
    });
    const second = choosePracticeAction(game, COLORS.black, PRACTICE_DIFFICULTIES.beginner, {
      random: sequenceRandom([0.12, 0.84, 0.4, 0.65])
    });

    expect(first).toEqual(second);
    expect(first.evaluated).toBeLessThanOrEqual(PRACTICE_CANDIDATE_LIMIT);
    expect(first.type).toBe("move");
    expect(playMove(game, COLORS.black, first.pointId).ok).toBe(true);
  });

  it("cannot distinguish hidden-hand locations concealed from its own view", () => {
    const firstGame = createGameState([
      { userId: "human", color: COLORS.black },
      { userId: "bot", color: COLORS.white }
    ]);
    const secondGame = structuredClone(firstGame);
    for (const [game, hiddenPointId] of [[firstGame, "3,3"], [secondGame, "9,9"]]) {
      const point = getPoint(game, hiddenPointId);
      point.stone = COLORS.black;
      point.hiddenHand = { owner: COLORS.black, exposed: false, effect: "hidden-hand" };
      game.turn = COLORS.white;
    }

    const first = choosePracticeAction(
      gameViewForColor(firstGame, COLORS.white),
      COLORS.white,
      PRACTICE_DIFFICULTIES.beginner,
      { random: sequenceRandom([0.2, 0.7, 0.4]) }
    );
    const second = choosePracticeAction(
      gameViewForColor(secondGame, COLORS.white),
      COLORS.white,
      PRACTICE_DIFFICULTIES.beginner,
      { random: sequenceRandom([0.2, 0.7, 0.4]) }
    );

    expect(first).toEqual(second);
  });

  it("passes low-value moves only near the endgame", () => {
    const game = createGameState([
      { userId: "bot", color: COLORS.black },
      { userId: "human", color: COLORS.white }
    ]);
    const scored = [{ pointId: "3,3", score: -24 }];

    game.points.slice(30).forEach((point) => { point.stone = COLORS.black; });
    expect(shouldPracticeBotPassLowValueMoves(game, scored)).toBe(false);

    game.points.slice(10, 30).forEach((point) => { point.stone = COLORS.black; });
    expect(shouldPracticeBotPassLowValueMoves(game, scored)).toBe(true);
  });
});

describe("practice bot scoring helper", () => {
  it("marks only a bot group whose final liberty is fully surrounded", () => {
    const game = createGameState([
      { userId: "bot", color: COLORS.black },
      { userId: "human", color: COLORS.white }
    ]);
    getPoint(game, "0,0").stone = COLORS.black;
    getPoint(game, "0,1").stone = COLORS.white;
    getPoint(game, "2,0").stone = COLORS.white;
    getPoint(game, "1,1").stone = COLORS.white;

    expect(obviousDeadBotGroups(game, COLORS.black)).toEqual(["0,0"]);

    getPoint(game, "2,0").stone = null;
    expect(obviousDeadBotGroups(game, COLORS.black)).toEqual([]);
  });
});
