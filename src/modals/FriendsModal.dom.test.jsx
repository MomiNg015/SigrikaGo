// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "../api/client.js";
import FriendsModal from "./FriendsModal.jsx";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));
afterEach(cleanup);
beforeEach(() => api.mockReset());
describe("FriendsModal keyboard lifecycle", () => {
  const friend = { id: "friend-1", username: "WWWWWWWW", status: "online", characterId: "sigrika" };

  function Harness({ socket, onNotice }) {
    const [opened, setOpened] = useState(false);
    return <><button onClick={() => setOpened(true)}>打开社交窗口</button>{opened && <FriendsModal token="token" socket={socket} characters={{}} onNotice={onNotice} onClose={() => setOpened(false)} />}</>;
  }

  it("focuses and traps the main sheet, then returns to its opener", async () => {
    api.mockResolvedValue({ friends: [friend], blacklist: [] });
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "打开社交窗口" });
    await user.click(opener);
    const dialog = screen.getByRole("dialog", { name: "社交系统" });
    const close = within(dialog).getByRole("button", { name: "关闭好友窗口" });
    await waitFor(() => expect(document.activeElement).toBe(close));
    await screen.findByText(friend.username);
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(within(dialog).getByTitle("操作"));
    await user.keyboard("{Tab}{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("dismisses a nested confirmation without dismissing friends and restores its gear", async () => {
    api.mockResolvedValue({ friends: [friend], blacklist: [] });
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "打开社交窗口" }));
    await screen.findByText(friend.username);
    const gear = screen.getByTitle("操作");
    await user.click(gear);
    await user.click(screen.getByRole("button", { name: "解除好友", exact: true }));
    const confirm = screen.getByRole("dialog", { name: "解除好友" });
    expect(confirm.contains(document.activeElement)).toBe(true);
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(within(confirm).getByRole("button", { name: "返回" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "解除好友" })).toBeNull();
    expect(screen.getByRole("dialog", { name: "社交系统" })).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(gear));
  });

  it("preserves the duel payload and returns focus after selecting a mode", async () => {
    api.mockResolvedValue({ friends: [friend], blacklist: [] });
    const user = userEvent.setup();
    const socket = { on: vi.fn(), off: vi.fn(), emit: vi.fn() };
    render(<Harness socket={socket} />);
    await user.click(screen.getByRole("button", { name: "打开社交窗口" }));
    await screen.findByText(friend.username);
    const gear = screen.getByTitle("操作");
    await user.click(gear);
    await user.click(screen.getByRole("button", { name: "对局申请" }));
    const modes = screen.getByRole("dialog", { name: "选择对弈模式" });
    await user.click(modes.querySelector(".match-mode-option"));
    expect(socket.emit).toHaveBeenCalledWith("duel:request", { targetUserId: friend.id, mode: "spark" });
    expect(screen.queryByRole("dialog", { name: "选择对弈模式" })).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(gear));
  });

  it("returns to the main close control when the removed friend's gear disappears", async () => {
    api.mockImplementation((path) => Promise.resolve(path === "/api/social" ? { friends: [friend], blacklist: [] } : { friends: [], blacklist: [] }));
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "打开社交窗口" }));
    await screen.findByText(friend.username);
    await user.click(screen.getByTitle("操作"));
    await user.click(screen.getByRole("button", { name: "解除好友", exact: true }));
    await user.click(within(screen.getByRole("dialog", { name: "解除好友" })).getByRole("button", { name: "确定" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "解除好友" })).toBeNull());
    expect(api).toHaveBeenCalledWith("/api/social/friends/friend-1", { method: "DELETE", token: "token" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "关闭好友窗口" }));
  });

  it("guards repeated removal synchronously, reports failure, and retains the target for retry", async () => {
    let rejectRemoval;
    let removalCount = 0;
    api.mockImplementation((path) => {
      if (path === "/api/social") return Promise.resolve({ friends: [friend], blacklist: [] });
      removalCount += 1;
      return removalCount === 1 ? new Promise((_resolve, reject) => { rejectRemoval = reject; })
        : Promise.resolve({ friends: [], blacklist: [] });
    });
    const user = userEvent.setup();
    const onNotice = vi.fn();
    render(<Harness onNotice={onNotice} />);
    await user.click(screen.getByRole("button", { name: "打开社交窗口" }));
    await screen.findByText(friend.username);
    await user.click(screen.getByTitle("操作"));
    await user.click(screen.getByRole("button", { name: "解除好友", exact: true }));
    const dialog = screen.getByRole("dialog", { name: "解除好友" });
    const confirm = within(dialog).getByRole("button", { name: "确定" });
    act(() => { confirm.click(); confirm.click(); });
    expect(removalCount).toBe(1);
    expect(confirm.disabled).toBe(true);
    expect(dialog.getAttribute("aria-busy")).toBe("true");
    expect(within(dialog).getByRole("button", { name: "返回" }).disabled).toBe(false);
    await act(async () => rejectRemoval(new Error("网络暂时不可用")));
    expect(onNotice).toHaveBeenCalledWith("网络暂时不可用", "danger");
    expect(screen.getByRole("dialog", { name: "解除好友" })).toBe(dialog);
    expect(confirm.disabled).toBe(false);
    await user.click(confirm);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "解除好友" })).toBeNull());
    expect(removalCount).toBe(2);
  });
});
