import { describe, expect, it } from "vitest";
import { GAME_PHASES, getPoint } from "../shared/game.js";
import {
  applyTutorialSkillAction,
  applyTutorialNodeAction,
  createTutorialGameState,
  isAllowedTutorialPoint
} from "./tutorialGameState.js";

describe("tutorialGameState", () => {
  it("creates a local spark game from a scripted initial board", () => {
    const game = createTutorialGameState({
      initialBoard: {
        mode: "spark",
        stones: [
          { pointId: "3,3", color: "black" },
          { pointId: "4,4", color: "white" }
        ]
      }
    });

    expect(game.mode).toBe("spark");
    expect(game.size).toBe(13);
    expect(getPoint(game, "3,3").stone).toBe("black");
    expect(getPoint(game, "4,4").stone).toBe("white");
  });

  it("hard gates player move nodes to the scripted target point", () => {
    const game = createTutorialGameState();
    const node = { type: "player-move", color: "black", pointId: "5,5" };

    expect(isAllowedTutorialPoint(node, "4,4")).toBe(false);
    expect(isAllowedTutorialPoint(node, "5,5")).toBe(true);

    const wrong = applyTutorialNodeAction(game, node, { pointId: "4,4" });
    expect(wrong.ok).toBe(false);
    expect(getPoint(wrong.state, "4,4").stone).toBe(null);

    const correct = applyTutorialNodeAction(game, node, { pointId: "5,5" });
    expect(correct.ok).toBe(true);
    expect(getPoint(correct.state, "5,5").stone).toBe("black");
  });

  it("applies npc move and resign nodes through shared game rules", () => {
    let game = createTutorialGameState();

    const npcMove = applyTutorialNodeAction(game, {
      type: "npc-move",
      color: "black",
      pointId: "6,6"
    });
    expect(npcMove.ok).toBe(true);
    expect(getPoint(npcMove.state, "6,6").stone).toBe("black");

    game = npcMove.state;
    const resign = applyTutorialNodeAction(game, { type: "resign", color: "white" });
    expect(resign.ok).toBe(true);
    expect(resign.state.phase).toBe(GAME_PHASES.finished);
    expect(resign.state.winner.reason).toBe("resign");
    expect(resign.state.winner.winnerColor).toBe("black");
  });

  it("applies board setup nodes by replacing the current tutorial board", () => {
    const game = createTutorialGameState({
      initialBoard: {
        mode: "spark",
        stones: [
          { pointId: "3,3", color: "black" }
        ]
      }
    });

    const result = applyTutorialNodeAction(game, {
      type: "board-setup",
      boardSetup: {
        mode: "spark",
        stones: [
          { pointId: "5,5", color: "white" }
        ]
      }
    });

    expect(result.ok).toBe(true);
    expect(getPoint(result.state, "3,3").stone).toBe(null);
    expect(getPoint(result.state, "5,5").stone).toBe("white");
  });

  it("creates a skill preview state and a resolved result for skill tutorial nodes", () => {
    const game = createTutorialGameState({
      initialBoard: {
        mode: "spark",
        stones: [
          { pointId: "4,4", color: "white" }
        ]
      }
    });

    const result = applyTutorialSkillAction(game, {
      id: "skill-1",
      type: "player-skill",
      characterId: "denia",
      color: "black",
      pointId: "4,4"
    }, { pointId: "4,4", pendingSkillId: "tutorial-skill-1" });

    expect(result.ok).toBe(true);
    expect(result.state.phase).toBe(GAME_PHASES.skillPreview);
    expect(result.state.pendingSkill).toMatchObject({
      id: "tutorial-skill-1",
      color: "black",
      characterId: "denia",
      effectType: "flip-stone",
      targetId: "4,4"
    });
    expect(getPoint(result.state, "4,4").stone).toBe("white");
    expect(getPoint(result.resolvedState, "4,4").stone).toBe("black");
  });
});
