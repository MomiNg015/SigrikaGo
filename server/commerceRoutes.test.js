import { describe, expect, it } from "vitest";
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

  it("mounts all commerce routes behind the index-level auth middleware", () => {
    const router = createCommerceRouter({ prisma: {} });
    const routes = router.stack
      .filter((layer) => layer.route)
      .map((layer) => [layer.route.path, Object.keys(layer.route.methods)]);

    expect(routes).toEqual([
      ["/shop/:id/purchase", ["post"]],
      ["/items/inventory", ["get"]],
      ["/items/:itemId/use", ["post"]]
    ]);
  });
});
