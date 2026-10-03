// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import StoryPlayerModal from "./StoryPlayerModal.jsx";

describe("StoryPlayerModal interactions", () => {
  it("retries a previously failed expression after another expression without remounting the body", () => {
    const sprite = { characterId: "sigrika", appearanceId: "sigrika-standard-v1", text: "原台词" };
    const { container } = render(<StoryPlayerModal script={{ startNodeId: "a", nodes: [
      { ...sprite, id: "a", expressionId: "smile", nextNodeId: "b" },
      { ...sprite, id: "b", expressionId: "thinking", nextNodeId: "c" },
      { ...sprite, id: "c", expressionId: "smile" }
    ] }} characters={{ sigrika: { name: "西格莉卡", portrait: "/legacy.webp" } }} portraitNodes={[]} typewriterDisabled />);
    const image = container.querySelector(".onboarding-story-portrait img");
    fireEvent.error(image);
    expect(image.getAttribute("data-story-fallback")).toBe("true");
    fireEvent.click(container.querySelector(".onboarding-story-single-action"));
    expect(image.src).toContain("thinking.webp");
    fireEvent.click(container.querySelector(".onboarding-story-single-action"));
    expect(container.querySelector(".onboarding-story-portrait img")).toBe(image);
    expect(image.src).toContain("smile.webp");
    expect(image.hasAttribute("data-story-fallback")).toBe(false);
  });
  it("changes expressions without remounting the same body, then clears narration and falls back on image failure", () => {
    const { container, unmount } = render(<StoryPlayerModal script={{ startNodeId: "first", nodes: [
      { id: "first", characterId: "sigrika", appearanceId: "sigrika-standard-v1", expressionId: "surprised", text: "原来的第一句", nextNodeId: "second" },
      { id: "second", characterId: "sigrika", appearanceId: "sigrika-standard-v1", expressionId: "thinking", text: "原来的第二句", nextNodeId: "narration" },
      { id: "narration", text: "原来的旁白", nextNodeId: "" }
    ] }} characters={{ sigrika: { name: "西格莉卡", portrait: "/legacy.webp" } }} portraitNodes={[]} typewriterDisabled />);
    const image = container.querySelector(".onboarding-story-portrait img");
    expect(image.src).toContain("surprised.webp");
    fireEvent.click(container.querySelector(".onboarding-story-single-action"));
    expect(container.querySelector(".onboarding-story-portrait img")).toBe(image);
    expect(image.src).toContain("thinking.webp");
    expect(container.textContent).toContain("原来的第二句");
    fireEvent.error(image);
    expect(image.src).toContain("/legacy.webp");
    fireEvent.click(container.querySelector(".onboarding-story-single-action"));
    expect(container.querySelector(".onboarding-story-portrait").childElementCount).toBe(0);
    expect(container.querySelector(".standard-story-sprite")).toBeNull();
    unmount();
  });
  it("clears the entire portrait area when character dialogue advances to narration", () => {
    const { container, unmount } = render(
      <StoryPlayerModal
        script={{
          startNodeId: "character",
          nodes: [
            { id: "character", characterId: "aemeath", speakerName: "爱弥斯", text: "再来一次！", nextNodeId: "narration" },
            { id: "narration", characterId: "", speakerName: "", text: "新的彩虹光纹随之炸开。", nextNodeId: "" }
          ]
        }}
        characters={{ aemeath: { name: "爱弥斯", portraitUrl: "/aemeath.webp" } }}
        portraitNodes={[]}
        typewriterDisabled
      />
    );
    const portrait = container.querySelector(".onboarding-story-portrait");
    expect(portrait.querySelector("img")).not.toBeNull();
    expect(portrait.textContent).toBe("爱弥斯");
    fireEvent.click(container.querySelector(".onboarding-story-single-action"));
    expect(portrait.childElementCount).toBe(0);
    expect(portrait.textContent).toBe("");
    expect(container.textContent).toContain("新的彩虹光纹随之炸开。");
    unmount();
  });

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
