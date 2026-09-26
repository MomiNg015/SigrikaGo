import { afterEach, describe, expect, it, vi } from "vitest";
import { createPracticeEngineClient } from "./practiceEngineClient.js";

afterEach(() => vi.useRealTimers());
function fixture() {
  vi.useFakeTimers();
  const workers = [];
  const client = createPracticeEngineClient({ createWorker: () => {
    const worker = { postMessage: vi.fn(), terminate: vi.fn() };
    workers.push(worker);
    return worker;
  } });
  const reply = (data = {}) => {
    const worker = workers.at(-1);
    worker.onmessage({ data: { id: worker.postMessage.mock.calls.at(-1)[0].id, ok: true, ...data } });
  };
  return { workers, client, reply };
}

describe("practice worker lifecycle", () => {
  it("deduplicates readiness and correlates searches", async () => {
    const f = fixture();
    const ready = f.client.ensureReady("advanced");
    expect(f.client.ensureReady("advanced")).toBe(ready);
    f.reply();
    await ready;
    const search = f.client.search({ difficulty: "advanced" });
    f.reply({ action: { type: "move", pointId: "3,3" } });
    expect(await search).toEqual({ type: "move", pointId: "3,3" });
    f.client.close();
    expect(f.workers[0].terminate).toHaveBeenCalledOnce();
  });

  it("kills a blocked synchronous WASM search from outside the Worker and recreates it", async () => {
    const f = fixture();
    const search = f.client.search({ difficulty: "advanced" });
    const rejected = expect(search).rejects.toThrow("engine_timeout");
    await vi.advanceTimersByTimeAsync(30_000);
    await rejected;
    expect(f.workers[0].terminate).toHaveBeenCalledOnce();
    const ready = f.client.ensureReady("advanced");
    f.reply();
    await ready;
    expect(f.workers).toHaveLength(2);
  });

  it("rejects pending work on disposal and ignores late replies", async () => {
    const f = fixture();
    const search = f.client.search({ difficulty: "beginner" });
    const rejected = expect(search).rejects.toThrow("engine_cancelled");
    f.client.close();
    f.reply();
    await rejected;
    expect(vi.getTimerCount()).toBe(0);
  });

  it("replaces a failed initialization so retry can download the engine again", async () => {
    const f = fixture();
    const first = f.client.ensureReady("advanced");
    const rejected = expect(first).rejects.toThrow("engine_failed");
    f.reply({ ok: false, error: "engine_failed" });
    await rejected;
    const second = f.client.ensureReady("advanced");
    expect(f.workers).toHaveLength(2);
    f.reply();
    await second;
    f.client.close();
  });
});
