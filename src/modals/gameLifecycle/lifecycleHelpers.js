import { COLORS } from "../../shared/game.js";
import { resultRewardDelta } from "../../shared/resultRewards.js";
import { SYSTEM_VOICE_EVENTS } from "../../shared/systemVoices.js";

export function colorTextForPlayer(player) {
  if (player?.color === COLORS.black) return "黑";
  if (player?.color === COLORS.white) return "白";
  return "";
}

export function secondsSinceStarted(startedAt, now) {
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}

export function secondsUntilTimestamp(timestamp, now) {
  return Math.max(0, Math.ceil((timestamp - now) / 1000));
}

export function formatSignedDelta(value) {
  return value > 0 ? `+${value}` : String(value);
}

export function resultRewardForRoom(room, user) {
  const currentPlayer = resultPlayerForRoom(room, user);
  if (!currentPlayer) return null;
  if (room.game.winner?.invalid) return { rating: 0, coins: 0 };
  const winnerColor = room.game.winner?.winnerColor ?? room.game.winner?.color;
  return resultRewardDelta(currentPlayer.color, winnerColor);
}

export function resultPlayerForRoom(room, user) {
  return room.players.find((player) => player.user?.id === user?.id) ?? null;
}

export function resultVoiceEventForRoom(room, user) {
  if (room.game.winner?.invalid) return null;
  const currentPlayer = resultPlayerForRoom(room, user);
  if (!currentPlayer) return null;
  const winnerColor = room.game.winner?.winnerColor ?? room.game.winner?.color;
  if (!winnerColor) return SYSTEM_VOICE_EVENTS.resultDraw;
  return currentPlayer.color === winnerColor ? SYSTEM_VOICE_EVENTS.resultVictory : SYSTEM_VOICE_EVENTS.resultDefeat;
}
