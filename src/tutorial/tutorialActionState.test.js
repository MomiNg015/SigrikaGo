import { describe, expect, it } from "vitest";
import { activeTutorialAction, tutorialActionForNode, tutorialContinueForState } from "./tutorialActionState.js";
import { tutorialFocusShape } from "./tutorialFocusShape.js";

describe("tutorial action gating", () => {
  it("routes manual waits, phase continuation and lone continue choices into the counting slot", () => {
    const option = { label: "继续", nextNodeId: "move" };
    for (const [state, kind, label] of [
      [{ pendingWait: { manualContinue: true } }, "wait", "继续"],
      [{ pendingWait: { manualContinue: false }, previewControlsEnabled: true }, "wait", "立即继续"],
      [{ phase: "continue" }, "continue", "继续"],
      [{ choicesVisible: true, node: { options: [option] } }, "choice", "继续"]
    ]) {
      expect(tutorialContinueForState(state)).toMatchObject({ kind, label });
      expect(activeTutorialAction(state)).toBe("continue");
      expect(activeTutorialAction({ ...state, loading: true })).toBe("");
      expect(activeTutorialAction({ ...state, confirmExit: true })).toBe("");
    }
    expect(tutorialContinueForState({ choicesVisible: true, node: { options: [option] } }).option).toBe(option);
    expect(tutorialContinueForState({ choicesVisible: true, node: { options: [option, { label: "回去" }] } })).toBeNull();
    expect(tutorialContinueForState({ choicesVisible: true, node: { options: [{ label: "准备好了" }] } })).toBeNull();
    expect(tutorialContinueForState({ pendingWait: { manualContinue: false } })).toBeNull();
  });
  it.each([["pass", "pass"], ["draw", "draw"], ["resign", "resign"], ["counting-start", "counting"], ["counting-confirm", "counting"], ["player-skill", "skill"]])("maps %s to its normal key", (type, action) => {
    const node = { type, actor: "player" };
    expect(tutorialActionForNode(node)).toBe(action);
    expect(activeTutorialAction({ node, phase: action === "skill" ? "skill-button" : "button" })).toBe(action);
    for (const flag of ["pendingWait", "loading", "choicesVisible", "confirmExit"]) {
      expect(activeTutorialAction({ node, phase: "button", [flag]: true })).toBe("");
    }
    expect(activeTutorialAction({ node, phase: "skill-board" })).toBe("");
  });
  it("never unlocks player actions for automatic or unsupported nodes", () => {
    expect(tutorialActionForNode({ type: "pass", actor: "npc" })).toBe("");
    expect(activeTutorialAction({ node: { type: "player-move" }, phase: "button" })).toBe("");
  });
});

describe("focus cutout geometry", () => {
  it("uses exact elliptical corners instead of exposing a rectangular cutout", () => {
    expect(tutorialFocusShape({ x: 10, y: 20, width: 100, height: 60 }, ["50%", "50%", "50%", "50%"]))
      .toBe("M 60 20 H 60 A 50 30 0 0 1 110 50 V 50 A 50 30 0 0 1 60 80 H 60 A 50 30 0 0 1 10 50 V 50 A 50 30 0 0 1 60 20 Z");
  });
  it("preserves asymmetric paddle corners and clamps overlapping radii", () => {
    const shape = tutorialFocusShape({ x: 0, y: 0, width: 100, height: 50 }, ["100px", "100px", "100px", "100px"]);
    expect(shape).toContain("A 25 25");
    expect(tutorialFocusShape({ x: 0, y: 0, width: 150, height: 104 }, ["27px", "36px", "36px", "27px"]))
      .toContain("H 114 A 36 36");
  });
});
