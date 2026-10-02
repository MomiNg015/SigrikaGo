import express from "express";
import { evaluateAchievementsForUser, incrementAchievementCounter } from "./achievements.js";
import {
  executeGachaDraw,
  listGachaDrawHistory,
  listOpenGachaPools
} from "./gacha.js";

export function createGachaRouteHandlers({
  prisma,
  evaluateAchievementsForUserFn = evaluateAchievementsForUser,
  executeGachaDrawFn = executeGachaDraw,
  incrementAchievementCounterFn = incrementAchievementCounter,
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
      const result = await executeGachaDrawFn({
        prisma,
        userId: req.user.id,
        poolId: req.params.poolId,
        count: req.body.count,
        now: new Date()
      });
      await incrementAchievementCounterFn({
        prisma,
        userId: req.user.id,
        metric: "gacha_draws",
        delta: result.draw?.drawCount ?? 1
      });
      const achievementUnlocks = await evaluateAchievementsForUserFn({ prisma, userId: req.user.id });
      res.json(achievementUnlocks.length ? { ...result, achievementUnlocks } : result);
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
