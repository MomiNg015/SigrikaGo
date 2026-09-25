// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import HomeScreen from "./HomeScreen.jsx";
import { CHARACTERS } from "../shared/characters.js";
import { CAPTURE_CHALLENGE_MODE } from "../shared/captureChallenge.js";

afterEach(cleanup);

function setup(extra = {}) {
  const onStartMatch = vi.fn();
  const onStartPractice = vi.fn();
  const props = { user: { username: "test", selectedCharacter: "sigrika", role: "player" }, characters: CHARACTERS, matchModePickerOpen: true, onStartMatch, onStartPractice, ...extra };
  const view = render(<HomeScreen {...props} />);
  const parent = screen.getByRole("button", { name: /星炬对弈.*匹配中/ });
  return { ...view, parent, props, onStartMatch, onStartPractice };
}

describe("Spark mode expansion", () => {
  it("expands without queuing, keeps practice available, and queues only the regular child", () => {
    const { parent, onStartMatch } = setup();
    const practice = screen.getByRole("button", { name: "准时宝陪练" });
    fireEvent.click(parent);
    expect(onStartMatch).not.toHaveBeenCalled();
    expect(parent.getAttribute("aria-expanded")).toBe("true");
    expect(screen.queryByRole("button", { name: /标准对弈.*匹配中/ })).toBeNull();
    expect(screen.getByRole("button", { name: "队际赛" }).disabled).toBe(false);
    expect(screen.getByRole("button", { name: "准时宝陪练" })).toBe(practice);
    expect(practice.closest("[inert]")).toBeNull();
    fireEvent.click(practice);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(within(screen.getByRole("dialog")).queryByRole("button", { name: /吃子挑战赛/ })).toBeNull();
    expect(within(screen.getByRole("dialog")).getByRole("button", { name: /高级/ })).toBeTruthy();
    // Close the nested dialog without collapsing its parent selection.
    fireEvent.click(screen.getAllByRole("button", { name: "返回" }).at(-1));
    expect(parent.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /常规匹配.*匹配中/ }));
    expect(onStartMatch).toHaveBeenCalledWith("spark");
  });

  it("starts the existing capture challenge with its required payload", () => {
    const { parent, onStartMatch, onStartPractice } = setup();
    fireEvent.click(parent);
    fireEvent.click(screen.getByRole("button", { name: "吃子挑战赛" }));
    expect(onStartPractice).toHaveBeenCalledWith({ difficulty: "advanced", challenge: CAPTURE_CHALLENGE_MODE, playerColor: "random" });
    expect(onStartMatch).not.toHaveBeenCalled();
  });

  it.each([
    ["吃子挑战赛", "100手内尽可能吃掉准时宝的棋子吧！吃得越多排名越高！"],
    ["队际赛", "挑选3位部员，进行一盘棋接力3个阶段的紧张刺激的队际赛！"]
  ])("opens the %s rule popover from its card corner", (title, rules) => {
    const { parent } = setup();
    fireEvent.click(parent);
    fireEvent.click(screen.getByRole("button", { name: `查看${title}规则` }));
    expect(screen.getByRole("tooltip").textContent).toContain(rules);
  });

  it("returns focus to Spark, disables hidden children and resets after reopening", () => {
    const { parent, rerender, props } = setup();
    fireEvent.click(parent);
    fireEvent.click(screen.getByRole("button", { name: "返回" }));
    expect(document.activeElement).toBe(parent);
    expect(screen.queryByRole("button", { name: "吃子挑战赛" })).toBeNull();
    expect(document.querySelector("#spark-match-submodes").hasAttribute("inert")).toBe(true);
    fireEvent.click(parent);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(parent.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(parent);
    rerender(<HomeScreen {...props} matchModePickerOpen={false} />);
    rerender(<HomeScreen {...props} />);
    expect(screen.getByRole("button", { name: /星炬对弈.*匹配中/ }).getAttribute("aria-expanded")).toBe("false");
  });

  it("preserves the corrupted-story lockout", () => {
    const { parent, container, onStartMatch } = setup({ user: { username: "test", selectedCharacter: "sigrika", sigrikaCandyArc: { corrupted: true } } });
    expect(parent.disabled).toBe(true);
    expect(container.querySelector(".match-mode-drilldown")).toBeNull();
    fireEvent.click(parent);
    expect(onStartMatch).not.toHaveBeenCalled();
  });
});
