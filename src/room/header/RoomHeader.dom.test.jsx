// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RoomHeader from "./RoomHeader.jsx";

const room = { code: "AB123", rated: false, game: { mode: "spark" } };
const info = { black: "黑方部员 3段", white: "白方部员 2段", moves: "0手" };
afterEach(cleanup);

describe("RoomHeader compact scoreboard", () => {
  it("follows the displayed turn independently of move parity, including extra turns and replay", () => {
    const { container, rerender } = render(<RoomHeader room={{ ...room, game: { ...room.game, turn: "black" } }} roomGameInfo={{ ...info, moves: "47手" }}/>);
    expect(container.querySelector(".room-move-placard").dataset.turn).toBe("black");
    expect(screen.getByLabelText("47手，轮黑方行棋")).toBeTruthy();
    rerender(<RoomHeader room={{ ...room, game: { ...room.game, turn: "white" } }} roomGameInfo={{ ...info, moves: "47手" }}/>);
    expect(container.querySelector(".room-move-placard").dataset.turn).toBe("white");
    expect(screen.getByLabelText("47手，轮白方行棋")).toBeTruthy();
  });

  it("shows zero and updated counts without a prefix, retaining room and player context", () => {
    const { container, rerender } = render(<RoomHeader room={room} roomGameInfo={info}/>);
    expect(container.querySelector(".room-move-placard").textContent).toBe("0手");
    expect(screen.getByLabelText("友谊对局 星炬 AB123")).toBeTruthy();
    expect(screen.getByText("黑方部员 3段")).toBeTruthy();
    expect(screen.getByText("白方部员 2段")).toBeTruthy();
    expect(screen.getByLabelText("黑方：黑方部员 3段").textContent).toBe("黑方部员 3段");
    expect(screen.getByLabelText("白方：白方部员 2段").textContent).toBe("白方部员 2段");
    rerender(<RoomHeader room={{ ...room, team: { round: 2 } }} roomGameInfo={{ ...info, moves: "123手" }}/>);
    expect(screen.getByText("Round 2")).toBeTruthy();
    expect(container.querySelector(".room-move-placard").textContent).toBe("123手");
    expect(container.querySelector(".room-move-placard strong").textContent).toBe("123");
    expect(container.querySelector(".room-move-placard").getAttribute("aria-label")).toBe("123手");
  });

  it("preserves utility callbacks, coordinate state, and mobile-menu dismissal", () => {
    const settings = vi.fn(); const coords = vi.fn(); const back = vi.fn();
    const { container } = render(<RoomHeader room={room} roomGameInfo={info} showCoords onOpenSettings={settings} onToggleCoords={coords} onBack={back}/>);
    fireEvent.click(screen.getByTitle("显示坐标"));
    expect(coords).toHaveBeenCalledTimes(1);
    expect(screen.getByTitle("显示坐标").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "选项" }));
    fireEvent.click(within(container.querySelector(".room-mobile-menu-panel")).getByRole("button", { name: "设置" }));
    expect(settings).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "选项" }).getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "退出房间" }));
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("retains existing presentation while players are missing and in corrupted duels", () => {
    const { container, rerender } = render(<RoomHeader room={room}/>);
    expect(container.querySelector(".room-move-placard")).toBeNull();
    expect(screen.getByText("星炬 AB123")).toBeTruthy();
    rerender(<RoomHeader room={{ ...room, sigrikaCandyDuel: {} }} roomGameInfo={info}/>);
    expect(container.querySelector(".room-move-placard")).toBeNull();
    expect(screen.getByText("星炬 ERROR")).toBeTruthy();
  });
});
