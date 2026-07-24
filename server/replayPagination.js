import { normalizeGameModeId } from "../src/shared/gameModes.js";

export const REPLAY_PAGE_SIZE = 50;

export async function listReplaySummaryPage({ prisma, userId, mode: modeInput = "spark", cursor = "" }) {
  const mode = normalizeGameModeId(modeInput);
  const cursorValue = decodeReplayCursor(cursor);
  const records = await prisma.gameRecord.findMany({
    where: {
      mode,
      AND: [
        {
          OR: [
            { blackUserId: userId },
            { whiteUserId: userId }
          ]
        },
        ...(cursorValue ? [{
          OR: [
            { createdAt: { lt: cursorValue.createdAt } },
            { createdAt: cursorValue.createdAt, id: { lt: cursorValue.id } }
          ]
        }] : [])
      ]
    },
    select: replaySummarySelect(),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: REPLAY_PAGE_SIZE + 1
  });
  const hasMore = records.length > REPLAY_PAGE_SIZE;
  const pageRecords = records.slice(0, REPLAY_PAGE_SIZE);
  const lastRecord = pageRecords.at(-1);
  return {
    records: pageRecords.map(toReplaySummary),
    nextCursor: hasMore && lastRecord ? encodeReplayCursor(lastRecord) : null
  };
}

export function encodeReplayCursor(record) {
  return Buffer.from(JSON.stringify({
    createdAt: new Date(record.createdAt).toISOString(),
    id: String(record.id)
  })).toString("base64url");
}

export function decodeReplayCursor(cursor) {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(String(cursor), "base64url").toString("utf8"));
    const createdAt = new Date(parsed.createdAt);
    const id = String(parsed.id ?? "").trim();
    if (!id || Number.isNaN(createdAt.getTime())) throw new Error("invalid cursor");
    return { createdAt, id };
  } catch {
    throw Object.assign(new Error("棋谱分页参数无效"), { status: 400 });
  }
}

function replaySummarySelect() {
  return {
    id: true,
    roomCode: true,
    blackUserId: true,
    whiteUserId: true,
    blackName: true,
    whiteName: true,
    resultText: true,
    winnerColor: true,
    resultReason: true,
    rated: true,
    matchSource: true,
    blackRatingDelta: true,
    whiteRatingDelta: true,
    blackCoinsDelta: true,
    whiteCoinsDelta: true,
    blackRankDelta: true,
    whiteRankDelta: true,
    moveCount: true,
    mode: true,
    blackCharacter: true,
    whiteCharacter: true,
    blackCostumeId: true,
    whiteCostumeId: true,
    blackCostumePortraitUrl: true,
    whiteCostumePortraitUrl: true,
    blackCostumePortraitScalePercent: true,
    whiteCostumePortraitScalePercent: true,
    blackCostumePortraitOffsetXPercent: true,
    whiteCostumePortraitOffsetXPercent: true,
    blackCostumePortraitOffsetYPercent: true,
    whiteCostumePortraitOffsetYPercent: true,
    createdAt: true
  };
}

function toReplaySummary(record) {
  return {
    ...record,
    rated: record.rated !== false,
    matchSource: record.matchSource ?? (record.rated === false ? "private" : "matchmaking"),
    blackRatingDelta: record.blackRatingDelta ?? 0,
    whiteRatingDelta: record.whiteRatingDelta ?? 0,
    blackCoinsDelta: record.blackCoinsDelta ?? 0,
    whiteCoinsDelta: record.whiteCoinsDelta ?? 0,
    blackRankDelta: record.blackRankDelta ?? 0,
    whiteRankDelta: record.whiteRankDelta ?? 0,
    mode: record.mode ?? "spark"
  };
}
