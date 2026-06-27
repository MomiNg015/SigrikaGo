import { GAME_MODE_IDS, gameModeById } from "../src/shared/gameModes.js";
import { USER_STATUS } from "./adminConfig.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;

export async function buildAdminOverviewAnalytics({
  prisma,
  onlineSessions = null,
  listActiveRooms = () => [],
  matchmakingCount = () => 0,
  matchmakingCountsByMode = () => emptyModeCounts(),
  runtimeStabilityMetrics = null,
  now = new Date()
}) {
  const today = shanghaiDayRange(now);
  const sevenDays = { start: new Date(today.start.getTime() - 6 * DAY_MS), end: today.end };
  const [
    totalUsers,
    bannedUsers,
    characters,
    totalGameRecords,
    todayUsers,
    todayLoginSessions,
    todayGameRecords,
    recentGameRecords,
    feedbackMessages,
    userReports,
    auditLogs,
    activePersistedRooms
  ] = await Promise.all([
    safeCount(prisma.user),
    safeCount(prisma.user, { where: { status: USER_STATUS.banned } }),
    safeCount(prisma.character, { where: { enabled: true } }),
    safeCount(prisma.gameRecord),
    safeFindMany(prisma.user, { where: { createdAt: rangeWhere(today) }, orderBy: { createdAt: "desc" }, take: 200 }),
    safeFindMany(prisma.loginSession, { where: { createdAt: rangeWhere(today) }, orderBy: { createdAt: "desc" }, take: 1000 }),
    safeFindMany(prisma.gameRecord, { where: { createdAt: rangeWhere(today) }, orderBy: { createdAt: "desc" }, take: 1000 }),
    safeFindMany(prisma.gameRecord, { where: { createdAt: rangeWhere(sevenDays) }, orderBy: { createdAt: "desc" }, take: 5000 }),
    safeFindMany(prisma.feedbackMessage, { orderBy: { createdAt: "desc" }, take: 20 }),
    safeFindMany(prisma.userReport, { orderBy: { createdAt: "desc" }, take: 20 }),
    safeFindMany(prisma.adminAuditLog, { orderBy: { createdAt: "desc" }, take: 8 }),
    safeCount(prisma.persistedRoom, { where: { status: "active" } })
  ]);

  const runtime = runtimeSummary({ onlineSessions, listActiveRooms, matchmakingCount, matchmakingCountsByMode });
  const stability = runtimeStabilitySnapshot(runtimeStabilityMetrics);
  const loginUserIds = unique(todayLoginSessions.map((session) => session.userId).filter(Boolean));
  const newUserIds = new Set(todayUsers.map((user) => user.id));
  const newUsersWithFirstGame = usersWithGame(todayUsers, todayGameRecords);
  const modeBreakdown = gameModeBreakdown(todayGameRecords, recentGameRecords);
  const durationLeaders = sessionDurationLeaders(todayLoginSessions, todayUsers, now);
  const insights = overviewInsights({
    runtime,
    todayUsers,
    loginUserIds,
    newUsersWithFirstGame,
    todayGameRecords,
    modeBreakdown,
    feedbackMessages,
    userReports
  });

  return {
    generatedAt: now.toISOString(),
    isSuperAdmin: false,
    summary: {
      users: totalUsers,
      bannedUsers,
      characters,
      gameRecords: totalGameRecords
    },
    brief: {
      title: "今日简报",
      status: insights.overallStatus,
      reasons: insights.reasons,
      sections: insights.sections
    },
    realtime: runtime,
    today: {
      logins: {
        uniqueUsers: loginUserIds.length,
        successfulEvents: todayLoginSessions.length,
        failedEvents: null,
        failedEventsStatus: "待接入",
        newUsers: loginUserIds.filter((userId) => newUserIds.has(userId)).length,
        returningUsers: loginUserIds.filter((userId) => !newUserIds.has(userId)).length
      },
      registrations: {
        users: todayUsers.length,
        firstGameUsers: newUsersWithFirstGame.length,
        firstGameConversionRate: ratio(newUsersWithFirstGame.length, todayUsers.length),
        lobbyEntrants: null,
        lobbyEntrantsStatus: "待接入"
      },
      games: {
        completed: todayGameRecords.length,
        byMode: modeBreakdown
      },
      durationLeaders
    },
    alerts: {
      feedbackPending: feedbackMessages.length,
      reportsPending: userReports.length,
      items: alertItems({ feedbackMessages, userReports, modeBreakdown })
    },
    serviceHealth: {
      socketConnections: runtime.onlineUsers.reduce((total, row) => total + Number(row.socketCount ?? 0), 0),
      activeRooms: runtime.activeRooms,
      matchingQueue: runtime.matchmakingCount,
      persistedActiveRooms: activePersistedRooms,
      reconnectsToday: stability.roomResumeSocketConnectRequests,
      preloadTimeoutsToday: stability.matchPreloadTimeouts,
      apiErrorsToday: stability.runtimeErrorCount,
      runtimeStability: stability,
      dataStatus: "运行时稳定性计数为本进程启动以来"
    },
    auditLogs
  };
}

