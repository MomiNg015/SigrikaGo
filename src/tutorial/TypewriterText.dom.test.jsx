// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TypewriterText } from "./TutorialBattleScreen.jsx";

afterEach(() => cleanup());

describe("TypewriterText", () => {
  it("reveals the full current line immediately when requested", () => {
    const view = render(<TypewriterText text="还在打字的教学台词" />);
    expect(view.container.textContent).not.toBe("还在打字的教学台词");

    view.rerender(<TypewriterText revealAll text="还在打字的教学台词" />);
    expect(view.container.textContent).toBe("还在打字的教学台词");
  });
});
