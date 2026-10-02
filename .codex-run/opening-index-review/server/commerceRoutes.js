import express from "express";
import {
  ACHIEVEMENT_TRIGGER_EVENTS,
  evaluateAchievementsForUser,
  incrementAchievementCounter
} from "./achievements.js";
import { listItemInventory, useInventoryItem } from "./items.js";
import { purchaseShopItem } from "./shop.js";
import { equipCostume, purchaseCostume } from "./costumes.js";
import {
  cancelRainbowBeanCandyEffect,
  completeSigrikaCandyRecovery,
  debugJumpSigrikaCandyToUseEight,
  getSigrikaCandyArcStory,
  markSigrikaCandyClimax,
  startSigrikaCandyRecovery
} from "./sigrikaCandyArc.js";

export function createCommerceRouteHandlers({
  prisma,
  evaluateAchievementsForUserFn = evaluateAchievementsForUser,
  incrementAchievementCounterFn = incrementAchievementCounter,
  equipCostumeFn = equipCostume,
  listItemInventoryFn = listItemInventory,
  purchaseCostumeFn = purchaseCostume,
  purchaseShopItemFn = purchaseShopItem,
  useInventoryItemFn = useInventoryItem,
  cancelRainbowBeanCandyEffectFn = cancelRainbowBeanCandyEffect,
  completeSigrikaCandyRecoveryFn = completeSigrikaCandyRecovery,
  debugJumpSigrikaCandyToUseEightFn = debugJumpSigrikaCandyToUseEight,
  getSigrikaCandyArcStoryFn = getSigrikaCandyArcStory,
  markSigrikaCandyClimaxFn = markSigrikaCandyClimax,
  startSigrikaCandyRecoveryFn = startSigrikaCandyRecovery
}) {
  async function purchase(req, res) {
    try {
      const result = await purchaseShopItemFn({
        prisma,
        userId: req.user.id,
        itemId: req.params.id
      });
      await incrementAchievementCounterFn({ prisma, userId: req.user.id, metric: "purchase_count" });
      const achievementUnlocks = await evaluateAchievementsForUserFn({ prisma, userId: req.user.id });
      res.json(withAchievementUnlocks(result, achievementUnlocks));
    } catch (error) {
      res.status(error.status ?? 500).json({ error: error.message ?? "\u8d2d\u4e70\u5931\u8d25" });
    }
  }

  async function inventory(req, res) {
    try {
      res.json(await listItemInventoryFn({ prisma, userId: req.user.id }));
    } catch (error) {
      res.status(error.status ?? 500).json({ error: error.message ?? "\u8bfb\u53d6\u4ed3\u5e93\u5931\u8d25" });
    }
  }

  async function costumePurchase(req, res) {
    try {
      const result = await purchaseCostumeFn({
        prisma,
        userId: req.user.id,
        costumeId: req.params.id
      });
      await incrementAchievementCounterFn({ prisma, userId: req.user.id, metric: "purchase_count" });
      const achievementUnlocks = await evaluateAchievementsForUserFn({ prisma, userId: req.user.id });
      res.json(withAchievementUnlocks(result, achievementUnlocks));
    } catch (error) {
      res.status(error.status ?? 500).json({ error: error.message ?? "购买服装失败" });
    }
  }

  async function costumeEquip(req, res) {
    try {
      res.json(await equipCostumeFn({
        prisma,
        userId: req.user.id,
        characterSlug: req.body.characterSlug,
        costumeId: req.body.costumeId
      }));
    } catch (error) {
      res.status(error.status ?? 500).json({ error: error.message ?? "更换服装失败" });
    }
  }

  async function useItem(req, res) {
    try {
      const result = await useInventoryItemFn({
        prisma,
        userId: req.user.id,
        itemId: req.params.itemId,
        characterId: req.body.characterId
      });
      const triggerEvent = result.itemUseOutcome !== "rejected"
        && result.item?.targetId === "rainbow-bean-candy"
        && result.target?.characterId === "denia"
        ? ACHIEVEMENT_TRIGGER_EVENTS.deniaRainbowBeanCandy
        : "";
      const achievementUnlocks = await evaluateAchievementsForUserFn({ prisma, userId: req.user.id, triggerEvent });
      res.json(withAchievementUnlocks(result, achievementUnlocks));
    } catch (error) {
      res.status(error.status ?? 500).json({ error: error.message ?? "\u4f7f\u7528\u9053\u5177\u5931\u8d25" });
    }
  }

  async function sigrikaCandyStory(req, res) {
    await respond(res, () => getSigrikaCandyArcStoryFn({ prisma, userId: req.user.id }), "读取西格莉卡剧情失败");
  }

  async function sigrikaCandyClimax(req, res) {
    await respond(res, async () => ({ user: await markSigrikaCandyClimaxFn({ prisma, userId: req.user.id }) }), "触发异常剧情失败");
  }

  async function sigrikaCandyDebugJump(req, res) {
    await respond(res, async () => ({ user: await debugJumpSigrikaCandyToUseEightFn({ prisma, userId: req.user.id }) }), "跳转第八次剧情失败");
  }

  async function sigrikaCandyRecoveryStart(req, res) {
    await respond(res, () => startSigrikaCandyRecoveryFn({ prisma, userId: req.user.id }), "读取恢复剧情失败");
  }

  async function sigrikaCandyRecoveryComplete(req, res) {
    await respond(res, async () => ({ user: await completeSigrikaCandyRecoveryFn({ prisma, userId: req.user.id }) }), "结束恢复剧情失败");
  }

  async function cancelCandyEffect(req, res) {
    await respond(res, () => cancelRainbowBeanCandyEffectFn({
      prisma,
      userId: req.user.id,
      characterId: req.params.characterId
    }), "取消糖果效果失败");
  }

  return {
    purchase,
    costumePurchase,
    costumeEquip,
    inventory,
    useItem,
    sigrikaCandyStory,
    sigrikaCandyClimax,
    sigrikaCandyDebugJump,
    sigrikaCandyRecoveryStart,
    sigrikaCandyRecoveryComplete,
    cancelCandyEffect
  };
}

async function respond(res, action, fallbackMessage) {
  try {
    res.json(await action());
  } catch (error) {
    res.status(error.status ?? 500).json({ error: error.message ?? fallbackMessage });
  }
}

function withAchievementUnlocks(result, achievementUnlocks = []) {
  return achievementUnlocks.length ? { ...result, achievementUnlocks } : result;
}

export function createCommerceRouter(deps) {
  const router = express.Router();
  const handlers = createCommerceRouteHandlers(deps);
  router.post("/shop/:id/purchase", handlers.purchase);
  router.post("/costumes/:id/purchase", handlers.costumePurchase);
  router.post("/costumes/equip", handlers.costumeEquip);
  router.get("/items/inventory", handlers.inventory);
  router.get("/items/rainbow-bean-candy/sigrika/story", handlers.sigrikaCandyStory);
  router.post("/items/rainbow-bean-candy/sigrika/climax", handlers.sigrikaCandyClimax);
  router.post("/items/rainbow-bean-candy/sigrika/debug/jump-to-eight", handlers.sigrikaCandyDebugJump);
  router.post("/items/rainbow-bean-candy/sigrika/recovery/start", handlers.sigrikaCandyRecoveryStart);
  router.post("/items/rainbow-bean-candy/sigrika/recovery/complete", handlers.sigrikaCandyRecoveryComplete);
  router.post("/items/rainbow-bean-candy/effects/:characterId/cancel", handlers.cancelCandyEffect);
  router.post("/items/:itemId/use", handlers.useItem);
  return router;
}