function runtimeStabilitySnapshot(metrics) {
  const snapshot = typeof metrics?.snapshot === "function" ? metrics.snapshot() : {};
  const number = (key) => Number(snapshot[key] ?? 0);
  const runtimeErrorCount = number("roomPersistenceErrors") + number("roomRestoreErrors") + number("roomResultSaveErrors");
  return {
    startedAt: snapshot.startedAt ?? null,
    roomPersistenceErrors: number("roomPersistenceErrors"),
    roomRestoreErrors: number("roomRestoreErrors"),
    roomResultSaveErrors: number("roomResultSaveErrors"),
    matchPreloadTimeouts: number("matchPreloadTimeouts"),
    roomResumeAttempts: number("roomResumeAttempts"),
    roomResumeSuccesses: number("roomResumeSuccesses"),
    roomResumeMisses: number("roomResumeMisses"),
    roomResumePatchGapRequests: number("roomResumePatchGapRequests"),
    roomResumeSocketConnectRequests: number("roomResumeSocketConnectRequests"),
    roomResumeInitialConnectRequests: number("roomResumeInitialConnectRequests"),
    runtimeErrorCount
  };
}

export async function buildAdminOperationsAnalytics({
  prisma,
  range = "7d",
  now = new Date()
}) {
  const dateRange = resolveAnalyticsRange(range, now);
  const [users, loginSessions, gameRecords, progressLedgers, gachaDraws, recruitmentTasks] = await Promise.all([
    safeFindMany(prisma.user, { where: { createdAt: rangeWhere(dateRange) }, orderBy: { createdAt: "asc" }, take: 5000 }),
    safeFindMany(prisma.loginSession, { where: { createdAt: rangeWhere(dateRange) }, orderBy: { createdAt: "asc" }, take: 5000 }),
    safeFindMany(prisma.gameRecord, { where: { createdAt: rangeWhere(dateRange) }, orderBy: { createdAt: "asc" }, take: 5000 }),
    safeFindMany(prisma.userProgressLedger, { where: { createdAt: rangeWhere(dateRange) }, orderBy: { createdAt: "asc" }, take: 5000 }),
    safeFindMany(prisma.gachaDraw, { where: { createdAt: rangeWhere(dateRange) }, orderBy: { createdAt: "asc" }, take: 5000 }),
    safeFindMany(prisma.recruitmentTask, { where: { createdAt: rangeWhere(dateRange) }, orderBy: { createdAt: "asc" }, take: 5000 })
  ]);
  const buckets = makeDateBuckets(dateRange.start, dateRange.end);
  const registrations = bucketCounts(users, buckets);
  const activeUsers = bucketUniqueCounts(loginSessions, buckets, "userId");
  const games = bucketCounts(gameRecords, buckets);
  const modeTotals = gameModeBreakdown(gameRecords, gameRecords);
  const coinDelta = progressLedgers
    .filter((row) => row.metric === "coins")
    .reduce((sum, row) => sum + Number(row.delta ?? 0), 0);
  const todayBucket = buckets.at(-1)?.key;
  const todayActive = activeUsers.find((row) => row.key === todayBucket)?.value ?? 0;
  const previousAverage = average(activeUsers.slice(0, -1).map((row) => row.value));
  const insights = operationInsights({ todayActive, previousAverage, users, gameRecords, modeTotals, coinDelta });

  return {
    generatedAt: now.toISOString(),
    range: {
      key: range,
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString()
    },
    insights,
    charts: {
      activeUsers,
      registrations,
      games,
      modeTotals
    },
    segments: userSegments({ users, loginSessions, gameRecords, now }),
    economy: {
      coinDelta,
      gachaDraws: gachaDraws.length,
      recruitmentStarted: recruitmentTasks.length,
      status: progressLedgers.length ? "可用" : "数据有限"
    }
  };
}

