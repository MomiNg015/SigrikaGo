export function isInvalidReplay(record) {
  if (!record) return false;
  if (record.resultText === "对局无效") return true;
  try {
    const snapshot = typeof record.snapshot === "string" ? JSON.parse(record.snapshot) : record.snapshot;
    return Boolean(snapshot?.game?.winner?.invalid);
  } catch {
    return false;
  }
}
