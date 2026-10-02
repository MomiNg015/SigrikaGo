import express from "express";

export function createHealthRouteHandlers({ runtimeServiceState }) {
  return {
    live(_req, res) {
      res.json({ ok: true, status: "live" });
    },
    ready(_req, res) {
      const readiness = runtimeServiceState?.readiness?.() ?? { ok: true, status: "ready" };
      res.status(readiness.ok ? 200 : 503).json(readiness);
    }
  };
}

export function createHealthRouter(deps) {
  const router = express.Router();
  const handlers = createHealthRouteHandlers(deps);
  router.get("/live", handlers.live);
  router.get("/ready", handlers.ready);
  return router;
}
