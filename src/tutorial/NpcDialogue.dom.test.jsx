// @vitest-environment jsdom
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NpcDialogue from "./NpcDialogue.jsx";
import { resolveStoryPortraitPresentation } from "../shared/characterStorySprites.js";

describe("NPC guide expressions", () => {
  it("updates the exact line, speaker and framed expression avatar together", () => {
    const bubble = (id, characterId, expressionId, text) => {
      const portrait = resolveStoryPortraitPresentation({ characterId, appearanceId: `${characterId}-standard-v1`, expressionId }, { variant: "avatar" });
      return { id, text, speakerName: characterId, portrait: portrait.src, standardPortrait: portrait.standard, appearanceId: portrait.appearanceId, expressionId: portrait.expressionId };
    };
    const { container, rerender, unmount } = render(<NpcDialogue bubble={bubble("1", "sigrika", "serious", "保持原台词")} revealAll />);
    expect(container.querySelector("img").src).toContain("serious-avatar.webp");
    rerender(<NpcDialogue bubble={bubble("2", "denia", "playful", "另一句原台词")} revealAll />);
    expect(container.querySelector("img").src).toContain("denia/playful-avatar.webp");
    expect(container.textContent).toBe("denia另一句原台词");
    expect(container.querySelector("section").dataset.storyExpression).toBe("playful");
    rerender(<NpcDialogue bubble={{ id: "3", text: "无头像的提示", speakerName: "提示" }} revealAll />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".tutorial-npc-copy").textContent).toBe("提示无头像的提示");
    rerender(<NpcDialogue bubble={null} />);
    expect(container.childElementCount).toBe(0);
    unmount();
  });

  it("uses the legacy image in the same portrait frame on load failure and restores it for the next expression", () => {
    const bubble = { id: "1", speakerName: "西格莉卡", text: "原台词", portrait: "/smile.webp", standardPortrait: true, fallbackPortrait: "/legacy.webp" };
    const { container, rerender } = render(<NpcDialogue bubble={bubble} revealAll />);
    const image = container.querySelector("img");
    expect(container.querySelector(".standard-npc-slot")).not.toBeNull();
    fireEvent.error(image);
    expect(image.getAttribute("src")).toBe("/legacy.webp");
    expect(container.querySelector(".standard-npc-sprite")).toBeNull();
    expect(container.querySelector(".standard-npc-slot")).toBeNull();
    rerender(<NpcDialogue bubble={{ ...bubble, id: "2", portrait: "/thinking.webp" }} revealAll />);
    expect(container.querySelector("img")).toBe(image);
    expect(image.getAttribute("src")).toBe("/thinking.webp");
    expect(container.querySelector(".standard-npc-sprite")).not.toBeNull();
    rerender(<NpcDialogue bubble={bubble} revealAll />);
    expect(image.getAttribute("src")).toBe("/smile.webp");
    expect(container.querySelector(".standard-npc-sprite")).not.toBeNull();
  });
});
