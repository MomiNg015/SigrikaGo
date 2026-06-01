export function applyRoomClock(room, clock) {
  if (!room || !clock || room.code !== clock.roomCode) return room;
  const timesByColor = new Map((clock.players ?? []).map((player) => [player.color, player.time]));
  let changed = false;
  const players = room.players.map((player) => {
    const nextTime = timesByColor.get(player.color);
    if (!nextTime || sameTime(player.time, nextTime)) return player;
    changed = true;
    return {
      ...player,
      time: { ...nextTime }
    };
  });
  return changed ? { ...room, players } : room;
}

function sameTime(left, right) {
  return left?.main === right?.main
    && left?.byoYomi === right?.byoYomi
    && left?.periodRemaining === right?.periodRemaining
    && left?.periods === right?.periods;
}
