export function tickPlayerClock(player, elapsed) {
  let remaining = elapsed;
  if (player.time.main > 0) {
    const used = Math.min(player.time.main, remaining);
    player.time.main -= used;
    remaining -= used;
  }
  while (remaining > 0 && player.time.main <= 0 && player.time.periods > 0) {
    const used = Math.min(player.time.periodRemaining, remaining);
    player.time.periodRemaining -= used;
    remaining -= used;
    if (player.time.periodRemaining <= 0) {
      player.time.periods -= 1;
      player.time.periodRemaining = player.time.byoYomi;
    }
  }
}

export function resetByoYomi(player) {
  if (player.time.main <= 0 && player.time.periods > 0) {
    player.time.periodRemaining = player.time.byoYomi;
  }
}
