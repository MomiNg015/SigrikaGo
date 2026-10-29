import { memo } from "react";
import {
  Calculator,
  Flag,
  Hand,
  Handshake,
  Play,
  Sparkles,
} from "lucide-react";
import { GAME_PHASES } from "../shared/game.js";
import { gameModeFamily } from "../shared/gameModes.js";
import { canRequestOpponentDecision } from "./actionBar/actionAvailability.js";
import DeadStoneDecisionBar from "./actionBar/DeadStoneDecisionBar.jsx";
import ReplayActionBar from "./actionBar/ReplayActionBar.jsx";
import ActionKey from "./actionBar/ActionKey.jsx";

function ActionBar({
  role,
  mode = "spark",
  phase,
  me,
  isMyTurn,
  pendingSkill,
  setPendingSkill,
  skillLocked = false,
  skillActionLocked = skillLocked,
  decisionLocked = skillLocked,
  skillEnabled = true,
  skillName = "技能",
  skillUses,
  skillAvailable = true,
  countingEnabled = true,
  drawEnabled = true,
  hasAnyStones = true,
  opponentConnected = true,
  tutorialAction,
  tutorialContinueLabel,
  onTutorialContinue,
  scoring,
  replayStep = 0,
  replayMax = 0,
  replayMode = "replay",
  onReplayStep,
  onPass,
  onCountingRequest,
  onDrawRequest,
  onConfirmScoring,
  onResetScoring,
  onResign
}) {
  if (role === "spectator") {
    return (
      <ReplayActionBar
        replayStep={replayStep}
        replayMax={replayMax}
        mode={replayMode}
        onReplayStep={onReplayStep}
      />
    );
  }
  const hasDecision =
    tutorialAction === undefined && phase === GAME_PHASES.markingDead && scoring;
  if (hasDecision) {
    return (
      <DeadStoneDecisionBar
        userId={me?.user?.id}
        scoring={scoring}
        onConfirmScoring={onConfirmScoring}
        onResetScoring={onResetScoring}
      />
    );
  }
  const isGomoku = gameModeFamily(mode) === "gomoku";
  const remainingUses = skillEnabled ? Math.max(0, skillUses ?? 0) : 0;
  const actionSkillName = skillEnabled ? (skillName || "技能") : "技能";
  const actionDisabled = (action, disabled) => tutorialAction === undefined ? disabled : tutorialAction !== action;
  const isContinue = tutorialAction !== undefined && Boolean(tutorialContinueLabel);
  const countingAction = isContinue ? "continue" : "counting";
  return (
    <nav className="action-bar battle-arcade-controls" aria-label="对弈操作" data-tutorial-action={tutorialAction || undefined}>
      <ActionKey className="pass-action" data-tutorial-target={tutorialAction === "pass" || undefined} onClick={onPass} disabled={actionDisabled("pass", isGomoku || phase !== "playing" || skillLocked)}>
        <Hand size={18} />
        <span className="action-label mobile-action-button-label">弃手</span>
      </ActionKey>
      <ActionKey
        className="counting-action"
        data-tutorial-target={tutorialAction === countingAction || undefined}
        onClick={isContinue ? onTutorialContinue : onCountingRequest}
        disabled={actionDisabled(countingAction, isGomoku || !countingEnabled || !canRequestOpponentDecision({ phase, skillLocked: decisionLocked, hasAnyStones, opponentConnected }))}
        title={!isContinue && (isGomoku || !countingEnabled) ? "该对局无法数子" : undefined}
      >
        {isContinue ? <Play size={18} aria-hidden="true" /> : <Calculator size={18} />}
        <span className="action-label mobile-action-button-label">{isContinue ? tutorialContinueLabel : "数子"}</span>
      </ActionKey>
      <ActionKey
        className={`skill-action ${pendingSkill ? "active" : ""} ${remainingUses <= 0 ? "spent" : ""}`}
        data-skill-uses={remainingUses}
        data-tutorial-target={tutorialAction === "skill" || undefined}
        data-long-name={actionSkillName.length > 6 || undefined}
        aria-label={`${actionSkillName}，剩余 ${remainingUses} 次`}
        aria-pressed={Boolean(pendingSkill)}
        onClick={() => setPendingSkill(!pendingSkill)}
        disabled={actionDisabled("skill", !skillEnabled || !me || phase !== "playing" || !isMyTurn || skillActionLocked || remainingUses <= 0 || !skillAvailable)}
      >
        <Sparkles size={20} />
        <span className="action-label mobile-action-button-label">{actionSkillName}</span>
        <span className="skill-use-window" aria-hidden="true">{String(remainingUses).padStart(2, "0")}</span>
      </ActionKey>
      <ActionKey className="draw-action" data-tutorial-target={tutorialAction === "draw" || undefined} onClick={onDrawRequest} disabled={actionDisabled("draw", !drawEnabled || !canRequestOpponentDecision({ phase, skillLocked: decisionLocked, opponentConnected }))}>
        <Handshake size={18} />
        <span className="action-label mobile-action-button-label">和棋</span>
      </ActionKey>
      <ActionKey className="resign-action" data-tutorial-target={tutorialAction === "resign" || undefined} onClick={onResign} disabled={actionDisabled("resign", phase === "finished" || skillLocked)}><Flag size={18} /><span className="action-label mobile-action-button-label">认输</span></ActionKey>
    </nav>
  );
}

export function areActionBarPropsEqual(previous, next) {
  if (previous.role !== next.role) return false;
  if (previous.role === "spectator") {
    return previous.replayStep === next.replayStep
      && previous.replayMax === next.replayMax
      && previous.replayMode === next.replayMode
      && previous.onReplayStep === next.onReplayStep;
  }

  return previous.mode === next.mode
    && previous.phase === next.phase
    && previous.me?.user?.id === next.me?.user?.id
    && Boolean(previous.me) === Boolean(next.me)
    && previous.isMyTurn === next.isMyTurn
    && Boolean(previous.pendingSkill) === Boolean(next.pendingSkill)
    && previous.setPendingSkill === next.setPendingSkill
    && previous.skillLocked === next.skillLocked
    && previous.skillActionLocked === next.skillActionLocked
    && previous.decisionLocked === next.decisionLocked
    && previous.skillEnabled === next.skillEnabled
    && previous.skillName === next.skillName
    && previous.skillUses === next.skillUses
    && previous.skillAvailable === next.skillAvailable
    && previous.countingEnabled === next.countingEnabled
    && previous.drawEnabled === next.drawEnabled
    && previous.hasAnyStones === next.hasAnyStones
    && previous.opponentConnected === next.opponentConnected
    && previous.tutorialAction === next.tutorialAction
    && previous.tutorialContinueLabel === next.tutorialContinueLabel
    && previous.onTutorialContinue === next.onTutorialContinue
    && previous.scoring === next.scoring
    && previous.onPass === next.onPass
    && previous.onCountingRequest === next.onCountingRequest
    && previous.onDrawRequest === next.onDrawRequest
    && previous.onConfirmScoring === next.onConfirmScoring
    && previous.onResetScoring === next.onResetScoring
    && previous.onResign === next.onResign;
}

export { canRequestOpponentDecision } from "./actionBar/actionAvailability.js";

export default memo(ActionBar, areActionBarPropsEqual);
