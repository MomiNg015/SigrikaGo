import express from "express";

export function createReplayRouteHandlers({ prisma }) {
  async function listUserReplays(req, res) {
    const records = await prisma.gameRecord.findMany({
      where: {
        OR: [
          { blackUserId: req.user.id },
          { whiteUserId: req.user.id }
        ]
      },
      select: {
        id: true,
        roomCode: true,
        blackUserId: true,
        whiteUserId: true,
        blackName: true,
        whiteName: true,
        resultText: true,
        winnerColor: true,
        resultReason: true,
        moveCount: true,
        mode: true,
        blackCharacter: true,
        whiteCharacter: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({
      records: records.map((record) => ({
        id: record.id,
        roomCode: record.roomCode,
        blackUserId: record.blackUserId,
        whiteUserId: record.whiteUserId,
        blackName: record.blackName,
        whiteName: record.whiteName,
        resultText: record.resultText,
        winnerColor: record.winnerColor,
        resultReason: record.resultReason,
        moveCount: record.moveCount,
        mode: record.mode ?? "spark",
        blackCharacter: record.blackCharacter,
        whiteCharacter: record.whiteCharacter,
        createdAt: record.createdAt
      }))
    });
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
