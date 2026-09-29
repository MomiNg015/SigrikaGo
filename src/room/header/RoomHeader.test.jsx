// @vitest-environment jsdom
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RoomHeader from "./RoomHeader.jsx";

afterEach(cleanup);

describe("header test tools", () => {
  it("keeps test tools hidden unless the room opts in", () => {
    render(<RoomHeader room={{ code: "123456" }} />);
    expect(screen.queryByRole("group", { name: "测试工具" })).toBeNull();
  });

  it("dispatches each action from an accessible icon-only button", () => {
    const onGameAction = vi.fn();
    render(<RoomHeader room={{ code: "123456" }} showTestTools onGameAction={onGameAction} />);
    const group = screen.getByRole("group", { name: "测试工具" });
    for (const [label, type] of [["随机布局", "test-random-layout"], ["恢复技能", "test-restore-skill"], ["进入读秒", "test-enter-byo-yomi"]]) {
      const button = within(group).getByRole("button", { name: label });
      expect(button.textContent).toBe("");
      expect(button.title).toBe(label);
      fireEvent.click(button);
      expect(onGameAction).toHaveBeenLastCalledWith({ type });
    }
    expect(onGameAction).toHaveBeenCalledTimes(3);
  });

  it("does not dispatch disabled tools", () => {
    const onGameAction = vi.fn();
    render(<RoomHeader room={{ code: "123456" }} showTestTools testToolsDisabled onGameAction={onGameAction} />);
    for (const button of within(screen.getByRole("group", { name: "测试工具" })).getAllByRole("button")) {
      expect(button.disabled).toBe(true);
      fireEvent.click(button);
    }
    expect(onGameAction).not.toHaveBeenCalled();
  });
});

describe("room header labels", () => {
  it.each([
    ["spark", {}, "星炬"],
    ["standard", {}, "标准"],
    ["gomoku", {}, "五子棋"],
    ["spark", { matchSource: "practice", practice: {} }, "人机"],
    ["spark", { matchSource: "practice", practice: { challenge: "capture-challenge", humanColor: "black" } }, "吃子赛"],
    ["team", { team: { round: 2 } }, "队际赛"]
  ])("labels %s %j and keeps the move badge free of mode and capture details", (mode, extra, label) => {
    const markup = renderToStaticMarkup(createElement(RoomHeader, {
      room: { code: "AB123", game: { mode, moveNumber: 42, captures: { black: 22 } }, ...extra },
      roomGameInfo: { black: "黑方玩家", white: "白方玩家", moves: "42手" },
      showUtilityControls: false
    }));
    expect(markup).toContain(`<span class="room-code-label">${label}AB123</span>`);
    expect(markup).toContain('<span class="room-info-tag move-count">42手</span>');
    expect(markup).not.toContain("房间号");
    expect(markup).not.toContain("提子22");
    expect(markup).not.toContain("100手");
  });
});
