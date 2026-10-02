// @vitest-environment jsdom
import { useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import WindowBookmarkTabs from "./WindowBookmarkTabs.jsx";

afterEach(cleanup);

function Fixture({ campus = true, optedIn = true, pending = false, onChange = () => {} }) {
  const [mode, setMode] = useState("星炬");
  return <div className={`app-shell player-theme-enabled ${campus ? "theme-bright-school" : "theme-classic"}`}>
    <section role="dialog" className={optedIn ? "window-bookmark-host" : "user-profile-modal"}>
      <div data-testid="scroll-content" style={{ overflow: "hidden" }}>
        <WindowBookmarkTabs className="profile-mode-tabs" aria-label="对弈模式">
          {["星炬", "标准", "五子棋"].map((label) => <button
            key={label} id={`mode-${label}`} type="button" role="tab" aria-selected={label === mode}
            aria-disabled={pending || undefined} aria-controls="records" tabIndex={label === mode ? 0 : -1}
            onClick={() => { if (!pending) { setMode(label); onChange(label); } }}
          >{label}</button>)}
        </WindowBookmarkTabs>
        <section id="records" role="tabpanel" aria-labelledby={`mode-${mode}`}>{mode}战绩</section>
      </div>
    </section>
  </div>;
}

describe("window bookmark tabs", () => {
  it("escapes the inner scroller while preserving mode identity and callbacks", () => {
    const onChange = vi.fn();
    const { container } = render(<Fixture onChange={onChange} />);
    const tabs = screen.getByRole("tablist");
    expect(tabs.parentElement).toBe(screen.getByRole("dialog"));
    expect(screen.getByTestId("scroll-content").contains(tabs)).toBe(false);
    expect(tabs.getAttribute("aria-orientation")).toBe("vertical");
    fireEvent.click(screen.getByRole("tab", { name: "标准" }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith("标准");
    expect(screen.getByRole("tabpanel").textContent).toBe("标准战绩");
    expect(screen.getByRole("tab", { name: "标准" }).id).toBe("mode-标准");
    expect(container.querySelectorAll(".window-bookmark-paper")).toHaveLength(3);
  });

  it("uses vertical arrow and Home/End navigation with one active tab stop", () => {
    render(<Fixture />);
    const first = screen.getByRole("tab", { name: "星炬" });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "标准" }));
    fireEvent.keyDown(document.activeElement, { key: "End" });
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "五子棋" }));
    fireEvent.keyDown(document.activeElement, { key: "ArrowDown" });
    expect(document.activeElement).toBe(first);
    expect(screen.getAllByRole("tab").filter((tab) => tab.tabIndex === 0)).toHaveLength(1);
  });

  it("does not activate or move selection while mode data is pending", () => {
    const onChange = vi.fn();
    render(<Fixture pending onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("tab", { name: "星炬" }), { key: "ArrowDown" });
    fireEvent.click(screen.getByRole("tab", { name: "标准" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("tabpanel").textContent).toBe("星炬战绩");
  });

  it("keeps non-opted profiles and other themes inline, and responds to live theme changes", async () => {
    render(<Fixture optedIn={false} />);
    expect(screen.getByRole("tablist").parentElement).toBe(screen.getByTestId("scroll-content"));
    cleanup();
    const next = render(<Fixture campus={false} />);
    expect(screen.getByRole("tablist").className).toBe("profile-mode-tabs");
    next.rerender(<Fixture campus />);
    await act(async () => {});
    expect(screen.getByRole("tablist").className).toBe("window-bookmark-rail");
    const app = next.container.querySelector(".app-shell");
    await act(async () => { app.classList.add("is-sigrika-corrupted"); });
    expect(screen.getByRole("tablist").className).toBe("profile-mode-tabs");
    expect(next.container.querySelector(".window-bookmark-rail")).toBeNull();
  });
});
