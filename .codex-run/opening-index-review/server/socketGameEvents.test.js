import { describe, expect, it, vi } from "vitest";
import { registerGameSocketEvents } from "./socketGameEvents.js";

function createSocket(user = { id: "user-a" }) {
  const handlers = {};
  return {
    user,
    emit: vi.fn(),
    on: vi.fn((event, handler) => {
      handlers[event] = handler;
    }),
    trigger: (event, ...args) => handlers[event](...args)
  };
}

function okResult(room = { code: "12345" }) {
  return { ok: true, room };
}

function errorResult(error = "bad action") {
  return { ok: false, error };
}

function createDeps(overrides = {}) {
  return {
    io: {},
    handleGameAction: vi.fn(() => okResult()),
    requestCounting: vi.fn(() => okResult()),
    respondCounting: vi.fn(() => okResult()),
    requestDraw: vi.fn(() => okResult()),
    respondDraw: vi.fn(() => okResult()),
    handleScoringAction: vi.fn(() => okResult()),
    broadcastRoom: vi.fn(),
    getRoom: vi.fn(() => null),
    metrics: { increment: vi.fn(), observe: vi.fn() },
    now: vi.fn(),
    ...overrides
  };
}

describe("socket game events", () => {
  it("registers game flow handlers", () => {
    const socket = createSocket();

    registerGameSocketEvents(socket, createDeps());

    expect(socket.on).toHaveBeenCalledWith("game:action", expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith("counting:request", expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith("counting:respond", expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith("draw:request", expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith("draw:respond", expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith("scoring:action", expect.any(Function));
  });

  it("forwards game actions and broadcasts successful rooms", () => {
    const socket = createSocket({ id: "player-a" });
    const room = { code: "11111" };
    const deps = createDeps({ handleGameAction: vi.fn(() => okResult(room)) });

    registerGameSocketEvents(socket, deps);
    const acknowledge = vi.fn();
    socket.trigger("game:action", {
      roomCode: "11111",
      actionId: "action-11111",
      action: { type: "play" }
    }, acknowledge);

    expect(deps.handleGameAction).toHaveBeenCalledWith("11111", "player-a", { type: "play" }, deps.io);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(deps.broadcastRoom).toHaveBeenCalledWith(deps.io, room);
    expect(acknowledge).toHaveBeenCalledWith({
      ok: true,
      actionId: "action-11111",
      roomCode: "11111",
      revision: 0
    });
    expect(room.actionReceipts["player-a"]).toEqual([expect.objectContaining({ actionId: "action-11111" })]);
  });

  it("emits an error toast and skips broadcast for failed game actions", () => {
    const socket = createSocket();
    const deps = createDeps({ handleGameAction: vi.fn(() => errorResult("invalid move")) });

    registerGameSocketEvents(socket, deps);
    const acknowledge = vi.fn();
    socket.trigger("game:action", {
      roomCode: "11111",
      actionId: "action-failed",
      action: { type: "play" }
    }, acknowledge);

    expect(socket.emit).toHaveBeenCalledWith("error:toast", "invalid move");
    expect(deps.broadcastRoom).not.toHaveBeenCalled();
    expect(acknowledge).toHaveBeenCalledWith(expect.objectContaining({
      ok: false,
      actionId: "action-failed",
      error: "invalid move"
    }));
  });

  it("returns a persisted receipt without executing or broadcasting a duplicate action", () => {
    const socket = createSocket({ id: "player-a" });
    const receipt = { ok: true, actionId: "action-duplicate", roomCode: "11111", revision: 4 };
    const room = { code: "11111", actionReceipts: { "player-a": [receipt] } };
    const deps = createDeps({ getRoom: vi.fn(() => room) });
    const acknowledge = vi.fn();

    registerGameSocketEvents(socket, deps);
    socket.trigger("game:action", {
      roomCode: "11111",
      actionId: "action-duplicate",
      action: { type: "move", pointId: "0,0" }
    }, acknowledge);

    expect(deps.handleGameAction).not.toHaveBeenCalled();
    expect(deps.broadcastRoom).not.toHaveBeenCalled();
    expect(acknowledge).toHaveBeenCalledWith(receipt);
    expect(deps.metrics.increment).toHaveBeenCalledWith("gameActionDuplicateAcks");
  });

  it("rejects malformed action ids before invoking game rules", () => {
    const socket = createSocket();
    const deps = createDeps();
    const acknowledge = vi.fn();

    registerGameSocketEvents(socket, deps);
    socket.trigger("game:action", {
      roomCode: "11111",
      actionId: "bad action id",
      action: { type: "move", pointId: "0,0" }
    }, acknowledge);

    expect(deps.handleGameAction).not.toHaveBeenCalled();
    expect(acknowledge).toHaveBeenCalledWith(expect.objectContaining({
      ok: false,
      code: "invalid_action_id"
    }));
  });

  it("forwards counting request and response events", () => {
    const socket = createSocket({ id: "counter" });
    const deps = createDeps();

    registerGameSocketEvents(socket, deps);
    socket.trigger("counting:request", { roomCode: "22222" });
    socket.trigger("counting:respond", { roomCode: "22222", accepted: true });

    expect(deps.requestCounting).toHaveBeenCalledWith("22222", "counter", deps.io);
    expect(deps.respondCounting).toHaveBeenCalledWith("22222", "counter", true);
    expect(deps.broadcastRoom).toHaveBeenCalledTimes(2);
  });

  it("forwards draw request and response events", () => {
    const socket = createSocket({ id: "draw-user" });
    const deps = createDeps();

    registerGameSocketEvents(socket, deps);
    socket.trigger("draw:request", { roomCode: "33333" });
    socket.trigger("draw:respond", { roomCode: "33333", accepted: false });

    expect(deps.requestDraw).toHaveBeenCalledWith("33333", "draw-user", deps.io);
    expect(deps.respondDraw).toHaveBeenCalledWith("33333", "draw-user", false, deps.io);
    expect(deps.broadcastRoom).toHaveBeenCalledTimes(2);
  });

  it("forwards scoring actions and only broadcasts successful results", () => {
    const socket = createSocket({ id: "scorer" });
    const room = { code: "44444" };
    const deps = createDeps({ handleScoringAction: vi.fn(() => okResult(room)) });

    registerGameSocketEvents(socket, deps);
    socket.trigger("scoring:action", { roomCode: "44444", action: { type: "mark-dead" } });

    expect(deps.handleScoringAction).toHaveBeenCalledWith("44444", "scorer", { type: "mark-dead" }, deps.io);
    expect(deps.broadcastRoom).toHaveBeenCalledWith(deps.io, room);
  });
});
