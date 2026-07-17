import express from "express";
import {
  claimRecruitment,
  fastForwardRecruitment,
  getRecruitmentStatus,
  interruptRecruitmentCinematic,
  startRecruitment
} from "./recruitment.js";

export function createRecruitmentRouteHandlers({
  prisma,
  claimRecruitmentFn = claimRecruitment,
  fastForwardRecruitmentFn = fastForwardRecruitment,
  getRecruitmentStatusFn = getRecruitmentStatus,
  interruptRecruitmentCinematicFn = interruptRecruitmentCinematic,
  startRecruitmentFn = startRecruitment
}) {
  async function status(req, res) {
    try {
      res.json(await getRecruitmentStatusFn({ prisma, userId: req.user.id, now: new Date() }));
    } catch (error) {
      res.status(error.status ?? 500).json({ error: error.message ?? "读取招募状态失败" });
    }
  }

  async function start(req, res) {
    try {
      res.json(await startRecruitmentFn({
        prisma,
        userId: req.user.id,
        itemType: req.body.itemType,
        now: new Date()
      }));
    } catch (error) {
      res.status(error.status ?? 500).json({ error: error.message ?? "开始招募失败" });
    }
  }

  async function claim(req, res) {
    try {
      res.json(await claimRecruitmentFn({ prisma, userId: req.user.id, now: new Date() }));
    } catch (error) {
      res.status(error.status ?? 500).json({ error: error.message ?? "查看招新回应失败" });
    }
  }

  async function fastForward(req, res) {
    try {
      res.json(await fastForwardRecruitmentFn({ prisma, userId: req.user.id, now: new Date() }));
    } catch (error) {
      res.status(error.status ?? 500).json({ error: error.message ?? "快速计时失败" });
    }
  }

  async function interruptCinematic(req, res) {
    try {
      res.json(await interruptRecruitmentCinematicFn({
        prisma,
        userId: req.user.id,
        now: new Date()
      }));
    } catch (error) {
      res.status(error.status ?? 500).json({ error: error.message ?? "中断特殊招募演出失败" });
    }
  }

  return { status, start, claim, fastForward, interruptCinematic };
}

export function createRecruitmentRouter(deps) {
  const router = express.Router();
  const handlers = createRecruitmentRouteHandlers(deps);
  router.get("/recruitment", handlers.status);
  router.post("/recruitment/start", handlers.start);
  router.post("/recruitment/fast-forward", handlers.fastForward);
  router.post("/recruitment/interrupt-cinematic", handlers.interruptCinematic);
  router.post("/recruitment/claim", handlers.claim);
  return router;
}
