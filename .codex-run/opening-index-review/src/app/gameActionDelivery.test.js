import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGameActionId, emitGameActionWithAck } from "./gameActionDelivery.js";

describe("game action delivery", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("uses browser UUIDs and provides a stable fallback id", () => {
    expect(createGameActionId({ cryptoLike: { randomUUID: () => "uuid-1" } })).toBe("uuid-1");
    expect(createGameActionId({ cryptoLike: null, now: () => 1000 })).toMatch(/^action:rs:/);
  });

  it("retries the same action id until the server acknowledges it", () => {
    const acknowledgements = [];
    const socket = {
      emit: vi.fn((_event, _payload, ack) => acknowledgements.push(ack))
    };
    const onAcknowledged = vi.fn();

    emitGameActionWithAck(socket, {
      roomCode: "12345",
      action: { type: "move", pointId: "0,0" }
    }, {
      actionId: "action-fixed",
      ackTimeoutMs: 100,
      retryLimit: 2,
      onAcknowledged
    });

    vi.advanceTimersByTime(100);
    expect(socket.emit).toHaveBeenCalledTimes(2);
    expect(socket.emit.mock.calls[0][1]).toEqual(socket.emit.mock.calls[1][1]);
    acknowledgements[1]({ ok: true, actionId: "action-fixed", roomCode: "12345", revision: 1 });
    vi.advanceTimersByTime(500);

    expect(socket.emit).toHaveBeenCalledTimes(2);
    expect(onAcknowledged).toHaveBeenCalledWith(expect.objectContaining({ ok: true, actionId: "action-fixed" }));
  });

  it("requests authoritative recovery after all acknowledgement attempts time out", () => {
    const socket = { emit: vi.fn() };
    const onUnconfirmed = vi.fn();

    emitGameActionWithAck(socket, {
      roomCode: "12345",
      action: { type: "pass" }
    }, {
      actionId: "action-timeout",
      ackTimeoutMs: 100,
      retryLimit: 1,
      onUnconfirmed
    });

    vi.advanceTimersByTime(200);
    expect(socket.emit).toHaveBeenCalledTimes(2);
    expect(onUnconfirmed).toHaveBeenCalledWith(expect.objectContaining({
      actionId: "action-timeout",
      attempts: 2
    }));
  });

  it("ignores an acknowledgement for another action id", () => {
    let acknowledge;
    const socket = { emit: vi.fn((_event, _payload, ack) => { acknowledge = ack; }) };
    const onAcknowledged = vi.fn();

    emitGameActionWithAck(socket, {
      roomCode: "12345",
      action: { type: "pass" }
    }, {
      actionId: "action-expected",
      ackTimeoutMs: 100,
      retryLimit: 0,
      onAcknowledged
    });
    acknowledge({ ok: true, actionId: "action-other" });
    vi.advanceTimersByTime(100);

    expect(onAcknowledged).not.toHaveBeenCalled();
  });

  it("does not leave a timeout behind when an acknowledgement is synchronous", () => {
    const socket = {
      emit: vi.fn((_event, payload, ack) => ack({ ok: true, actionId: payload.actionId }))
    };
    const onAcknowledged = vi.fn();

    emitGameActionWithAck(socket, {
      roomCode: "12345",
      action: { type: "pass" }
    }, {
      actionId: "action-sync",
      onAcknowledged
    });

    expect(onAcknowledged).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
