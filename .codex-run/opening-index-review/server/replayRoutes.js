import express from "express";
import { listReplaySummaryPage, REPLAY_PAGE_SIZE } from "./replayPagination.js";

export const PERSONAL_REPLAY_PAGE_SIZE = REPLAY_PAGE_SIZE;

export function createReplayRouteHandlers({ prisma }) {
  async function listUserReplays(req, res) {
    res.json(await listReplaySummaryPage({
      prisma,
      userId: req.user.id,
      mode: req.query?.mode,
      cursor: req.query?.cursor
    }));
  }

  async function getReplay(req, res) {
    const record = await prisma.gameRecord.findUnique({ where: { id: req.params.id } });
    if (!record) {
      res.status(404).json({ error: "\u68cb\u8c31\u4e0d\u5b58\u5728" });
      return;
    }
    res.json({ record: { ...record, snapshot: JSON.parse(record.snapshot) } });
  }

  return {
    listUserReplays,
    getReplay
  };
}

export function createReplayRouter(deps) {
  const router = express.Router();
  const handlers = createReplayRouteHandlers(deps);
  router.get("/replays", handlers.listUserReplays);
  router.get("/replays/:id", handlers.getReplay);
  return router;
}
