import { normalizeGameModeId } from "../src/shared/gameModes.js";
import { isInvalidReplay } from "./replayValidity.js";

export const REPLAY_PAGE_SIZE = 50;

export async function listReplaySummaryPage({ prisma, userId, mode: modeInput = "spark", cursor = "", scope = "" }) {
  const mode = normalizeGameModeId(modeInput);
  let cursorValue = decodeReplayCursor(cursor);
  const records = [];
  while (records.length <= REPLAY_PAGE_SIZE) {
    const batch = await prisma.gameRecord.findMany({
      where: {
        mode: mode === "spark" && scope !== "regular" ? { in: ["spark", "team"] } : mode,
        ...(scope === "regular" ? { matchSource: { in: ["matchmaking", "duel", "private"] } } : {}),
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
    records.push(...batch.filter((record) => !isInvalidReplay(record)));
    if (batch.length < REPLAY_PAGE_SIZE + 1) break;
    const last = batch.at(-1);
    cursorValue = { createdAt: last.createdAt, id: last.id };
  }
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
    snapshot: true,
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
  const { snapshot: _snapshot, ...summary } = record;
  return {
    ...summary,
    ...(record.mode === "team" ? { teamLineups: replayTeamLineups(_snapshot) } : {}),
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

function replayTeamLineups(snapshot) {
  try {
    const room = typeof snapshot === "string" ? JSON.parse(snapshot) : snapshot;
    // Only completed stored records reach this projection; never send raw room snapshots.
    if (room?.game?.phase !== "finished") return {};
    return Object.fromEntries(["black", "white"].map((color) => [color,
      (room.players?.find((player) => player.color === color)?.teamLineup ?? []).slice(0, 3)
        .map((entry) => ({ characterId: entry?.characterId ?? "", costumeSnapshot: entry?.costumeSnapshot ?? null }))
    ]));
  } catch { return {}; }
}
