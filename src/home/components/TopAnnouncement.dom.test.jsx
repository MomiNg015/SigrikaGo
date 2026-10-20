// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TopAnnouncement from "./TopAnnouncement.jsx";

let resize, preference, textWidth;
const disconnect = vi.fn();
beforeEach(() => {
  textWidth = 800;
  vi.stubGlobal("ResizeObserver", class { constructor(callback) { resize = callback; } observe() {} disconnect() { disconnect(); } });
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: (_type, callback) => { preference = callback; }, removeEventListener: vi.fn() }));
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({ width: textWidth }));
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(300);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("campus announcement", () => {
  it("hides disabled or blank content and treats markup as plain text", () => {
    const view = render(<TopAnnouncement text="隐藏" />);
    expect(screen.queryByLabelText("校园播报")).toBeNull();
    view.rerender(<TopAnnouncement enabled text={" \n "} />);
    expect(screen.queryByLabelText("校园播报")).toBeNull();
    view.rerender(<TopAnnouncement enabled text={" <b>公告</b>\n第二行 "} />);
    expect(screen.getByRole("status").textContent).toBe("<b>公告</b> 第二行");
    expect(view.container.querySelector("b")).toBeNull();
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("remeasures overflow, supports pause and resets pause for a replacement notice", () => {
    const view = render(<TopAnnouncement enabled text="公告" />);
    fireEvent.click(screen.getByRole("button", { name: "暂停滚动公告" }));
    expect(screen.getByLabelText("校园播报").dataset.paused).toBe("true");
    view.rerender(<TopAnnouncement enabled text="新的公告" />);
    expect(screen.getByLabelText("校园播报").dataset.paused).toBe("false");
    textWidth = 150;
    act(() => resize());
    expect(screen.queryByRole("button")).toBeNull();
    expect(view.container.querySelector(".is-scrolling")).toBeNull();
    textWidth = 800;
    act(() => resize());
    expect(screen.getByRole("button", { name: "暂停滚动公告" })).not.toBeNull();
    view.unmount();
    expect(disconnect).toHaveBeenCalledTimes(2);
  });

  it("uses a single manually readable text copy when motion preference changes", () => {
    const query = { matches: false, addEventListener: (_type, callback) => { preference = callback; }, removeEventListener: vi.fn() };
    vi.stubGlobal("matchMedia", () => query);
    const view = render(<TopAnnouncement enabled text="公告" />);
    query.matches = true;
    act(() => preference());
    expect(view.container.querySelector(".is-scrolling")).toBeNull();
    expect(view.container.querySelectorAll(".campus-broadcast-track > span")).toHaveLength(1);
    expect(screen.getByLabelText("公告内容").tabIndex).toBe(0);
    view.unmount();
    expect(query.removeEventListener).toHaveBeenCalledWith("change", preference);
  });
});
