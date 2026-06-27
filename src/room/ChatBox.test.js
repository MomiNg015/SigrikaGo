import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { areChatBoxPropsEqual, playerChatCount } from "./ChatBox.jsx";

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
