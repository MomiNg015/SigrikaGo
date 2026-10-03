import { afterEach, expect, test, vi } from "vitest";
import { cancelMatchStart, startMatchTransition } from "./useMatchActions.js";
afterEach(() => vi.useRealTimers());
function fixture() {
  const listeners = new Map();
  const socket = { id: "one", connected: true, emit: vi.fn(), on: (event, fn) => listeners.set(event, fn), off: (event) => listeners.delete(event) };
  const options = { socket, preloadPlayableReady: () => {}, setMatchStart: vi.fn(), setMatchSuccess: vi.fn(), showToast: vi.fn() };
  return { ...options, options, listeners, acknowledge: (ack) => socket.emit.mock.calls.find(([event]) => event === "match:join")[2](ack) };
}
test("disconnected matchmaking never emits a buffered join or opens the wait UI", () => {
  const f = fixture(); f.socket.connected = false;
  startMatchTransition(f.options);
  expect(f.socket.emit).not.toHaveBeenCalled();
  expect(f.setMatchStart).not.toHaveBeenCalled();
  expect(f.showToast).toHaveBeenCalled();
});
test.each(["failure", "timeout", "disconnect"])("clears waiting on %s and rejects a late ACK", (failure) => {
  vi.useFakeTimers();
  const f = fixture(); startMatchTransition(f.options);
  if (failure === "failure") f.acknowledge({ ok: false, error: "busy" });
  if (failure === "timeout") vi.advanceTimersByTime(8000);
  if (failure === "disconnect") f.listeners.get("disconnect")();
  expect(f.setMatchStart).toHaveBeenLastCalledWith(null);
  expect(f.showToast).toHaveBeenCalledOnce();
  f.acknowledge({ ok: true });
  expect(f.showToast).toHaveBeenCalledOnce();
});
test.each(["ack", "found", "cancel"])("%s clears pending timers and cannot clear a subsequent match", (success) => {
  vi.useFakeTimers();
  const f = fixture(); startMatchTransition(f.options);
  if (success === "ack") f.acknowledge({ ok: true });
  if (success === "found") f.listeners.get("match:found")();
  if (success === "cancel") cancelMatchStart(f.socket);
  vi.advanceTimersByTime(20000);
  expect(f.showToast).not.toHaveBeenCalled();
  expect(f.setMatchStart).toHaveBeenCalledOnce();
});
