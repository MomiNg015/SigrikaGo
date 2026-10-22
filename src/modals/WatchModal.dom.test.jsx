// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import WatchModal from "./WatchModal.jsx";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));

describe("WatchModal ledger", () => {
  beforeEach(() => {
    api.mockReset();
  });

  afterEach(cleanup);

  it("keeps first-load focus on the close button while refresh is unavailable", async () => {
    api.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<WatchModal token="token" characters={{}} onClose={onClose} />);
    const close = screen.getByRole("button", { name: "关闭对局列表" });
    expect(screen.getByRole("button", { name: "刷新对局列表" }).disabled).toBe(true);
    expect(document.activeElement).toBe(close);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows every type without tabs, searches locally and joins the chosen room", async () => {
    const onJoinRoom = vi.fn();
    const onClose = vi.fn();
    api.mockResolvedValue({ rooms: [
      { code: "483126", mode: "spark", black: { user: { username: "橘子" }, characterId: "sigrika", connected: true }, white: null, moveNumber: 86, onlineCount: 12, status: "playing" },
      ...["standard", "gomoku", "team"].map((mode, index) => ({ code: String(500001 + index), mode, moveNumber: 1024, onlineCount: 128, status: "finished" }))
    ] });
    render(<WatchModal token="token" characters={{}} onJoinRoom={onJoinRoom} onClose={onClose}/>);
    await screen.findByRole("table", { name: "全部类型对局" });
    expect(api).toHaveBeenCalledWith("/api/rooms/watch?mode=all", { token: "token" });
    expect(screen.queryByRole("tab")).toBeNull();
    for (const label of ["星炬", "标准", "五子棋", "队际赛"]) expect(screen.getByText(label)).toBeTruthy();
    const search = screen.getByRole("textbox", { name: "搜索房间或玩家" });
    expect(screen.queryByRole("button", { name: "搜索", exact: true })).toBeNull();
    expect(screen.getByRole("button", { name: "观战房间 500003" }).closest("tr").classList.contains("finished")).toBe(true);
    fireEvent.change(search, { target: { value: "橘子" } });
    expect(screen.getAllByRole("row")).toHaveLength(2);
    fireEvent.change(search, { target: { value: "nothing" } });
    expect(screen.getByText("未找到对局")).toBeTruthy();
    fireEvent.change(search, { target: { value: "500003" } });
    fireEvent.click(screen.getByRole("button", { name: "观战房间 500003" }));
    expect(onJoinRoom).toHaveBeenCalledWith("500003");
    expect(onClose).toHaveBeenCalledOnce();
    expect(api).toHaveBeenCalledTimes(1);
  });

  it("preserves rooms on refresh failure and recovers on retry", async () => {
    api.mockResolvedValueOnce({ rooms: [{ code: "123456", mode: "standard", moveNumber: 1, onlineCount: 2 }] });
    render(<WatchModal token="token" characters={{}} onClose={() => {}}/>);
    await screen.findByText("123456");
    api.mockRejectedValueOnce(new Error("刷新失败"));
    fireEvent.click(screen.getByRole("button", { name: "刷新对局列表" }));
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "刷新失败");
    expect(screen.getByText("123456")).toBeTruthy();
    api.mockResolvedValueOnce({ rooms: [] });
    fireEvent.click(screen.getByRole("button", { name: "刷新对局列表" }));
    expect(await screen.findByText("暂无对局")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows a load error without presenting it as an empty room list", async () => {
    api.mockRejectedValue(new Error("网络不可用"));
    const { container } = render(<WatchModal token="token" characters={{}} onClose={() => {}} />);
    expect(await screen.findByText("网络不可用")).toBeTruthy();
    expect(container.querySelector(".window-empty-state")).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
  });

});
