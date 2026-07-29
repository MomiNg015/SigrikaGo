// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CHARACTERS } from "../shared/characters.js";
import HomeScreen from "./HomeScreen.jsx";

describe("HomeScreen practice difficulty picker", () => {
  afterEach(cleanup);

  it("opens three levels and starts the selected one with a random color", async () => {
    const onMatchModePickerOpenChange = vi.fn();
    const onStartPractice = vi.fn();
    const user = userEvent.setup();

    render(
      <HomeScreen
        user={{
          username: "practice-test",
          selectedCharacter: "sigrika",
          role: "player",
          modeStats: {}
        }}
        characters={CHARACTERS}
        matchModePickerOpen
        onMatchModePickerOpenChange={onMatchModePickerOpenChange}
        onStartMatch={vi.fn()}
        onStartPractice={onStartPractice}
      />
    );

    expect(screen.queryByRole("dialog", { name: "选择难度" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "准时宝陪练" }));

    expect(screen.getByRole("dialog", { name: "选择难度" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /入门/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /中级/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /高级/ })).toBeTruthy();
    expect(screen.queryByText("选择执棋颜色")).toBeNull();
    expect(onMatchModePickerOpenChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /中级/ }));

    expect(onMatchModePickerOpenChange).toHaveBeenCalledWith(false);
    expect(onStartPractice).toHaveBeenCalledTimes(1);
    expect(onStartPractice).toHaveBeenCalledWith({
      difficulty: "intermediate",
      playerColor: "random"
    });
  });

  it("closes only the nested picker on Escape and restores focus to the practice entry", async () => {
    const onMatchModePickerOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <HomeScreen
        user={{
          username: "practice-test",
          selectedCharacter: "sigrika",
          role: "player",
          modeStats: {}
        }}
        characters={CHARACTERS}
        matchModePickerOpen
        onMatchModePickerOpenChange={onMatchModePickerOpenChange}
        onStartMatch={vi.fn()}
        onStartPractice={vi.fn()}
      />
    );

    const practiceEntry = screen.getByRole("button", { name: "准时宝陪练" });
    await user.click(practiceEntry);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "选择难度" })).toBeNull();
    expect(onMatchModePickerOpenChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(practiceEntry);
  });
});