export function isSuperAdmin(user) {
  return String(user?.username ?? "").toLowerCase() === "moming";
}

function runtimeSummary({ onlineSessions, listActiveRooms, matchmakingCount, matchmakingCountsByMode }) {
  const onlineUsers = typeof onlineSessions?.listOnlineUsers === "function" ? onlineSessions.listOnlineUsers() : [];
  const activeRooms = safeRuntimeNumber(() => listActiveRooms().length);
  return {
    onlineCount: safeRuntimeNumber(() => onlineSessions?.onlineCount?.() ?? onlineUsers.length),
    onlineUsers: onlineUsers.map((row) => ({
      ...row,
      connectedAt: row.connectedAt ? new Date(row.connectedAt).toISOString() : null,
      lastActiveAt: row.lastActiveAt ? new Date(row.lastActiveAt).toISOString() : null
    })),
    activeRooms,
    matchmakingCount: safeRuntimeNumber(matchmakingCount),
    matchmakingCounts: safeRuntimeValue(matchmakingCountsByMode, emptyModeCounts()),
    groups: groupOnlineUsers(onlineUsers)
  };
}

function groupOnlineUsers(onlineUsers) {
  const groups = { lobby: [], matching: [], playing: [], watching: [], admin: [] };
  for (const user of onlineUsers) {
    if (user.role === "admin") groups.admin.push(user);
    else if (user.status === "playing") groups.playing.push(user);
    else groups.lobby.push(user);
  }
  return groups;
}

function overviewInsights({ runtime, todayUsers, loginUserIds, newUsersWithFirstGame, todayGameRecords, modeBreakdown, feedbackMessages, userReports }) {
  const urgent = [];
  const watch = [];
  const normal = [];
  if (userReports.length) urgent.push(actionInsight("有待处理用户举报", `${userReports.length} 条举报需要查看。`, "查看举报", "reports"));
  if (feedbackMessages.length) watch.push(actionInsight("有新的留言反馈", `${feedbackMessages.length} 条反馈可查看。`, "查看反馈", "feedback"));
  if (todayUsers.length && newUsersWithFirstGame.length === 0) watch.push(actionInsight("新用户还没有完成首局", "今日注册用户尚未转化为首局玩家。", "查看用户", "users"));
  for (const mode of modeBreakdown) {
    if (mode.completed > 0 && mode.interruptionRate >= 0.35) {
      watch.push(actionInsight(`${mode.label} 中断率偏高`, `估算中断率 ${formatPercent(mode.interruptionRate)}，建议查看对局。`, "查看棋谱", "overview"));
    }
  }
  normal.push({
    title: "在线与对局概况",
    body: `当前 ${runtime.onlineCount} 人在线，今日完成 ${todayGameRecords.length} 局。`,
    tone: "正常记录"
  });
  normal.push({
    title: "登录概况",
    body: `今日 ${loginUserIds.length} 个账号登录，新增 ${todayUsers.length} 个账号。`,
    tone: "正常记录"
  });
  const overallStatus = urgent.length ? "需要处理" : watch.length ? "需要关注" : "正常";
  return {
    overallStatus,
    reasons: [...urgent, ...watch, ...normal].slice(0, 5).map((item) => item.body),
    sections: {
      needsAction: urgent,
      watch,
      normal
    }
  };
}

