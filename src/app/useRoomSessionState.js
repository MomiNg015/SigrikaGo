import { useMemo, useState } from "react";
import { readDismissedResultRoom, shouldShowResultModal } from "./resumeSession.js";

export function initialRoomSessionState() {
  return {
    room: null,
    pendingSkill: false,
    replayStep: null,
    dismissedResultRoom: readDismissedResultRoom()
  };
}

export function roomSessionView(state) {
  return {
    ...state,
    resultModalOpen: shouldShowResultModal(state.room, state.dismissedResultRoom, state.replayStep)
  };
}

export function useRoomSessionState() {
  const [room, setRoom] = useState(null);
  const [pendingSkill, setPendingSkill] = useState(false);
  const [replayStep, setReplayStep] = useState(null);
  const [dismissedResultRoom, setDismissedResultRoom] = useState(() => readDismissedResultRoom());

  return useMemo(() => ({
    ...roomSessionView({ room, pendingSkill, replayStep, dismissedResultRoom }),
    setRoom,
    setPendingSkill,
    setReplayStep,
    setDismissedResultRoom
  }), [dismissedResultRoom, pendingSkill, replayStep, room]);
}
