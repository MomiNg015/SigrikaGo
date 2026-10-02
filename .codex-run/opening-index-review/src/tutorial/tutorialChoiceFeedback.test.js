import { describe, expect, it } from "vitest";
import {
  TUTORIAL_CHOICE_FEEDBACK,
  tutorialChoiceFeedback,
  tutorialChoiceRetryFeedbackNode
} from "./tutorialChoiceFeedback.js";

describe("tutorialChoiceFeedback", () => {
  it("classifies retry branches as wrong and the advancing branch as correct", () => {
    const node = {
      id: "question",
      options: [
        { label: "正确", nextNodeId: "correct" },
        { label: "错误", nextNodeId: "wrong" }
      ]
    };
    const nodesById = new Map([
      ["correct", { id: "correct", nextNodeId: "next-lesson" }],
      ["wrong", { id: "wrong", nextNodeId: "question" }]
    ]);

    expect(tutorialChoiceFeedback(node, node.options[0], nodesById)).toBe(TUTORIAL_CHOICE_FEEDBACK.correct);
    expect(tutorialChoiceFeedback(node, node.options[1], nodesById)).toBe(TUTORIAL_CHOICE_FEEDBACK.wrong);
    expect(tutorialChoiceRetryFeedbackNode(node, node.options[1], nodesById)).toEqual({
      id: "wrong",
      nextNodeId: "question"
    });
  });

  it("recognizes a direct retry without requiring a separate feedback node", () => {
    const node = {
      id: "question",
      options: [
        { label: "正确", nextNodeId: "correct" },
        { label: "错误", nextNodeId: "question" }
      ]
    };

    expect(tutorialChoiceFeedback(node, node.options[1], new Map())).toBe(TUTORIAL_CHOICE_FEEDBACK.wrong);
    expect(tutorialChoiceRetryFeedbackNode(node, node.options[1], new Map())).toBeNull();
  });

  it("does not treat ordinary multi-branch dialogue or single replies as quiz answers", () => {
    const branch = {
      id: "branch",
      options: [
        { label: "A", nextNodeId: "a" },
        { label: "B", nextNodeId: "b" }
      ]
    };
    const reply = { id: "reply", options: [{ label: "继续", nextNodeId: "next" }] };

    expect(tutorialChoiceFeedback(branch, branch.options[0], new Map())).toBe("");
    expect(tutorialChoiceFeedback(reply, reply.options[0], new Map())).toBe("");
    expect(tutorialChoiceRetryFeedbackNode(branch, branch.options[0], new Map())).toBeNull();
  });
});
