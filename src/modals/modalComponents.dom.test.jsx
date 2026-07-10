// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModalDialog } from "./modalComponents.jsx";

describe("ModalDialog DOM interaction", () => {
  it("focuses the first control, traps Tab, and closes on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <ModalDialog ariaLabel="测试窗口" onClose={onClose}>
        <button type="button">第一个</button>
        <button type="button">第二个</button>
      </ModalDialog>
    );

    const first = screen.getByRole("button", { name: "第一个" });
    const second = screen.getByRole("button", { name: "第二个" });
    expect(document.activeElement).toBe(first);
    await user.tab();
    expect(document.activeElement).toBe(second);
    await user.tab();
    expect(document.activeElement).toBe(first);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("restores focus to the opener when unmounted", () => {
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    const view = render(
      <ModalDialog ariaLabel="测试窗口" onClose={() => {}}>
        <button type="button">关闭</button>
      </ModalDialog>
    );

    view.unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it("focuses the dialog shell when it has no interactive controls", () => {
    render(<ModalDialog ariaLabel="纯文本窗口">暂无内容</ModalDialog>);

    expect(document.activeElement).toBe(screen.getByRole("dialog", { name: "纯文本窗口" }));
  });
});
