import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import OnboardingStoryModal, { nextStoryNodeId } from "./OnboardingStoryModal.jsx";
import { readCssWithImports } from "../styles/cssTestUtils.js";

const onboardingStoryCss = readCssWithImports(new URL("../styles/modals/onboarding-story.css", import.meta.url));

const script = {
  startNodeId: "start",
  nodes: [
    {
      id: "start",
      speakerName: "希格莉卡",
      characterId: "sigrika",
      text: "你以前下过围棋吗？",
      options: [
        { label: "会一点", nextNodeId: "knows-go" },
        { label: "完全不会", nextNodeId: "new-go" }
      ]
    },
    { id: "knows-go", speakerName: "希格莉卡", characterId: "sigrika", text: "那我们直接看特色规则。", nextNodeId: "" },
    { id: "new-go", speakerName: "希格莉卡", characterId: "sigrika", text: "没关系，我会先讲基础。", nextNodeId: "" }
  ]
};

describe("OnboardingStoryModal", () => {
  it("renders a vertical text-first story stage with options after the text is complete", () => {
    const html = renderToStaticMarkup(createElement(OnboardingStoryModal, {
      script,
      characters: {
        sigrika: { name: "希格莉卡", portraitUrl: "/assets/characters/sigrika.webp" }
      },
      typewriterDisabled: true,
      onClose: () => {}
    }));

    expect(html).toContain("onboarding-story-modal");
    expect(html).toContain("onboarding-story-portrait");
    expect(html).toContain("onboarding-story-text-button");
    expect(html).toContain("onboarding-story-fast-forward");
    expect(html).toContain("aria-label=\"快进并跳过引导\"");
    expect(html).toContain("你以前下过围棋吗？");
    expect(html).toContain("会一点");
    expect(html).toContain("完全不会");
    expect(html).toContain('src="/assets/characters/sigrika.webp"');
  });

  it("routes option branches and sequential continue targets", () => {
    const startNode = script.nodes[0];
    const terminalNode = script.nodes[1];

    expect(nextStoryNodeId(startNode, startNode.options[1])).toBe("new-go");
    expect(nextStoryNodeId(terminalNode)).toBe("");
  });

  it("resolves portraits when admin content stores a character name instead of an id", () => {
    const html = renderToStaticMarkup(createElement(OnboardingStoryModal, {
      script: {
        startNodeId: "start",
        nodes: [
          { id: "start", speakerName: "", characterId: "Sigrika", text: "hello", nextNodeId: "", options: [] }
        ]
      },
      characters: {
        sigrika: { name: "Sigrika", portrait: "/assets/sigrika_centered.webp" }
      },
      typewriterDisabled: true,
      onClose: () => {}
    }));

    expect(html).toContain('src="/assets/sigrika_centered.webp"');
    expect(html).toContain(">Sigrika</span>");
  });

  it("keeps the requested story region ratio and responsive option layout contracts", () => {
    const backdropBlock = onboardingStoryCss.match(/\.onboarding-story-backdrop\s*\{[^}]+\}/)?.[0] ?? "";

    expect(backdropBlock).toContain("z-index: 100100 !important");
    expect(onboardingStoryCss).toContain("grid-template-rows: minmax(0, 4fr) minmax(0, 5fr) minmax(0, 1fr)");
    expect(onboardingStoryCss).toContain("grid-template-columns: repeat(auto-fit, minmax(0, 1fr))");
    expect(onboardingStoryCss).toContain("max-height: min(34dvh, 260px)");
    expect(onboardingStoryCss).toContain(".onboarding-story-portrait div");
    expect(onboardingStoryCss).toContain("border: 0;");
    expect(onboardingStoryCss).toContain("background: transparent;");
    expect(onboardingStoryCss).toContain("box-shadow: none;");
    expect(onboardingStoryCss).toContain("padding: 12px;");
    expect(onboardingStoryCss).not.toContain("padding: 12px 56px 12px 12px");
    expect(onboardingStoryCss).toContain(".onboarding-story-skip-backdrop");
    expect(onboardingStoryCss).toContain("position: absolute !important;");
    expect(onboardingStoryCss).toContain("place-items: center");
    expect(onboardingStoryCss).toContain("overflow: hidden;");
    expect(onboardingStoryCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .onboarding-story-modal .onboarding-story-skip-confirm");
    expect(onboardingStoryCss).toContain("width: min(420px, 100%) !important");
    expect(onboardingStoryCss).toContain("max-height: 100% !important");
  });
});
