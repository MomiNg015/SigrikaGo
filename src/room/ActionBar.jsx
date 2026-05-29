import {
  DoorOpen,
  Flag,
  MonitorPlay,
  RotateCcw,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  StepBack,
  StepForward,
  Timer
} from "lucide-react";
import { GAME_PHASES } from "../shared/game.js";
import ScoringBreakdown from "./ScoringBreakdown.jsx";

export default function ActionBar({
  role,
  phase,
  me,
  isMyTurn,
  pendingSkill,
  setPendingSkill,
  skillLocked = false,
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
  onResign,
  onBack
}) {
  if (role === "spectator") {
    return (
      <nav className="action-bar">
        <button title="回到第0手" onClick={() => onReplayStep?.(0)} disabled={!onReplayStep || replayStep <= 0}>
          <SkipBack size={20} />
        </button>
        <button title="上一手" onClick={() => onReplayStep?.(Math.max(0, replayStep - 1))} disabled={!onReplayStep || replayStep <= 0}>
          <StepBack size={20} />
        </button>
        <span className="replay-step-indicator"><MonitorPlay size={16} />{replayStep}/{replayMax}</span>
        <button title="下一手" onClick={() => onReplayStep?.(Math.min(replayMax, replayStep + 1))} disabled={!onReplayStep || replayStep >= replayMax}>
          <StepForward size={20} />
        </button>
        <button title="跳到最新一手" onClick={() => onReplayStep?.(replayMax)} disabled={!onReplayStep || replayStep >= replayMax}>
          <SkipForward size={20} />
        </button>
        <button className="exit-action" onClick={onBack}><DoorOpen size={18} />退出房间</button>
      </nav>
    );
  }
  const hasDecision =
    (phase === GAME_PHASES.drawRequested && drawRequest) ||
    (phase === GAME_PHASES.countingRequested && scoring) ||
    (phase === GAME_PHASES.markingDead && scoring) ||
    (phase === GAME_PHASES.resultReview && scoring);
  if (hasDecision) {
    return (
      <DecisionBar
        phase={phase}
        userId={me?.user?.id}
        scoring={scoring}
        drawRequest={drawRequest}
        drawDeadline={drawDeadline}
        countingDeadline={countingDeadline}
        resultDeadline={resultDeadline}
        onCountingRespond={onCountingRespond}
        onDrawRespond={onDrawRespond}
        onConfirmScoring={onConfirmScoring}
        onResetScoring={onResetScoring}
        onAcceptResult={onAcceptResult}
        onRejectResult={onRejectResult}
      />
    );
  }
  return (
    <nav className="action-bar">
      <button onClick={onPass} disabled={phase !== "playing" || skillLocked}>弃一手</button>
      <button onClick={onCountingRequest} disabled={!canRequestOpponentDecision({ phase, skillLocked, hasAnyStones, opponentConnected })}>申请数子</button>
      <button
        className={`skill-action ${pendingSkill ? "active" : ""} ${skillUses <= 0 ? "spent" : ""}`}
        onClick={() => setPendingSkill(!pendingSkill)}
        disabled={!me || phase !== "playing" || !isMyTurn || skillLocked || skillUses <= 0 || !skillAvailable}
      >
        <Sparkles size={20} />技能 · {skillUses}
      </button>
      <button onClick={onDrawRequest} disabled={!canRequestOpponentDecision({ phase, skillLocked, opponentConnected })}>申请和棋</button>
      <button onClick={onResign} disabled={phase === "finished" || skillLocked}><Flag size={18} />认输</button>
      {showTestTools && (
        <TestTools
          disabled={phase !== "playing" || skillLocked || !me}
          onRandomLayout={onTestRandomLayout}
          onRestoreSkill={onTestRestoreSkill}
          onEnterByoYomi={onTestEnterByoYomi}
        />
      )}
      <button className="exit-action" onClick={onBack}><DoorOpen size={18} />退出房间</button>
    </nav>
  );
}

export function canRequestOpponentDecision({ phase, skillLocked = false, hasAnyStones = true, opponentConnected = true } = {}) {
  return phase === GAME_PHASES.playing && !skillLocked && hasAnyStones && opponentConnected !== false;
}

