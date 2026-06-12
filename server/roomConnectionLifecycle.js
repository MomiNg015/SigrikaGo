import { GAME_PHASES } from "../src/shared/game.js";

export function createRoomConnectionLifecycle({
  rooms,
  matchmakingQueue,
  validateRoomCode,
  appendSystem,
  clearEmptyRoomClose,
  scheduleEmptyActiveRoomClose,
  persistRoom,
  now = Date.now
}) {
  function attachSocketToRoom(roomCode, socket, user) {
    const validatedRoomCode = validateRoomCode(roomCode);
    if (!validatedRoomCode.ok) return null;
    const room = rooms.get(validatedRoomCode.value);
    if (!room) return null;
    const player = room.players.find((candidate) => candidate.user.id === user.id);
    if (player) {
      attachPlayerSocket(room, player, socket);
    } else {
      attachSpectatorSocket(room, socket, user);
    }
    socket.join(validatedRoomCode.value);
    persistRoom(room, { force: true });
    return room;
  }

  function attachPlayerSocket(room, player, socket) {
    const shouldAnnounceReconnect = !player.socketId
      && player.disconnectedAt
      && room.game.phase !== GAME_PHASES.finished;
    player.socketId = socket.id;
    player.disconnectedAt = null;
    clearEmptyRoomClose(room);
    if (shouldAnnounceReconnect) {
      appendSystem(room, `${player.user.username}已重新连接。`, { kind: "reconnect" });
    }
  }

  function attachSpectatorSocket(room, socket, user) {
    if (room.spectators.some((candidate) => candidate.user.id === user.id)) return;
    room.spectators.push({ user, socketId: socket.id });
    appendSystem(room, `${user.username}进入了观战席。`);
  }

  function detachSocket(socketId, io = null) {
    matchmakingQueue.removeSocket(socketId);
    const changedRooms = [];
    for (const room of rooms.values()) {
      let changed = detachPlayersWithSocket(room, socketId);
      if (detachSpectatorsWithSocket(room, socketId)) changed = true;
      if (changed) {
        if (io) scheduleEmptyActiveRoomClose(room, io);
        persistRoom(room, { force: true });
        changedRooms.push(room);
      }
    }
    return changedRooms;
  }

  function detachPlayersWithSocket(room, socketId) {
    let changed = false;
    for (const player of room.players) {
      if (player.socketId === socketId) {
        player.socketId = null;
        player.disconnectedAt = now();
        if (room.game.phase !== GAME_PHASES.finished) {
          appendSystem(room, `${player.user.username}断线中。`, { kind: "disconnect" });
        }
        changed = true;
      }
    }
    return changed;
  }

  function detachSpectatorsWithSocket(room, socketId) {
    const before = room.spectators.length;
    room.spectators = room.spectators.filter((spectator) => spectator.socketId !== socketId);
    return room.spectators.length !== before;
  }

  function leaveRoom(roomCode, userId, socketId = "") {
    const validatedRoomCode = validateRoomCode(roomCode);
    if (!validatedRoomCode.ok) return null;
    const room = rooms.get(validatedRoomCode.value);
    if (!room) return null;
    const finishedPlayer = findFinishedPlayerLeaving(room, userId, socketId);
    if (finishedPlayer) {
      finishedPlayer.socketId = null;
      finishedPlayer.disconnectedAt = null;
      appendSystem(room, `${finishedPlayer.user.username}离开了观战席。`, { kind: "spectator-leave" });
      persistRoom(room, { force: true });
      return room;
    }
    const spectator = room.spectators.find((candidate) => (
      candidate.user.id === userId && (!socketId || candidate.socketId === socketId)
    ));
    if (!spectator) return null;
    room.spectators = room.spectators.filter((candidate) => candidate !== spectator);
    appendSystem(room, `${spectator.user.username}离开了观战席。`, { kind: "spectator-leave" });
    persistRoom(room, { force: true });
    return room;
  }

  function findFinishedPlayerLeaving(room, userId, socketId) {
    if (room.game.phase !== GAME_PHASES.finished) return null;
    return room.players.find((candidate) => (
      candidate.user.id === userId && (!socketId || candidate.socketId === socketId)
    )) ?? null;
  }

  return {
    attachSocketToRoom,
    detachSocket,
    leaveRoom
  };
}
