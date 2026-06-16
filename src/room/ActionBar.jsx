import {
  Calculator,
  Flag,
  Hand,
  Handshake,
  Sparkles,
} from "lucide-react";
import { GAME_PHASES } from "../shared/game.js";
import { canRequestOpponentDecision } from "./actionBar/actionAvailability.js";
import DeadStoneDecisionBar from "./actionBar/DeadStoneDecisionBar.jsx";
import ReplayActionBar from "./actionBar/ReplayActionBar.jsx";
import TestTools from "./actionBar/TestTools.jsx";

export default function ActionBar({
  role,
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
  drawRequest,
  drawDeadline,
  countingDeadline,
  resultDeadline,
  replayStep = 0,
  replayMax = 0,
  showTestTools = false,
  onReplayStep,
  onTestRandomLayout,
  onTestRestoreSkill,
  onTestEnterByoYomi,
  onPass,
  onCountingRequest,
  onCountingRespond,
  onDrawRequest,
  onDrawRespond,
  onConfirmScoring,
  onResetScoring,
  onAcceptResult,
  onRejectResult,
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
  return (
    <nav className="action-bar">
      <button onClick={onPass} disabled={phase !== "playing" || skillLocked}>
        <Hand size={18} />
        <span className="action-label mobile-action-button-label">弃手</span>
      </button>
      <button onClick={onCountingRequest} disabled={!canRequestOpponentDecision({ phase, skillLocked: decisionLocked, hasAnyStones, opponentConnected })}>
        <Calculator size={18} />
        <span className="action-label mobile-action-button-label">数子</span>
      </button>
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

export { canRequestOpponentDecision } from "./actionBar/actionAvailability.js";