function operationInsights({ todayActive, previousAverage, users, gameRecords, modeTotals, coinDelta }) {
  const needsAction = [];
  const watch = [];
  const normal = [];
  const delta = previousAverage ? (todayActive - previousAverage) / previousAverage : 0;
  if (previousAverage && delta < -0.3) watch.push(actionInsight("今日活跃低于近期平均", `今日活跃 ${todayActive}，比近期平均低 ${formatPercent(Math.abs(delta))}。`, "查看用户", "users"));
  else normal.push({ title: "活跃趋势正常", body: `今日活跃 ${todayActive}，近期平均 ${Math.round(previousAverage)}。`, tone: "正常记录" });
  if (users.length && gameRecords.length === 0) watch.push(actionInsight("新增用户未形成对局", "当前范围内有注册但没有完成对局。", "查看新用户", "users"));
  const topMode = [...modeTotals].sort((a, b) => b.completed - a.completed)[0];
  if (topMode) normal.push({ title: "玩法趋势", body: `${topMode.label} 是当前范围内最多的模式，共 ${topMode.completed} 局。`, tone: "正常记录" });
  normal.push({ title: "经济变化", body: `金币净变化 ${formatSigned(coinDelta)}，深度来源拆分待接入。`, tone: coinDelta ? "值得关注" : "正常记录" });
  return { needsAction, watch, normal };
}

function alertItems({ feedbackMessages, userReports, modeBreakdown }) {
  return [
    ...userReports.slice(0, 3).map((report) => actionInsight("用户举报", `${report.reporterUsername ?? "玩家"} 举报 ${report.reportedUsername ?? "玩家"}`, "查看举报", "reports")),
    ...feedbackMessages.slice(0, 3).map((message) => actionInsight("留言反馈", `${message.username ?? "玩家"}：${String(message.content ?? "").slice(0, 36)}`, "查看反馈", "feedback")),
    ...modeBreakdown.filter((mode) => mode.interruptionRate >= 0.35).map((mode) => actionInsight("模式异常", `${mode.label} 中断率 ${formatPercent(mode.interruptionRate)}`, "查看详情", "operations"))
  ].slice(0, 6);
}

function actionInsight(title, body, actionLabel, actionTab) {
  return { title, body, actionLabel, actionTab, tone: "需要处理" };
}

function gameModeBreakdown(todayRecords, recentRecords) {
  return GAME_MODE_IDS.map((mode) => {
    const records = todayRecords.filter((record) => normalizeRecordMode(record.mode) === mode);
    const recent = recentRecords.filter((record) => normalizeRecordMode(record.mode) === mode);
    const invalid = records.filter((record) => String(record.resultReason ?? "").includes("invalid") || String(record.resultText ?? "").includes("无效")).length;
    const averageMoveCount = average(records.map((record) => Number(record.moveCount ?? 0)).filter(Boolean));
    const recentAverage = average(recent.map((record) => Number(record.moveCount ?? 0)).filter(Boolean));
    const interruptionRate = recentAverage && averageMoveCount && averageMoveCount < recentAverage * 0.65 ? 0.4 : 0;
    return {
      mode,
      label: gameModeById(mode).shortTitle,
      completed: records.length,
      invalid,
      interrupted: null,
      interruptedStatus: "待接入",
      createdRooms: null,
      createdRoomsStatus: "待接入",
      averageMoveCount: Math.round(averageMoveCount),
      interruptionRate
    };
  });
}

function sessionDurationLeaders(sessions, todayUsers, now) {
  const userMap = new Map(todayUsers.map((user) => [user.id, user]));
  const totals = new Map();
  for (const session of sessions) {
    const userId = session.userId;
    if (!userId) continue;
    const start = new Date(session.createdAt).getTime();
    const end = Math.min(new Date(session.revokedAt ?? session.lastSeenAt ?? now).getTime(), now.getTime());
    const seconds = Math.max(0, Math.round((end - start) / 1000));
    totals.set(userId, (totals.get(userId) ?? 0) + seconds);
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([userId, activeSeconds]) => ({
      userId,
      username: userMap.get(userId)?.username ?? userId,
      activeSeconds,
      dataStatus: "由登录会话估算"
    }));
}

function usersWithGame(users, records) {
  const ids = new Set(users.map((user) => user.id));
  const played = new Set();
  for (const record of records) {
    if (ids.has(record.blackUserId)) played.add(record.blackUserId);
    if (ids.has(record.whiteUserId)) played.add(record.whiteUserId);
  }
  return [...played];
}

