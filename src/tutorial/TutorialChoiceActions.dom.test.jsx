// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TutorialChoiceActions } from "./TutorialBattleScreen.jsx";

describe("TutorialChoiceActions", () => {
  afterEach(() => cleanup());

  it("focuses the first reply and submits only one choice", async () => {
    const onChoice = vi.fn();
    render(
      <TutorialChoiceActions
        node={{
          id: "choice-1",
          options: [
            { label: "先看左上角的棋形" },
            { label: "先看右下角的棋形" }
          ]
        }}
        onChoice={onChoice}
      />
    );

    const firstChoice = screen.getByRole("button", { name: "先看左上角的棋形" });
    await waitFor(() => expect(document.activeElement).toBe(firstChoice));

    fireEvent.click(firstChoice);
    fireEvent.click(screen.getByRole("button", { name: "先看右下角的棋形" }));

    expect(onChoice).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("group", { name: "请选择回答" }).getAttribute("aria-busy")).toBe("true");
    expect(firstChoice.disabled).toBe(true);
  });

  it("renders long and multiple reply labels without truncating their text", () => {
    const longLabel = "先判断左上角黑棋有没有逃跑空间，再比较右下角白棋是否已经形成完整的两个眼位";
    render(
      <TutorialChoiceActions
        node={{
          id: "choice-2",
          options: [
            { label: longLabel },
            { label: "我想再观察一下棋盘" },
            { label: "我已经看清楚了" }
          ]
        }}
        onChoice={() => {}}
      />
    );

    expect(screen.getByText(longLabel).textContent).toBe(longLabel);
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("blocks replies under history/exit overlays and preserves restored header focus", () => {
    const onChoice = vi.fn();
    const node = { id: "blocked-choice", options: [{ label: "回答" }] };
    const { rerender } = render(<TutorialChoiceActions node={node} onChoice={onChoice} disabled />);
    const answer = screen.getByRole("button", { name: "回答" });
    fireEvent.click(answer);
    expect(onChoice).not.toHaveBeenCalled();
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    rerender(<TutorialChoiceActions node={node} onChoice={onChoice} />);
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(answer);
    expect(onChoice).toHaveBeenCalledOnce();
    trigger.remove();
  });
});
