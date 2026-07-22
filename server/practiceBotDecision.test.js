import { describe, expect, it } from "vitest";
import { COLORS, createGameState, gameViewForColor, getPoint, playMove } from "../src/shared/game.js";
import { PRACTICE_DIFFICULTIES } from "../src/shared/practiceMode.js";
import {
  PRACTICE_CANDIDATE_LIMIT,
  choosePracticeAction,
  practiceCandidateIds,
  scorePracticeMove,
  shouldPracticeBotPassLowValueMoves
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

  it("opens on two corner star points before ordinary local replies", () => {
    let game = createGameState([
      { userId: "bot", color: COLORS.black },
      { userId: "human", color: COLORS.white }
    ]);
    const cornerStars = new Set(["3,3", "9,3", "3,9", "9,9"]);

    const first = choosePracticeAction(game, COLORS.black, PRACTICE_DIFFICULTIES.basic, { random: () => 0 });
    expect(cornerStars.has(first.pointId)).toBe(true);
    expect(first.reasons).toContain("opening-corner");
    game = playMove(game, COLORS.black, first.pointId).state;
    game = playMove(game, COLORS.white, "6,6").state;

    const second = choosePracticeAction(game, COLORS.black, PRACTICE_DIFFICULTIES.basic, { random: () => 0 });
    expect(cornerStars.has(second.pointId)).toBe(true);
    expect(second.pointId).not.toBe(first.pointId);
    expect(second.reasons).toContain("opening-corner");
  });

  it("does not pass in the middle game merely because every candidate looks low value", () => {
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

  it("prefers immediate capture and defense reasons over remote shape moves", () => {
    const captureGame = createGameState([
      { userId: "bot", color: COLORS.black },
      { userId: "human", color: COLORS.white }
    ]);
    captureGame.turn = COLORS.black;
    getPoint(captureGame, "4,4").stone = COLORS.white;
    getPoint(captureGame, "3,4").stone = COLORS.black;
    getPoint(captureGame, "4,3").stone = COLORS.black;
    getPoint(captureGame, "5,4").stone = COLORS.black;

    const capture = scorePracticeMove(captureGame, COLORS.black, "4,5");
    const remote = scorePracticeMove(captureGame, COLORS.black, "9,9");

    expect(capture.priority).toBe(3);
    expect(capture.reasons).toContain("capture");
    expect(capture.score).toBeGreaterThan(remote.score);

    const defenseGame = structuredClone(captureGame);
    defenseGame.points.forEach((point) => { point.stone = null; });
    getPoint(defenseGame, "4,4").stone = COLORS.black;
    getPoint(defenseGame, "3,4").stone = COLORS.white;
    getPoint(defenseGame, "4,3").stone = COLORS.white;
    getPoint(defenseGame, "5,4").stone = COLORS.white;
    const defense = scorePracticeMove(defenseGame, COLORS.black, "4,5");

    expect(defense.priority).toBe(2);
    expect(defense.reasons).toContain("defend");
  });

  it("penalizes non-tactical early straight lines and keeps beginner randomness plausible", () => {
    const game = createGameState([
      { userId: "bot", color: COLORS.black },
      { userId: "human", color: COLORS.white }
    ]);
    game.turn = COLORS.black;
    game.moveNumber = 4;
    getPoint(game, "4,6").stone = COLORS.black;
    getPoint(game, "5,6").stone = COLORS.black;
    getPoint(game, "8,8").stone = COLORS.white;

    const straight = scorePracticeMove(game, COLORS.black, "6,6");
    const shape = scorePracticeMove(game, COLORS.black, "7,8");
    expect(straight.reasons).toContain("early-straight-line");
    expect(straight.score).toBeLessThan(shape.score);

    const decision = choosePracticeAction(game, COLORS.black, PRACTICE_DIFFICULTIES.beginner, {
      random: sequenceRandom([0.1, 0.99, 0.3, 0.7])
    });
    expect(decision.bestScore - decision.score).toBeLessThanOrEqual(16);
  });
});
