import { LOCAL_PRACTICE_VERSION, LOCAL_PRACTICE_SEARCH_MS } from "../shared/localPractice.js";

export function createPracticeEngineClient({
  createWorker = () => new Worker(new URL("./practiceEngine.worker.js", import.meta.url), { type: "module" }),
  setTimer = setTimeout, clearTimer = clearTimeout
} = {}) {
  let worker = null;
  let sequence = 0;
  const pending = new Map();
  const ready = new Map();

  function close(reason = "engine_cancelled") {
    worker?.terminate();
    worker = null;
    ready.clear();
    for (const request of pending.values()) {
      clearTimer(request.timer);
      request.reject(new Error(reason));
    }
    pending.clear();
  }

  function call(payload, timeoutMs) {
    return new Promise((resolve, reject) => {
      if (!worker) {
        worker = createWorker();
        worker.onmessage = ({ data }) => {
          const request = pending.get(data.id);
          if (!request) return;
          pending.delete(data.id);
          clearTimer(request.timer);
          if (data.ok) request.resolve(data.action);
          else request.reject(new Error(data.error));
        };
        worker.onerror = () => close("engine_failed");
      }
      const id = ++sequence;
      const timer = setTimer(() => close("engine_timeout"), timeoutMs);
      pending.set(id, { resolve, reject, timer });
      try {
        worker.postMessage({ ...payload, version: LOCAL_PRACTICE_VERSION, id });
      } catch {
        close("engine_failed");
      }
    });
  }

  function ensureReady(difficulty) {
    if (!ready.has(difficulty)) {
      const promise = call({ type: "ready", difficulty }, 60_000).catch((error) => {
        // A rejected dynamic import/compile is cached inside the Worker. A new
        // admission attempt must get a fresh Worker after a transient failure.
        if (ready.get(difficulty) === promise) close("engine_failed");
        throw error;
      });
      ready.set(difficulty, promise);
    }
    return ready.get(difficulty);
  }

  return { ensureReady, close, search: (job) => call({ type: "search", job }, LOCAL_PRACTICE_SEARCH_MS) };
}

export const practiceEngineClient = createPracticeEngineClient();
