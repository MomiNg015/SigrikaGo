// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { createPortal } from "react-dom";
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

  it.each(["disabled", "disabled-focused", "removed"])("recovers lost focus when the current control is %s and routes Tab from the shell", async (change) => {
    const user = userEvent.setup();
    const onFocusCapture = vi.fn();
    const content = (pending) => (
      <ModalDialog ariaLabel="请求窗口" onFocusCapture={onFocusCapture}>
        <button type="button">关闭请求窗口</button>
        {!(pending && change === "removed") && <button type="button" disabled={pending}>提交请求</button>}
      </ModalDialog>
    );
    const view = render(content(false));
    const submit = screen.getByRole("button", { name: "提交请求" });
    submit.focus();
    // jsdom does not perform Chromium's native blur when a focused button is disabled.
    if (change === "disabled") submit.blur();
    view.rerender(content(true));
    const dialog = screen.getByRole("dialog", { name: "请求窗口" });
    const close = screen.getByRole("button", { name: "关闭请求窗口" });
    expect(document.activeElement).toBe(dialog);
    expect(onFocusCapture).toHaveBeenCalled();
    await user.tab();
    expect(document.activeElement).toBe(close);
    dialog.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(close);
    view.unmount();
  });

  it("keeps a currently focused field when another control becomes disabled", () => {
    const content = (pending) => (
      <ModalDialog ariaLabel="编辑窗口">
        <button type="button" disabled={pending}>保存</button>
        <input aria-label="编辑文本" />
      </ModalDialog>
    );
    const view = render(content(false));
    const field = screen.getByRole("textbox", { name: "编辑文本" });
    field.focus();
    view.rerender(content(true));
    expect(document.activeElement).toBe(field);
    view.unmount();
  });

  it("does not reclaim deliberately moved focus during a pending commit", () => {
    const external = document.createElement("button");
    document.body.append(external);
    const content = (pending) => <ModalDialog ariaLabel="外部焦点窗口"><button disabled={pending}>提交</button></ModalDialog>;
    const view = render(content(false));
    external.focus();
    view.rerender(content(true));
    expect(document.activeElement).toBe(external);
    view.unmount();
    external.remove();
  });

  it("preserves the current field in a nested portal when the parent action becomes disabled", () => {
    const content = (pending) => (
      <ModalDialog ariaLabel="父窗口">
        <button disabled={pending}>父窗口提交</button>
        {createPortal(<ModalDialog ariaLabel="嵌套窗口"><input aria-label="嵌套编辑" /></ModalDialog>, document.body)}
      </ModalDialog>
    );
    const view = render(content(false));
    const field = screen.getByRole("textbox", { name: "嵌套编辑" });
    field.focus();
    view.rerender(content(true));
    expect(document.activeElement).toBe(field);
    view.unmount();
  });
});
