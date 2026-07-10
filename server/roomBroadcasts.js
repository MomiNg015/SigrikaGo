import { buildRoomView } from "./roomView.js";
import { roomParticipants } from "./roomPresence.js";
import { performance } from "node:perf_hooks";

export { roomParticipants };

export const ROOM_BROADCAST_PERSISTENCE = Object.freeze({
  fullUpdate: Object.freeze({ force: true }),
  clock: Object.freeze({ force: false }),
  patchDefault: Object.freeze({ force: true }),
  presencePatch: Object.freeze({ force: false })
});

export function roomView(room, viewerId) {
  return buildRoomView(room, viewerId);
}

export function broadcastRoom(io, room, {
  persistRoom = () => {},
  roomViewFn = roomView,
  metrics = null,
  now = () => performance.now()
} = {}) {
  advanceRoomClockSeq(room);
  persistRoom(room, ROOM_BROADCAST_PERSISTENCE.fullUpdate);
  for (const player of room.players) {
    emitRoomUpdate(io, room, player, roomViewFn, metrics, now);
  }
  for (const spectator of room.spectators) {
    emitRoomUpdate(io, room, spectator, roomViewFn, metrics, now);
  }
}

export function broadcastRoomClock(io, room, { persistRoom = () => {} } = {}) {
  advanceRoomClockSeq(room);
  const payload = roomClockPayload(room);
  persistRoom(room);
  for (const participant of roomParticipants(room)) {
    emitToSocket(io, participant.socketId, "room:clock", payload);
  }
}

export function broadcastRoomPatch(io, room, patch, { persistRoom = () => {}, forcePersist = true } = {}) {
  const baseRevision = Number(room.revision ?? 0);
  const revision = baseRevision + 1;
  room.revision = revision;
  persistRoom(room, forcePersist ? ROOM_BROADCAST_PERSISTENCE.patchDefault : ROOM_BROADCAST_PERSISTENCE.presencePatch);
  const payload = {
    ...patch,
    eventId: `${room.code}:${revision}:${patch.type}`,
    baseRevision,
    revision,
    roomCode: room.code
  };
  for (const participant of roomParticipants(room)) {
    emitToSocket(io, participant.socketId, "room:patch", payload);
  }
}

export function broadcastRoomPresencePatch(io, room, {
  persistRoom = () => {},
  roomViewFn = roomView,
  metrics = null,
  now = () => performance.now()
} = {}) {
  const participant = roomParticipants(room).find((candidate) => candidate.socketId);
  if (!participant) return;
  const view = measuredRoomView(room, participant.user.id, roomViewFn, metrics, now);
  broadcastRoomPatch(io, room, {
    type: "presence:update",
    players: view.players,
    spectatorCount: view.spectatorCount,
    spectators: view.spectators,
    chat: view.chat
  }, { forcePersist: false, persistRoom });
}

export function roomClockPayload(room) {
  return {
    roomCode: room.code,
    clockSeq: Number(room.clockSeq ?? 0),
    activeColor: room.game.turn,
    serverNow: Date.now(),
    players: room.players.map((player) => ({
      color: player.color,
      time: { ...player.time }
    }))
  };
}

function advanceRoomClockSeq(room) {
  room.clockSeq = Number(room.clockSeq ?? 0) + 1;
}

export function broadcastToast(io, room, text) {
  for (const participant of roomParticipants(room)) {
    emitToSocket(io, participant.socketId, "error:toast", text);
  }
}

export function emitRoomClosed(io, room, payload) {
  for (const participant of roomParticipants(room)) {
    emitToSocket(io, participant.socketId, "room:closed", payload);
  }
}

function emitToSocket(io, socketId, event, payload) {
  if (socketId) io.to(socketId).emit(event, payload);
}

function emitRoomUpdate(io, room, participant, roomViewFn, metrics, now) {
  if (!participant.socketId) return;
  const view = measuredRoomView(room, participant.user.id, roomViewFn, metrics, now);
  metrics?.recordRoomUpdate?.(view);
  emitToSocket(io, participant.socketId, "room:update", view);
}

function measuredRoomView(room, viewerId, roomViewFn, metrics, now) {
  const startedAt = now();
  const view = roomViewFn(room, viewerId);
  metrics?.observe?.("roomViewBuildMs", Math.max(0, now() - startedAt));
  return view;
}
