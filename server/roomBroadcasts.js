import { buildRoomView } from "./roomView.js";
import { roomParticipants } from "./roomPresence.js";

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

export function broadcastRoom(io, room, { persistRoom = () => {}, roomViewFn = roomView } = {}) {
  advanceRoomClockSeq(room);
  persistRoom(room, ROOM_BROADCAST_PERSISTENCE.fullUpdate);
  for (const player of room.players) {
    emitRoomUpdate(io, room, player, roomViewFn);
  }
  for (const spectator of room.spectators) {
    emitRoomUpdate(io, room, spectator, roomViewFn);
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

export function broadcastRoomPresencePatch(io, room, { persistRoom = () => {}, roomViewFn = roomView } = {}) {
  const participant = roomParticipants(room).find((candidate) => candidate.socketId);
  if (!participant) return;
  const view = roomViewFn(room, participant.user.id);
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

function emitRoomUpdate(io, room, participant, roomViewFn) {
  if (!participant.socketId) return;
  emitToSocket(io, participant.socketId, "room:update", roomViewFn(room, participant.user.id));
}
