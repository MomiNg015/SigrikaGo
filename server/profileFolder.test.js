import { describe, expect, it, vi } from "vitest";
import { profileCaptureRecord } from "./profileCaptureRecord.js";
import { listReplaySummaryPage } from "./replayPagination.js";
import { createSocialRouteHandlers, createSocialRouter } from "./socialRoutes.js";

describe("profile folder records", () => {
  it("uses the same arrival tie-break as the leaderboard and preserves best appearance", async () => {
    const count = vi.fn(async () => 2);
    const prisma = {
      user: { findUnique: async () => ({ id: "a" }) },
      captureChallengeBest: { findUnique: async () => ({ captures: 86, reachedAt: new Date(1000), characterId: "sigrika", costumeSnapshot: '{"portraitUrl":"/costume.webp"}' }), count }
    };
    expect(await profileCaptureRecord({ prisma, userId: "a" })).toEqual({ captures: 86, ranking: 3, characterId: "sigrika", costumeSnapshot: { portraitUrl: "/costume.webp" } });
    expect(count).toHaveBeenCalledWith({ where: { userId: { not: "a" }, OR: [{ captures: { gt: 86 } }, { captures: 86, reachedAt: { lt: new Date(1000) } }, { captures: 86, reachedAt: new Date(1000), userId: { lt: "a" } }] } });
  });

  it.each([null, { id: "a" }])("distinguishes a missing user from an empty challenge record: %j", async (user) => {
    const findUnique = vi.fn(async () => null);
    const record = await profileCaptureRecord({ prisma: { user: { findUnique: async () => user }, captureChallengeBest: { findUnique } }, userId: "a" });
    expect(record).toBe(user ? null : undefined);
    expect(findUnique).toHaveBeenCalledTimes(user ? 1 : 0);
  });

  it("filters ordinary matches before pagination, including friend duels", async () => {
    const findMany = vi.fn(async () => []);
    await listReplaySummaryPage({ prisma: { gameRecord: { findMany } }, userId: "a", mode: "spark", scope: "regular" });
    expect(findMany.mock.calls[0][0].where).toMatchObject({ mode: "spark", matchSource: { in: ["matchmaking", "duel", "private"] } });
  });

  it("projects only completed team lineups and never returns the room snapshot", async () => {
    const lineup = [{ characterId: "sigrika", costumeSnapshot: { portraitUrl: "/old.webp" }, character: { secret: true } }];
    const rows = ["playing", "finished"].map(phase => ({ id: phase, mode: "team", snapshot: JSON.stringify({ game: { phase }, players: [{ color: "black", teamLineup: lineup }], privateField: "secret" }) }));
    const page = await listReplaySummaryPage({ prisma: { gameRecord: { findMany: async () => rows } }, userId: "a", mode: "team" });
    expect(page.records[0].teamLineups).toEqual({});
    expect(page.records[1].teamLineups).toEqual({ black: [{ characterId: "sigrika", costumeSnapshot: { portraitUrl: "/old.webp" } }], white: [] });
    expect(JSON.stringify(page)).not.toContain("secret");
    expect(page.records[1]).not.toHaveProperty("snapshot");
  });

  it.each([undefined, null, { captures: 12, ranking: 1 }])("returns the challenge endpoint result: %j", async (record) => {
    const load = vi.fn(async () => record);
    const handlers = createSocialRouteHandlers({ prisma: {}, profileCaptureRecordFn: load });
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json: vi.fn() };
    await handlers.getCaptureRecord({ params: { id: "target" } }, res);
    expect(load).toHaveBeenCalledWith({ prisma: {}, userId: "target" });
    expect(res.statusCode).toBe(record === undefined ? 404 : 200);
    if (record !== undefined) expect(res.json).toHaveBeenCalledWith({ record });
  });

  it("protects challenge summaries with the existing authentication middleware", () => {
    const authHttp = vi.fn();
    const router = createSocialRouter({ prisma: {}, authHttp });
    const route = router.stack.find(layer => layer.route?.path === "/users/:id/capture-record").route;
    expect(route.stack[0].handle).toBe(authHttp);
  });
});
