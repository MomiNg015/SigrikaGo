import { afterEach, expect, it, vi } from "vitest";
import { io } from "socket.io-client";
import { emitGameActionWithAck } from "./gameActionDelivery.js";
import { cancelPendingRoomActions, emitRoomMutation, markRoomActionsReady, markRoomActionsSyncing, roomActionsReady } from "./roomActionConnection.js";

afterEach(() => vi.useRealTimers());
it("does not buffer offline game, scoring, counting or draw operations", () => {
  const socket = io("http://127.0.0.1:1", { autoConnect: false });
  try {
    expect(emitGameActionWithAck(socket, { roomCode: "room", action: { type: "resign" } })).toBeNull();
    for (const event of ["scoring:action", "counting:request", "counting:respond", "draw:request", "draw:respond"]) {
      expect(emitRoomMutation(socket, event, { roomCode: "room" })).toBe(false);
    }
    expect(socket.sendBuffer).toEqual([]);
  } finally { socket.close(); }
});
it("requires a matching snapshot after reconnect and cancels retries on sync or room exit", () => {
  vi.useFakeTimers();
  const socket = { id: "connection", connected: true, emit: vi.fn() };
  markRoomActionsSyncing(socket);
  expect(roomActionsReady(socket, "room")).toBe(false);
  markRoomActionsReady(socket, "another-room");
  expect(roomActionsReady(socket, "room")).toBe(false);
  markRoomActionsReady(socket, "room");
  emitGameActionWithAck(socket, { roomCode: "room", action: { type: "move", pointId: "1,1" } });
  expect(socket.emit).toHaveBeenCalledTimes(1);
  markRoomActionsSyncing(socket);
  vi.advanceTimersByTime(20000);
  expect(socket.emit).toHaveBeenCalledTimes(1);
  markRoomActionsReady(socket, "room");
  emitGameActionWithAck(socket, { roomCode: "room", action: { type: "pass" } });
  cancelPendingRoomActions(socket, "room");
  vi.advanceTimersByTime(20000);
  expect(socket.emit).toHaveBeenCalledTimes(2);
  expect(vi.getTimerCount()).toBe(0);
});
