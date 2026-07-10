import express from "express";
import {
  getAchievementEquipment,
  listAchievementsForUser,
  publicUserWithAchievementEquipment,
  updateAchievementEquipment
} from "./achievements.js";
import { USER_ASSET_RELATION_INCLUDE, publicUser } from "./db.js";
import { listPublicCharacters } from "./characters.js";
import { CHARACTERS } from "../src/shared/characters.js";
import { getStoneDecoration } from "../src/shared/stoneDecorations.js";
import { blockedCharactersForItemEffects } from "./itemEffects.js";
import { resumePayloadForUser } from "./resume.js";
import { selectUserSkillMusic } from "./musicSelection.js";
import { listMusicTrackSettings } from "./musicTracks.js";
import { validateRoomCode } from "./security.js";
import { publicUserWithRecordStats } from "./userProfile.js";

export function validateOptionalRoomCode(roomCode) {
  if (!roomCode) return "";
  const result = validateRoomCode(String(roomCode));
  return result.ok ? result.value : "";
}

async function characterMap({ prisma, listCharacters = listPublicCharacters }) {
  const list = await listCharacters(prisma);
  return Object.fromEntries(list.map((character) => [character.id, character]));
}

export function createCharacterSelectionData({
  prisma,
  listCharacters = listPublicCharacters
}) {
  return async function characterSelectionData() {
    const [characters, records] = await Promise.all([
      characterMap({ prisma, listCharacters }),
      prisma.character.findMany({ select: { slug: true, enabled: true } })
    ]);
    return {
      characters,
      disabledSlugs: new Set(records.filter((record) => !record.enabled).map((record) => record.slug))
    };
  };
}

export function createPlayerRouteHandlers({
  prisma,
  findRoomForUser,
  roomView,
  characterSelectionData,
  publicUserFn = publicUser,
  resumePayloadForUserFn = resumePayloadForUser,
  selectSkillMusic = selectUserSkillMusic,
  stoneDecorationForId = getStoneDecoration,
  blockedCharactersForEffects = blockedCharactersForItemEffects,
  statsForUser = publicUserWithRecordStats,
  listAchievementsForUserFn = listAchievementsForUser,
  getAchievementEquipmentFn = getAchievementEquipment,
  updateAchievementEquipmentFn = updateAchievementEquipment,
  publicUserWithAchievementEquipmentFn = publicUserWithAchievementEquipment
}) {
  async function publicUserWithHistory(user) {
    const records = await prisma.gameRecord.findMany({
      where: {
        OR: [
          { blackUserId: user.id },
          { whiteUserId: user.id }
        ]
      },
      select: {
        blackUserId: true,
        whiteUserId: true,
        winnerColor: true,
        resultText: true
      }
    });
    return statsForUser(user, records);
  }

  async function getMe(req, res) {
    const [user, achievementUnlocks] = await Promise.all([
      publicUserWithAchievementEquipmentFn({ prisma, user: req.user }),
      listAchievementsForUserFn({ prisma, userId: req.user.id }).then((data) => data.unlocks ?? [])
    ]);
    res.json({ user, achievementUnlocks });
  }

  async function listAchievements(req, res) {
    res.json(await listAchievementsForUserFn({ prisma, userId: req.user.id }));
  }

  async function getEquipment(req, res) {
    res.json(await getAchievementEquipmentFn({ prisma, userId: req.user.id }));
  }

  async function updateEquipment(req, res) {
    res.json(await updateAchievementEquipmentFn({ prisma, userId: req.user.id, body: req.body }));
  }

  async function resume(req, res) {
    res.json(await resumePayloadForUserFn({
      prisma,
      userId: req.user.id,
      roomCode: validateOptionalRoomCode(req.query.roomCode),
      findRoomForUser,
      roomView
    }));
  }

  async function updateCharacter(req, res) {
    const characterId = String(req.body.characterId ?? "");
    const publicProfile = publicUserFn(req.user);
    if (blockedCharactersForEffects(publicProfile.itemEffects).has(characterId)) {
      res.status(403).json({ error: "\u7cd6\u679c\u6548\u679c\u4e2d\uff0c\u6682\u65f6\u65e0\u6cd5\u51fa\u6218" });
      return;
    }
    if (!publicProfile.ownedCharacters.includes(characterId)) {
      res.status(403).json({ error: "\u5c1a\u672a\u83b7\u5f97\u8be5\u89d2\u8272" });
      return;
    }
    const { characters, disabledSlugs } = await characterSelectionData();
    if (!characters[characterId] && (disabledSlugs.has(characterId) || !CHARACTERS[characterId])) {
      res.status(400).json({ error: "\u89d2\u8272\u4e0d\u5b58\u5728" });
      return;
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { selectedCharacter: characterId },
      include: USER_ASSET_RELATION_INCLUDE
    });
    res.json({ user: publicUserFn(user) });
  }

  async function updateDecoration(req, res) {
    const decorationId = String(req.body.decorationId ?? "").trim();
    if (decorationId) {
      if (!stoneDecorationForId(decorationId)) {
        res.status(400).json({ error: "\u88c5\u9970\u4e0d\u5b58\u5728" });
        return;
      }
      const ownedDecorations = publicUserFn(req.user).ownedDecorations;
      if (!ownedDecorations.includes(decorationId)) {
        res.status(403).json({ error: "\u5c1a\u672a\u83b7\u5f97\u8be5\u88c5\u9970" });
        return;
      }
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { selectedStoneDecoration: decorationId },
      include: USER_ASSET_RELATION_INCLUDE
    });
    res.json({ user: publicUserFn(user) });
  }

  async function updateMusicSelection(req, res) {
    try {
      res.json(await selectSkillMusic({
        prisma,
        user: req.user,
        characterId: req.body.characterId,
        trackId: req.body.trackId,
        effectType: req.body.effectType
      }));
    } catch (error) {
      if (error.status) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      throw error;
    }
  }

  async function listMusicTracks(_req, res) {
    res.json(await listMusicTrackSettings({ prisma }));
  }

  return {
    getMe,
    getEquipment,
    listAchievements,
    listMusicTracks,
    resume,
    updateCharacter,
    updateDecoration,
    updateEquipment,
    updateMusicSelection,
    publicUserWithHistory
  };
}

export function createPlayerRouter(deps) {
  const router = express.Router();
  const handlers = createPlayerRouteHandlers(deps);
  router.get("/me", handlers.getMe);
  router.get("/achievements", handlers.listAchievements);
  router.get("/music-tracks", handlers.listMusicTracks);
  router.get("/me/resume", handlers.resume);
  router.get("/me/achievement-equipment", handlers.getEquipment);
  router.patch("/me/achievement-equipment", handlers.updateEquipment);
  router.post("/me/character", handlers.updateCharacter);
  router.post("/me/decoration", handlers.updateDecoration);
  router.post("/me/music-selection", handlers.updateMusicSelection);
  return router;
}
