// @vitest-environment jsdom
import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import MessageBoardModal from "./MessageBoardModal.jsx";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));
beforeEach(() => api.mockReset());
afterEach(cleanup);

describe("MessageBoardModal keyboard and submission", () => {
  function Harness() {
    const [opened, setOpened] = useState(false);
    return <><button onClick={() => setOpened(true)}>打开反馈</button>{opened && <MessageBoardModal token="token" onClose={() => setOpened(false)} />}</>;
  }

  it("labels, focuses and traps the feedback form, then restores its opener", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "打开反馈" });
    await user.click(opener);
    const dialog = screen.getByRole("dialog");
    expect(dialog.tagName).toBe("FORM");
    expect(dialog.getAttribute("aria-labelledby")).toBe("message-board-title");
    const close = screen.getByRole("button", { name: "关闭反馈窗口" });
    expect(document.activeElement).toBe(close);
    expect(screen.getByRole("textbox", { name: "反馈内容" })).toBeTruthy();
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "提交", exact: true }));
    await user.keyboard("{Tab}{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("guards two submit callbacks before render, preserves rejected content, and permits retry", async () => {
    let rejectSubmission;
    api.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectSubmission = reject; }));
    api.mockResolvedValue({});
    const onSubmitted = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<MessageBoardModal token="token" onSubmitted={onSubmitted} onClose={onClose} />);
    const dialog = screen.getByRole("dialog");
    const input = screen.getByRole("textbox", { name: "反馈内容" });
    await user.type(input, "  反馈内容  ");
    act(() => { fireEvent.submit(dialog); fireEvent.submit(dialog); });
    expect(api).toHaveBeenCalledOnce();
    expect(api).toHaveBeenCalledWith("/api/feedback", { method: "POST", token: "token", body: { content: "反馈内容" } });
    expect(screen.getByRole("button", { name: "提交中" }).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "关闭反馈窗口" }).disabled).toBe(false);
    await act(async () => rejectSubmission(new Error("反馈暂时无法提交")));
    expect(screen.getByText("反馈暂时无法提交")).toBeTruthy();
    expect(input.value).toBe("  反馈内容  ");
    await user.click(screen.getByRole("button", { name: "提交", exact: true }));
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledOnce());
    expect(onClose).toHaveBeenCalledOnce();
    expect(api).toHaveBeenCalledTimes(2);
  });

  it("keeps empty feedback local and does not consume the submission guard", async () => {
    const user = userEvent.setup();
    render(<MessageBoardModal token="token" onClose={() => {}} />);
    await user.click(screen.getByRole("button", { name: "提交", exact: true }));
    expect(screen.getByText("反馈内容不能为空")).toBeTruthy();
    expect(api).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "反馈内容" }).maxLength).toBe(400);
  });
});
