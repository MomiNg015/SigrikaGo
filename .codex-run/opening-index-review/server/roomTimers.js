export function scheduleRoomInterval(room, callback, delay) {
  room.timerId = setInterval(callback, delay);
  return room.timerId;
}

export function clearRoomInterval(room) {
  if (room.timerId) clearInterval(room.timerId);
}

export function scheduleRoomTimeout(room, callback, delay) {
  const id = setTimeout(() => {
    removeRoomTimeout(room, id);
    callback();
  }, delay);
  room.timeoutIds ??= [];
  room.timeoutIds.push(id);
  return id;
}

export function clearRoomTimeout(room, id) {
  if (!id) return;
  clearTimeout(id);
  removeRoomTimeout(room, id);
}

export function clearRoomTimers(room) {
  clearRoomInterval(room);
  for (const id of room.timeoutIds ?? []) {
    clearTimeout(id);
  }
  room.timeoutIds = [];
}

function removeRoomTimeout(room, id) {
  room.timeoutIds = (room.timeoutIds ?? []).filter((candidate) => candidate !== id);
}
