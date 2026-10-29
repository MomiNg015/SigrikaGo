import { expect, it } from "vitest";
import { tutorialInputFocusMode } from "./TutorialInputFocus.jsx";
it("focuses moves and guided actions without dimming choices or continuation", () => {
  const choices = { node: { options: [{ label: "落子" }] }, choicesVisible: true };
  expect(tutorialInputFocusMode(choices)).toBe("");
  expect(tutorialInputFocusMode({ node: { type: "player-move" } })).toBe("board");
  expect(tutorialInputFocusMode({ phase: "skill-button" })).toBe("actions");
  expect(tutorialInputFocusMode({ ...choices, pendingWait: {} })).toBe("");
  expect(tutorialInputFocusMode({ ...choices, loading: {} })).toBe("");
  expect(tutorialInputFocusMode({ ...choices, confirmExit: {} })).toBe("");
  expect(tutorialInputFocusMode({ node: { type: "player-move" }, phase: "continue" })).toBe("");
  expect(tutorialInputFocusMode({ node: { options: [{ label: "继续" }, { label: "立即继续" }] }, choicesVisible: true })).toBe("");
});
