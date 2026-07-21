// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
