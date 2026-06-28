import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import StoryPlayerModal, { nextStoryNodeId } from "./StoryPlayerModal.jsx";
import { DENIA_RAINBOW_GLOW_STORY_PORTRAIT_ID } from "../shared/storyPortraits.js";

describe("StoryPlayerModal", () => {
  it("renders configurable story player labels for non-onboarding interactions", () => {
    const html = renderToStaticMarkup(createElement(StoryPlayerModal, {
      script: {
        startNodeId: "start",
        nodes: [
          { id: "start", speakerName: "达妮娅", characterId: "denia", text: "这是什么糖？", nextNodeId: "" }
        ]
      },
      labels: {
        title: "道具互动",
        fastForward: "快进并跳过剧情",
        finish: "收下反馈",
        textLabel: "道具互动剧情文本"
      },
      typewriterDisabled: true,
      onClose: () => {}
    }));

    expect(html).toContain('aria-label="道具互动"');
    expect(html).toContain('aria-label="快进并跳过剧情"');
    expect(html).toContain('aria-label="道具互动剧情文本"');
    expect(html).toContain("收下反馈");
    expect(html).toContain("这是什么糖？");
  });
  it("resolves the rainbow-glow Denia story portrait without requiring a normal character row", () => {
    const html = renderToStaticMarkup(createElement(StoryPlayerModal, {
      script: {
        startNodeId: "start",
        nodes: [
          {
            id: "start",
            speakerName: "",
            characterId: DENIA_RAINBOW_GLOW_STORY_PORTRAIT_ID,
            text: "rainbow",
            nextNodeId: ""
          }
        ]
      },
      typewriterDisabled: true,
      onClose: () => {}
    }));

    expect(html).toContain("发彩虹光的达妮娅");
    expect(html).toContain("/assets/characters/denia_color.webp");
  });

  it("treats an option with an empty target as the close-window path", () => {
    expect(nextStoryNodeId({ nextNodeId: "fallback" }, { label: "Sneak away", nextNodeId: "" })).toBe("");
  });
});
