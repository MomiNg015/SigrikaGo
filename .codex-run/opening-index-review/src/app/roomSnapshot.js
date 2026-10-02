export function applyRoomSnapshot(currentRoom, incomingRoom) {
  if (!currentRoom || !incomingRoom) return incomingRoom;
  if (currentRoom.code !== incomingRoom.code || currentRoom.role !== incomingRoom.role) return incomingRoom;
  return shareSnapshotValue(currentRoom, incomingRoom);
}

export function normalizeRoomSnapshot(room) {
  if (!room || typeof room !== "object") return room;
  const normalizedGame = normalizeGameSnapshot(room.game);
  const normalized = {
    ...room,
    players: Array.isArray(room.players) ? room.players : [],
    spectators: Array.isArray(room.spectators) ? room.spectators : [],
    chat: Array.isArray(room.chat) ? room.chat : [],
    game: normalizedGame
  };
  return snapshotFieldsAreSame(room, normalized) ? room : normalized;
}

export function shareSnapshotValue(previous, next) {
  if (Object.is(previous, next)) return previous;
  if (Array.isArray(previous) && Array.isArray(next)) return shareSnapshotArray(previous, next);
  if (isSnapshotObject(previous) && isSnapshotObject(next)) return shareSnapshotObject(previous, next);
  return next;
}

function shareSnapshotArray(previous, next) {
  let changed = previous.length !== next.length;
  const shared = next.map((value, index) => {
    const sharedValue = shareSnapshotValue(previous[index], value);
    if (sharedValue !== previous[index]) changed = true;
    return sharedValue;
  });
  return changed ? shared : previous;
}

function shareSnapshotObject(previous, next) {
  const previousKeys = Object.keys(previous);
  const nextKeys = Object.keys(next);
  let changed = previousKeys.length !== nextKeys.length;
  const shared = {};

  for (const key of nextKeys) {
    const sharedValue = shareSnapshotValue(previous[key], next[key]);
    shared[key] = sharedValue;
    if (sharedValue !== previous[key]) changed = true;
  }

  return changed ? shared : previous;
}

function isSnapshotObject(value) {
  return value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;
}

function normalizeGameSnapshot(game) {
  if (!game || typeof game !== "object") {
    return {
      points: [],
      history: [],
      captures: { black: 0, white: 0 },
      skillUses: {}
    };
  }

  const normalized = {
    ...game,
    points: Array.isArray(game.points) ? game.points : [],
    history: Array.isArray(game.history) ? game.history : [],
    captures: normalizeCaptures(game.captures),
    skillUses: isSnapshotObject(game.skillUses) ? game.skillUses : {}
  };
  return snapshotFieldsAreSame(game, normalized) ? game : normalized;
}

function normalizeCaptures(captures) {
  if (!captures || typeof captures !== "object") return { black: 0, white: 0 };
  const normalized = {
    black: Number(captures.black ?? 0),
    white: Number(captures.white ?? 0)
  };
  return normalized.black === captures.black && normalized.white === captures.white ? captures : normalized;
}

function snapshotFieldsAreSame(previous, next) {
  const previousKeys = Object.keys(previous);
  const nextKeys = Object.keys(next);
  if (previousKeys.length !== nextKeys.length) return false;
  return nextKeys.every((key) => previous[key] === next[key]);
}
