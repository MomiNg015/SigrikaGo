// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import ChatBox from "./ChatBox.jsx";

const ROOM = { code: "12345", players: [], chat: [] };

describe("ChatBox popover draft", () => {
  afterEach(cleanup);

  it("keeps the draft when the popover is closed and reopened", async () => {
    const user = userEvent.setup();
    render(<ChatBox room={ROOM} onChat={() => {}} />);

    await user.click(screen.getByRole("button", { name: /对局聊天/ }));
    const input = screen.getByPlaceholderText("输入聊天内容");
    await user.type(input, "尚未发送的草稿");
    await user.click(screen.getByRole("button", { name: "关闭对局聊天" }));
    await user.click(screen.getByRole("button", { name: /对局聊天/ }));

    expect(screen.getByPlaceholderText("输入聊天内容").value).toBe("尚未发送的草稿");
  });

  it("portals a mobile tutorial record upward from its dock trigger and clamps it to the viewport", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 700 });
    render(
      <main className="app-shell">
        <section className="mobile-room-dock" style={{ overflow: "hidden" }}>
          <ChatBox
            room={{
              ...ROOM,
              chat: [{ id: "record-1", type: "chat", username: "西格莉卡", text: "这是一条足够长的剧情教学记录。" }]
            }}
            readonly
            compactMessages
            label="剧情记录"
            mobileDockPopup
          />
        </section>
      </main>
    );
    const trigger = screen.getByRole("tab", { name: /剧情记录/ });
    trigger.getBoundingClientRect = () => ({
      left: 280,
      right: 380,
      top: 620,
      bottom: 664,
      width: 100,
      height: 44,
      x: 280,
      y: 620,
      toJSON: () => ({})
    });

    await user.click(trigger);

    const dock = document.querySelector(".mobile-room-dock");
    const appShell = document.querySelector(".app-shell");
    const popover = document.querySelector(".tutorial-story-log-popover");
    expect(popover).toBeTruthy();
    expect(appShell?.contains(popover)).toBe(true);
    expect(dock?.contains(popover)).toBe(false);
    expect(popover?.style.position).toBe("fixed");
    expect(popover?.style.display).toBe("grid");
    expect(popover?.style.pointerEvents).toBe("auto");
    expect(popover?.style.zIndex).toBe("141");
    expect(popover?.style.left).toBe("20px");
    expect(popover?.style.bottom).toBe("88px");
    expect(popover?.style.width).toBe("360px");
    expect(popover?.style.height).toBe("460px");
    expect(trigger.style.width).toBe("100%");
    expect(trigger.style.minWidth).toBe("0px");
    expect(trigger.parentElement.style.width).toBe("100%");
    expect(trigger.parentElement.style.minWidth).toBe("0px");
    expect(screen.getByText("这是一条足够长的剧情教学记录。")).toBeTruthy();
    expect(trigger.getAttribute("aria-selected")).toBe("true");

    await user.click(screen.getByRole("button", { name: "关闭剧情记录" }));
    expect(document.querySelector(".tutorial-story-log-popover")).toBeNull();
  });
});
