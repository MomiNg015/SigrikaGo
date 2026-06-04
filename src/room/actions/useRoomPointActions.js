import { useEffect, useState } from "react";
import { GAME_PHASES } from "../../shared/game.js";
import { nextPointConfirmation, shouldUsePointConfirmation } from "../mobilePointConfirmation.js";

export function useRoomPointActions({
  canConfirmSkillPoint,
  displayRoom,
  isReplay,
  me,
  pendingSkill,
  role,
  setPendingSkill,
  skillPreview,
  onGameAction,
  onScoringAction
}) {
  const [pointConfirmation, setPointConfirmation] = useState(null);

  useEffect(() => {
    setPointConfirmation(null);
  }, [displayRoom.code, displayRoom.game.turn, displayRoom.game.phase, pendingSkill, skillPreview, isReplay]);

  function handlePoint(point, eventMeta = {}) {
    if (isReplay) return;
    if (skillPreview) return;
    if (displayRoom.game.phase === "marking-dead") return handleScoringPoint(point);
    if (displayRoom.game.phase !== GAME_PHASES.playing) return;
    if (role !== "player") return;
    const actionType = pendingSkill ? "skill" : "move";
    if (!canConfirmPointAction({ point, actionType })) {
      setPointConfirmation(null);
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
      onGameAction({ type: "skill", pointId: point.id });
      return;
    }
    onGameAction({ type: "move", pointId: point.id });
  }

  function canConfirmPointAction({ point, actionType }) {
    if (actionType === "skill") return canConfirmSkillPoint(point, me);
    return Boolean(point?.valid && !point.stone);
  }

  function handleScoringPoint(point) {
    if (point.stone) onScoringAction({ type: "mark-dead", pointId: point.id });
    else if (point.valid) onScoringAction({ type: "mark-neutral", pointId: point.id });
  }

  return {
    handlePoint,
    handleScoringPoint,
    pointConfirmation
  };
}
