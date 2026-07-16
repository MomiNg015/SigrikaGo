import { useEffect, useId, useRef, useState } from "react";
import { gameModeById } from "../shared/gameModes.js";
import UserIdentity from "../shared/UserIdentity.jsx";
import { ModalActionButton, ModalDialog } from "./modalComponents.jsx";

export function ConfirmModal({ title, message, confirmText, onConfirm, onCancel }) {
  const titleId = useId();
  const messageId = useId();
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <ModalDialog
        className="confirm-modal"
        ariaLabelledBy={titleId}
        aria-describedby={messageId}
        onClose={onCancel}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId}>{title}</h2>
        <p id={messageId}>{message}</p>
        <div className="inline-actions confirm-actions">
          <ModalActionButton variant="danger" onClick={onConfirm}>{confirmText}</ModalActionButton>
          <ModalActionButton variant="secondary" onClick={onCancel}>取消</ModalActionButton>
        </div>
      </ModalDialog>
    </div>
  );
}

export function Toast({ text, tone = "danger", onClose }) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const id = setTimeout(() => onCloseRef.current(), 3000);
    return () => clearTimeout(id);
  }, []);

  return <div className={`toast ${tone}`}>{text}</div>;
}

export function ToastStack({ toasts, onClose }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          text={toast.text}
          tone={toast.tone}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </div>
  );
}

export function limitToastQueue(toasts, maxToasts = 5) {
  return toasts.slice(0, maxToasts);
}

export function DuelRequestBanner({ request, onAccept, onReject, onTimeout }) {
  const [seconds, setSeconds] = useState(secondsUntilDuelRequestExpires(request.expiresAt, Date.now()));
  const gameMode = gameModeById(request.mode);

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
        <strong>
          <UserIdentity user={request.from} compact />向你申请{gameMode.title}
        </strong>
        <small>{gameMode.rulesText}</small>
        <span>{request.from.rank} · <span className="text-rating-value">{request.from.rating}分</span></span>
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
