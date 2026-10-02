export function mergeCurrentUserFromRoom(currentUser, room) {
  if (!currentUser || !room?.players) return currentUser;
  const roomUser = room.players.find((player) => player.user?.id === currentUser.id)?.user;
  if (!roomUser) return currentUser;
  return sameUserPayload(currentUser, roomUser) ? currentUser : { ...currentUser, ...roomUser };
}

function sameUserPayload(currentUser, roomUser) {
  return Object.entries(roomUser).every(([key, value]) => sameValue(currentUser[key], value));
}

function sameValue(left, right) {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) && Array.isArray(right)) return sameArray(left, right);
  if (isPlainObject(left) && isPlainObject(right)) return samePlainObject(left, right);
  return false;
}

function sameArray(left, right) {
  return left.length === right.length && left.every((value, index) => sameValue(value, right[index]));
}

function samePlainObject(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key) => Object.prototype.hasOwnProperty.call(right, key) && sameValue(left[key], right[key]));
}

function isPlainObject(value) {
  return Boolean(value) && Object.getPrototypeOf(value) === Object.prototype;
}
