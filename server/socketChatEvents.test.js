import { describe, expect, it, vi } from "vitest";
import { registerChatSocketEvents } from "./socketChatEvents.js";

function createSocket(user = { id: "user-a" }) {
  const handlers = {};
  return {
    user,
    on: vi.fn((event, handler) => {
      handlers[event] = handler;
    }),
    trigger: (event, payload) => handlers[event](payload)
  };
}

function createDeps(overrides = {}) {
  return {
    io: {},
    addChat: vi.fn(() => ({ code: "12345" })),
    broadcastRoom: vi.fn(),
    ...overrides
  };
}

describe("socket chat events", () => {
  it("registers the chat send handler", () => {
    const socket = createSocket();

    registerChatSocketEvents(socket, createDeps());

    expect(socket.on).toHaveBeenCalledWith("chat:send", expect.any(Function));
  });

  it("forwards chat payloads with the current socket user and broadcasts changed rooms", () => {
    const socket = createSocket({ id: "chat-user", username: "Chat User" });
    const room = { code: "12345" };
    const deps = createDeps({ addChat: vi.fn(() => room) });

    registerChatSocketEvents(socket, deps);
    socket.trigger("chat:send", { roomCode: "12345", text: "hello" });

    expect(deps.addChat).toHaveBeenCalledWith("12345", socket.user, "hello");
    expect(deps.broadcastRoom).toHaveBeenCalledWith(deps.io, room);
  });

  it("does not broadcast when chat mutation returns no room", () => {
    const socket = createSocket();
    const deps = createDeps({ addChat: vi.fn(() => null) });

    registerChatSocketEvents(socket, deps);
    socket.trigger("chat:send", { roomCode: "bad", text: "" });

    expect(deps.broadcastRoom).not.toHaveBeenCalled();
  });
});
