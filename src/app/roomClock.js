export function applyRoomClock(room, clock) {
  if (!room || !clock || room.code !== clock.roomCode) return room;
  if (!Array.isArray(room.players)) return room;
  const currentClockSeq = Number(room.clockSeq ?? 0);
  const nextClockSeq = Number(clock.clockSeq ?? 0);
  if (currentClockSeq > 0 && nextClockSeq <= currentClockSeq) return room;
  const timesByColor = new Map((clock.players ?? []).map((player) => [player.color, player.time]));
  let changed = nextClockSeq > currentClockSeq;
  const players = room.players.map((player) => {
    const nextTime = timesByColor.get(player.color);
    if (!nextTime || sameTime(player.time, nextTime)) return player;
    changed = true;
    return {
      ...player,
      time: { ...nextTime }
    };
  });
  return changed ? { ...room, clockSeq: nextClockSeq, players } : room;
}

function sameTime(left, right) {
  return left?.main === right?.main
    && left?.byoYomi === right?.byoYomi
    && left?.periodRemaining === right?.periodRemaining
    && left?.periods === right?.periods;
}
