import { describe, expect, it, vi } from "vitest";
import { createOnlineSessionManager } from "./onlineSessions.js";

describe("online session manager", () => {
  it("creates a login response without requiring a socket to keep the session", async () => {
    const sessions = fakeSessions();
    const manager = createManager({ sessions });

    const response = await manager.createLoginResponse({ id: "user-1" });

    expect(response).toMatchObject({
      userId: "user-1",
      sessionId: "session-user-1",
      refreshToken: "refresh-user-1"
    });
    expect(sessions.cleared).toEqual([]);
  });

  it("marks the user online when the socket connects", async () => {
    const clearTimer = vi.fn();
    const manager = createManager({ clearTimer });

    await manager.createLoginResponse({ id: "user-1" });
    manager.registerOnlineSocket(fakeSocket("socket-1", "user-1", "session-user-1"));

    expect(clearTimer).not.toHaveBeenCalled();
    expect(manager.statusForUser("user-1")).toBe("online");
    expect(manager.onlineCount()).toBe(1);
  });

  it("force logs out all sockets for a user and clears the active session", async () => {
    const sessions = fakeSessions();
    const socket = fakeSocket("socket-1", "user-1", "session-user-1");
    const manager = createManager({ sessions, sockets: [socket] });
    manager.registerOnlineSocket(socket);

    await manager.forceLogoutUser("user-1");

    expect(sessions.clearUser).toHaveBeenCalledWith("user-1");
    expect(socket.events).toContainEqual({
      event: "account:logged-out",
      payload: { message: "账号已在其他地方登录" }
    });
    expect(socket.disconnected).toBe(true);
  });

  it("keeps the session when the last socket disconnects", () => {
    const sessions = fakeSessions();
    const onSocketDisconnected = vi.fn();
    const manager = createManager({
      sessions,
      onSocketDisconnected
    });
    const socket = fakeSocket("socket-1", "user-1", "session-user-1");
    manager.registerOnlineSocket(socket);

    manager.unregisterOnlineSocket(socket);

    expect(sessions.cleared).toEqual([]);
    expect(onSocketDisconnected).toHaveBeenCalledWith(socket);
    expect(manager.statusForUser("user-1")).toBe("offline");
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

    expect(clearTimer).not.toHaveBeenCalled();
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
    signLoginResponse: (user, session) => ({ userId: user.id, sessionId: session.sessionId }),
    isUserInActiveRoom: overrides.isUserInActiveRoom ?? (() => false),
    onSocketDisconnected: overrides.onSocketDisconnected ?? vi.fn(),
    clearTimer: overrides.clearTimer ?? vi.fn()
  });
}

function fakeSessions() {
  return {
    cleared: [],
    replace: vi.fn((userId) => ({ sessionId: `session-${userId}`, refreshToken: `refresh-${userId}` })),
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
