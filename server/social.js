import { rankFromRating } from "../src/shared/ratingRank.js";

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
  const userMap = new Map(users.map((user) => [user.id, user]));
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
  await prisma.$executeRaw`
    INSERT INTO UserRelationship (id, ownerUserId, targetUserId, type)
    VALUES (${crypto.randomUUID()}, ${ownerUserId}, ${targetUserId}, ${type})
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

export async function getUserProfile({ prisma, userId, viewerId, statusForUser }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicProfileSelect()
  });
  if (!user) return null;

  const [records, viewerRelation] = await Promise.all([
    prisma.gameRecord.findMany({
      where: {
        OR: [
          { blackUserId: userId },
          { whiteUserId: userId }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 30
    }),
    viewerId && viewerId !== userId
      ? prisma.$queryRaw`
          SELECT type FROM UserRelationship
          WHERE ownerUserId = ${viewerId} AND targetUserId = ${userId}
          LIMIT 1
        `
      : []
  ]);

  return {
    ...toSocialUser(user, statusForUser?.(user.id) ?? "offline"),
    record: formatRecord(recordStats(userId, records)),
    characterStats: characterStats(userId, records),
    relation: viewerId === userId ? "self" : viewerRelation?.[0]?.type ?? ""
  };
}

export async function getUserReplays({ prisma, userId }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  if (!user) return null;

  const records = await prisma.gameRecord.findMany({
    where: {
      OR: [
        { blackUserId: userId },
        { whiteUserId: userId }
      ]
    },
    orderBy: { createdAt: "desc" },
    take: 30
  });

  return records.map((record) => ({
    id: record.id,
    roomCode: record.roomCode,
    blackName: record.blackName,
    whiteName: record.whiteName,
    resultText: record.resultText,
    moveCount: record.moveCount,
    blackCharacter: record.blackCharacter,
    whiteCharacter: record.whiteCharacter,
    createdAt: record.createdAt
  }));
}

export function publicProfileSelect() {
  return {
    id: true,
    username: true,
    rating: true,
    selectedCharacter: true,
    ownedCharacters: true
  };
}

export function toSocialUser(user, status = "offline") {
  return {
    id: user.id,
    username: user.username,
    rank: rankFromRating(user.rating),
    rating: user.rating,
    characterId: user.selectedCharacter ?? "sigrika",
    status
  };
}

function assertRelationship(ownerUserId, targetUserId, type) {
  if (!ownerUserId || !targetUserId) throw routeError(400, "用户不存在");
  if (ownerUserId === targetUserId) throw routeError(400, "不能对自己执行该操作");
  if (!Object.values(RELATIONSHIP_TYPES).includes(type)) throw routeError(400, "未知关系类型");
}

function recordStats(userId, records) {
  return records.reduce((stats, record) => {
    const color = record.blackUserId === userId ? "black" : "white";
    const won = record.winnerColor === color;
    const draw = !record.winnerColor;
    stats.total += 1;
    if (won) stats.wins += 1;
    else if (draw) stats.draws += 1;
    else stats.losses += 1;
    return stats;
  }, { total: 0, wins: 0, losses: 0, draws: 0 });
}

function characterStats(userId, records) {
  const stats = new Map();
  for (const record of records) {
    const color = record.blackUserId === userId ? "black" : "white";
    const characterId = color === "black" ? record.blackCharacter : record.whiteCharacter;
    const row = stats.get(characterId) ?? { characterId, wins: 0, losses: 0, draws: 0, total: 0 };
    row.total += 1;
    if (!record.winnerColor) row.draws += 1;
    else if (record.winnerColor === color) row.wins += 1;
    else row.losses += 1;
    stats.set(characterId, row);
  }
  return [...stats.values()].map((row) => ({
    characterId: row.characterId,
    record: formatRecord(row),
    winRate: row.total ? `${((row.wins / row.total) * 100).toFixed(1)}%` : "0.0%"
  }));
}

function formatRecord(stats) {
  return `${stats.total}局 · ${stats.wins}胜${stats.losses}负${stats.draws}和`;
}

function routeError(status, message) {
  return Object.assign(new Error(message), { status });
}
