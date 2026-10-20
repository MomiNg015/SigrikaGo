import RankProgress from "../shared/RankProgress.jsx";
import { useEffect, useId, useRef, useState } from "react";
import { gameModeById } from "../shared/gameModes.js";
import UserIdentity from "../shared/UserIdentity.jsx";
import { ModalActionButton, ModalDialog } from "./modalComponents.jsx";

export function ConfirmModal({ title, message, confirmText, atmosphere, onConfirm, onCancel }) {
  const titleId = useId();
  const messageId = useId();
  const isSigrikaDuel = atmosphere === "sigrika-duel";
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <ModalDialog
        className={`confirm-modal ${isSigrikaDuel ? "sigrika-duel-confirm-modal" : ""}`.trim()}
        ariaLabelledBy={titleId}
        aria-describedby={messageId}
        onClose={onCancel}
        onClick={(event) => event.stopPropagation()}
      >
        {isSigrikaDuel && <span className="sigrika-duel-modal-atmosphere" aria-hidden="true" />}
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
  const remainingRef = useRef(2600);
  const [exiting, setExiting] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;
  const appearance = TOAST_APPEARANCES[tone] || TOAST_APPEARANCES.danger;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (paused || exiting) return undefined;
    const startedAt = Date.now();
    const exitId = setTimeout(() => setExiting(true), remainingRef.current);
    return () => {
      clearTimeout(exitId);
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAt));
    };
  }, [paused, exiting]);

  useEffect(() => {
    if (!exiting) return undefined;
    const closeId = setTimeout(() => onCloseRef.current(), 400);
    return () => clearTimeout(closeId);
  }, [exiting]);

  return (
    <div
      className={`toast ${appearance.tone}`}
      data-exiting={exiting || undefined}
      data-paused={paused || exiting || undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <span className="toast-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d={appearance.icon} />
        </svg>
      </span>
      <div className="toast-copy">
        <strong className="toast-title">{appearance.title}</strong>
        <p className="toast-message">{text}</p>
      </div>
      <button className="toast-close" type="button" aria-label="关闭提示" data-ui-sound="none" disabled={exiting} onClick={() => setExiting(true)}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8" /></svg>
      </button>
      <span className="toast-lifetime" aria-hidden="true"><span /></span>
    </div>
  );
}

const TOAST_APPEARANCES = {
  success: { tone: "success", title: "操作成功", icon: "m5 12 4 4L19 6" },
  warning: { tone: "warning", title: "温馨提醒", icon: "M12 8v5m0 3h.01M10.3 4.5 2.5 18a1 1 0 0 0 .9 1.5h17.2a1 1 0 0 0 .9-1.5L13.7 4.5a2 2 0 0 0-3.4 0Z" },
  danger: { tone: "danger", title: "操作未完成", icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-4 5 8 8m0-8-8 8" },
  error: { tone: "danger", title: "操作未完成", icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-4 5 8 8m0-8-8 8" },
  info: { tone: "info", title: "消息提示", icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 8v6m0-10h.01" },
  mail: { tone: "mail", title: "收到来信", icon: "M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm-2 1 9 7 9-7" },
  achievement: { tone: "achievement", title: "成就达成", icon: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" }
};

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
        <RankProgress {...request.from} />
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
