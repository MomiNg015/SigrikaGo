import { describe, expect, it } from "vitest";
import { createGachaRouteHandlers, createGachaRouter } from "./gachaRoutes.js";

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

describe("gacha route handlers", () => {
  it("lists open gacha pools for the authenticated user", async () => {
    let listArgs = null;
    const handlers = createGachaRouteHandlers({
      prisma: {},
      listOpenGachaPoolsFn: async (args) => {
        listArgs = args;
        return { pools: [{ id: "pool-1" }], wallet: { coins: 300, blueGems: 0 } };
      }
    });
    const res = createResponse();

    await handlers.pools({ user: { id: "user-1" } }, res);

    expect(listArgs).toMatchObject({ prisma: {}, userId: "user-1" });
    expect(listArgs.now).toBeInstanceOf(Date);
    expect(res.body).toEqual({ pools: [{ id: "pool-1" }], wallet: { coins: 300, blueGems: 0 } });
  });

  it("draws from a pool for the authenticated user", async () => {
    let drawArgs = null;
    const handlers = createGachaRouteHandlers({
      prisma: {},
      executeGachaDrawFn: async (args) => {
        drawArgs = args;
        return { draw: { id: "draw-1" }, rewards: [], user: { id: args.userId } };
      }
    });
    const res = createResponse();

    await handlers.draw({
      user: { id: "user-1" },
      params: { poolId: "pool-1" },
      body: { count: 10 }
    }, res);

    expect(drawArgs).toMatchObject({
      prisma: {},
      userId: "user-1",
      poolId: "pool-1",
      count: 10
    });
    expect(drawArgs.now).toBeInstanceOf(Date);
    expect(res.body).toEqual({ draw: { id: "draw-1" }, rewards: [], user: { id: "user-1" } });
  });

  it("loads draw history for the authenticated user", async () => {
    let historyArgs = null;
    const handlers = createGachaRouteHandlers({
      prisma: {},
      listGachaDrawHistoryFn: async (args) => {
        historyArgs = args;
        return { records: [{ id: "draw-1" }] };
      }
    });
    const res = createResponse();

    await handlers.history({ user: { id: "user-1" } }, res);

    expect(historyArgs).toEqual({ prisma: {}, userId: "user-1" });
    expect(res.body).toEqual({ records: [{ id: "draw-1" }] });
  });

  it("maps gacha domain errors into HTTP responses", async () => {
    const handlers = createGachaRouteHandlers({
      prisma: {},
      executeGachaDrawFn: async () => {
        const error = new Error("Not enough coins");
        error.status = 400;
        throw error;
      }
    });
    const res = createResponse();

    await handlers.draw({
      user: { id: "user-1" },
      params: { poolId: "pool-1" },
      body: { count: 1 }
    }, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Not enough coins" });
  });

  it("mounts gacha routes behind the index-level auth middleware", () => {
    const router = createGachaRouter({ prisma: {} });
    const routes = router.stack
      .filter((layer) => layer.route)
      .map((layer) => [layer.route.path, Object.keys(layer.route.methods)]);

    expect(routes).toEqual([
      ["/gacha/pools", ["get"]],
      ["/gacha/pools/:poolId/draw", ["post"]],
      ["/gacha/history", ["get"]]
    ]);
  });
});
