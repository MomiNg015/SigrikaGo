import { useCallback, useEffect, useState } from "react";
import { GAME_PHASES } from "../../shared/game.js";
import { isLibertyPurgeForbiddenPoint } from "../../shared/gameSkillState.js";
import { nextPointConfirmation, shouldUsePointConfirmation } from "../mobilePointConfirmation.js";

export function useRoomPointActions({
  canConfirmSkillPoint,
  displayRoom,
  isReplay,
  me,
  pendingSkill,
  role,
  setPendingSkill,
  skillUsesBoardConfirmation = false,
  skillUsesBoardSurfaceConfirmation = false,
  skillPreview,
  onGameAction,
  onScoringAction
}) {
  const [pointConfirmation, setPointConfirmation] = useState(null);
  const phase = displayRoom.game.phase;
  const meColor = me?.color;
  const libertyPurgeMarks = displayRoom.game.libertyPurgeMarks;

  useEffect(() => {
    setPointConfirmation(null);
  }, [displayRoom.code, displayRoom.game.turn, displayRoom.game.phase, pendingSkill, skillPreview, isReplay]);

  const handleScoringPoint = useCallback((point) => {
    if (point.stone) onScoringAction({ type: "mark-dead", pointId: point.id });
    else if (point.valid) onScoringAction({ type: "mark-neutral", pointId: point.id });
  }, [onScoringAction]);

  const handlePoint = useCallback((point, eventMeta = {}) => {
    if (isReplay) return;
    if (skillPreview) return;
    if (phase === "marking-dead") return handleScoringPoint(point);
    if (phase !== GAME_PHASES.playing) return;
    if (role !== "player") return;
    const actionType = pendingSkill ? "skill" : "move";
    if (!canConfirmPointAction({
      point,
      actionType,
      canConfirmSkillPoint,
      me: { color: meColor },
      libertyPurgeForbidden: isLibertyPurgeForbiddenPoint({ libertyPurgeMarks }, meColor, point),
      skillUsesBoardConfirmation,
      skillUsesBoardSurfaceConfirmation
    })) {
      setPointConfirmation(null);
      return;
    }
    if (pendingSkill && skillUsesBoardSurfaceConfirmation) {
      setPointConfirmation(null);
      setPendingSkill(false);
      onGameAction({ type: "skill" });
      return;
    }
    if (shouldUsePointConfirmation(eventMeta)) {
      const confirmation = nextPointConfirmation(pointConfirmation, { pointId: point.id, actionType });
      setPointConfirmation(confirmation.next);
      if (!confirmation.confirmed) return;
    } else {
      setPointConfirmation(null);
    }
    if (pendingSkill) {
      setPendingSkill(false);
      onGameAction(skillUsesBoardSurfaceConfirmation ? { type: "skill" } : { type: "skill", pointId: point.id });
      return;
    }
    onGameAction({ type: "move", pointId: point.id });
  }, [
    canConfirmSkillPoint,
    handleScoringPoint,
    isReplay,
    libertyPurgeMarks,
    meColor,
    onGameAction,
    pendingSkill,
    phase,
    pointConfirmation,
    role,
    setPendingSkill,
    skillPreview,
    skillUsesBoardConfirmation,
    skillUsesBoardSurfaceConfirmation
  ]);

  const handleBoardSurface = useCallback(() => {
    if (isReplay || skillPreview || !pendingSkill || !skillUsesBoardSurfaceConfirmation) return;
    if (phase !== GAME_PHASES.playing || role !== "player") return;
    setPointConfirmation(null);
    setPendingSkill(false);
    onGameAction({ type: "skill" });
  }, [isReplay, onGameAction, pendingSkill, phase, role, setPendingSkill, skillPreview, skillUsesBoardSurfaceConfirmation]);

  return {
    handlePoint,
    handleBoardSurface,
    handleScoringPoint,
    pointConfirmation
  };
}

export function canConfirmPointAction({
  point,
  actionType,
  canConfirmSkillPoint = () => false,
  me = null,
  libertyPurgeForbidden = false,
  skillUsesBoardConfirmation = false,
  skillUsesBoardSurfaceConfirmation = false
}) {
  if (actionType === "skill") {
    if (skillUsesBoardSurfaceConfirmation) return true;
    if (skillUsesBoardConfirmation) return Boolean(point?.valid);
    return canConfirmSkillPoint(point, me);
  }
  return Boolean(point?.valid && !point.stone && point.protocolBan?.bannedColor !== me?.color && !libertyPurgeForbidden);
}
