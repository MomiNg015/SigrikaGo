export function applyRoomSnapshot(currentRoom, incomingRoom) {
  if (!currentRoom || !incomingRoom) return incomingRoom;
  if (currentRoom.code !== incomingRoom.code || currentRoom.role !== incomingRoom.role) return incomingRoom;
  return shareSnapshotValue(currentRoom, incomingRoom);
}

function shareSnapshotValue(previous, next) {
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
