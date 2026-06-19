import { useEffect, useMemo, useRef, useState } from "react";
import {
  GOMOKU_RESULT_REVEAL_DELAY_MS,
  gomokuResultRevealKey,
  shouldShowResultModal
} from "./resumeSession.js";

export function initialRoomSessionState() {
  return {
    room: null,
    pendingSkill: false,
    replayStep: null,
    dismissedResultRoom: ""
  };
}

export function roomSessionView(state) {
  return {
    ...state,
    resultModalOpen: shouldShowResultModal(state.room, state.dismissedResultRoom, state.replayStep, {
      resultRevealReady: state.resultRevealReady ?? true
    })
  };
}

export function useRoomSessionState() {
  const [room, setRoom] = useState(null);
  const [pendingSkill, setPendingSkill] = useState(false);
  const [replayStep, setReplayStep] = useState(null);
  const [dismissedResultRoom, setDismissedResultRoom] = useState("");
  const [resultRevealReady, setResultRevealReady] = useState(true);
  const lastRevealKeyRef = useRef("");
  const revealKey = gomokuResultRevealKey(room, replayStep);

  useEffect(() => {
    if (!revealKey) {
      lastRevealKeyRef.current = "";
      setResultRevealReady(true);
      return undefined;
    }
    if (lastRevealKeyRef.current === revealKey) return undefined;

    lastRevealKeyRef.current = revealKey;
    setResultRevealReady(false);
    const timer = setTimeout(() => setResultRevealReady(true), GOMOKU_RESULT_REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [revealKey]);

  return useMemo(() => ({
    ...roomSessionView({ room, pendingSkill, replayStep, dismissedResultRoom, resultRevealReady }),
    setRoom,
    setPendingSkill,
    setReplayStep,
    setDismissedResultRoom
  }), [dismissedResultRoom, pendingSkill, replayStep, resultRevealReady, room]);
}
