export const BOARD_SOUND_TYPES = {
  stone: "stone",
  capture: "capture",
  hiddenReveal: "hidden-reveal"
};

export function latestBoardSoundAction(history = []) {
  const action = [...history].reverse().find((entry) => (
    entry.type === "move" || (entry.type === "skill" && Array.isArray(entry.captures))
  ));
  return boardSoundActionFromHistoryEntry(action);
}

export function boardSoundActionAtStep(history = [], step = 0) {
  return boardSoundActionFromHistoryEntry(history[step - 1]);
}

function boardSoundActionFromHistoryEntry(action) {
  if (!action) return null;
  if (action.type !== "move" && !(action.type === "skill" && Array.isArray(action.captures))) return null;
  return {
    key: `${action.type}-${action.moveNumber}-${action.id}`,
    sound: action.hiddenHandRevealed
      ? BOARD_SOUND_TYPES.hiddenReveal
      : action.captures?.length > 0
        ? BOARD_SOUND_TYPES.capture
        : BOARD_SOUND_TYPES.stone
  };
}
