import { describe, expect, it } from "vitest";
import { createPublicRouteHandlers, createPublicRouter } from "./publicRoutes.js";

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

describe("public and lobby route handlers", () => {
  it("returns a simple health payload", () => {
    const handlers = createPublicRouteHandlers({
      prisma: {},
      listWatchRooms: () => []
    });
    const res = createResponse();

    handlers.health({}, res);

    expect(res.body).toEqual({ ok: true });
  });

  it("loads public characters, skill traits, and site settings through their catalog helpers", async () => {
    const handlers = createPublicRouteHandlers({
      prisma: { id: "prisma" },
      listWatchRooms: () => [],
      listPublicCharacterResponseFn: async (prisma) => ({ characters: [{ id: prisma.id }] }),
      listPublicSkillTraitsFn: async (prisma) => [{ id: `trait:${prisma.id}` }],
      getPublicSiteSettingsFn: async (prisma) => ({ title: prisma.id })
    });
    const characterRes = createResponse();
    const traitRes = createResponse();
    const settingsRes = createResponse();

    await handlers.characters({}, characterRes);
    await handlers.skillTraits({}, traitRes);
    await handlers.siteSettings({}, settingsRes);

    expect(characterRes.body).toEqual({ characters: [{ id: "prisma" }] });
    expect(traitRes.body).toEqual({ traits: [{ id: "trait:prisma" }] });
    expect(settingsRes.body).toEqual({ settings: { title: "prisma" } });
  });

  it("loads the authenticated user's shop catalog", async () => {
    let shopArgs = null;
    const handlers = createPublicRouteHandlers({
      prisma: {},
      listWatchRooms: () => [],
      listShopItemsFn: async (...args) => {
        shopArgs = args;
        return { items: [{ id: "item-1" }] };
      }
    });
    const res = createResponse();

    await handlers.shop({ user: { id: "user-1" } }, res);

    expect(shopArgs).toEqual([{}, "user-1"]);
    expect(res.body).toEqual({ items: [{ id: "item-1" }] });
  });

  it("formats feedback route errors with status codes", async () => {
    const handlers = createPublicRouteHandlers({
      prisma: {},
      listWatchRooms: () => [],
      createFeedbackMessageFn: async () => {
        const error = new Error("too long");
        error.status = 400;
        throw error;
      }
    });
    const res = createResponse();

    await handlers.feedback({
      user: { id: "user-1" },
      body: { content: "x" }
    }, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "too long" });
  });

  it("builds leaderboard from mode-filtered users and records", async () => {
    let recordQuery = null;
    let leaderboardArgs = null;
    const users = [{ id: "user-1" }];
    const records = [{ blackUserId: "user-1", whiteUserId: "user-2" }];
    const handlers = createPublicRouteHandlers({
      prisma: {
        user: {
          findMany: async () => users
        },
        gameRecord: {
          findMany: async (query) => {
            recordQuery = query;
            return records;
          }
        }
      },
      listWatchRooms: () => [],
      normalizeMode: (mode) => `mode:${mode}`,
      buildLeaderboardFn: (...args) => {
        leaderboardArgs = args;
        return [{ id: "ranked-1" }];
      }
    });
    const res = createResponse();

    await handlers.leaderboard({ query: { mode: "standard" } }, res);

    expect(recordQuery.where).toEqual({ mode: "mode:standard", rated: true });
    expect(recordQuery.take).toBe(10_000);
    expect(leaderboardArgs).toEqual([[
      {
        id: "user-1",
        achievementEquipment: {
          titleAssetId: "",
          badgeAssetId: "",
          nameplateAssetId: ""
        },
        achievementEquipmentAssets: {
          title: null,
          badge: null,
          nameplate: null
        }
      }
    ], records, { mode: "mode:standard" }]);
    expect(res.body).toEqual({ players: [{ id: "ranked-1" }] });
  });

  it("filters watch rooms by normalized mode", async () => {
    const handlers = createPublicRouteHandlers({
      prisma: {},
      normalizeMode: (mode) => mode ?? "spark",
      listWatchRooms: () => [
        { code: "spark-room", mode: "spark" },
        { code: "standard-room", mode: "standard" },
        { code: "legacy-room" }
      ]
    });
    const res = createResponse();

    await handlers.watchRooms({ query: { mode: "spark" } }, res);

    expect(res.body).toEqual({
      rooms: [
        { code: "spark-room", mode: "spark" },
        { code: "legacy-room" }
      ]
    });
  });

  it("mounts public catalog routes separately from authenticated lobby routes", () => {
    const router = createPublicRouter({
      prisma: {},
      listWatchRooms: () => [],
      authHttp: (_req, _res, next) => next()
    });
    const routeLayerCounts = new Map(router.stack
      .filter((layer) => layer.route)
      .map((layer) => [
        layer.route.path,
        layer.route.stack.length
      ]));

    expect(routeLayerCounts.get("/health")).toBe(1);
    expect(routeLayerCounts.get("/characters")).toBe(1);
    expect(routeLayerCounts.get("/skill-traits")).toBe(1);
    expect(routeLayerCounts.get("/site-settings")).toBe(1);
    expect(routeLayerCounts.get("/shop")).toBe(2);
    expect(routeLayerCounts.get("/feedback")).toBe(2);
    expect(routeLayerCounts.get("/leaderboard")).toBe(2);
    expect(routeLayerCounts.get("/rooms/watch")).toBe(2);
  });
});
