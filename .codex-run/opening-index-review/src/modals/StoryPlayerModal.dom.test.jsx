// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import StoryPlayerModal from "./StoryPlayerModal.jsx";

describe("StoryPlayerModal interactions", () => {
  it("reveals the full current line when the portrait area is clicked", () => {
    const text = "这是一句仍在逐字显示的剧情文本。";
    const { container } = render(
      <StoryPlayerModal
        script={{
          startNodeId: "start",
          nodes: [{
            id: "start",
            type: "story",
            characterId: "sigrika",
            text,
            nextNodeId: ""
          }]
        }}
        characters={{
          sigrika: { name: "西格莉卡", portraitUrl: "/sigrika.webp" }
        }}
        portraitNodes={[]}
        onClose={() => {}}
      />
    );

    expect(screen.queryByText(text)).toBeNull();
    fireEvent.click(container.querySelector(".onboarding-story-portrait"));
    expect(screen.getByText(text)).toBeTruthy();
  });

  it("reports the active node so the corruption climax can switch the persistent UI state", () => {
    const onNodeEnter = vi.fn();
    render(
      <StoryPlayerModal
        script={{
          startNodeId: "corruption-climax",
          nodes: [{ id: "corruption-climax", type: "story", text: "数据损坏", nextNodeId: "" }]
        }}
        portraitNodes={[]}
        typewriterDisabled
        onClose={() => {}}
        onNodeEnter={onNodeEnter}
      />
    );

    expect(onNodeEnter).toHaveBeenCalledWith(
      "corruption-climax",
      expect.objectContaining({ node: expect.objectContaining({ id: "corruption-climax" }) })
    );
  });
});
