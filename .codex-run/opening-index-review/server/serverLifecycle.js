export function startHttpServer(server, {
  port,
  logger = console,
  processLike = process
} = {}) {
  server.on("error", (error) => {
    if (error?.code === "EADDRINUSE") {
      logger.error(`Port ${port} is already in use. Stop the old dev server or set PORT to another value.`);
      processLike.exit(1);
      return;
    }
    throw error;
  });

  server.listen(port, () => {
    logger.log(`SigrikaGo server listening on http://localhost:${port}`);
  });
}

export function installServerLifecycle(server, {
  processLike = process,
  dependencies = [],
  beginShutdown = [],
  closeRealtime = null,
  beforeShutdown = [],
  logger = console,
  shutdownTimeoutMs = 15000,
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout
} = {}) {
  let shuttingDown = false;

  async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    let timeoutId = null;
    try {
      await Promise.race([
        performShutdown(),
        new Promise((_, reject) => {
          timeoutId = setTimeoutFn(() => reject(new Error(
            `Server shutdown exceeded ${shutdownTimeoutMs}ms`
          )), shutdownTimeoutMs);
        })
      ]);
      clearTimeoutFn(timeoutId);
      processLike.exit(0);
    } catch (error) {
      clearTimeoutFn(timeoutId);
      logger.error(error);
      processLike.exit(1);
    }
  }

  async function performShutdown() {
    for (const task of beginShutdown) await task?.();
    await closeRealtime?.();
    await closeServer(server);
    for (const task of beforeShutdown) await task?.();
    for (const dependency of dependencies) await dependency?.$disconnect?.();
  }

  processLike.on("SIGINT", shutdown);
  processLike.on("SIGTERM", shutdown);
  processLike.on?.("message", (message) => {
    if (message?.type === "shutdown") void shutdown();
  });
}

export function closeRealtimeServer(realtimeServer) {
  if (!realtimeServer?.close) return Promise.resolve();
  return new Promise((resolve) => realtimeServer.close(resolve));
}

function closeServer(server) {
  if (!server?.close || server.listening === false) return Promise.resolve();
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error?.code === "ERR_SERVER_NOT_RUNNING") resolve();
      else if (error) reject(error);
      else resolve();
    });
  });
}
