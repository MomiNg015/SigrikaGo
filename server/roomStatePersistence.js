import { GAME_PHASES } from "../src/shared/game.js";
import { upsertPersistedRoom } from "./roomPersistence.js";

export const CURRENT_ROOM_SNAPSHOT_VERSION = 1;

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
  upsert(prisma, { code: room.code, status, snapshot }).catch(onError);
}

export function roomPersistenceSnapshot(room) {
  return {
    snapshotVersion: CURRENT_ROOM_SNAPSHOT_VERSION,
    code: room.code,
    players: room.players.map((player) => ({
      ...player,
      socketId: null
    })),
    spectators: [],
    game: room.game,
    chat: room.chat,
    createdAt: room.createdAt,
    openingEndsAt: room.openingEndsAt,
    closesAt: room.closesAt,
    emptySince: room.emptySince,
    countingDeadline: room.countingDeadline,
    drawDeadline: room.drawDeadline,
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
    timerId: null,
    timeoutIds: [],
    emptyTimerId: null,
    lastTick: hydratedAt,
    lastPersistedAt: 0
  };
}
