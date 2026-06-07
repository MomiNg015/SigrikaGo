import { GAME_PHASES } from "../shared/game.js";

export function shouldShowRoomCloseCountdown(room) {
  return room?.game?.phase === GAME_PHASES.finished && Boolean(room.closesAt);
}

export function effectiveRoomRole(room, isReplay = false) {
  if (isReplay || room?.game?.phase === GAME_PHASES.finished) return "spectator";
  return room?.role ?? "spectator";
}

export function shouldPlayGameStartVoice({ isReplay = false, role = "spectator", phase = "" } = {}) {
  return !isReplay && role === "player" && phase === GAME_PHASES.playing;
}

export function roomCloseCountdownText(closesAt, now = Date.now()) {
  const seconds = Math.max(0, Math.ceil((Number(closesAt) - now) / 1000));
  const minutes = Math.floor(seconds / 60);
  const restSeconds = String(seconds % 60).padStart(2, "0");
  return `关闭倒计时 ${minutes}:${restSeconds}`;
}

export function roomGameInfoForPlayers(blackPlayer, whitePlayer, moveNumber) {
  if (!blackPlayer || !whitePlayer) return null;
  return {
    black: `${blackPlayer.user.username} ${blackPlayer.user.rank}`,
    white: `${whitePlayer.user.username} ${whitePlayer.user.rank}`,
    moves: `${moveNumber}手`
  };
}
