import { shouldClearRoomOnReplayExit } from "./resumeSession.js";

export const BATTLE_RETURN_VIEW = "battle-return";

export function planRoomBackNavigation({ room, replayStep }) {
  const basePlan = {
    clearRoom: false,
    dismissResultRoomCode: "",
    leaveRoomCode: "",
    nextReplayStep: null,
    nextView: "home"
  };

  if (shouldClearRoomOnReplayExit(replayStep)) {
    return {
      ...basePlan,
      clearRoom: true
    };
  }

  if ((room?.role === "spectator" || room?.game?.phase === "finished") && replayStep === null) {
    return {
      ...basePlan,
      clearRoom: true,
      dismissResultRoomCode: room?.game?.phase === "finished" ? room?.code || "" : "",
      leaveRoomCode: room?.code || "",
      nextView: room?.game?.phase === "finished" && !room.sigrikaCandyDuel ? BATTLE_RETURN_VIEW : basePlan.nextView
    };
  }

  return basePlan;
}
