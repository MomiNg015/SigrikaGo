import { useEffect, useState } from "react";

export function ConfirmModal({ title, message, confirmText, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <section className="confirm-modal" onClick={(event) => event.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="inline-actions confirm-actions">
          <button className="danger-action" onClick={onConfirm}>{confirmText}</button>
          <button className="secondary-action" onClick={onCancel}>取消</button>
        </div>
      </section>
    </div>
  );
}

export function Toast({ text, tone = "danger", onClose }) {
  useEffect(() => {
    const id = setTimeout(onClose, 3000);
    return () => clearTimeout(id);
  }, [onClose]);

  return <div className={`toast ${tone}`}>{text}</div>;
}

export function DuelRequestBanner({ request, onAccept, onReject, onTimeout }) {
  const [seconds, setSeconds] = useState(secondsUntilDuelRequestExpires(request.expiresAt, Date.now()));

  useEffect(() => {
    setSeconds(secondsUntilDuelRequestExpires(request.expiresAt, Date.now()));
  }, [request.requestId, request.expiresAt]);

  useEffect(() => {
    if (seconds <= 0) {
      onTimeout();
      return undefined;
    }
    const timer = setTimeout(() => setSeconds((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, onTimeout]);

  return (
    <div className="duel-request-banner">
      <div>
        <strong>{request.from.username}向你申请对局</strong>
        <span>{request.from.rank} · {request.from.rating}分</span>
      </div>
      <div className="duel-request-actions">
        <button className="agree" type="button" onClick={onAccept}>同意</button>
        <button className="reject" type="button" onClick={onReject}>不同意</button>
      </div>
      <i style={{ "--duel-progress": duelProgressPercent(seconds) }} />
      <b>{seconds}s</b>
    </div>
  );
}

export function secondsUntilDuelRequestExpires(expiresAt, now) {
  return Math.max(0, Math.ceil((expiresAt - now) / 1000));
}

export function duelProgressPercent(seconds, duration = 20) {
  const percent = Math.max(0, Math.min(100, (seconds / duration) * 100));
  return `${percent}%`;
}
