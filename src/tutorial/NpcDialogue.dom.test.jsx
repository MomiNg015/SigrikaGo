// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NpcDialogue from "./NpcDialogue.jsx";
import { resolveStoryPortraitPresentation } from "../shared/characterStorySprites.js";

describe("NPC guide expressions", () => {
  it("updates the exact line, speaker and small expression image together", () => {
    const bubble = (id, characterId, expressionId, text) => {
      const portrait = resolveStoryPortraitPresentation({ characterId, appearanceId: `${characterId}-standard-v1`, expressionId }, { variant: "avatar" });
      return { id, text, speakerName: characterId, portrait: portrait.src, appearanceId: portrait.appearanceId, expressionId: portrait.expressionId };
    };
    const { container, rerender, unmount } = render(<NpcDialogue bubble={bubble("1", "sigrika", "serious", "保持原台词")} revealAll />);
    expect(container.querySelector("img").src).toContain("serious-avatar.webp");
    rerender(<NpcDialogue bubble={bubble("2", "denia", "playful", "另一句原台词")} revealAll />);
    expect(container.querySelector("img").src).toContain("denia/playful-avatar.webp");
    expect(container.textContent).toBe("denia另一句原台词");
    expect(container.querySelector("section").dataset.storyExpression).toBe("playful");
    rerender(<NpcDialogue bubble={null} />);
    expect(container.childElementCount).toBe(0);
    unmount();
  });
});
