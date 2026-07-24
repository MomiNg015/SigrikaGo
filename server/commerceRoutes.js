import express from "express";
import {
  ACHIEVEMENT_TRIGGER_EVENTS,
  evaluateAchievementsForUser,
  incrementAchievementCounter
} from "./achievements.js";
import { listItemInventory, useInventoryItem } from "./items.js";
import { purchaseShopItem } from "./shop.js";
import { equipCostume, purchaseCostume } from "./costumes.js";

export function createCommerceRouteHandlers({
  prisma,
  evaluateAchievementsForUserFn = evaluateAchievementsForUser,
  incrementAchievementCounterFn = incrementAchievementCounter,
  equipCostumeFn = equipCostume,
  listItemInventoryFn = listItemInventory,
  purchaseCostumeFn = purchaseCostume,
  purchaseShopItemFn = purchaseShopItem,
  useInventoryItemFn = useInventoryItem
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

  return {
    purchase,
    costumePurchase,
    costumeEquip,
    inventory,
    useItem
  };
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
  router.post("/items/:itemId/use", handlers.useItem);
  return router;
}
