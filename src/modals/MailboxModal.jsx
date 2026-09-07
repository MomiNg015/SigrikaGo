import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Archive, Check, Coins, Gift, MailOpen, Ticket, Trash2, X } from "lucide-react";
import { api } from "../api/client.js";
import { RECRUITMENT_ITEM_TYPES, recruitmentItemForType } from "../shared/recruitment.js";
import MarkdownLiteContent from "../shared/MarkdownLiteContent.jsx";
import InformationCenterLayout, { useNarrowInformationCenter } from "./InformationCenterLayout.jsx";
import { ModalActionButton, ModalDialog } from "./modalComponents.jsx";

const EMPTY_TEXT = "这里空空如也~";

export default function MailboxModal({
  token,
  initialLoaded = false,
  initialMessages = [],
  onClose,
  onNotice,
  onSummaryChange,
  onUserChange
}) {
  const isNarrow = useNarrowInformationCenter();
  const [messages, setMessages] = useState(() => sortMailboxMessages(initialMessages));
  const [loaded, setLoaded] = useState(initialLoaded);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(() => isNarrow ? "" : sortMailboxMessages(initialMessages)[0]?.id ?? "");
  const [busyId, setBusyId] = useState("");
  const [detailAttachment, setDetailAttachment] = useState(null);
  const selected = useMemo(
    () => messages.find((message) => message.id === selectedId) ?? null,
    [messages, selectedId]
  );
  const listEmptyText = loaded ? (isNarrow ? "暂无邮件" : EMPTY_TEXT) : "正在读取邮件...";

  async function refresh() {
    if (!token) return;
    setError("");
    try {
      const data = await api("/api/mailbox", { token });
      const nextMessages = sortMailboxMessages(data.messages ?? []);
      setMessages(nextMessages);
      setSelectedId((current) => nextMessages.some((message) => message.id === current)
        ? current
        : isNarrow ? "" : nextMessages[0]?.id ?? "");
      setLoaded(true);
      onSummaryChange?.();
    } catch (err) {
      setError(err.message);
      setLoaded(true);
    }
  }

  useEffect(() => {
    if (initialLoaded && !isNarrow) {
      markRead(messages[0]);
    } else if (!initialLoaded) {
      refresh();
    }
  }, [token]);

  async function runMessageAction(messageId, action) {
    setBusyId(messageId);
    setError("");
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(err.message);
      onNotice?.(err.message);
    } finally {
      setBusyId("");
    }
  }

  async function markRead(message) {
    if (!message || message.isRead || !token) return;
    await runMessageAction(message.id, () => api(`/api/mailbox/${message.id}/read`, { method: "POST", token }));
  }

  async function claim(message) {
    if (!message || !token) return;
    await runMessageAction(message.id, async () => {
      const data = await api(`/api/mailbox/${message.id}/claim`, { method: "POST", token });
      if (data.user) onUserChange?.(data.user);
      onNotice?.("附件已领取", "success");
    });
  }

  async function remove(message) {
    if (!message || !token) return;
    await runMessageAction(message.id, async () => {
      await api(`/api/mailbox/${message.id}`, { method: "DELETE", token });
      onNotice?.("邮件已删除", "success");
    });
  }

  function selectMessage(message) {
    setDetailAttachment(null);
    setSelectedId(message.id);
    markRead(message);
  }

  return (
    <InformationCenterLayout
      backdropClassName="mailbox-backdrop"
      modalClassName="mailbox-modal"
      title="邮箱"
      titleStickerKey="mailbox"
      titleId="mailbox-modal-title"
      closeLabel="关闭邮箱"
      backLabel="返回邮件列表"
      mobileView={selected ? "detail" : "list"}
      onBack={selected ? () => {
        setDetailAttachment(null);
        setSelectedId("");
      } : undefined}
      onClose={onClose}
      listLabel="邮件列表"
      detailLabelledBy={selected ? "mailbox-detail-title" : undefined}
      list={(
        <div className="mailbox-list-region">
          {error && <p className="form-error mailbox-error" role="alert">{error}</p>}
          {messages.length > 0 && (
            <ul className="mailbox-list">
              {messages.map((message) => {
                const sender = displayMailboxSender(message.sender);
                const listTime = formatMailboxListTime(message.createdAt);
                const status = mailboxMessageStatusLabel(message);
                return (
                  <li key={message.id}>
                    <button
                      className={`mailbox-list-item ${selected?.id === message.id ? "active" : ""} ${mailboxMessageStateClass(message)}`}
                      type="button"
                      aria-label={`${message.title}，${sender}，${listTime}，${status}`}
                      aria-current={selected?.id === message.id ? "true" : undefined}
                      onClick={() => selectMessage(message)}
                    >
                      <span className="mailbox-list-title">{message.title}</span>
                      <span className="mailbox-list-meta">
                        <span className="mailbox-list-sender">{sender}</span>
                        <time className="mailbox-list-time" dateTime={message.createdAt}>{listTime}</time>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {messages.length === 0 && (
            <div className="mailbox-list-empty">
              {listEmptyText}
            </div>
          )}
          <div className="information-center-status" role="status" aria-live="polite">
            {!loaded ? listEmptyText : busyId ? "正在处理邮件" : error}
          </div>
        </div>
      )}
      detail={selected ? (
        <article key={selected.id} className="mailbox-detail" aria-busy={busyId === selected.id || undefined}>
          <header className="mailbox-detail-header">
            <div className="mailbox-detail-heading">
              <h3 id="mailbox-detail-title">{selected.title}</h3>
              <p className="mailbox-detail-meta">
                <span>{displayMailboxSender(selected.sender)}</span>
                <time dateTime={selected.createdAt}>{formatDateTime(selected.createdAt)}</time>
              </p>
            </div>
            <button
              className="mailbox-delete-button"
              type="button"
              disabled={!selected.deletable || busyId === selected.id}
              onClick={() => remove(selected)}
              aria-label={selected.deletable ? "删除邮件" : "请先领取附件"}
            >
              <Trash2 size={19} />
            </button>
          </header>
          <MarkdownLiteContent className="information-center-prose mailbox-body" value={selected.body} />
          {hasAttachment(selected.attachment) && (
            <footer className="mailbox-attachment-shelf">
              <AttachmentTile
                attachment={selected.attachment}
                claimable={selected.claimable}
                onOpenDetail={setDetailAttachment}
              />
              <ModalActionButton
                variant="primary"
                className="mailbox-claim-button"
                type="button"
                disabled={!selected.claimable || busyId === selected.id}
                onClick={() => claim(selected)}
              >
                {selected.claimable ? <Gift size={18} /> : <Check size={18} />}
                {selected.claimable ? "领取附件" : "已领取"}
              </ModalActionButton>
            </footer>
          )}
          {detailAttachment && (
            <MailboxItemDetailDialog
              attachment={detailAttachment}
              onClose={() => setDetailAttachment(null)}
            />
          )}
        </article>
      ) : (
        <article className="mailbox-detail mailbox-detail-empty">
          <MailOpen size={28} />
          <h3>{EMPTY_TEXT}</h3>
        </article>
      )}
    />
  );
}

export function mailboxMessageIsDone(message) {
  if (!hasAttachment(message?.attachment)) return Boolean(message?.isRead);
  return Boolean(message?.isRead && !message?.claimable);
}

function mailboxMessageStateClass(message) {
  return mailboxMessageIsDone(message) ? "state-done" : "state-open";
}

function mailboxMessageStatusLabel(message) {
  if (!message?.isRead) return message?.claimable ? "未读，待领取" : "未读";
  return message?.claimable ? "待领取" : "已完成";
}

function sortMailboxMessages(messages) {
  return [...messages].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
}

function AttachmentTile({ attachment, claimable, onOpenDetail }) {
  if (!hasAttachment(attachment)) return null;
  const isCoins = attachment.type === "coins";
  const itemPresentation = isCoins ? null : mailboxAttachmentItemPresentation(attachment);
  const quantity = Math.max(0, Number(attachment.quantity ?? 0) || 0);
  const stateLabel = claimable ? "待领取" : "已领取";
  const content = (
    <>
      <span className="mailbox-attachment-icon" aria-hidden="true">
        {isCoins ? (
          <Coins size={44} />
        ) : itemPresentation.imageUrl ? (
          <img src={itemPresentation.imageUrl} alt="" loading="lazy" decoding="async" />
        ) : itemPresentation.itemId === RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket ? (
          <Ticket size={42} />
        ) : (
          <Archive size={40} />
        )}
        {quantity > 1 && <span className="mailbox-attachment-quantity-badge">{quantity}</span>}
        {!claimable && (
          <span className="mailbox-attachment-claimed-mark">
            <Check size={58} strokeWidth={3.4} />
          </span>
        )}
      </span>
      <span className="mailbox-attachment-caption">{isCoins ? "金币" : itemPresentation.name}</span>
    </>
  );

  if (isCoins) {
    return (
      <div
        className={`mailbox-attachment-tile ${claimable ? "claimable" : "claimed"}`}
        role="img"
        aria-label={`金币附件，数量 ${quantity}，${stateLabel}`}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      className={`mailbox-attachment-tile ${claimable ? "claimable" : "claimed"}`}
      type="button"
      aria-label={`查看道具详情：${itemPresentation.name}，数量 ${quantity}，${stateLabel}`}
      onClick={() => onOpenDetail?.(attachment)}
    >
      {content}
    </button>
  );
}

function MailboxItemDetailDialog({ attachment, onClose }) {
  const item = mailboxAttachmentItemPresentation(attachment);

  function handleBackdropClick(event) {
    event.stopPropagation();
    if (event.target === event.currentTarget) onClose?.();
  }

  if (typeof document === "undefined") return null;
  const dialog = (
    <div className="nested-modal-backdrop mailbox-item-detail-backdrop" onClick={handleBackdropClick}>
      <ModalDialog
        className="nested-modal mailbox-item-detail-modal"
        ariaLabel={`道具详情：${item.name}`}
        onClose={onClose}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="nested-modal-close mailbox-item-detail-close" type="button" onClick={onClose} aria-label="关闭道具详情">
          <X size={20} />
        </button>
        <div className="mailbox-item-detail-art" aria-hidden="true">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" decoding="async" />
          ) : item.itemId === RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket ? (
            <Ticket size={64} />
          ) : (
            <Archive size={60} />
          )}
        </div>
        <div className="mailbox-item-detail-copy">
          <span className="mailbox-item-detail-category">道具</span>
          <h3>{item.name}</h3>
          <p>{item.description || "暂无道具说明。"}</p>
        </div>
      </ModalDialog>
    </div>
  );
  return createPortal(dialog, document.querySelector(".app-shell") ?? document.body);
}

function hasAttachment(attachment) {
  return attachment?.type && attachment.type !== "none";
}

export function mailboxAttachmentItemPresentation(attachment) {
  const itemId = String(attachment?.itemId ?? "").trim();
  const builtinItem = recruitmentItemForType(itemId);
  return {
    itemId,
    name: String(attachment?.itemName ?? builtinItem?.name ?? "").trim() || "道具",
    description: String(attachment?.itemDescription ?? builtinItem?.description ?? "").trim(),
    imageUrl: String(attachment?.imageUrl ?? builtinItem?.imageUrl ?? "").trim()
  };
}

export function formatMailboxListTime(value, now = new Date()) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const nowDate = now instanceof Date ? now : new Date(now);
  const elapsedMs = Math.max(0, nowDate.getTime() - date.getTime());
  const elapsedMinutes = Math.floor(elapsedMs / 60_000);
  if (elapsedMinutes < 1) return "刚刚";
  if (elapsedMinutes < 60) return `${elapsedMinutes}分钟前`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}小时前`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return `${elapsedDays}天前`;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date).replaceAll("-", "/");
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function displayMailboxSender(value) {
  return String(value ?? "").trim() || "系统";
}
