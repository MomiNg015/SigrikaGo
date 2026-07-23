import express from "express";
import { GAME_MODE_IDS, normalizeGameModeId } from "../src/shared/gameModes.js";
import { USER_ASSET_RELATION_SELECT } from "./db.js";
import { listPublicCharacterResponse } from "./characters.js";
import { createFeedbackMessage } from "./feedback.js";
import { buildLeaderboard } from "./leaderboard.js";
import { attachAchievementEquipmentAssetsToUsers } from "./achievements.js";
import { listShopItems } from "./shop.js";
import { getPublicSiteSettings } from "./siteSettings.js";
import { listPublicSkillTraits } from "./skillTraits.js";

export const LEADERBOARD_RECORD_SCAN_LIMIT = 10_000;

export function createPublicRouteHandlers({
  prisma,
  listWatchRooms,
  buildLeaderboardFn = buildLeaderboard,
  createFeedbackMessageFn = createFeedbackMessage,
  getPublicSiteSettingsFn = getPublicSiteSettings,
  listPublicCharacterResponseFn = listPublicCharacterResponse,
  listPublicSkillTraitsFn = listPublicSkillTraits,
  listShopItemsFn = listShopItems,
  normalizeMode = normalizeGameModeId
}) {
  function health(_req, res) {
    res.json({ ok: true });
  }

  async function characters(_req, res) {
    res.json(await listPublicCharacterResponseFn(prisma));
  }

  async function skillTraits(_req, res) {
    res.json({ traits: await listPublicSkillTraitsFn(prisma) });
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
        where: { mode, rated: true },
        select: {
          blackUserId: true,
          whiteUserId: true,
          blackCharacter: true,
          whiteCharacter: true,
          winnerColor: true,
          resultReason: true,
          resultText: true,
          mode: true
        },
        orderBy: { createdAt: "desc" },
        take: LEADERBOARD_RECORD_SCAN_LIMIT
      })
    ]);
    const decoratedUsers = await attachAchievementEquipmentAssetsToUsers(prisma, users);
    res.json({ players: buildLeaderboardFn(decoratedUsers, records, { mode }) });
  }

  async function watchRooms(req, res) {
    const mode = normalizeMode(req.query.mode);
    const watchableRooms = listWatchRooms();
    const roomCounts = Object.fromEntries(GAME_MODE_IDS.map((modeId) => [modeId, 0]));
    for (const room of watchableRooms) {
      const roomMode = normalizeMode(room.mode);
      if (Object.hasOwn(roomCounts, roomMode)) roomCounts[roomMode] += 1;
    }
    res.json({
      rooms: watchableRooms.filter((room) => normalizeMode(room.mode) === mode),
      roomCounts
    });
  }

  return {
    health,
    characters,
    skillTraits,
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
  router.get("/skill-traits", handlers.skillTraits);
  router.get("/shop", authHttp, handlers.shop);
  router.get("/site-settings", handlers.siteSettings);
  router.post("/feedback", authHttp, handlers.feedback);
  router.get("/leaderboard", authHttp, handlers.leaderboard);
  router.get("/rooms/watch", authHttp, handlers.watchRooms);
  return router;
}
