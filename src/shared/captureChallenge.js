export const CAPTURE_CHALLENGE_MODE = "capture-challenge";
export const CAPTURE_CHALLENGE_MOVE_LIMIT = 100;

export function isCaptureChallenge(room) {
  return room?.matchSource === "practice" && room.practice?.challenge === CAPTURE_CHALLENGE_MODE;
}

export function isCompletedCaptureChallenge(room) {
  return isCaptureChallenge(room)
    && room.game?.phase === "finished"
    && room.game.moveNumber === CAPTURE_CHALLENGE_MOVE_LIMIT
    && room.game.winner?.reason === CAPTURE_CHALLENGE_MODE
    && !room.game.winner.invalid
    && Boolean(room.practice.result);
}

export function captureChallengeResultText(captures, rank) {
  return `你这次提了${captures}个子，位列总排名中的第${rank}位，可喜可贺！`;
}
