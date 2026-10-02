// @vitest-environment jsdom
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StorySpriteFields } from "./AdminOnboardingStory.jsx";

describe("story appearance editor", () => {
  it("offers only the selected character's expressions and changes presentation fields only", () => {
    const onPatch = vi.fn();
    const node = { characterId: "denia", text: "保留原台词", appearanceId: "denia-standard-v1", expressionId: "smile" };
    const { getByLabelText, queryByText, rerender, unmount } = render(<StorySpriteFields node={node} onPatch={onPatch} />);
    expect(queryByText("困倦")).not.toBeNull();
    expect(queryByText("害羞")).toBeNull();
    fireEvent.change(getByLabelText("角色表情"), { target: { value: "playful" } });
    expect(onPatch).toHaveBeenLastCalledWith({ expressionId: "playful" });
    fireEvent.change(getByLabelText("立绘造型"), { target: { value: "" } });
    expect(onPatch).toHaveBeenLastCalledWith({ appearanceId: "", expressionId: "" });
    rerender(<StorySpriteFields node={{ characterId: "denia-rainbow-glow" }} onPatch={onPatch} />);
    expect(queryByText("立绘造型")).toBeNull();
    unmount();
  });
});
