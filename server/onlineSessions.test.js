import { describe, expect, it, vi } from "vitest";
import { createOnlineSessionManager } from "./onlineSessions.js";

describe("online session manager", () => {
  it("creates a login response and clears an unused session after the pending window", () => {
    let pendingCallback;
    const sessions = fakeSessions();
    const manager = createManager({
      sessions,
      setTimer: (callback, delay) => {
        pendingCallback = callback;
        return { delay };
      }
    });

    const response = manager.createLoginResponse({ id: "user-1" });
    pendingCallback();

    expect(response).toEqual({ userId: "user-1", sessionId: "session-user-1" });
    expect(sessions.cleared).toContainEqual(["user-1", "session-user-1"]);
  });

  it("cancels pending login cleanup when the socket connects", () => {
    const clearTimer = vi.fn();
    const manager = createManager({ clearTimer });

    manager.createLoginResponse({ id: "user-1" });
    manager.registerOnlineSocket(fakeSocket("socket-1", "user-1", "session-user-1"));

    expect(clearTimer).toHaveBeenCalledTimes(1);
    expect(manager.statusForUser("user-1")).toBe("online");
    expect(manager.onlineCount()).toBe(1);
  });

  it("force logs out all sockets for a user and clears the active session", () => {
    const sessions = fakeSessions();
    const socket = fakeSocket("socket-1", "user-1", "session-user-1");
    const manager = createManager({ sessions, sockets: [socket] });
    manager.registerOnlineSocket(socket);

    manager.forceLogoutUser("user-1");

    expect(sessions.clearUser).toHaveBeenCalledWith("user-1");
    expect(socket.events).toContainEqual({
      event: "account:logged-out",
      payload: { message: "账号已在其他地方登录" }
    });
    expect(socket.disconnected).toBe(true);
  });

  it("keeps the session during a short disconnect grace window", () => {
    const timers = [];
    const sessions = fakeSessions();
    const onSocketDisconnected = vi.fn();
    const manager = createManager({
      sessions,
      onSocketDisconnected,
      setTimer: (callback, delay) => {
        const timer = { callback, delay };
        timers.push(timer);
        return timer;
      }
    });
    const socket = fakeSocket("socket-1", "user-1", "session-user-1");
    manager.registerOnlineSocket(socket);

    manager.unregisterOnlineSocket(socket);

    expect(sessions.cleared).toEqual([]);
    expect(timers[0].delay).toBe(10000);
    expect(onSocketDisconnected).toHaveBeenCalledWith(socket);
    expect(manager.statusForUser("user-1")).toBe("offline");

    timers[0].callback();

    expect(sessions.cleared).toContainEqual(["user-1", "session-user-1"]);
  });

  it("uses a long default disconnect grace window for browser idle reconnects", () => {
    const timers = [];
    const manager = createManager({
      setTimer: (callback, delay) => {
        const timer = { callback, delay };
        timers.push(timer);
        return timer;
      },
      useDefaultDisconnectGrace: true
    });
    const socket = fakeSocket("socket-1", "user-1", "session-user-1");
    manager.registerOnlineSocket(socket);

    manager.unregisterOnlineSocket(socket);

    expect(timers[0].delay).toBe(30 * 60 * 1000);
  });

  it("cancels pending session cleanup when the user reconnects quickly", () => {
    const clearTimer = vi.fn();
    const sessions = fakeSessions();
    const manager = createManager({
      sessions,
      setTimer: (callback, delay) => ({ callback, delay }),
      clearTimer
    });
    const socket = fakeSocket("socket-1", "user-1", "session-user-1");
    const nextSocket = fakeSocket("socket-2", "user-1", "session-user-1");
    manager.registerOnlineSocket(socket);

    manager.unregisterOnlineSocket(socket);
    manager.registerOnlineSocket(nextSocket);

    expect(clearTimer).toHaveBeenCalledTimes(1);
    expect(sessions.cleared).toEqual([]);
    expect(manager.statusForUser("user-1")).toBe("online");
  });

  it("reports whether a user currently has an online socket", () => {
    const manager = createManager();
    const socket = fakeSocket("socket-1", "user-1", "session-user-1");

    expect(manager.hasOnlineUser("user-1")).toBe(false);
    manager.registerOnlineSocket(socket);
    expect(manager.hasOnlineUser("user-1")).toBe(true);
    manager.unregisterOnlineSocket(socket);
    expect(manager.hasOnlineUser("user-1")).toBe(false);
  });
});

function createManager(overrides = {}) {
  const sockets = new Map((overrides.sockets ?? []).map((socket) => [socket.id, socket]));
  return createOnlineSessionManager({
    io: { sockets: { sockets } },
    sessions: overrides.sessions ?? fakeSessions(),
    signLoginResponse: (user, sessionId) => ({ userId: user.id, sessionId }),
    isUserInActiveRoom: overrides.isUserInActiveRoom ?? (() => false),
    onSocketDisconnected: overrides.onSocketDisconnected ?? vi.fn(),
    setTimer: overrides.setTimer ?? (() => "timer-1"),
    clearTimer: overrides.clearTimer ?? vi.fn(),
    pendingLoginMs: 120000,
    ...(overrides.useDefaultDisconnectGrace ? {} : { disconnectedSessionGraceMs: 10000 })
  });
}

function fakeSessions() {
  return {
    cleared: [],
    replace: vi.fn((userId) => `session-${userId}`),
    clear: vi.fn(function clear(userId, sessionId) {
      this.cleared.push([userId, sessionId]);
    }),
    clearUser: vi.fn()
  };
}

function fakeSocket(socketId, userId, sessionId) {
  return {
    id: socketId,
    user: { id: userId },
    data: { sessionId },
    events: [],
    disconnected: false,
    emit(event, payload) {
      this.events.push({ event, payload });
    },
    disconnect() {
      this.disconnected = true;
    }
  };
}
