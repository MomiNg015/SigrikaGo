// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MatchModal from "./MatchModal.jsx";
import OpeningModal from "./OpeningModal.jsx";
import RoomHeader from "../../room/header/RoomHeader.jsx";

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("match type presentation", () => {
  it("reveals expansion copy only at 15 seconds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    render(<MatchModal user={{}} characters={[]} startedAt={1000} onCancel={() => {}} />);
    expect(screen.queryByRole("status")).toBeNull();
    act(() => vi.advanceTimersByTime(14999));
    expect(screen.queryByRole("status")).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("status").textContent).toBe("（段位相近的玩家较少...开始自动匹配段位较远的玩家）");
  });
  it.each([[true, "rated", "升降级对局"], [false, "friendly", "友谊对局"]])("shares the %s classification between opening and header", (rated, id, label) => {
    const room = { code: "12345", rated, openingEndsAt: Date.now() + 3000 };
    const { container } = render(<><OpeningModal room={room} player={{ color: "black" }} /><RoomHeader room={room} /></>);
    const tag = screen.getByText(label);
    expect(tag.classList.contains(`is-${id}`)).toBe(true);
    expect(tag.nextElementSibling.textContent).toBe("本局你执黑");
    expect(container.querySelector(".room-code-label").classList.contains(`is-${id}`)).toBe(true);
    expect(container.querySelector(".room-code-label").title).toBe(label);
  });
});
