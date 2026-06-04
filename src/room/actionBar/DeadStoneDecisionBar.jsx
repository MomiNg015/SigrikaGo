export default function DeadStoneDecisionBar({ userId, scoring, onConfirmScoring, onResetScoring }) {
  const hasParticipant = Boolean(userId);
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
