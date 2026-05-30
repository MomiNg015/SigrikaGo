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
  logger = console
} = {}) {
  let shuttingDown = false;

  async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    try {
      await closeServer(server);
      for (const dependency of dependencies) {
        await dependency?.$disconnect?.();
      }
      processLike.exit(0);
    } catch (error) {
      logger.error(error);
      processLike.exit(1);
    }
  }

  processLike.on("SIGINT", shutdown);
  processLike.on("SIGTERM", shutdown);
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}
