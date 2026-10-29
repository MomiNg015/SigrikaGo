// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ActionBar from "./ActionBar.jsx";

const props = (overrides = {}) => ({
  role: "player", phase: "playing", mode: "spark", me: { user: { id: "u" } },
  isMyTurn: true, pendingSkill: false, skillName: "远航星", skillUses: 2,
  setPendingSkill: vi.fn(), onPass: vi.fn(), onCountingRequest: vi.fn(), onDrawRequest: vi.fn(), onResign: vi.fn(),
  ...overrides
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("battle action keys", () => {
  it("retains all five keys and only enables the guided action, including dead-stone phases", () => {
    const p = props({ phase: "marking-dead", scoring: { confirmedBy: [] } });
    const { container, rerender } = render(<ActionBar {...p} tutorialAction=""/>);
    expect(screen.getAllByRole("button")).toHaveLength(5);
    expect(screen.getAllByRole("button").every(button => button.disabled)).toBe(true);
    for (const action of ["pass", "counting", "skill", "draw", "resign"]) {
      rerender(<ActionBar {...p} tutorialAction={action}/>);
      const enabled = screen.getAllByRole("button").filter(button => !button.disabled);
      expect(enabled).toHaveLength(1);
      expect(enabled[0].classList.contains(`${action}-action`)).toBe(true);
      expect(container.querySelectorAll('[data-tutorial-target="true"]')).toHaveLength(1);
    }
    rerender(<ActionBar {...props()} tutorialAction=""/>);
    for (const button of screen.getAllByRole("button")) fireEvent.click(button);
    expect(p.onPass).not.toHaveBeenCalled();
  });
  it("keeps every real action wired once while separating the effective skill name and charges", () => {
    const p = props();
    render(<ActionBar {...p}/>);
    const skill = screen.getByRole("button", { name: "远航星，剩余 2 次" });
    expect(skill.querySelector(".action-label").textContent).toBe("远航星");
    expect(skill.querySelector(".skill-use-window").textContent).toBe("02");
    for (const [name, callback] of [["弃手", "onPass"], ["数子", "onCountingRequest"], ["和棋", "onDrawRequest"], ["认输", "onResign"]]) {
      fireEvent.click(screen.getByRole("button", { name }));
      expect(p[callback]).toHaveBeenCalledTimes(1);
    }
    fireEvent.click(skill);
    expect(p.setPendingSkill).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("distinguishes a turn lock from exhausted charges and updates derived names/counts", () => {
    const { rerender } = render(<ActionBar {...props({ isMyTurn: false })}/>);
    let skill = screen.getByRole("button", { name: "远航星，剩余 2 次" });
    expect(skill.disabled).toBe(true);
    expect(skill.classList.contains("spent")).toBe(false);
    rerender(<ActionBar {...props({ skillName: "星落日灵", skillUses: 0 })}/>);
    skill = screen.getByRole("button", { name: "星落日灵，剩余 0 次" });
    expect(skill.disabled).toBe(true);
    expect(skill.classList.contains("spent")).toBe(true);
    expect(skill.querySelector(".skill-use-window").textContent).toBe("00");
    rerender(<ActionBar {...props({ skillName: "很长很长的派生技能名称", skillUses: 12, pendingSkill: true })}/>);
    skill = screen.getByRole("button", { name: "很长很长的派生技能名称，剩余 12 次" });
    expect(skill.getAttribute("data-long-name")).toBe("true");
    expect(skill.getAttribute("aria-pressed")).toBe("true");
  });

  it("clears transient press after release, cancel, blur, disable and unmount", () => {
    vi.useFakeTimers();
    const p = props();
    const { rerender, unmount } = render(<ActionBar {...p}/>);
    const pass = screen.getByRole("button", { name: "弃手" });
    fireEvent.keyDown(pass, { key: " " });
    expect(pass.getAttribute("data-pressed")).toBe("true");
    fireEvent.keyUp(pass, { key: " " });
    act(() => vi.advanceTimersByTime(120));
    expect(pass.hasAttribute("data-pressed")).toBe(false);
    fireEvent.keyDown(pass, { key: "Enter" });
    fireEvent.pointerCancel(pass);
    expect(pass.hasAttribute("data-pressed")).toBe(false);
    fireEvent.keyDown(pass, { key: "Enter" });
    fireEvent.blur(pass);
    expect(pass.hasAttribute("data-pressed")).toBe(false);
    fireEvent.keyDown(pass, { key: "Enter" });
    fireEvent.blur(window);
    expect(pass.hasAttribute("data-pressed")).toBe(false);
    fireEvent.keyDown(pass, { key: "Enter" });
    rerender(<ActionBar {...p} skillLocked/>);
    expect(pass.hasAttribute("data-pressed")).toBe(false);
    fireEvent.click(pass);
    expect(p.onPass).not.toHaveBeenCalled();
    rerender(<ActionBar {...p}/>);
    fireEvent.click(pass);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("retains distinct spectator and dead-stone decision bars", () => {
    const { container, rerender } = render(<ActionBar {...props({ role: "spectator" })}/>);
    expect(container.querySelector(".battle-arcade-controls")).toBeNull();
    rerender(<ActionBar {...props({ phase: "marking-dead", scoring: { confirmedBy: [] } })}/>);
    expect(container.querySelector(".battle-arcade-controls")).toBeNull();
  });
});
