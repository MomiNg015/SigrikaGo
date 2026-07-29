import { describe, expect, it } from "vitest";
import {
  COLORS,
  createGameState,
  getPoint
} from "../src/shared/game.js";
import { obviousDeadBotGroups } from "./practiceBotDecision.js";

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
