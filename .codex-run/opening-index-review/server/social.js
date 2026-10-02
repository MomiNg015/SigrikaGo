import { GAME_RESULT_REASONS, recordWinnerColor } from "./gameRecords.js";
import { achievementStatsForUser, attachAchievementEquipmentAssetsToUsers } from "./achievements.js";
import { validateFeedbackContent } from "./feedback.js";
import { publicUser, USER_ASSET_RELATION_SELECT } from "./db.js";
import { normalizeGameModeId } from "../src/shared/gameModes.js";
import { listReplaySummaryPage } from "./replayPagination.js";

const LEGACY_MOJIBAKE_DRAW_TEXT = "\u935c\u5c7e\ue5d0";

export const RELATIONSHIP_TYPES = {
  friend: "friend",
  blacklist: "blacklist"
};

export async function ensureSocialSchema(prisma) {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS UserRelationship (
      id TEXT NOT NULL PRIMARY KEY,
      ownerUserId TEXT NOT NULL,
      targetUserId TEXT NOT NULL,
      type TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS UserRelationship_ownerUserId_targetUserId_key ON UserRelationship(ownerUserId, targetUserId)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS UserRelationship_ownerUserId_type_idx ON UserRelationship(ownerUserId, type)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS UserRelationship_targetUserId_idx ON UserRelationship(targetUserId)`;
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS UserProfileLike (
      id TEXT NOT NULL PRIMARY KEY,
      likerUserId TEXT NOT NULL,
      targetUserId TEXT NOT NULL,
      dayKey TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS UserProfileLike_likerUserId_targetUserId_dayKey_key ON UserProfileLike(likerUserId, targetUserId, dayKey)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS UserProfileLike_targetUserId_idx ON UserProfileLike(targetUserId)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS UserProfileLike_likerUserId_createdAt_idx ON UserProfileLike(likerUserId, createdAt)`;
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS UserReport (
      id TEXT NOT NULL PRIMARY KEY,
      reporterUserId TEXT NOT NULL,
      reportedUserId TEXT NOT NULL,
      reporterUsername TEXT NOT NULL,
      reportedUsername TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS UserReport_createdAt_idx ON UserReport(createdAt)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS UserReport_reporterUserId_idx ON UserReport(reporterUserId)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS UserReport_reportedUserId_idx ON UserReport(reportedUserId)`;
}

export async function listSocialUsers({ prisma, userId, statusForUser }) {
  const rows = await prisma.$queryRaw`
    SELECT id, ownerUserId, targetUserId, type, createdAt, updatedAt
    FROM UserRelationship
    WHERE ownerUserId = ${userId}
    ORDER BY updatedAt DESC
  `;
  const targetIds = [...new Set(rows.map((row) => row.targetUserId))];
  const users = targetIds.length
    ? await prisma.user.findMany({
        where: { id: { in: targetIds } },
        select: publicProfileSelect()
      })
    : [];
  const decoratedUsers = await attachAchievementEquipmentAssetsToUsers(prisma, users);
  const userMap = new Map(decoratedUsers.map((user) => [user.id, user]));
  const toEntry = (relationship) => {
    const user = userMap.get(relationship.targetUserId);
    return user ? toSocialUser(user, statusForUser?.(user.id) ?? "offline") : null;
  };

  return {
    friends: rows.filter((row) => row.type === RELATIONSHIP_TYPES.friend).map(toEntry).filter(Boolean),
    blacklist: rows.filter((row) => row.type === RELATIONSHIP_TYPES.blacklist).map(toEntry).filter(Boolean)
  };
}

export async function setRelationship({ prisma, ownerUserId, targetUserId, type }) {
  assertRelationship(ownerUserId, targetUserId, type);
  const now = new Date();
  await prisma.$executeRaw`
    INSERT INTO UserRelationship (id, ownerUserId, targetUserId, type, createdAt, updatedAt)
    VALUES (${crypto.randomUUID()}, ${ownerUserId}, ${targetUserId}, ${type}, ${now}, ${now})
    ON CONFLICT(ownerUserId, targetUserId)
    DO UPDATE SET type = ${type}, updatedAt = CURRENT_TIMESTAMP
  `;
}

export async function deleteRelationship({ prisma, ownerUserId, targetUserId, type }) {
  assertRelationship(ownerUserId, targetUserId, type);
  await prisma.$executeRaw`
    DELETE FROM UserRelationship
    WHERE ownerUserId = ${ownerUserId} AND targetUserId = ${targetUserId} AND type = ${type}
  `;
}

export async function hasBlacklistFromOwner({ prisma, ownerUserId, targetUserId }) {
  if (!ownerUserId || !targetUserId || ownerUserId === targetUserId) return false;
  const rows = await prisma.$queryRaw`
    SELECT id FROM UserRelationship
    WHERE ownerUserId = ${ownerUserId}
      AND targetUserId = ${targetUserId}
      AND type = ${RELATIONSHIP_TYPES.blacklist}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function hasBlacklistBetween({ prisma, firstUserId, secondUserId }) {
  if (!firstUserId || !secondUserId || firstUserId === secondUserId) return false;
  const rows = await prisma.$queryRaw`
    SELECT id FROM UserRelationship
    WHERE type = ${RELATIONSHIP_TYPES.blacklist}
      AND (
        (ownerUserId = ${firstUserId} AND targetUserId = ${secondUserId})
        OR (ownerUserId = ${secondUserId} AND targetUserId = ${firstUserId})
      )
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function getUserProfile({ prisma, userId, viewerId, statusForUser, mode: modeInput = "spark" }) {
  const mode = normalizeGameModeId(modeInput);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicProfileSelect()
  });
  if (!user) return null;

  const [decoratedUsers, records, viewerRelation, achievementStats, likeSummary] = await Promise.all([
    attachAchievementEquipmentAssetsToUsers(prisma, [user]),
    prisma.gameRecord.findMany({
      where: {
        mode,
        rated: true,
        OR: [
          { blackUserId: userId },
          { whiteUserId: userId }
        ]
      },
      select: profileRecordSelect(),
      orderBy: { createdAt: "desc" }
    }),
    viewerId && viewerId !== userId
      ? prisma.$queryRaw`
          SELECT type FROM UserRelationship
          WHERE ownerUserId = ${viewerId} AND targetUserId = ${userId}
          LIMIT 1
        `
      : []
    ,
    achievementStatsForUser({ prisma, userId }),
    profileLikeSummary({ prisma, targetUserId: userId, viewerId })
  ]);
  const decoratedUser = decoratedUsers[0] ?? user;
  const profileStats = recordStats(userId, records);

  return {
    ...toSocialUser(decoratedUser, statusForUser?.(decoratedUser.id) ?? "offline", mode),
    achievementStats,
    likeCount: likeSummary.likeCount,
    likedToday: likeSummary.likedToday,
    record: formatRecord(profileStats),
    recordStats: {
      totalGames: profileStats.total,
      wins: profileStats.wins,
      losses: profileStats.losses,
      draws: profileStats.draws
    },
    characterStats: characterStats(userId, records),
    relation: viewerId === userId ? "self" : viewerRelation?.[0]?.type ?? ""
  };
}

export async function getUserProfileByUsername({ prisma, username, viewerId, statusForUser, mode = "spark" }) {
  const user = await prisma.user.findFirst({
    where: { username },
    select: { id: true }
  });
  if (!user) return null;
  return getUserProfile({ prisma, userId: user.id, viewerId, statusForUser, mode });
}

export async function getUserReplays({ prisma, userId, mode: modeInput = "spark", cursor = "" }) {
  const mode = normalizeGameModeId(modeInput);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  if (!user) return null;

  return listReplaySummaryPage({ prisma, userId, mode, cursor });
}

export async function likeUserProfile({ prisma, likerUserId, targetUserId, now = new Date() }) {
  assertDifferentUsers(likerUserId, targetUserId);
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true }
  });
  if (!target) throw routeError(404, "用户不存在");
  const dayKey = profileLikeDayKey(now);
  await prisma.$executeRaw`
    INSERT OR IGNORE INTO UserProfileLike (id, likerUserId, targetUserId, dayKey, createdAt)
    VALUES (${crypto.randomUUID()}, ${likerUserId}, ${targetUserId}, ${dayKey}, ${now})
  `;
  return profileLikeSummary({ prisma, targetUserId, viewerId: likerUserId, now });
}

export async function createUserReport({ prisma, reporter, reportedUserId, content }) {
  assertDifferentUsers(reporter?.id, reportedUserId);
  const validated = validateFeedbackContent(content);
  if (!validated.ok) throw routeError(400, validated.error);
  const reported = await prisma.user.findUnique({
    where: { id: reportedUserId },
    select: { id: true, username: true }
  });
  if (!reported) throw routeError(404, "用户不存在");
  const now = new Date();
  const rows = await prisma.$queryRaw`
    INSERT INTO UserReport (id, reporterUserId, reportedUserId, reporterUsername, reportedUsername, content, createdAt)
    VALUES (${crypto.randomUUID()}, ${reporter.id}, ${reported.id}, ${reporter.username}, ${reported.username}, ${validated.value}, ${now})
    RETURNING id, reporterUserId, reportedUserId, reporterUsername, reportedUsername, content, createdAt
  `;
  return { report: toUserReportPayload(rows[0]) };
}

export async function listUserReports({ prisma }) {
  const rows = await prisma.$queryRaw`
    SELECT id, reporterUserId, reportedUserId, reporterUsername, reportedUsername, content, createdAt
    FROM UserReport
    ORDER BY createdAt DESC
    LIMIT 100
  `;
  return { reports: rows.map(toUserReportPayload) };
}

export function publicProfileSelect() {
  return {
    id: true,
    username: true,
    rating: true,
    selectedCharacter: true,
    ownedCharacters: true,
    itemEffects: true,
    achievementEquipment: true,
    ...USER_ASSET_RELATION_SELECT
  };
}

export function toSocialUser(user, status = "offline", mode = "spark") {
  const profile = publicUser(user);
  const modeStats = profile.modeStats?.[normalizeGameModeId(mode)] ?? profile.modeStats?.spark;
  return {
    id: profile.id,
    username: profile.username,
    rank: modeStats?.rank ?? profile.rank,
    rating: modeStats?.rating ?? profile.rating,
    recentResults: modeStats?.recentResults ?? [],
    characterId: profile.selectedCharacter ?? "sigrika",
    itemEffects: profile.itemEffects,
    equippedCostumes: profile.equippedCostumes,
    ownedCostumeIds: profile.ownedCostumeIds,
    achievementEquipment: {
      titleAssetId: user.achievementEquipment?.titleAssetId ?? "",
      badgeAssetId: user.achievementEquipment?.badgeAssetId ?? "",
      nameplateAssetId: user.achievementEquipment?.nameplateAssetId ?? ""
    },
    achievementEquipmentAssets: user.achievementEquipmentAssets ?? {
      title: null,
      badge: null,
      nameplate: null
    },
    status
  };
}

function assertRelationship(ownerUserId, targetUserId, type) {
  if (!ownerUserId || !targetUserId) throw routeError(400, "用户不存在");
  if (ownerUserId === targetUserId) throw routeError(400, "不能对自己执行该操作");
  if (!Object.values(RELATIONSHIP_TYPES).includes(type)) throw routeError(400, "未知关系类型");
}

function assertDifferentUsers(sourceUserId, targetUserId) {
  if (!sourceUserId || !targetUserId) throw routeError(400, "用户不存在");
  if (sourceUserId === targetUserId) throw routeError(400, "不能对自己执行该操作");
}

async function profileLikeSummary({ prisma, targetUserId, viewerId, now = new Date() }) {
  const dayKey = profileLikeDayKey(now);
  const [countRows, todayRows] = await Promise.all([
    prisma.$queryRaw`SELECT COUNT(*) AS count FROM UserProfileLike WHERE targetUserId = ${targetUserId}`,
    viewerId && viewerId !== targetUserId
      ? prisma.$queryRaw`
          SELECT id FROM UserProfileLike
          WHERE likerUserId = ${viewerId}
            AND targetUserId = ${targetUserId}
            AND dayKey = ${dayKey}
          LIMIT 1
        `
      : []
  ]);
  return {
    likeCount: Number(countRows?.[0]?.count ?? 0),
    likedToday: viewerId === targetUserId ? true : todayRows.length > 0
  };
}

export function profileLikeDayKey(date = new Date()) {
  return new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function toUserReportPayload(record) {
  return {
    id: record.id,
    reporterUserId: record.reporterUserId,
    reportedUserId: record.reportedUserId,
    reporterUsername: record.reporterUsername,
    reportedUsername: record.reportedUsername,
    content: record.content,
    createdAt: new Date(record.createdAt).toISOString()
  };
}

function recordStats(userId, records) {
  return records.reduce((stats, record) => {
    const color = record.blackUserId === userId ? "black" : "white";
    const winner = recordWinnerColor(record);
    stats.total += 1;
    if (winner === color) stats.wins += 1;
    else if (winner) stats.losses += 1;
    else if (recordIsDraw(record)) stats.draws += 1;
    return stats;
  }, { total: 0, wins: 0, losses: 0, draws: 0 });
}

function recordIsDraw(record = {}) {
  if (record.resultReason === GAME_RESULT_REASONS.agreement) return true;
  return String(record.resultText ?? "") === "和棋" || String(record.resultText ?? "") === LEGACY_MOJIBAKE_DRAW_TEXT;
}

function characterStats(userId, records) {
  const stats = new Map();
  for (const record of records) {
    const color = record.blackUserId === userId ? "black" : "white";
    const characterId = color === "black" ? record.blackCharacter : record.whiteCharacter;
    const row = stats.get(characterId) ?? { characterId, wins: 0, losses: 0, draws: 0, total: 0 };
    const winner = recordWinnerColor(record);
    row.total += 1;
    if (winner === color) row.wins += 1;
    else if (winner) row.losses += 1;
    else if (recordIsDraw(record)) row.draws += 1;
    stats.set(characterId, row);
  }
  return [...stats.values()].map((row) => ({
    characterId: row.characterId,
    total: row.total,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    record: formatRecord(row),
    winRate: row.total ? `${((row.wins / row.total) * 100).toFixed(1)}%` : "0.0%"
  }));
}

function profileRecordSelect() {
  return {
    blackUserId: true,
    whiteUserId: true,
    blackCharacter: true,
    whiteCharacter: true,
    winnerColor: true,
    resultReason: true,
    resultText: true,
    mode: true
  };
}

function formatRecord(stats) {
  return `${stats.total}局 · ${stats.wins}胜${stats.losses}负${stats.draws}和`;
}

function routeError(status, message) {
  return Object.assign(new Error(message), { status });
}
