import { GAME_PHASES } from "../../shared/game.js";

export function timedRoomRequestToastForPlayer(room, userId) {
  if (!room || !userId || room.role === "spectator") return null;
  const phase = room.game?.phase;

  if (phase === GAME_PHASES.drawRequested && room.game.drawRequest) {
    const requestedBy = room.game.drawRequest.requestedBy;
    const isRequester = requestedBy === userId;
    const requesterName = playerName(room, requestedBy);
    return {
      key: `${room.code}:draw:${requestedBy}:${room.drawDeadline ?? room.game.drawRequest.deadline ?? ""}`,
      type: "draw",
      title: isRequester ? "和棋申请已发送" : "收到和棋申请",
      message: isRequester ? "等待对方回应。" : `${requesterName}申请和棋。`,
      deadline: room.drawDeadline ?? room.game.drawRequest.deadline,
      actions: isRequester ? [] : [
        { action: "draw:accept", label: "同意", tone: "agree" },
        { action: "draw:reject", label: "不同意", tone: "reject" }
      ]
    };
  }

  if (phase === GAME_PHASES.countingRequested && room.game.scoring) {
    const requestedBy = room.game.scoring.requestedBy;
    const isRequester = requestedBy === userId;
    const requesterName = playerName(room, requestedBy);
    return {
      key: `${room.code}:counting:${requestedBy}:${room.countingDeadline ?? room.game.scoring.deadline ?? ""}`,
      type: "counting",
      title: isRequester ? "数子申请已发送" : "收到数子申请",
      message: isRequester ? "等待对方回应。" : `${requesterName}申请进入数子。`,
      deadline: room.countingDeadline ?? room.game.scoring.deadline,
      actions: isRequester ? [] : [
        { action: "counting:accept", label: "同意", tone: "agree" },
        { action: "counting:reject", label: "不同意", tone: "reject" }
      ]
    };
  }

  if (phase === GAME_PHASES.resultReview && room.game.scoring) {
    const accepted = room.game.scoring.resultAcceptedBy?.includes(userId);
    const scoreText = room.game.scoring.result?.text ?? "请确认当前数子结果。";
    return {
      key: `${room.code}:result:${room.game.scoring.resultDeadline ?? ""}:${accepted ? "accepted" : "pending"}`,
      type: "result",
      title: accepted ? "已同意数子结果" : "数子结果确认",
      message: accepted ? "等待对方确认结果。" : scoreText,
      deadline: room.game.scoring.resultDeadline ?? room.resultDeadline,
      score: room.game.scoring.result,
      actions: accepted ? [] : [
        { action: "result:accept", label: "同意结果", tone: "agree" },
        { action: "result:reject", label: "不同意", tone: "reject" }
      ]
    };
  }

  return null;
}

export function timedRoomRequestSnapshot(room, userId) {
  const toast = timedRoomRequestToastForPlayer(room, userId);
  if (!toast) return null;
  return {
    key: toast.key,
    type: toast.type,
    title: toast.title,
    message: toast.message
  };
}

export function timedRoomRequestEffectKey(room, userId) {
  if (!room || !userId) return "";
  const toast = timedRoomRequestToastForPlayer(room, userId);
  return [
    room.code ?? "",
    room.role ?? "",
    room.game?.phase ?? "",
    toast?.key ?? "",
    toast?.title ?? "",
    toast?.message ?? "",
    toast?.score?.text ?? "",
    toast?.actions?.map((action) => action.action).join(",") ?? ""
  ].join("|");
}

export function timedRoomResponseToast(previousRequest, room) {
  if (!previousRequest || !room) return null;
  const phase = room.game?.phase;

  if (previousRequest.type === "draw") {
    return {
      key: `${previousRequest.key}:response:${phase}`,
      title: "和棋申请已回应",
      message: phase === GAME_PHASES.finished ? "双方同意和棋，对局结束。" : "和棋申请未通过，对局继续。",
      autoDismiss: true
    };
  }

  if (previousRequest.type === "counting") {
    return {
      key: `${previousRequest.key}:response:${phase}`,
      title: "数子申请已回应",
      message: phase === GAME_PHASES.markingDead ? "对方同意数子，请确认死子。" : "数子申请未通过，对局继续。",
      autoDismiss: true
    };
  }

  if (previousRequest.type === "result") {
    return {
      key: `${previousRequest.key}:response:${phase}`,
      title: "数子结果已回应",
      message: phase === GAME_PHASES.finished ? "双方确认数子结果，对局结束。" : "数子结果未通过，对局继续。",
      autoDismiss: true
    };
  }

  return null;
}

function playerName(room, userId) {
  return room.players?.find((player) => player.user?.id === userId)?.user?.username ?? "对方";
}
