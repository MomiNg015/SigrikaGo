import { memo } from "react";
import {
  Calculator,
  Flag,
  Hand,
  Handshake,
  Sparkles,
} from "lucide-react";
import { GAME_PHASES } from "../shared/game.js";
import { gameModeFamily } from "../shared/gameModes.js";
import { canRequestOpponentDecision } from "./actionBar/actionAvailability.js";
import DeadStoneDecisionBar from "./actionBar/DeadStoneDecisionBar.jsx";
import ReplayActionBar from "./actionBar/ReplayActionBar.jsx";
import TestTools from "./actionBar/TestTools.jsx";

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
  skillUses,
  skillAvailable = true,
  hasAnyStones = true,
  opponentConnected = true,
  scoring,
  replayStep = 0,
  replayMax = 0,
  showTestTools = false,
  onReplayStep,
  onTestRandomLayout,
  onTestRestoreSkill,
  onTestEnterByoYomi,
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
        onReplayStep={onReplayStep}
      />
    );
  }
  const hasDecision =
    phase === GAME_PHASES.markingDead && scoring;
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
  const showGoControls = !isGomoku;
  return (
    <nav className="action-bar">
      {showGoControls && <button onClick={onPass} disabled={phase !== "playing" || skillLocked}>
        <Hand size={18} />
        <span className="action-label mobile-action-button-label">弃手</span>
      </button>}
      {showGoControls && <button onClick={onCountingRequest} disabled={!canRequestOpponentDecision({ phase, skillLocked: decisionLocked, hasAnyStones, opponentConnected })}>
        <Calculator size={18} />
        <span className="action-label mobile-action-button-label">数子</span>
      </button>}
      {skillEnabled && (
      <button
        className={`skill-action ${pendingSkill ? "active" : ""} ${skillUses <= 0 ? "spent" : ""}`}
        onClick={() => setPendingSkill(!pendingSkill)}
        disabled={!me || phase !== "playing" || !isMyTurn || skillActionLocked || skillUses <= 0 || !skillAvailable}
      >
        <Sparkles size={20} />
        <span className="action-label mobile-action-button-label">技能 · {skillUses}</span>
      </button>
      )}
      <button onClick={onDrawRequest} disabled={!canRequestOpponentDecision({ phase, skillLocked: decisionLocked, opponentConnected })}>
        <Handshake size={18} />
        <span className="action-label mobile-action-button-label">和棋</span>
      </button>
      <button onClick={onResign} disabled={phase === "finished" || skillLocked}><Flag size={18} /><span className="action-label mobile-action-button-label">认输</span></button>
      {showTestTools && (
        <TestTools
          disabled={phase !== "playing" || skillLocked || !me}
          onRandomLayout={onTestRandomLayout}
          onRestoreSkill={onTestRestoreSkill}
          onEnterByoYomi={onTestEnterByoYomi}
        />
      )}
    </nav>
  );
}

export function areActionBarPropsEqual(previous, next) {
  if (previous.role !== next.role) return false;
  if (previous.role === "spectator") {
    return previous.replayStep === next.replayStep
      && previous.replayMax === next.replayMax
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
    && previous.skillUses === next.skillUses
    && previous.skillAvailable === next.skillAvailable
    && previous.hasAnyStones === next.hasAnyStones
    && previous.opponentConnected === next.opponentConnected
    && previous.scoring === next.scoring
    && previous.showTestTools === next.showTestTools
    && previous.onTestRandomLayout === next.onTestRandomLayout
    && previous.onTestRestoreSkill === next.onTestRestoreSkill
    && previous.onTestEnterByoYomi === next.onTestEnterByoYomi
    && previous.onPass === next.onPass
    && previous.onCountingRequest === next.onCountingRequest
    && previous.onDrawRequest === next.onDrawRequest
    && previous.onConfirmScoring === next.onConfirmScoring
    && previous.onResetScoring === next.onResetScoring
    && previous.onResign === next.onResign;
}

export { canRequestOpponentDecision } from "./actionBar/actionAvailability.js";

export default memo(ActionBar, areActionBarPropsEqual);
