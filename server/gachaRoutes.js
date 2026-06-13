import express from "express";
import {
  executeGachaDraw,
  listGachaDrawHistory,
  listOpenGachaPools
} from "./gacha.js";

export function createGachaRouteHandlers({
  prisma,
  executeGachaDrawFn = executeGachaDraw,
  listGachaDrawHistoryFn = listGachaDrawHistory,
  listOpenGachaPoolsFn = listOpenGachaPools
}) {
  async function pools(req, res) {
    try {
      res.json(await listOpenGachaPoolsFn({
        prisma,
        userId: req.user.id,
        now: new Date()
      }));
    } catch (error) {
      sendGachaError(res, error, "读取扭蛋池失败");
    }
  }

  async function draw(req, res) {
    try {
      res.json(await executeGachaDrawFn({
        prisma,
        userId: req.user.id,
        poolId: req.params.poolId,
        count: req.body.count,
        now: new Date()
      }));
    } catch (error) {
      sendGachaError(res, error, "扭蛋失败");
    }
  }

  async function history(req, res) {
    try {
      res.json(await listGachaDrawHistoryFn({
        prisma,
        userId: req.user.id
      }));
    } catch (error) {
      sendGachaError(res, error, "读取扭蛋记录失败");
    }
  }

  return { pools, draw, history };
}

export function createGachaRouter(deps) {
  const router = express.Router();
  const handlers = createGachaRouteHandlers(deps);
  router.get("/gacha/pools", handlers.pools);
  router.post("/gacha/pools/:poolId/draw", handlers.draw);
  router.get("/gacha/history", handlers.history);
  return router;
}

function sendGachaError(res, error, fallbackMessage) {
  res.status(error.status ?? 500).json({ error: error.message ?? fallbackMessage });
}
