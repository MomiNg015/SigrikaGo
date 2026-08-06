import { describe, expect, it } from "vitest";
import { ACHIEVEMENT_TRIGGER_EVENTS } from "./achievements.js";
import { createCommerceRouteHandlers, createCommerceRouter } from "./commerceRoutes.js";

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

describe("commerce route handlers", () => {
  it("purchases a shop item for the authenticated user", async () => {
    let purchaseArgs = null;
    const handlers = createCommerceRouteHandlers({
      prisma: {},
      purchaseShopItemFn: async (args) => {
        purchaseArgs = args;
        return { user: { id: args.userId }, itemId: args.itemId };
      }
    });
    const res = createResponse();

    await handlers.purchase({
      user: { id: "user-1" },
      params: { id: "shop-1" }
    }, res);

    expect(purchaseArgs).toEqual({
      prisma: {},
      userId: "user-1",
      itemId: "shop-1"
    });
    expect(res.body).toEqual({ user: { id: "user-1" }, itemId: "shop-1" });
  });

  it("maps purchase errors into HTTP responses", async () => {
    const handlers = createCommerceRouteHandlers({
      prisma: {},
      purchaseShopItemFn: async () => {
        const error = new Error("not enough coins");
        error.status = 402;
        throw error;
      }
    });
    const res = createResponse();

    await handlers.purchase({
      user: { id: "user-1" },
      params: { id: "shop-1" }
    }, res);

    expect(res.statusCode).toBe(402);
    expect(res.body).toEqual({ error: "not enough coins" });
  });

  it("loads inventory for the authenticated user", async () => {
    let inventoryArgs = null;
    const handlers = createCommerceRouteHandlers({
      prisma: {},
      listItemInventoryFn: async (args) => {
        inventoryArgs = args;
        return { items: [{ itemId: "dream-ticket" }] };
      }
    });
    const res = createResponse();

    await handlers.inventory({ user: { id: "user-1" } }, res);

    expect(inventoryArgs).toEqual({ prisma: {}, userId: "user-1" });
    expect(res.body).toEqual({ items: [{ itemId: "dream-ticket" }] });
  });

  it("uses an inventory item with the selected character target", async () => {
    let useArgs = null;
    const handlers = createCommerceRouteHandlers({
      prisma: {},
      useInventoryItemFn: async (args) => {
        useArgs = args;
        return { ok: true };
      }
    });
    const res = createResponse();

    await handlers.useItem({
      user: { id: "user-1" },
      params: { itemId: "rainbow-bean-candy" },
      body: { characterId: "denia" }
    }, res);

    expect(useArgs).toEqual({
      prisma: {},
      userId: "user-1",
      itemId: "rainbow-bean-candy",
      characterId: "denia"
    });
    expect(res.body).toEqual({ ok: true });
  });

  it("passes the Denia rainbow bean candy achievement trigger after successful item use", async () => {
    let achievementArgs = null;
    const handlers = createCommerceRouteHandlers({
      prisma: {},
      useInventoryItemFn: async () => ({
        ok: true,
        itemUseOutcome: "accepted",
        item: { targetId: "rainbow-bean-candy" },
        target: { characterId: "denia" }
      }),
      evaluateAchievementsForUserFn: async (args) => {
        achievementArgs = args;
        return [{ id: "achievement-denia-rainbow-bean-candy" }];
      }
    });
    const res = createResponse();

    await handlers.useItem({
      user: { id: "user-1" },
      params: { itemId: "rainbow-bean-candy" },
      body: { characterId: "denia" }
    }, res);

    expect(achievementArgs).toEqual({
      prisma: {},
      userId: "user-1",
      triggerEvent: ACHIEVEMENT_TRIGGER_EVENTS.deniaRainbowBeanCandy
    });
    expect(res.body.achievementUnlocks).toEqual([{ id: "achievement-denia-rainbow-bean-candy" }]);
  });

  it("does not trigger the Denia candy achievement when she rejects the item", async () => {
    let achievementArgs = null;
    const handlers = createCommerceRouteHandlers({
      prisma: {},
      useInventoryItemFn: async () => ({
        ok: true,
        itemUseOutcome: "rejected",
        item: { targetId: "rainbow-bean-candy" },
        target: { characterId: "denia" }
      }),
      evaluateAchievementsForUserFn: async (args) => {
        achievementArgs = args;
        return [];
      }
    });
    const res = createResponse();

    await handlers.useItem({
      user: { id: "user-1" },
      params: { itemId: "rainbow-bean-candy" },
      body: { characterId: "denia" }
    }, res);

    expect(achievementArgs).toEqual({ prisma: {}, userId: "user-1", triggerEvent: "" });
    expect(res.body.achievementUnlocks).toBeUndefined();
  });

  it("routes the Sigrika arc transitions and development candy cancellation for the authenticated user", async () => {
    const calls = [];
    const handlers = createCommerceRouteHandlers({
      prisma: { marker: "prisma" },
      getSigrikaCandyArcStoryFn: async (args) => {
        calls.push(["story", args]);
        return { storyScript: { startNodeId: "corruption-start" } };
      },
      markSigrikaCandyClimaxFn: async (args) => {
        calls.push(["climax", args]);
        return { id: args.userId, sigrikaCandyArc: { phase: "awaiting-duel" } };
      },
      startSigrikaCandyRecoveryFn: async (args) => {
        calls.push(["recovery-start", args]);
        return { storyScript: { startNodeId: "recovery-win-start" } };
      },
      completeSigrikaCandyRecoveryFn: async (args) => {
        calls.push(["recovery-complete", args]);
        return { id: args.userId, sigrikaCandyArc: { phase: "normal" } };
      },
      debugJumpSigrikaCandyToUseEightFn: async (args) => {
        calls.push(["debug-jump", args]);
        return { id: args.userId, sigrikaCandyArc: { useCount: 8, phase: "corruption-story" } };
      },
      cancelRainbowBeanCandyEffectFn: async (args) => {
        calls.push(["cancel", args]);
        return { user: { id: args.userId } };
      }
    });
    const request = { user: { id: "user-1" }, params: { characterId: "sigrika" } };

    await handlers.sigrikaCandyStory(request, createResponse());
    await handlers.sigrikaCandyClimax(request, createResponse());
    await handlers.sigrikaCandyDebugJump(request, createResponse());
    await handlers.sigrikaCandyRecoveryStart(request, createResponse());
    await handlers.sigrikaCandyRecoveryComplete(request, createResponse());
    await handlers.cancelCandyEffect(request, createResponse());

    expect(calls).toEqual([
      ["story", { prisma: { marker: "prisma" }, userId: "user-1" }],
      ["climax", { prisma: { marker: "prisma" }, userId: "user-1" }],
      ["debug-jump", { prisma: { marker: "prisma" }, userId: "user-1" }],
      ["recovery-start", { prisma: { marker: "prisma" }, userId: "user-1" }],
      ["recovery-complete", { prisma: { marker: "prisma" }, userId: "user-1" }],
      ["cancel", { prisma: { marker: "prisma" }, userId: "user-1", characterId: "sigrika" }]
    ]);
  });

  it("mounts all commerce routes behind the index-level auth middleware", () => {
    const router = createCommerceRouter({ prisma: {} });
    const routes = router.stack
      .filter((layer) => layer.route)
      .map((layer) => [layer.route.path, Object.keys(layer.route.methods)]);

    expect(routes).toEqual([
      ["/shop/:id/purchase", ["post"]],
      ["/costumes/:id/purchase", ["post"]],
      ["/costumes/equip", ["post"]],
      ["/items/inventory", ["get"]],
      ["/items/rainbow-bean-candy/sigrika/story", ["get"]],
      ["/items/rainbow-bean-candy/sigrika/climax", ["post"]],
      ["/items/rainbow-bean-candy/sigrika/debug/jump-to-eight", ["post"]],
      ["/items/rainbow-bean-candy/sigrika/recovery/start", ["post"]],
      ["/items/rainbow-bean-candy/sigrika/recovery/complete", ["post"]],
      ["/items/rainbow-bean-candy/effects/:characterId/cancel", ["post"]],
      ["/items/:itemId/use", ["post"]]
    ]);
  });
});
