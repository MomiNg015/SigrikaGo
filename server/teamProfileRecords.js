// A terminal replay reveals the whole lineup, including members that never played.
// Count actual stage transitions, never move thresholds (extra turns can delay them).
export function enteredTeamCharacterIds(record, color) {
  const fallback = color === "black" ? record.blackCharacter : record.whiteCharacter;
  try {
    const snapshot = typeof record.snapshot === "string" ? JSON.parse(record.snapshot) : record.snapshot;
    const player = snapshot?.players?.find((entry) => entry.color === color);
    const round = Number(snapshot?.team?.round);
    if (Number.isInteger(round) && round >= 1 && round <= 3 && Array.isArray(player?.teamLineup)) {
      return [...new Set(player.teamLineup.slice(0, round).map((member) => member.characterId).filter(Boolean))];
    }
  } catch { /* Legacy damaged snapshots still identify the final active member. */ }
  return fallback ? [fallback] : [];
}
