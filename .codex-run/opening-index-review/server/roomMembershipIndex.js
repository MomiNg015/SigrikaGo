import { GAME_PHASES } from "../src/shared/game.js";

export function createRoomMembershipIndex({ rooms } = {}) {
  const roomCodesByUserId = new Map();
  const roomCodesBySocketId = new Map();

  function registerRoom(room) {
    if (!room?.code) return;
    for (const player of room.players ?? []) {
      const userId = player?.user?.id;
      addMapEntry(roomCodesByUserId, userId, room.code);
      addMapEntry(roomCodesBySocketId, player?.socketId, room.code);
    }
    for (const spectator of room.spectators ?? []) {
      addMapEntry(roomCodesBySocketId, spectator?.socketId, room.code);
    }
  }

  function unregisterRoom(roomOrCode) {
    const room = typeof roomOrCode === "string" ? rooms?.get(roomOrCode) : roomOrCode;
    const roomCode = typeof roomOrCode === "string" ? roomOrCode : roomOrCode?.code;
    if (!roomCode) return;
    const players = room?.players ?? [];
    if (players.length > 0) {
      for (const player of players) {
        removeMapEntry(roomCodesByUserId, player?.user?.id, roomCode);
        removeMapEntry(roomCodesBySocketId, player?.socketId, roomCode);
      }
      for (const spectator of room?.spectators ?? []) {
        removeMapEntry(roomCodesBySocketId, spectator?.socketId, roomCode);
      }
      return;
    }
    removeRoomCodeFromMap(roomCodesByUserId, roomCode);
    removeRoomCodeFromMap(roomCodesBySocketId, roomCode);
  }

  function findRoomForUser(userId, roomCode = "") {
    if (!userId) return null;
    if (roomCode) {
      const room = rooms?.get(roomCode) ?? null;
      return roomHasPlayer(room, userId) ? room : null;
    }
    const roomCodes = roomCodesByUserId.get(userId);
    if (!roomCodes?.size) return null;
    const candidates = [...roomCodes]
      .map((candidateCode) => rooms?.get(candidateCode))
      .filter((room) => roomHasPlayer(room, userId));
    return candidates.find((room) => room.game?.phase !== GAME_PHASES.finished)
      ?? candidates.find((room) => room.game?.phase === GAME_PHASES.finished)
      ?? null;
  }

  function isUserInActiveRoom(userId) {
    const room = findRoomForUser(userId);
    return Boolean(room && room.game?.phase !== GAME_PHASES.finished);
  }

  function registerSocket(room, socketId) {
    addMapEntry(roomCodesBySocketId, socketId, room?.code);
  }

  function unregisterSocket(roomOrCode, socketId) {
    const roomCode = typeof roomOrCode === "string" ? roomOrCode : roomOrCode?.code;
    removeMapEntry(roomCodesBySocketId, socketId, roomCode);
  }

  function findRoomsForSocket(socketId) {
    if (!socketId) return [];
    const roomCodes = roomCodesBySocketId.get(socketId);
    if (!roomCodes?.size) return [];
    const roomsForSocket = [];
    for (const roomCode of roomCodes) {
      const room = rooms?.get(roomCode);
      if (roomHasSocket(room, socketId)) {
        roomsForSocket.push(room);
      } else {
        removeMapEntry(roomCodesBySocketId, socketId, roomCode);
      }
    }
    return roomsForSocket;
  }

  function clear() {
    roomCodesByUserId.clear();
    roomCodesBySocketId.clear();
  }

  return {
    clear,
    findRoomsForSocket,
    findRoomForUser,
    isUserInActiveRoom,
    registerRoom,
    registerSocket,
    unregisterSocket,
    unregisterRoom
  };
}

function roomHasPlayer(room, userId) {
  return Boolean(room?.players?.some((player) => player?.user?.id === userId));
}

function roomHasSocket(room, socketId) {
  return Boolean(
    room?.players?.some((player) => player?.socketId === socketId)
      || room?.spectators?.some((spectator) => spectator?.socketId === socketId)
  );
}

function addMapEntry(map, key, roomCode) {
  if (!key || !roomCode) return;
  const roomCodes = map.get(key) ?? new Set();
  roomCodes.add(roomCode);
  map.set(key, roomCodes);
}

function removeMapEntry(map, key, roomCode) {
  if (!key || !roomCode) return;
  const roomCodes = map.get(key);
  if (!roomCodes) return;
  roomCodes.delete(roomCode);
  if (roomCodes.size === 0) map.delete(key);
}

function removeRoomCodeFromMap(map, roomCode) {
  for (const [key, roomCodes] of map.entries()) {
    roomCodes.delete(roomCode);
    if (roomCodes.size === 0) map.delete(key);
  }
}
