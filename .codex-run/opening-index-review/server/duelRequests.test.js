import { describe, expect, it, vi } from "vitest";
import { createDuelRequestManager } from "./duelRequests.js";

describe("duel request manager", () => {
  it("sends duel request events and tracks an expiry timer", async () => {
    const timerIds = [];
    const { manager, sockets } = setupManager({
      setTimer: (callback, delay) => {
        const id = { callback, delay };
        timerIds.push(id);
        return id;
      }
    });

    await manager.handleRequest(sockets.from, "target");

    expect(manager.pendingCount()).toBe(1);
    expect(timerIds[0].delay).toBe(20000);
    expect(sockets.target.events).toContainEqual(expect.objectContaining({ event: "duel:incoming" }));
    expect(sockets.from.events).toContainEqual(expect.objectContaining({ event: "duel:sent" }));
  });

  it("clears the timer when the target rejects a duel", async () => {
    const clearTimer = vi.fn();
    const { manager, sockets } = setupManager({ clearTimer });
    await manager.handleRequest(sockets.from, "target");
    const requestId = sockets.from.events.find((event) => event.event === "duel:sent").payload.requestId;

    await manager.handleResponse(sockets.target, requestId, false);

    expect(manager.pendingCount()).toBe(0);
    expect(clearTimer).toHaveBeenCalledTimes(1);
    expect(sockets.from.events).toContainEqual({
      event: "duel:rejected",
      payload: { requestId, username: "Target" }
    });
    expect(sockets.target.events).toContainEqual({
      event: "duel:closed",
      payload: { requestId }
    });
  });

  it("expires all pending requests for a disconnected socket", async () => {
    const clearTimer = vi.fn();
    const io = fakeIo();
    const { manager, sockets } = setupManager({ clearTimer, io });
    await manager.handleRequest(sockets.from, "target");
    const requestId = sockets.from.events.find((event) => event.event === "duel:sent").payload.requestId;

    manager.expireSocketRequests(sockets.target.id);

    expect(manager.pendingCount()).toBe(0);
    expect(clearTimer).toHaveBeenCalledTimes(1);
    expect(io.events).toContainEqual({
      socketId: sockets.from.id,
      event: "duel:rejected",
      payload: { requestId, username: "Target", reason: "timeout" }
    });
    expect(io.events).toContainEqual({
      socketId: sockets.target.id,
      event: "duel:closed",
      payload: { requestId }
    });
  });

  it("delays a normal rejection when the target has blacklisted the requester", async () => {
    const timerIds = [];
    const { manager, sockets } = setupManager({
      isDuelBlocked: async () => true,
      setTimer: (callback, delay) => {
        const id = { callback, delay };
        timerIds.push(id);
        return id;
      }
    });

    await manager.handleRequest(sockets.from, "target");

    expect(manager.pendingCount()).toBe(0);
    expect(sockets.target.events).not.toContainEqual(expect.objectContaining({ event: "duel:incoming" }));
    expect(timerIds[0].delay).toBe(3000);

    timerIds[0].callback();

    expect(sockets.from.events).toContainEqual({
      event: "duel:rejected",
      payload: { requestId: "request-1", username: "Target" }
    });
  });
});

function setupManager(overrides = {}) {
  const sockets = {
    from: fakeSocket("from-socket", "from", "From"),
    target: fakeSocket("target-socket", "target", "Target")
  };
  const io = overrides.io ?? fakeIo();
  io.sockets = {
    sockets: new Map([
      [sockets.from.id, sockets.from],
      [sockets.target.id, sockets.target]
    ])
  };
  const manager = createDuelRequestManager({
    io,
    isUserInActiveRoom: () => false,
    firstOnlineSocket: (userId) => userId === "target" ? sockets.target : null,
    statusForUser: () => "online",
    toSocialUser: (user, status) => ({ id: user.id, username: user.username, status }),
    createDirectRoom: vi.fn(),
    refreshSocketUser: vi.fn(),
    isDuelBlocked: overrides.isDuelBlocked ?? vi.fn(async () => false),
    randomId: () => "request-1",
    now: () => 1000,
    setTimer: overrides.setTimer ?? (() => "timer-1"),
    clearTimer: overrides.clearTimer ?? vi.fn()
  });
  return { io, manager, sockets };
}

function fakeSocket(socketId, userId, username) {
  return {
    id: socketId,
    user: { id: userId, username },
    events: [],
    emit(event, payload) {
      this.events.push({ event, payload });
    }
  };
}

function fakeIo() {
  return {
    events: [],
    to(socketId) {
      return {
        emit: (event, payload) => {
          this.events.push({ socketId, event, payload });
        }
      };
    }
  };
}
