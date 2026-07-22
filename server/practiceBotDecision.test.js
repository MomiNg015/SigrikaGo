import { describe, expect, it } from "vitest";
import { COLORS, createGameState, gameViewForColor, getPoint, playMove } from "../src/shared/game.js";
import { PRACTICE_DIFFICULTIES } from "../src/shared/practiceMode.js";
import {
  PRACTICE_CANDIDATE_LIMIT,
  choosePracticeAction,
  practiceCandidateIds
} from "./practiceBotDecision.js";

function sequenceRandom(values) {
  let index = 0;
  return () => values[index++ % values.length];
}

describe("practice bot decision", () => {
  it("is reproducible, bounded, and only returns a legal action", () => {
    const game = createGameState([
      { userId: "human", color: COLORS.black },
      { userId: "bot", color: COLORS.white }
    ]);
    const firstRandom = sequenceRandom([0.12, 0.84, 0.4, 0.65]);
    const secondRandom = sequenceRandom([0.12, 0.84, 0.4, 0.65]);
    const first = choosePracticeAction(game, COLORS.black, PRACTICE_DIFFICULTIES.basic, { random: firstRandom });
    const second = choosePracticeAction(game, COLORS.black, PRACTICE_DIFFICULTIES.basic, { random: secondRandom });

    expect(first).toEqual(second);
    expect(first.evaluated).toBeLessThanOrEqual(PRACTICE_CANDIDATE_LIMIT);
    expect(first.type).toBe("move");
    expect(playMove(game, COLORS.black, first.pointId).ok).toBe(true);
  });

  it("prioritizes an urgent liberty while respecting the 48 point cap", () => {
    let game = createGameState([
      { userId: "human", color: COLORS.black },
      { userId: "bot", color: COLORS.white }
    ]);
    for (const [color, pointId] of [
      [COLORS.black, "1,1"], [COLORS.white, "0,1"],
      [COLORS.black, "5,5"], [COLORS.white, "1,0"]
    ]) {
      game.turn = color;
      const result = playMove(game, color, pointId);
      expect(result.ok).toBe(true);
      game = result.state;
    }
    const candidates = practiceCandidateIds(game, COLORS.black, { random: () => 0.5 });
    expect(candidates.slice(0, 8)).toContain("2,1");
    expect(candidates.length).toBeLessThanOrEqual(PRACTICE_CANDIDATE_LIMIT);
  });

  it("cannot distinguish hidden-hand locations that its own view conceals", () => {
    const firstGame = createGameState([
      { userId: "human", color: COLORS.black },
      { userId: "bot", color: COLORS.white }
    ]);
    const secondGame = structuredClone(firstGame);
    for (const [game, pointId] of [[firstGame, "3,3"], [secondGame, "9,9"]]) {
      const point = getPoint(game, pointId);
      point.stone = COLORS.black;
      point.hiddenHand = { owner: COLORS.black, exposed: false, effect: "hidden-hand" };
    }
    firstGame.turn = COLORS.white;
    secondGame.turn = COLORS.white;
    const firstView = gameViewForColor(firstGame, COLORS.white);
    const secondView = gameViewForColor(secondGame, COLORS.white);
    const first = choosePracticeAction(firstView, COLORS.white, PRACTICE_DIFFICULTIES.basic, { random: sequenceRandom([0.2, 0.7, 0.4]) });
    const second = choosePracticeAction(secondView, COLORS.white, PRACTICE_DIFFICULTIES.basic, { random: sequenceRandom([0.2, 0.7, 0.4]) });

    expect(first).toEqual(second);
  });
});
