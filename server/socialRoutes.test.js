import { describe, expect, it } from "vitest";
import { createSocialRouteHandlers, createSocialRouter } from "./socialRoutes.js";

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

describe("social route handlers", () => {
  it("adds a friend and returns the refreshed social list", async () => {
    const writes = [];
    const handlers = createSocialRouteHandlers({
      prisma: {},
      statusForUser: () => "online",
      setRelationshipFn: async (args) => writes.push(args),
      listSocialUsersFn: async ({ userId }) => ({
        friends: [{ id: "target-1", owner: userId }],
        blacklist: []
      })
    });
    const res = createResponse();

    await handlers.addFriend({
      user: { id: "owner-1" },
      params: { targetId: "target-1" }
    }, res);

    expect(writes).toEqual([expect.objectContaining({
      ownerUserId: "owner-1",
      targetUserId: "target-1",
      type: "friend"
    })]);
    expect(res.body).toEqual({
      friends: [{ id: "target-1", owner: "owner-1" }],
      blacklist: []
    });
  });

  it("returns relationship errors without refreshing the list", async () => {
    let listed = false;
    const handlers = createSocialRouteHandlers({
      prisma: {},
      statusForUser: () => "offline",
      setRelationshipFn: async () => {
        const error = new Error("blocked");
        error.status = 409;
        throw error;
      },
      listSocialUsersFn: async () => {
        listed = true;
        return {};
      }
    });
    const res = createResponse();

    await handlers.addBlacklist({
      user: { id: "owner-1" },
      params: { targetId: "owner-1" }
    }, res);

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ error: "blocked" });
    expect(listed).toBe(false);
  });

  it("validates search usernames before loading profiles", async () => {
    let loaded = false;
    const handlers = createSocialRouteHandlers({
      prisma: {},
      statusForUser: () => "offline",
      validateUsernameFn: () => ({ ok: false, error: "bad username" }),
      getUserProfileByUsernameFn: async () => {
        loaded = true;
        return null;
      }
    });
    const res = createResponse();

    await handlers.searchProfile({
      user: { id: "viewer-1" },
      query: { username: "" }
    }, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "bad username" });
    expect(loaded).toBe(false);
  });

  it("normalizes profile search mode before delegating", async () => {
    let profileArgs = null;
    const handlers = createSocialRouteHandlers({
      prisma: {},
      statusForUser: (id) => id,
      validateUsernameFn: (username) => ({ ok: true, value: username.trim() }),
      normalizeMode: (mode) => `mode:${mode}`,
      getUserProfileByUsernameFn: async (args) => {
        profileArgs = args;
        return { id: "target-1" };
      }
    });
    const res = createResponse();

    await handlers.searchProfile({
      user: { id: "viewer-1" },
      query: { username: " alice ", mode: "standard" }
    }, res);

    expect(profileArgs).toMatchObject({
      username: "alice",
      viewerId: "viewer-1",
      mode: "mode:standard"
    });
    expect(res.body).toEqual({ profile: { id: "target-1" } });
  });

  it("keeps public user replay lookup independent from auth state", async () => {
    let replayArgs = null;
    const handlers = createSocialRouteHandlers({
      prisma: {},
      statusForUser: () => "offline",
      normalizeMode: (mode) => mode ?? "spark",
      getUserReplaysFn: async (args) => {
        replayArgs = args;
        return [{ id: "record-1" }];
      }
    });
    const res = createResponse();

    await handlers.getReplays({
      params: { id: "target-1" },
      query: {}
    }, res);

    expect(replayArgs).toMatchObject({ userId: "target-1", mode: "spark" });
    expect(res.body).toEqual({ records: [{ id: "record-1" }] });
  });

  it("mounts authenticated social routes and public replay routes separately", () => {
    const router = createSocialRouter({
      prisma: {},
      statusForUser: () => "offline",
      authHttp: (_req, _res, next) => next()
    });
    const routeLayerCounts = new Map(router.stack
      .filter((layer) => layer.route)
      .map((layer) => [
        layer.route.path,
        layer.route.stack.length
      ]));

    expect(routeLayerCounts.get("/social")).toBe(2);
    expect(routeLayerCounts.get("/users/:id/profile")).toBe(2);
    expect(routeLayerCounts.get("/users/:id/replays")).toBe(1);
  });
});
