import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ChatBox, { areChatBoxPropsEqual, chatDisplayName, chatMessageMetaLabel, playerChatCount } from "./ChatBox.jsx";

describe("ChatBox", () => {
  it("counts only player chat messages for the collapsed badge", () => {
    expect(playerChatCount([
      { type: "system", kind: "game-start" },
      { type: "chat", text: "hello" },
      { type: "system", kind: "skill" },
      { type: "chat", text: "again" },
      { type: "system", kind: "disconnect" }
    ])).toBe(2);
  });

  it("stays memoized when room clock ticks only replace player time", () => {
    const chat = [{ id: "chat-1", type: "chat", userId: "black-user", text: "hello" }];
    const previous = chatProps({
      room: {
        code: "12345",
        chat,
        players: [
          { color: "black", user: { id: "black-user" }, character: "sigrika", time: { main: 300 } },
          { color: "white", user: { id: "white-user" }, character: "denia", time: { main: 300 } }
        ]
      }
    });
    const next = chatProps({
      room: {
        code: "12345",
        chat,
        players: [
          { color: "black", user: { id: "black-user" }, character: "sigrika", time: { main: 299 } },
          { color: "white", user: { id: "white-user" }, character: "denia", time: { main: 300 } }
        ]
      }
    });

    expect(areChatBoxPropsEqual(previous, next)).toBe(true);
  });

  it("rerenders when chat content or chat name metadata changes", () => {
    const chat = [{ id: "chat-1", type: "chat", userId: "black-user", text: "hello" }];
    const previous = chatProps({
      room: {
        code: "12345",
        chat,
        players: [{ color: "black", user: { id: "black-user" }, character: "sigrika" }]
      }
    });

    expect(areChatBoxPropsEqual(previous, chatProps({
      room: { ...previous.room, chat: [...chat, { id: "chat-2", type: "chat", text: "again" }] }
    }))).toBe(false);
    expect(areChatBoxPropsEqual(previous, chatProps({
      room: {
        ...previous.room,
        players: [{ color: "black", user: { id: "black-user" }, character: "denia" }]
      }
    }))).toBe(false);
  });

  it("can render tutorial records without move time or character suffix metadata", () => {
    const room = {
      chat: [],
      players: [
        { color: "black", user: { id: "npc" }, character: "sigrika", characterId: "sigrika" }
      ]
    };
    const message = {
      id: "chat-1",
      type: "chat",
      userId: "npc",
      username: "西格莉卡",
      moveNumber: 12,
      createdAt: Date.UTC(2026, 0, 1, 1, 2, 3),
      text: "请看这里"
    };

    expect(chatMessageMetaLabel(message)).toContain("12手");
    expect(chatDisplayName(message, room)).toContain("[");
    expect(chatMessageMetaLabel(message, { compactMessages: true })).toBe("");
    expect(chatDisplayName(message, room, { compactMessages: true })).toBe("西格莉卡");
  });

  it("rerenders when tutorial compact chat mode changes", () => {
    const previous = chatProps({ compactMessages: false });
    const next = chatProps({ compactMessages: true });

    expect(areChatBoxPropsEqual(previous, next)).toBe(false);
  });

  it("rerenders when the mobile dock popup trigger mode changes", () => {
    const previous = chatProps({ mobileDockPopup: false });
    const next = chatProps({ mobileDockPopup: true });

    expect(areChatBoxPropsEqual(previous, next)).toBe(false);
  });

  it("rerenders when the readonly record label changes", () => {
    const previous = chatProps({ label: "对局聊天" });
    const next = chatProps({ label: "剧情记录" });

    expect(areChatBoxPropsEqual(previous, next)).toBe(false);
  });

  it("keeps tutorial records behind the popup toggle", () => {
    const markup = renderToStaticMarkup(createElement(ChatBox, chatProps({
      readonly: true,
      disabledInputMessage: "剧情教学记录仅供查看",
      label: "剧情记录",
      room: {
        code: "12345",
        players: [{ color: "black", user: { id: "user-1", username: "玩家甲" } }],
        chat: [{ id: "chat-1", type: "chat", userId: "user-1", username: "玩家甲", text: "你好" }]
      }
    })));

    expect(markup).toContain("剧情记录");
    expect(markup).toContain("chat-toggle-button");
    expect(markup).not.toContain("chat-popover");
    expect(markup).not.toContain("你好");
    expect(markup).not.toContain("placeholder=\"输入聊天内容\"");
  });

  it("renders the mobile tutorial record entry with the existing dock-tab affordance", () => {
    const markup = renderToStaticMarkup(createElement(ChatBox, chatProps({
      mobileDockPopup: true,
      readonly: true,
      label: "剧情记录"
    })));

    expect(markup).toContain("tutorial-mobile-story-log");
    expect(markup).toContain("chat-toggle-button mobile-tab-button");
    expect(markup).toContain("role=\"tab\"");
    expect(markup).toContain("aria-selected=\"false\"");
  });

  it("allows chat messages and names to wrap inside the battle chat log", () => {
    const css = readFileSync(new URL("../styles/room/chat-responsive.css", import.meta.url), "utf8");
    const messageBlock = cssBlock(css, ".chat-log p");
    const nameBlock = cssBlock(css, ".chat-log strong");

    expect(messageBlock).toContain("white-space: pre-wrap");
    expect(messageBlock).toContain("overflow-wrap: anywhere");
    expect(messageBlock).toContain("word-break: break-word");
    expect(nameBlock).toContain("overflow-wrap: anywhere");
    expect(nameBlock).toContain("word-break: break-word");
  });
});

function chatProps(overrides = {}) {
  return {
    room: { code: "12345", chat: [], players: [] },
    onChat: noop,
    readonly: false,
    mobileDockPopup: false,
    trailingAction: null,
    floatingLayerZ: undefined,
    onFloatingLayerRequest: noop,
    ...overrides
  };
}

function noop() {}

function cssBlock(css, selector) {
  const index = css.indexOf(`${selector} {`);
  if (index === -1) return "";
  const start = css.indexOf("{", index);
  const end = css.indexOf("}", start);
  return css.slice(start + 1, end);
}
