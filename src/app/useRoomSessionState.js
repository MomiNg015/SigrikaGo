import { useCallback, useMemo, useState } from "react";
import { readDismissedResultRoom, shouldShowResultModal } from "./resumeSession.js";

const EMPTY_PENDING_SKILL_DRAFT = Object.freeze({
  active: false,
  roomIdentity: ""
});

export function initialRoomSessionState() {
  return {
    room: null,
    pendingSkill: false,
    replayStep: null,
    dismissedResultRoom: readDismissedResultRoom()
  };
}

export function roomIdentityForLocalState(room) {
  const roomCode = String(room?.code ?? "");
  if (!roomCode) return "";
  return `${roomCode}:${String(room?.role ?? "")}`;
}

export function pendingSkillValueForRoom(draft, roomIdentity) {
  return Boolean(
    roomIdentity
      && draft?.active
      && draft.roomIdentity === roomIdentity
  );
}

export function updatePendingSkillDraft(currentDraft, nextValue, roomIdentity) {
  const currentValue = pendingSkillValueForRoom(currentDraft, roomIdentity);
  const nextActive = Boolean(
    typeof nextValue === "function"
      ? nextValue(currentValue)
      : nextValue
  );

  if (!roomIdentity || !nextActive) {
    if (!currentDraft?.active && !currentDraft?.roomIdentity) {
      return currentDraft ?? EMPTY_PENDING_SKILL_DRAFT;
    }
    return EMPTY_PENDING_SKILL_DRAFT;
  }
  if (currentValue) return currentDraft;
  return { active: true, roomIdentity };
}

export function roomSessionView(state) {
  return {
    ...state,
    resultModalOpen: shouldShowResultModal(state.room, state.dismissedResultRoom, state.replayStep)
  };
}

export function useRoomSessionState() {
  const [roomBoundary, setRoomBoundary] = useState(() => ({
    room: null,
    pendingSkillDraft: EMPTY_PENDING_SKILL_DRAFT
  }));
  const room = roomBoundary.room;
  const roomIdentity = roomIdentityForLocalState(room);
  const pendingSkillDraft = roomBoundary.pendingSkillDraft;
  const pendingSkill = pendingSkillValueForRoom(pendingSkillDraft, roomIdentity);
  const setRoom = useCallback((nextRoomOrUpdater) => {
    setRoomBoundary((current) => {
      const nextRoom = typeof nextRoomOrUpdater === "function"
        ? nextRoomOrUpdater(current.room)
        : nextRoomOrUpdater;
      if (Object.is(nextRoom, current.room)) return current;

      const currentRoomIdentity = roomIdentityForLocalState(current.room);
      const nextRoomIdentity = roomIdentityForLocalState(nextRoom);
      return {
        room: nextRoom,
        pendingSkillDraft: currentRoomIdentity === nextRoomIdentity
          ? current.pendingSkillDraft
          : EMPTY_PENDING_SKILL_DRAFT
      };
    });
  }, []);
  const setPendingSkill = useCallback((nextValue) => {
    setRoomBoundary((current) => {
      const currentRoomIdentity = roomIdentityForLocalState(current.room);
      const nextDraft = updatePendingSkillDraft(
        current.pendingSkillDraft,
        nextValue,
        currentRoomIdentity
      );
      if (Object.is(nextDraft, current.pendingSkillDraft)) return current;
      return { ...current, pendingSkillDraft: nextDraft };
    });
  }, []);
  const [replayStep, setReplayStep] = useState(null);
  const [dismissedResultRoom, setDismissedResultRoom] = useState(() => readDismissedResultRoom());

  return useMemo(() => ({
    ...roomSessionView({ room, pendingSkill, replayStep, dismissedResultRoom }),
    setRoom,
    setPendingSkill,
    setReplayStep,
    setDismissedResultRoom
  }), [dismissedResultRoom, pendingSkill, replayStep, room, setPendingSkill, setRoom]);
}
