// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CHARACTERS } from "../shared/characters.js";
import { PRACTICE_QUICK_START_OPTIONS } from "../shared/practiceMode.js";
import HomeScreen from "./HomeScreen.jsx";

describe("HomeScreen practice quick start", () => {
  afterEach(cleanup);

  it("starts basic practice with a random color without opening another settings surface", async () => {
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

    expect(screen.queryByLabelText("人机练习设置")).toBeNull();
    await user.click(screen.getByRole("button", { name: "准时宝陪练" }));

    expect(onMatchModePickerOpenChange).toHaveBeenCalledWith(false);
    expect(onStartPractice).toHaveBeenCalledTimes(1);
    expect(onStartPractice).toHaveBeenCalledWith(PRACTICE_QUICK_START_OPTIONS);
  });
});
