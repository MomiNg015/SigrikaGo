// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from "@testing-library/react";
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

    expect(screen.queryByRole("dialog", { name: "准时宝陪练" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "准时宝陪练" }));

    expect(screen.getByRole("dialog", { name: "准时宝陪练" })).toBeTruthy();
    expect(screen.queryByText("选择难度")).toBeNull();
    expect(screen.getByText("随机猜先。")).toBeTruthy();
    expect(screen.getByText("吃掉准时宝22颗子或数子胜即算胜利！")).toBeTruthy();
    expect(screen.getByText("沙包型准时宝")).toBeTruthy();
    expect(screen.getByText("一般型准时宝")).toBeTruthy();
    expect(screen.getByText("红温型准时宝")).toBeTruthy();
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

  it("keeps both onboarding actions inert during Sigrika corruption", async () => {
    const onOpenOnboardingStory = vi.fn();
    const user = userEvent.setup();

    render(
      <HomeScreen
        user={{
          username: "corruption-test",
          selectedCharacter: "sigrika",
          role: "player",
          modeStats: {},
          sigrikaCandyArc: { phase: "awaiting-duel", corrupted: true }
        }}
        characters={CHARACTERS}
        onOpenOnboardingStory={onOpenOnboardingStory}
      />
    );

    const onboardingActions = screen.getAllByRole("button", { name: "打开新手引导", hidden: true });
    expect(onboardingActions).toHaveLength(2);

    for (const action of onboardingActions) {
      expect(action.disabled).toBe(true);
      await user.click(action);
    }

    expect(onOpenOnboardingStory).not.toHaveBeenCalled();
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

    expect(screen.queryByRole("dialog", { name: "准时宝陪练" })).toBeNull();
    expect(onMatchModePickerOpenChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(practiceEntry);
  });

  it("requires an explicit high-difficulty confirmation before starting the Sigrika duel", async () => {
    const onMatchModePickerOpenChange = vi.fn();
    const onStartSigrikaDuel = vi.fn();
    const user = userEvent.setup();

    render(
      <HomeScreen
        user={corruptedUser()}
        characters={CHARACTERS}
        matchModePickerOpen
        socket={duelSocket({ status: "available" })}
        onMatchModePickerOpenChange={onMatchModePickerOpenChange}
        onStartMatch={vi.fn()}
        onStartPractice={vi.fn()}
        onStartSigrikaDuel={onStartSigrikaDuel}
      />
    );

    await user.click(await screen.findByRole("button", { name: "与西格莉卡？决战" }));

    const confirmDialog = screen.getByRole("dialog", { name: "确认参与决战" });
    expect(within(confirmDialog).getByText("本对局为高难度对局，用时为30分钟包干制，确定参与吗？")).toBeTruthy();
    expect(onMatchModePickerOpenChange).not.toHaveBeenCalled();
    expect(onStartSigrikaDuel).not.toHaveBeenCalled();

    await user.click(within(confirmDialog).getByRole("button", { name: "取消" }));
    expect(screen.queryByRole("dialog", { name: "确认参与决战" })).toBeNull();
    expect(onMatchModePickerOpenChange).not.toHaveBeenCalled();
    expect(onStartSigrikaDuel).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "与西格莉卡？决战" }));
    await user.click(within(screen.getByRole("dialog", { name: "确认参与决战" })).getByRole("button", { name: "确定" }));

    expect(onMatchModePickerOpenChange).toHaveBeenCalledOnce();
    expect(onMatchModePickerOpenChange).toHaveBeenCalledWith(false);
    expect(onStartSigrikaDuel).toHaveBeenCalledOnce();
  });

  it("turns the occupied duel entry pale yellow and watches directly without closing the picker", async () => {
    const onMatchModePickerOpenChange = vi.fn();
    const onStartSigrikaDuel = vi.fn();
    const socket = duelSocket({ status: "occupied" });
    const user = userEvent.setup();

    render(
      <HomeScreen
        user={corruptedUser()}
        characters={CHARACTERS}
        matchModePickerOpen
        socket={socket}
        onMatchModePickerOpenChange={onMatchModePickerOpenChange}
        onStartMatch={vi.fn()}
        onStartPractice={vi.fn()}
        onStartSigrikaDuel={onStartSigrikaDuel}
      />
    );

    const watchButton = await screen.findByRole("button", { name: "西格莉卡？正在对局中。。。" });
    expect(watchButton.classList.contains("is-spectate")).toBe(true);
    await user.click(watchButton);

    expect(socket.emit).toHaveBeenCalledWith("sigrika-candy:duel-watch", {}, expect.any(Function));
    expect(onMatchModePickerOpenChange).not.toHaveBeenCalled();
    expect(onStartSigrikaDuel).not.toHaveBeenCalled();
  });

  it("returns the button to challenge state when the watched duel has just ended", async () => {
    const onNotice = vi.fn();
    const socket = duelSocket({
      status: "occupied",
      watchAck: {
        ok: false,
        error: "这盘决战已经结束了。",
        code: "special_watch_ended",
        status: "available"
      }
    });
    const user = userEvent.setup();

    render(
      <HomeScreen
        user={corruptedUser()}
        characters={CHARACTERS}
        matchModePickerOpen
        socket={socket}
        onNotice={onNotice}
        onMatchModePickerOpenChange={vi.fn()}
        onStartMatch={vi.fn()}
        onStartPractice={vi.fn()}
      />
    );

    await user.click(await screen.findByRole("button", { name: "西格莉卡？正在对局中。。。" }));

    expect(await screen.findByRole("button", { name: "与西格莉卡？决战" })).toBeTruthy();
    expect(onNotice).toHaveBeenCalledWith("这盘决战已经结束了。", "warning");
  });

  it("reopens the picker in occupied state when a challenge loses the creation race", async () => {
    const onMatchModePickerOpenChange = vi.fn();
    const onStartSigrikaDuel = vi.fn();
    const socket = duelSocket({ status: "available" });
    const user = userEvent.setup();

    render(
      <HomeScreen
        user={corruptedUser()}
        characters={CHARACTERS}
        matchModePickerOpen
        socket={socket}
        onMatchModePickerOpenChange={onMatchModePickerOpenChange}
        onStartMatch={vi.fn()}
        onStartPractice={vi.fn()}
        onStartSigrikaDuel={onStartSigrikaDuel}
      />
    );

    await user.click(await screen.findByRole("button", { name: "与西格莉卡？决战" }));
    await user.click(within(screen.getByRole("dialog", { name: "确认参与决战" })).getByRole("button", { name: "确定" }));
    const [{ onStatusChange }] = onStartSigrikaDuel.mock.calls[0];
    act(() => onStatusChange("occupied"));

    expect(onMatchModePickerOpenChange).toHaveBeenNthCalledWith(1, false);
    expect(onMatchModePickerOpenChange).toHaveBeenNthCalledWith(2, true);
    expect(await screen.findByRole("button", { name: "西格莉卡？正在对局中。。。" })).toBeTruthy();
  });
});

function corruptedUser() {
  return {
    id: "user-1",
    username: "corruption-test",
    selectedCharacter: "sigrika",
    role: "player",
    modeStats: {},
    sigrikaCandyArc: { phase: "awaiting-duel", corrupted: true }
  };
}

function duelSocket({ status, watchAck = { ok: true, roomCode: "SIG88" } }) {
  return {
    emit: vi.fn((event, _payload, acknowledge) => {
      if (event === "sigrika-candy:duel-status") acknowledge({ ok: true, status });
      if (event === "sigrika-candy:duel-watch") acknowledge(watchAck);
    })
  };
}
