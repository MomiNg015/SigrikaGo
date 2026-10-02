import { describe, expect, it } from "vitest";
import {
  buildAdminOperationsAnalytics,
  buildAdminOverviewAnalytics,
  isSuperAdmin
} from "./adminAnalytics.js";

describe("admin analytics", () => {
  it("builds an explainable overview from current tables and runtime state", async () => {
    const now = new Date("2026-06-23T04:00:00.000Z");
    const data = await buildAdminOverviewAnalytics({
      prisma: analyticsPrisma(),
      onlineSessions: {
        onlineCount: () => 2,
        listOnlineUsers: () => [
          { userId: "admin-1", username: "moming", role: "admin", status: "online", socketCount: 1, connectedAt: now },
          { userId: "user-1", username: "alice", role: "player", status: "playing", socketCount: 1, connectedAt: now }
        ]
      },
      listActiveRooms: () => [{ code: "12345" }],
      matchmakingCount: () => 1,
      matchmakingCountsByMode: () => ({ spark: 1, standard: 0, gomoku: 0 }),
      runtimeStabilityMetrics: {
        snapshot: () => ({
          startedAt: "2026-06-23T03:00:00.000Z",
          roomPersistenceErrors: 1,
          roomRestoreErrors: 2,
          roomResultSaveErrors: 3,
          matchPreloadTimeouts: 4,
          roomResumeAttempts: 5,
          roomResumeSuccesses: 6,
          roomResumeMisses: 7,
          roomResumePatchGapRequests: 8,
          roomResumeSocketConnectRequests: 9,
          roomResumeInitialConnectRequests: 10
        })
      },
      runtimeServiceState: {
        snapshot: () => ({
          draining: false,
          limits: { maxOnlineUsers: 500, maxActiveRooms: 100 },
          current: { onlineUsers: 2, activeRooms: 1 },
          process: { rssBytes: 1000 }
        })
      },
      now
    });

    expect(data.brief.title).toBe("今日简报");
    expect(data.brief.status).toBe("需要处理");
    expect(data.today.logins.uniqueUsers).toBe(2);
    expect(data.today.registrations.users).toBe(1);
    expect(data.today.registrations.firstGameConversionRate).toBe(1);
    expect(data.today.games.byMode.find((mode) => mode.mode === "spark").completed).toBe(1);
    expect(data.realtime.onlineUsers).toHaveLength(2);
    expect(data.serviceHealth.reconnectsToday).toBe(9);
    expect(data.serviceHealth.preloadTimeoutsToday).toBe(4);
    expect(data.serviceHealth.apiErrorsToday).toBe(6);
    expect(data.serviceHealth.runtimeStability.roomResumePatchGapRequests).toBe(8);
    expect(data.serviceHealth.runtimeStability.roomResumeInitialConnectRequests).toBe(10);
    expect(data.serviceHealth.capacity.limits.maxActiveRooms).toBe(100);
    expect(data.alerts.items.some((item) => item.actionLabel === "查看举报")).toBe(true);
  });

  it("builds operations charts and plain-language insights", async () => {
    const data = await buildAdminOperationsAnalytics({
      prisma: analyticsPrisma(),
      range: "7d",
      now: new Date("2026-06-23T04:00:00.000Z")
    });

    expect(data.charts.activeUsers).toHaveLength(7);
    expect(data.charts.registrations.at(-1).value).toBe(1);
    expect(data.charts.modeTotals.find((mode) => mode.mode === "spark").completed).toBe(1);
    expect(data.segments.some((segment) => segment.label === "活跃玩家")).toBe(true);
    expect(data.insights.normal.length + data.insights.watch.length).toBeGreaterThan(0);
  });

  it("treats moming as the super administrator", () => {
    expect(isSuperAdmin({ username: "moming" })).toBe(true);
    expect(isSuperAdmin({ username: "Moming" })).toBe(true);
    expect(isSuperAdmin({ username: "alice" })).toBe(false);
  });
});

function analyticsPrisma() {
  const today = new Date("2026-06-23T01:00:00.000Z");
  const yesterday = new Date("2026-06-22T01:00:00.000Z");
  const users = [
    { id: "user-1", username: "alice", status: "active", createdAt: today },
    { id: "user-2", username: "bob", status: "active", createdAt: yesterday }
  ];
  const sessions = [
    { id: "s1", userId: "user-1", createdAt: today, lastSeenAt: new Date("2026-06-23T02:00:00.000Z") },
    { id: "s2", userId: "user-2", createdAt: today, lastSeenAt: new Date("2026-06-23T03:00:00.000Z") }
  ];
  const records = [
    { id: "g1", blackUserId: "user-1", whiteUserId: "user-2", mode: "spark", moveCount: 42, resultText: "黑胜", createdAt: today },
    { id: "g2", blackUserId: "user-2", whiteUserId: "user-1", mode: "standard", moveCount: 80, resultText: "白胜", createdAt: yesterday }
  ];
  return {
    user: {
      count: async (query = {}) => query.where?.status === "banned" ? 0 : users.length,
      findMany: async (query = {}) => filterByRange(users, query.where?.createdAt)
    },
    character: { count: async () => 3 },
    gameRecord: {
      count: async () => records.length,
      findMany: async (query = {}) => filterByRange(records, query.where?.createdAt)
    },
    loginSession: {
      findMany: async (query = {}) => filterByRange(sessions, query.where?.createdAt)
    },
    feedbackMessage: {
      findMany: async () => [{ id: "f1", username: "alice", content: "hello", createdAt: today }]
    },
    userReport: {
      findMany: async () => [{ id: "r1", reporterUsername: "alice", reportedUsername: "bob", createdAt: today }]
    },
    adminAuditLog: { findMany: async () => [] },
    persistedRoom: { count: async () => 1 },
    userProgressLedger: {
      findMany: async () => [{ metric: "coins", delta: 20, createdAt: today }]
    },
    gachaDraw: { findMany: async () => [{ id: "draw-1", createdAt: today }] },
    recruitmentTask: { findMany: async () => [{ id: "task-1", createdAt: today }] }
  };
}

function filterByRange(rows, range) {
  if (!range) return rows;
  return rows.filter((row) => {
    const time = new Date(row.createdAt).getTime();
    return time >= new Date(range.gte).getTime() && time < new Date(range.lt).getTime();
  });
}
