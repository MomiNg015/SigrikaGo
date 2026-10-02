import { recordWinnerColor } from "../shared/gameRecords.js";

export function replayOpeningState({ record }) {
  const snapshot = record?.snapshot ? replayRoomWithResult(record) : null;
  return {
    room: snapshot,
    replayStep: Array.isArray(snapshot?.game?.history) ? snapshot.game.history.length : 0,
    pendingSkill: false,
    view: "room"
  };
}

function replayRoomWithResult(record) {
  const snapshot = record.snapshot;
  const game = snapshot.game ?? {};
  return {
    ...snapshot,
    game: {
      ...game,
      phase: game.phase ?? "finished",
      winner: game.winner ?? {
        winnerColor: recordWinnerColor(record),
        text: record.resultText ?? ""
      }
    }
  };
}
