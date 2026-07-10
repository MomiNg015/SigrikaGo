import { GAME_PHASES } from "../src/shared/game.js";
import { normalizeRoomActionReceipts } from "./roomActionReceipts.js";
import { upsertPersistedRoom } from "./roomPersistence.js";

export const CURRENT_ROOM_SNAPSHOT_VERSION = 1;
const pendingRoomPersistence = new Map();

export function persistRoomState({
  prisma,
  room,
  force = false,
  throttleMs,
  now = Date.now,
  upsert = upsertPersistedRoom,
  onError = (error) => console.error("Failed to persist room", error)
} = {}) {
  if (!room?.code) return;
  const currentTime = now();
  if (!force && room.lastPersistedAt && currentTime - room.lastPersistedAt < throttleMs) return;
  room.lastPersistedAt = currentTime;
  const snapshot = JSON.stringify(roomPersistenceSnapshot(room));
  const status = room.game.phase === GAME_PHASES.finished ? "finished" : "active";
  return enqueueRoomPersistence(room.code, () => upsert(prisma, { code: room.code, status, snapshot }), onError);
}

export async function flushRoomPersistence(roomCode = "") {
  if (roomCode) {
    while (pendingRoomPersistence.has(roomCode)) {
      await Promise.allSettled([pendingRoomPersistence.get(roomCode)]);
    }
    return;
  }
  while (pendingRoomPersistence.size > 0) {
    await Promise.allSettled([...pendingRoomPersistence.values()]);
  }
}

export function roomPersistenceStats() {
  return { pendingRooms: pendingRoomPersistence.size };
}

function enqueueRoomPersistence(roomCode, persist, onError) {
  const previous = pendingRoomPersistence.get(roomCode);
  const current = previous
    ? previous.catch(() => {}).then(persist).catch(onError)
    : runPersistenceNow(persist, onError);
  pendingRoomPersistence.set(roomCode, current);
  current.finally(() => {
    if (pendingRoomPersistence.get(roomCode) === current) pendingRoomPersistence.delete(roomCode);
  });
  return current;
}

function runPersistenceNow(persist, onError) {
  try {
    return Promise.resolve(persist()).catch(onError);
  } catch (error) {
    onError(error);
    return Promise.resolve();
  }
}

export function roomPersistenceSnapshot(room) {
  return {
    snapshotVersion: CURRENT_ROOM_SNAPSHOT_VERSION,
    code: room.code,
    revision: Number(room.revision ?? 0),
    clockSeq: Number(room.clockSeq ?? 0),
    mode: room.mode ?? room.game?.mode ?? "spark",
    players: room.players.map((player) => ({
      ...player,
      socketId: null
    })),
    spectators: [],
    game: room.game,
    chat: room.chat,
    actionReceipts: normalizeRoomActionReceipts(room.actionReceipts),
    createdAt: room.createdAt,
    openingEndsAt: room.openingEndsAt,
    preload: room.preload ?? null,
    closesAt: room.closesAt,
    emptySince: room.emptySince,
    countingDeadline: room.countingDeadline,
    drawDeadline: room.drawDeadline,
    pendingSkillResolution: room.pendingSkillResolution ?? null,
    lastTick: room.lastTick,
    recordSaved: room.recordSaved,
    candyEffectUpdates: room.candyEffectUpdates ?? null
  };
}

export function hydratePersistedRoom(snapshot, { now = Date.now } = {}) {
  const snapshotVersion = snapshot.snapshotVersion ?? 1;
  if (snapshotVersion > CURRENT_ROOM_SNAPSHOT_VERSION) {
    throw new Error(`Unsupported room snapshot version: ${snapshotVersion}`);
  }
  const hydratedAt = now();
  const isFinished = snapshot.game?.phase === GAME_PHASES.finished;
  return {
    ...snapshot,
    players: (snapshot.players ?? []).map((player) => ({
      ...player,
      socketId: null,
      disconnectedAt: isFinished ? null : (player.disconnectedAt ?? hydratedAt)
    })),
    spectators: [],
    chat: snapshot.chat ?? [],
    actionReceipts: normalizeRoomActionReceipts(snapshot.actionReceipts),
    revision: Number(snapshot.revision ?? 0),
    clockSeq: Number(snapshot.clockSeq ?? 0),
    timerId: null,
    timeoutIds: [],
    emptyTimerId: null,
    lastTick: hydratedAt,
    lastPersistedAt: 0
  };
}
