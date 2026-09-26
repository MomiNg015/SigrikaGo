import { afterEach, expect, it, vi } from "vitest";
import { installLocalPracticeController } from "./localPracticeController.js";
import { LOCAL_PRACTICE_VERSION } from "../shared/localPractice.js";

afterEach(() => vi.useRealTimers());
function fixture({ search, submit } = {}) {
  vi.useFakeTimers();
  const job = { id: "job-1", roomCode: "ABCDE", positionVersion: "v1", difficulty: "advanced", version: LOCAL_PRACTICE_VERSION };
  let currentJob = job;
  const handlers = {};
  const page = { visibilityState: "visible", addEventListener: vi.fn((name, callback) => { handlers[name] = callback; }), removeEventListener: vi.fn() };
  const engine = { ensureReady: vi.fn().mockResolvedValue(), search: search ?? vi.fn().mockResolvedValue({ type: "move", pointId: "3,3" }), close: vi.fn() };
  const socket = { connected: true, on: vi.fn((name, callback) => { handlers[name] = callback; }), off: vi.fn(),
    emit: vi.fn((name, payload, ack) => {
      if (name === "practice:compute") ack?.({ ok: true, job: currentJob });
      if (name === "practice:computed") {
        if (submit) submit(ack);
        else { currentJob = null; ack({ ok: true }); }
      }
    }) };
  const room = { code: "ABCDE", matchSource: "practice", practice: { engineBackend: "browser" }, role: "player", game: { phase: "playing" } };
  const showToast = vi.fn();
  const dispose = installLocalPracticeController(socket, { engine, page, showToast, getRoom: () => room });
  return { socket, engine, handlers, page, showToast, dispose, job };
}

it("retries a lost result ACK with the same job and no second search", async () => {
  let count = 0;
  const f = fixture({ submit: (ack) => { if (++count === 2) ack({ ok: true, duplicate: true }); } });
  await vi.advanceTimersByTimeAsync(6200);
  const calls = f.socket.emit.mock.calls.filter(([name]) => name === "practice:computed");
  expect(calls).toHaveLength(2);
  expect(calls[0][1]).toEqual(calls[1][1]);
  expect(f.engine.search).toHaveBeenCalledOnce();
  f.dispose();
  expect(vi.getTimerCount()).toBe(0);
});

it("backgrounding cancels a search and fences late results, foreground reissues it", async () => {
  const resolveSearch = [];
  const search = vi.fn(() => new Promise((resolve) => resolveSearch.push(resolve)));
  const f = fixture({ search });
  await vi.advanceTimersByTimeAsync(0);
  f.page.visibilityState = "hidden";
  f.handlers.visibilitychange();
  resolveSearch[0]({ type: "move", pointId: "3,3" });
  await vi.advanceTimersByTimeAsync(10000);
  expect(f.socket.emit.mock.calls.filter(([name]) => name === "practice:computed")).toHaveLength(0);
  expect(f.socket.emit).toHaveBeenCalledWith("practice:compute", expect.objectContaining({ active: false }));
  f.page.visibilityState = "visible";
  f.handlers.visibilitychange();
  await vi.advanceTimersByTimeAsync(0);
  expect(search).toHaveBeenCalledTimes(2);
  resolveSearch[1]({ type: "move", pointId: "4,4" });
  await vi.advanceTimersByTimeAsync(700);
  expect(f.socket.emit.mock.calls.find(([name]) => name === "practice:computed")[1].action.pointId).toBe("4,4");
  f.dispose();
});

it("restarts once on failure, then pauses without fabricating a move", async () => {
  const f = fixture({ search: vi.fn().mockRejectedValue(new Error("engine_timeout")) });
  await vi.advanceTimersByTimeAsync(6000);
  expect(f.engine.search).toHaveBeenCalledTimes(2);
  expect(f.showToast).toHaveBeenCalledOnce();
  expect(f.socket.emit.mock.calls.filter(([name]) => name === "practice:computed")).toHaveLength(0);
  f.dispose();
});

it("disconnect and disposal fence pending work and remove timers and listeners", async () => {
  let resolveSearch;
  const f = fixture({ search: vi.fn(() => new Promise((resolve) => { resolveSearch = resolve; })) });
  await vi.advanceTimersByTimeAsync(0);
  f.socket.connected = false;
  f.handlers.disconnect();
  f.dispose();
  resolveSearch({ type: "move", pointId: "3,3" });
  await vi.advanceTimersByTimeAsync(2000);
  expect(f.socket.emit.mock.calls.filter(([name]) => name === "practice:computed")).toHaveLength(0);
  expect(vi.getTimerCount()).toBe(0);
  expect(f.socket.off).toHaveBeenCalledTimes(2);
  expect(f.page.removeEventListener).toHaveBeenCalledOnce();
});
