import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import StoryPlayerModal, {
  nextStoryNodeId,
  resolveStoryRenderNodeId,
  storyTypewriterIntervalMs,
  visibleStoryOptions
} from "./StoryPlayerModal.jsx";
import { DENIA_RAINBOW_GLOW_STORY_PORTRAIT_ID } from "../shared/storyPortraits.js";
import { STORY_NODE_EFFECTS } from "../shared/storyPresentation.js";

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

  it("keeps the story shell on the next node when tutorial playback swaps the script window", () => {
    const nodesById = new Map([
      ["next", { id: "next", text: "下一句" }]
    ]);

    expect(resolveStoryRenderNodeId("previous", "next", nodesById)).toBe("next");
    expect(resolveStoryRenderNodeId("next", "start", nodesById)).toBe("next");
  });

  it("keys story portraits to the active node so swapped tutorial windows do not reuse stale images", () => {
    const source = readFileSync(new URL("./StoryPlayerModal.jsx", import.meta.url), "utf8");
    const html = renderToStaticMarkup(createElement(StoryPlayerModal, {
      script: {
        startNodeId: "next",
        nodes: [
          { id: "next", speakerName: "Sigrika", characterId: "sigrika", text: "下一句", nextNodeId: "" }
        ]
      },
      characters: {
        sigrika: { name: "Sigrika", portraitUrl: "/assets/characters/sigrika.webp" }
      },
      typewriterDisabled: true,
      onClose: () => {}
    }));

    expect(source).toContain("const portraitKey = `${activeNodeId}:");
    expect(source).toContain("key={portraitKey}");
    expect(html).toContain('data-story-node-id="next"');
    expect(html).toContain('data-story-character-id="sigrika"');
    expect(html).toContain('loading="eager"');
    expect(html).toContain('decoding="sync"');
  });

  it("marks long-text portrait compression nodes for effect styling", () => {
    const html = renderToStaticMarkup(createElement(StoryPlayerModal, {
      script: {
        startNodeId: "start",
        nodes: [
          {
            id: "start",
            speakerName: "Denia",
            characterId: "denia",
            effect: STORY_NODE_EFFECTS.longTextCompressPortrait,
            text: "very long",
            nextNodeId: ""
          }
        ]
      },
      typewriterDisabled: true,
      onClose: () => {}
    }));

    expect(html).toContain("onboarding-story-modal long-text-compress-portrait");
    expect(html).toContain('data-story-effect="long-text-compress-portrait"');
  });

  it("types long-text portrait compression nodes at one and a half times speed", () => {
    expect(storyTypewriterIntervalMs()).toBe(24);
    expect(storyTypewriterIntervalMs(STORY_NODE_EFFECTS.longTextCompressPortrait)).toBe(16);
  });

  it("reveals branch options independently by delay or when typing completes", () => {
    const node = {
      options: [
        { label: "Now", nextNodeId: "", revealDelaySeconds: 0 },
        { label: "Soon", nextNodeId: "", revealDelaySeconds: "0.5" },
        { label: "After text", nextNodeId: "" }
      ]
    };

    expect(visibleStoryOptions(node, { typingComplete: false, elapsedMs: 0 }).map((option) => option.label)).toEqual(["Now"]);
    expect(visibleStoryOptions(node, { typingComplete: false, elapsedMs: 499 }).map((option) => option.label)).toEqual(["Now"]);
    expect(visibleStoryOptions(node, { typingComplete: false, elapsedMs: 500 }).map((option) => option.label)).toEqual(["Now", "Soon"]);
    expect(visibleStoryOptions(node, { typingComplete: true, elapsedMs: 0 }).map((option) => option.label)).toEqual(["Now", "Soon", "After text"]);
  });
});
