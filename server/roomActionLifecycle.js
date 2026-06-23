import { applyStandardGameAction as defaultApplyStandardGameAction } from "./roomGameActions.js";
import { validateRoomActionPhase } from "./roomActionPhaseGuards.js";
import {
  handleRoomTestAction as defaultHandleRoomTestAction,
  isRoomTestAction as defaultIsRoomTestAction
} from "./roomTestActions.js";

export function createRoomActionLifecycle({
  rooms,
  validateRoomCode,
  validateActionPoint,
  appendSystem,
  appendNotices,
  startActiveSkill,
  broadcastToast,
  resetByoYomi,
  scheduleRoomClose,
  maybeStartPassiveSkill,
  isRoomTestAction = defaultIsRoomTestAction,
  handleRoomTestAction = defaultHandleRoomTestAction,
  applyStandardGameAction = defaultApplyStandardGameAction
}) {
  function handleGameAction(roomCode, userId, action, io) {
    const validatedRoomCode = validateRoomCode(roomCode);
    if (!validatedRoomCode.ok) return { ok: false, error: validatedRoomCode.error };

    const room = rooms.get(validatedRoomCode.value);
    if (!room) return { ok: false, error: "\u623f\u95f4\u4e0d\u5b58\u5728" };

    const validationError = validateActionPoint(action, room.game.size);
    if (validationError) return { ok: false, error: validationError };

    const player = room.players.find((candidate) => candidate.user.id === userId);
    if (!player) return { ok: false, error: "\u89c2\u6218\u8005\u4e0d\u80fd\u64cd\u4f5c\u68cb\u5c40" };
    if (room.game.pendingSkill) return { ok: false, error: "\u6280\u80fd\u6f14\u51fa\u4e2d" };

    if (isRoomTestAction(action)) {
      return handleTestAction({ action, player, room });
    }

    const phaseError = validateRoomActionPhase(action, room.game.phase);
    if (phaseError) return { ok: false, error: phaseError };

    if (action.type === "skill") {
      return startActiveSkill({ room, player, action, io });
    }

    return applyStandardGameAction({
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
    });
  }

  function handleTestAction({ action, player, room }) {
    const testAction = handleRoomTestAction({ action, player, room });
    if (!testAction.ok) return testAction;
    if (testAction.systemMessage) appendSystem(room, testAction.systemMessage);
    if (!testAction.result) return { ok: true, room };

    const result = testAction.result;
    if (!result.ok) return result;

    room.game = result.state;
    appendNotices(room, result.notices);
    return { ok: true, room };
  }

  return {
    handleGameAction
  };
}
