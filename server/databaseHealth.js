export function createDatabaseHealth({ probe, now = Date.now, timeoutMs = 2000, intervalMs = 5000, staleMs = 15000 }) {
  let timer = null;
  let inFlight = null;
  let closed = false;
  let healthy = false;
  let checkedAt = null;
  async function check() {
    if (closed || inFlight) return;
    let expired = false;
    let timeout;
    const operation = Promise.resolve().then(probe);
    inFlight = operation;
    const result = operation.then(() => {
      if (!closed && !expired) { healthy = true; checkedAt = now(); }
    }, () => {
      if (!closed && !expired) { healthy = false; checkedAt = now(); }
    }).finally(() => {
      clearTimeout(timeout);
      if (inFlight === operation) inFlight = null;
    });
    await Promise.race([result, new Promise((resolve) => {
      timeout = setTimeout(() => { expired = true; healthy = false; checkedAt = now(); resolve(); }, timeoutMs);
    })]);
  }
  return {
    async start() {
      await check();
      if (!closed && !timer) { timer = setInterval(() => { void check(); }, intervalMs); timer.unref?.(); }
    },
    snapshot: () => ({ ok: healthy && checkedAt !== null && now() - checkedAt < staleMs, checkedAt }),
    close() { closed = true; clearInterval(timer); timer = null; },
    check
  };
}
