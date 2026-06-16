import {
  COLORS,
  GAME_PHASES,
  INVALID_EARLY_RESIGN_NOTICE,
  exposeHiddenHands,
  passMove,
  playMove,
  resignGame
} from "../src/shared/game.js";

export function applyStandardGameAction({
  room,
  player,
  action,
  io,
  appendSystem,
  appendNotices,
  broadcastToast,
  resetByoYomi,
  scheduleRoomClose,
  maybeStartPassiveSkill
}) {
  let result;
  if (action.type === "move") result = playMove(room.game, player.color, action.pointId);
  if (action.type === "pass") result = passMove(room.game, player.color);
  if (action.type === "resign") result = resignGame(room.game, player.color);

  if (!result) return { ok: false, error: "未知操作" };
  if (!result.ok) return result;

  room.game = result.state;
  appendNotices(room, result.notices);
  if (action.type === "resign" && room.game.winner?.invalid) {
    broadcastToast(io, room, INVALID_EARLY_RESIGN_NOTICE);
  }
  resetByoYomi(player);
  const label = player.color === COLORS.black ? "黑" : "白";
  if (action.type === "pass") appendSystem(room, `${label}方弃一手。`);
  if (action.type === "resign") appendSystem(room, `${label}方认输。`);

  if (room.game.phase === GAME_PHASES.finished) {
    appendNotices(room, exposeHiddenHands(room.game));
    scheduleRoomClose(room.code, io);
  } else if (!room.game.extraTurn) {
    maybeStartPassiveSkill(room, io);
  }
  return { ok: true, room };
}
