import { buildRoomView } from "./roomView.js";
import { roomParticipants } from "./roomPresence.js";

export { roomParticipants };

export function roomView(room, viewerId) {
  return buildRoomView(room, viewerId);
}

export function broadcastRoom(io, room, { persistRoom = () => {}, roomViewFn = roomView } = {}) {
  persistRoom(room, { force: true });
  for (const player of room.players) {
    emitRoomUpdate(io, room, player, roomViewFn);
  }
  for (const spectator of room.spectators) {
    emitRoomUpdate(io, room, spectator, roomViewFn);
  }
}

export function broadcastRoomClock(io, room, { persistRoom = () => {} } = {}) {
  const payload = roomClockPayload(room);
  persistRoom(room);
  for (const participant of roomParticipants(room)) {
    emitToSocket(io, participant.socketId, "room:clock", payload);
  }
}

export function broadcastRoomPatch(io, room, patch, { persistRoom = () => {} } = {}) {
  persistRoom(room, { force: true });
  const payload = { roomCode: room.code, ...patch };
  for (const participant of roomParticipants(room)) {
    emitToSocket(io, participant.socketId, "room:patch", payload);
  }
}

export function roomClockPayload(room) {
  return {
    roomCode: room.code,
    activeColor: room.game.turn,
    serverNow: Date.now(),
    players: room.players.map((player) => ({
      color: player.color,
      time: { ...player.time }
    }))
  };
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
