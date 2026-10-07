// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import WatchModal from "./WatchModal.jsx";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));

describe("WatchModal mode tabs", () => {
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

  it("keeps labels free of counts and loads rooms when switching modes", async () => {
    api.mockResolvedValue({
      rooms: [],
      roomCounts: { spark: 2, standard: 1, gomoku: 3 }
    });

    render(
      <WatchModal
        token="token"
        characters={{}}
        onJoinRoom={() => {}}
        onClose={() => {}}
      />
    );

    await waitFor(() => expect(screen.getByRole("tab", { name: "星炬" })).toBeTruthy());
    expect(screen.getByRole("tab", { name: "标准" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "五子棋" })).toBeTruthy();
    expect(api).toHaveBeenCalledWith("/api/rooms/watch?mode=spark", { token: "token" });
    expect(document.querySelector(".watch-mode-count")).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "标准", exact: true }));
    await waitFor(() => expect(api).toHaveBeenCalledWith("/api/rooms/watch?mode=standard", { token: "token" }));
    expect(screen.getByRole("tab", { name: "标准", exact: true }).getAttribute("aria-selected")).toBe("true");
  });
  it("shows a load error without presenting it as an empty room list", async () => {
    api.mockRejectedValue(new Error("网络不可用"));
    const { container } = render(<WatchModal token="token" characters={{}} onClose={() => {}} />);
    expect(await screen.findByText("网络不可用")).toBeTruthy();
    expect(container.querySelector(".window-empty-state")).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
  });

});
