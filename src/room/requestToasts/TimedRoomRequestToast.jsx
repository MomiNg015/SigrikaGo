import ScoringBreakdown from "../ScoringBreakdown.jsx";

export default function TimedRoomRequestToast({ toast, onAction }) {
  const hasActions = toast.actions?.length > 0;
  return (
    <section className={`room-request-toast ${hasActions ? "actionable" : "passive"}`} role="status" aria-live="polite">
      <div className="room-request-toast-copy">
        <strong>{toast.title}</strong>
        <p>{toast.message}</p>
        {toast.score?.formula && <ScoringBreakdown result={toast.score} compact />}
        {toast.deadline && <TimedRoomRequestProgress deadline={toast.deadline} />}
      </div>
      {hasActions && (
        <div className="room-request-toast-actions">
          {toast.actions.map((action) => (
            <button
              key={action.action}
              type="button"
              className={action.tone}
              disabled={Boolean(toast.pendingAction)}
              onClick={() => onAction(action.action)}
            >
              {toast.pendingAction === action.action ? "处理中" : action.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function TimedRoomRequestProgress({ deadline }) {
  const remainingSeconds = Number.isFinite(deadline)
    ? Math.max(0.1, (deadline - Date.now()) / 1000)
    : 10;

  return (
    <div className="room-request-toast-progress" aria-hidden="true">
      <span key={deadline} style={{ animationDuration: `${remainingSeconds}s` }} />
    </div>
  );
}