function userSegments({ users, loginSessions, gameRecords, now }) {
  const loginIds = new Set(loginSessions.map((session) => session.userId).filter(Boolean));
  const gameIds = new Set();
  for (const record of gameRecords) {
    gameIds.add(record.blackUserId);
    gameIds.add(record.whiteUserId);
  }
  return [
    { key: "newNoGame", label: "注册未首局", count: users.filter((user) => !gameIds.has(user.id)).length },
    { key: "newWithGame", label: "新手已首局", count: users.filter((user) => gameIds.has(user.id)).length },
    { key: "active", label: "活跃玩家", count: loginIds.size },
    { key: "core", label: "核心玩家", count: topGameUserCount(gameRecords) },
    { key: "silent", label: "沉默用户", count: users.filter((user) => new Date(user.createdAt).getTime() < now.getTime() - 7 * DAY_MS && !loginIds.has(user.id)).length }
  ];
}

function topGameUserCount(records) {
  const counts = new Map();
  for (const record of records) {
    counts.set(record.blackUserId, (counts.get(record.blackUserId) ?? 0) + 1);
    counts.set(record.whiteUserId, (counts.get(record.whiteUserId) ?? 0) + 1);
  }
  return [...counts.values()].filter((count) => count >= 3).length;
}

function resolveAnalyticsRange(range, now) {
  const today = shanghaiDayRange(now);
  if (range === "today") return today;
  if (range === "yesterday") return { start: new Date(today.start.getTime() - DAY_MS), end: today.start };
  if (range === "30d") return { start: new Date(today.start.getTime() - 29 * DAY_MS), end: today.end };
  return { start: new Date(today.start.getTime() - 6 * DAY_MS), end: today.end };
}

function makeDateBuckets(start, end) {
  const buckets = [];
  for (let time = start.getTime(); time < end.getTime(); time += DAY_MS) {
    const date = new Date(time);
    buckets.push({ key: shanghaiDayKey(date), label: shanghaiDayKey(date).slice(5), start: date, end: new Date(time + DAY_MS) });
  }
  return buckets;
}

function bucketCounts(rows, buckets) {
  return buckets.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    value: rows.filter((row) => inRange(new Date(row.createdAt), bucket)).length
  }));
}

function bucketUniqueCounts(rows, buckets, key) {
  return buckets.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    value: new Set(rows.filter((row) => inRange(new Date(row.createdAt), bucket)).map((row) => row[key]).filter(Boolean)).size
  }));
}

function shanghaiDayRange(date) {
  const shifted = new Date(date.getTime() + SHANGHAI_OFFSET_MS);
  const key = shifted.toISOString().slice(0, 10);
  const [year, month, day] = key.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day) - SHANGHAI_OFFSET_MS);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

function shanghaiDayKey(date) {
  return new Date(date.getTime() + SHANGHAI_OFFSET_MS).toISOString().slice(0, 10);
}

function rangeWhere(range) {
  return { gte: range.start, lt: range.end };
}

function inRange(date, range) {
  const time = date.getTime();
  return time >= range.start.getTime() && time < range.end.getTime();
}

function ratio(part, total) {
  return total > 0 ? part / total : 0;
}

function average(values) {
  const finite = values.map(Number).filter(Number.isFinite);
  return finite.length ? finite.reduce((sum, value) => sum + value, 0) / finite.length : 0;
}

function unique(values) {
  return [...new Set(values)];
}

function emptyModeCounts() {
  return Object.fromEntries(GAME_MODE_IDS.map((mode) => [mode, 0]));
}

function normalizeRecordMode(mode) {
  return GAME_MODE_IDS.includes(mode) ? mode : "spark";
}

async function safeCount(delegate, query) {
  if (typeof delegate?.count !== "function") return 0;
  return delegate.count(query);
}

async function safeFindMany(delegate, query) {
  if (typeof delegate?.findMany !== "function") return [];
  return delegate.findMany(query);
}

function safeRuntimeNumber(read) {
  try {
    const value = read();
    return Number.isFinite(Number(value)) ? Number(value) : 0;
  } catch {
    return 0;
  }
}

function safeRuntimeValue(read, fallback) {
  try {
    return read();
  } catch {
    return fallback;
  }
}

function formatPercent(value) {
  return `${Math.round(Number(value ?? 0) * 100)}%`;
}

function formatSigned(value) {
  const number = Number(value ?? 0);
  return `${number >= 0 ? "+" : ""}${number}`;
}
