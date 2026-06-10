import {
  GAME_PHASES,
  INVALID_EARLY_RESIGN_NOTICE,
  createDrawResult,
  createScoringState,
  exposeHiddenHands,
  markDeadGroup,
  prepareScoringState,
  resetDeadMarks,
  resultWithInvalidFlagForGame,
  restoreSuspendedHiddenHands,
  scoreGame,
  suspendUnexposedHiddenHands,
  toggleNeutralPoint
} from "../src/shared/game.js";

export function applyCountingRequest({ room, player, userId, now = Date.now(), appendSystem, scheduleCountingTimeout, io }) {
  room.game.phase = GAME_PHASES.countingRequested;
  suspendUnexposedHiddenHands(room.game);
  room.game.scoring = prepareScoringState(room.game, createScoringState());
  room.game.scoring.requestedBy = userId;
  room.countingDeadline = now + 30000;
  appendSystem(room, `${player.user.username}申请数子。`);
  scheduleCountingTimeout(room, io);
  return { ok: true, room };
}

export function applyCountingResponse({ room, player, userId, accepted, appendSystem }) {
  if (room.game.scoring?.requestedBy === userId) return { ok: false, error: "需要等待对方确认" };

  if (!accepted) {
    restoreSuspendedHiddenHands(room.game);
    room.game.phase = GAME_PHASES.playing;
    room.game.scoring = null;
    room.countingDeadline = null;
    appendSystem(room, "数子申请被拒绝，对局继续。");
    return { ok: true, room };
  }
  room.game.phase = GAME_PHASES.markingDead;
  room.game.scoring = prepareScoringState(room.game, room.game.scoring);
  room.game.scoring.acceptedBy = userId;
  room.countingDeadline = null;
  appendSystem(room, "双方同意数子，进入死子确认。");
  return { ok: true, room };
}

export function applyDrawRequest({ room, player, userId, now = Date.now(), appendSystem, scheduleDrawTimeout, io }) {
  room.game.phase = GAME_PHASES.drawRequested;
  room.game.drawRequest = {
    requestedBy: userId,
    requestedColor: player.color
  };
  room.drawDeadline = now + 10000;
  appendSystem(room, `${player.user.username}申请和棋。`);
  scheduleDrawTimeout(room, io);
  return { ok: true, room };
}

export function applyDrawResponse({ room, player, userId, accepted, appendSystem, broadcastToast, scheduleRoomClose, io }) {
  if (room.game.drawRequest?.requestedBy === userId) return { ok: false, error: "需要等待对方确认" };

  if (!accepted) {
    room.game.phase = GAME_PHASES.playing;
    room.game.drawRequest = null;
    room.drawDeadline = null;
    appendSystem(room, `${player.user.username}不同意和棋，对局继续。`);
    return { ok: true, room };
  }

  room.game.phase = GAME_PHASES.finished;
  room.game.drawRequest = null;
  room.game.winner = resultWithInvalidFlagForGame(room.game, createDrawResult("agreement"));
  if (room.game.winner?.invalid) broadcastToast(io, room, INVALID_EARLY_RESIGN_NOTICE);
  room.drawDeadline = null;
  appendSystem(room, "双方同意和棋，对局结束。");
  scheduleRoomClose(room.code, io);
  return { ok: true, room };
}

export function applyScoringAction({ room, player, userId, action, appendSystem, appendNotices, broadcastToast, scheduleResultReviewTimeout, scheduleRoomClose, io }) {
  let result = { ok: true, state: room.game };
  if (action.type === "mark-dead") result = markDeadGroup(room.game, action.pointId, player.color);
  if (action.type === "mark-neutral") result = toggleNeutralPoint(room.game, action.pointId);
  if (action.type === "reset-dead") result = resetDeadMarks(room.game);
  if (!result.ok) return result;
  room.game = result.state;

  if (action.type === "reset-dead") appendSystem(room, `${player.user.username}重新确认死子。`);

  if (action.type === "confirm-dead") {
    const confirmed = new Set(room.game.scoring.confirmedBy);
    confirmed.add(userId);
    room.game.scoring.confirmedBy = [...confirmed];
    appendSystem(room, `${player.user.username}确认死子。`);
    if (room.game.scoring.confirmedBy.length === 2) {
      const score = scoreGame(room.game);
      room.game.phase = GAME_PHASES.resultReview;
      room.game.scoring.result = score;
      room.game.scoring.resultDeadline = Date.now() + 30000;
      appendSystem(room, `数子结果：${score.text}。`);
      scheduleResultReviewTimeout(room.code, io);
    }
  }

  if (action.type === "accept-result") {
    const accepted = new Set(room.game.scoring.resultAcceptedBy);
    accepted.add(userId);
    room.game.scoring.resultAcceptedBy = [...accepted];
    if (room.game.scoring.resultAcceptedBy.length === 2) {
      room.game.phase = GAME_PHASES.finished;
      room.game.winner = resultWithInvalidFlagForGame(room.game, room.game.scoring.result);
      if (room.game.winner?.invalid) broadcastToast(io, room, INVALID_EARLY_RESIGN_NOTICE);
      appendNotices(room, exposeHiddenHands(room.game));
      appendSystem(room, `对局结束，${room.game.scoring.result.text}。`);
      scheduleRoomClose(room.code, io);
    }
  }

  if (action.type === "reject-result") {
    restoreSuspendedHiddenHands(room.game);
    room.game.phase = GAME_PHASES.playing;
    room.game.scoring = null;
    appendSystem(room, `${player.user.username}不同意结果，对局继续。`);
  }

  return { ok: true, room };
}
