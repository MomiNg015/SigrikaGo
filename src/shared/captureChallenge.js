export const CAPTURE_CHALLENGE_MODE = "capture-challenge";
export const CAPTURE_CHALLENGE_MOVE_LIMIT = 100;

export function isCaptureChallenge(room) {
  return room?.matchSource === "practice" && room.practice?.challenge === CAPTURE_CHALLENGE_MODE;
}

export function captureChallengeResultText(captures, rank) {
  return `你这次提了${captures}个子，位列总排名中的第${rank}位，可喜可贺！`;
}
