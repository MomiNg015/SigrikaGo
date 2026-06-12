import express from "express";
import { normalizeGameModeId } from "../src/shared/gameModes.js";
import { USER_ASSET_RELATION_SELECT } from "./db.js";
import { listPublicCharacterResponse } from "./characters.js";
import { createFeedbackMessage } from "./feedback.js";
import { buildLeaderboard } from "./leaderboard.js";
import { listShopItems } from "./shop.js";
import { getPublicSiteSettings } from "./siteSettings.js";

export function createPublicRouteHandlers({
  prisma,
  listWatchRooms,
  buildLeaderboardFn = buildLeaderboard,
  createFeedbackMessageFn = createFeedbackMessage,
  getPublicSiteSettingsFn = getPublicSiteSettings,
  listPublicCharacterResponseFn = listPublicCharacterResponse,
  listShopItemsFn = listShopItems,
  normalizeMode = normalizeGameModeId
}) {
  function health(_req, res) {
    res.json({ ok: true });
  }

  async function characters(_req, res) {
    res.json(await listPublicCharacterResponseFn(prisma));
  }

  async function shop(req, res) {
    res.json(await listShopItemsFn(prisma, req.user.id));
  }

  async function siteSettings(_req, res) {
    res.json({ settings: await getPublicSiteSettingsFn(prisma) });
  }

  async function feedback(req, res) {
    try {
      res.json(await createFeedbackMessageFn({
        prisma,
        user: req.user,
        content: req.body.content
      }));
    } catch (error) {
      res.status(error.status ?? 500).json({ error: error.message ?? "\u53cd\u9988\u63d0\u4ea4\u5931\u8d25" });
    }
  }

  async function leaderboard(req, res) {
    const mode = normalizeMode(req.query.mode);
    const [users, records] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          rating: true,
          selectedCharacter: true,
          itemEffects: true,
          ...USER_ASSET_RELATION_SELECT
        }
      }),
      prisma.gameRecord.findMany({
        where: { mode },
        select: {
          blackUserId: true,
          whiteUserId: true,
          blackCharacter: true,
          whiteCharacter: true,
          winnerColor: true,
          resultReason: true,
          resultText: true,
          mode: true
        }
      })
    ]);
    res.json({ players: buildLeaderboardFn(users, records, { mode }) });
  }

  async function watchRooms(req, res) {
    const mode = normalizeMode(req.query.mode);
    res.json({ rooms: listWatchRooms().filter((room) => normalizeMode(room.mode) === mode) });
  }

  return {
    health,
    characters,
    shop,
    siteSettings,
    feedback,
    leaderboard,
    watchRooms
  };
}

export function createPublicRouter({ authHttp, ...deps }) {
  const router = express.Router();
  const handlers = createPublicRouteHandlers(deps);
  router.get("/health", handlers.health);
  router.get("/characters", handlers.characters);
  router.get("/shop", authHttp, handlers.shop);
  router.get("/site-settings", handlers.siteSettings);
  router.post("/feedback", authHttp, handlers.feedback);
  router.get("/leaderboard", authHttp, handlers.leaderboard);
  router.get("/rooms/watch", authHttp, handlers.watchRooms);
  return router;
}
