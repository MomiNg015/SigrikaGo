import { shouldClearRoomOnReplayExit } from "./resumeSession.js";

export function planRoomBackNavigation({ room, replayStep }) {
  const basePlan = {
    clearRoom: false,
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
      leaveRoomCode: room?.code || ""
    };
  }

  return basePlan;
}