function DecisionBar({ phase, userId, scoring, drawRequest, drawDeadline, countingDeadline, resultDeadline, onCountingRespond, onDrawRespond, onConfirmScoring, onResetScoring, onAcceptResult, onRejectResult }) {
  const hasParticipant = Boolean(userId);
  if (phase === GAME_PHASES.drawRequested && drawRequest) {
    const isRequester = hasParticipant && drawRequest.requestedBy === userId;
    const canRespond = hasParticipant && !isRequester;
    return (
      <nav className={`action-bar decision-bar ${isRequester ? "waiting" : ""}`} aria-live="polite">
        <div className="decision-copy">
          <strong>和棋申请</strong>
          <span>{isRequester ? "等待对方确认和棋。" : hasParticipant ? "对方申请和棋，是否同意？" : "和棋申请确认中。"}</span>
          <DecisionProgress deadline={drawDeadline} fallbackSeconds={10} />
        </div>
        {!canRespond ? (
          <span className="decision-waiting">等待中</span>
        ) : (
          <div className="decision-actions">
            <button onClick={() => onDrawRespond?.(true)}>同意</button>
            <button onClick={() => onDrawRespond?.(false)}>不同意</button>
          </div>
        )}
      </nav>
    );
  }

  if (phase === GAME_PHASES.countingRequested && scoring) {
    const isRequester = hasParticipant && scoring.requestedBy === userId;
    const canRespond = hasParticipant && !isRequester;
    return (
      <nav className={`action-bar decision-bar ${isRequester ? "waiting" : ""}`} aria-live="polite">
        <div className="decision-copy">
          <strong>数子申请</strong>
          <span>{isRequester ? "等待对方确认数子。" : hasParticipant ? "对方申请数子，是否同意？" : "数子申请确认中。"}</span>
          <DecisionProgress deadline={countingDeadline} fallbackSeconds={30} />
        </div>
        {!canRespond ? (
          <span className="decision-waiting">等待中</span>
        ) : (
          <div className="decision-actions">
            <button onClick={() => onCountingRespond?.(true)}>同意</button>
            <button onClick={() => onCountingRespond?.(false)}>不同意</button>
          </div>
        )}
      </nav>
    );
  }

  if (phase === GAME_PHASES.markingDead && scoring) {
    const confirmed = hasParticipant && scoring.confirmedBy?.includes(userId);
    return (
      <nav className={`action-bar decision-bar ${!hasParticipant || confirmed ? "waiting" : ""}`} aria-live="polite">
        <div className="decision-copy">
          <strong>确认死子</strong>
          <span>{!hasParticipant ? "死子确认进行中。" : confirmed ? "你已确认，等待双方完成确认。" : "确认当前死子标记，或重新确认。"}</span>
        </div>
        {!hasParticipant ? (
          <span className="decision-waiting">等待中</span>
        ) : (
          <div className="decision-actions">
            <button onClick={onConfirmScoring} disabled={confirmed}>{confirmed ? "已确认" : "确认死子"}</button>
            <button className="secondary-action" onClick={onResetScoring}>重新确认</button>
          </div>
        )}
      </nav>
    );
  }

  if (phase === GAME_PHASES.resultReview && scoring) {
    const accepted = hasParticipant && scoring.resultAcceptedBy?.includes(userId);
    return (
      <nav className={`action-bar decision-bar ${!hasParticipant || accepted ? "waiting" : ""}`} aria-live="polite">
        <div className="decision-copy">
          <strong>{scoring.result?.text ?? "结果确认"}</strong>
          <span>请核对数子计算过程，确认无误后同意结果。</span>
          <ScoringBreakdown result={scoring.result} />
          <DecisionProgress deadline={resultDeadline ?? scoring.resultDeadline} fallbackSeconds={30} />
        </div>
        {!hasParticipant ? (
          <span className="decision-waiting">等待中</span>
        ) : (
          <div className="decision-actions">
            <button onClick={onAcceptResult} disabled={accepted}>{accepted ? "已同意" : "同意结果"}</button>
            <button onClick={onRejectResult}>不同意</button>
          </div>
        )}
      </nav>
    );
  }

  return null;
}

function DecisionProgress({ deadline, fallbackSeconds }) {
  const remainingSeconds = Number.isFinite(deadline)
    ? Math.max(0.1, (deadline - Date.now()) / 1000)
    : fallbackSeconds;

  return (
    <div className="decision-progress" aria-hidden="true">
      <span key={deadline ?? fallbackSeconds} style={{ animationDuration: `${remainingSeconds}s` }} />
    </div>
  );
}

function TestTools({ disabled, onRandomLayout, onRestoreSkill, onEnterByoYomi }) {
  return (
    <span className="test-tools" aria-label="测试工具">
      <button title="随机布局" onClick={onRandomLayout} disabled={disabled}>
        <Shuffle size={18} />随机布局
      </button>
      <button title="恢复技能" onClick={onRestoreSkill} disabled={disabled}>
        <RotateCcw size={18} />恢复技能
      </button>
      <button title="进入读秒" onClick={onEnterByoYomi} disabled={disabled}>
        <Timer size={18} />进入读秒
      </button>
    </span>
  );
}
