export function replayOpeningState({ record }) {
  const snapshot = record?.snapshot ?? null;
  return {
    room: snapshot,
    replayStep: Array.isArray(snapshot?.game?.history) ? snapshot.game.history.length : 0,
    pendingSkill: false,
    view: "room"
  };
}
