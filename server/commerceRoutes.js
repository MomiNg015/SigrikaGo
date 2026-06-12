import express from "express";
import { listItemInventory, useInventoryItem } from "./items.js";
import { purchaseShopItem } from "./shop.js";

export function createCommerceRouteHandlers({
  prisma,
  listItemInventoryFn = listItemInventory,
  purchaseShopItemFn = purchaseShopItem,
  useInventoryItemFn = useInventoryItem
}) {
  async function purchase(req, res) {
    try {
      res.json(await purchaseShopItemFn({
        prisma,
        userId: req.user.id,
        itemId: req.params.id
      }));
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

  async function useItem(req, res) {
    try {
      res.json(await useInventoryItemFn({
        prisma,
        userId: req.user.id,
        itemId: req.params.itemId,
        characterId: req.body.characterId
      }));
    } catch (error) {
      res.status(error.status ?? 500).json({ error: error.message ?? "\u4f7f\u7528\u9053\u5177\u5931\u8d25" });
    }
  }

  return {
    purchase,
    inventory,
    useItem
  };
}

export function createCommerceRouter(deps) {
  const router = express.Router();
  const handlers = createCommerceRouteHandlers(deps);
  router.post("/shop/:id/purchase", handlers.purchase);
  router.get("/items/inventory", handlers.inventory);
  router.post("/items/:itemId/use", handlers.useItem);
  return router;
}
