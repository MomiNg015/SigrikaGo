import { useEffect, useMemo, useState } from "react";
import { Archive, CheckCircle2, Coins, Gift, MailOpen, Ticket, Trash2 } from "lucide-react";
import { api } from "../api/client.js";
import { RECRUITMENT_ITEM_TYPES, recruitmentItemForType } from "../shared/recruitment.js";
import MarkdownLiteContent from "../shared/MarkdownLiteContent.jsx";
import InformationCenterLayout, { useNarrowInformationCenter } from "./InformationCenterLayout.jsx";
import { ModalActionButton } from "./modalComponents.jsx";

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

  return (
    <InformationCenterLayout
      backdropClassName="mailbox-backdrop"
      modalClassName="mailbox-modal"
      title="邮箱"
      titleId="mailbox-modal-title"
      closeLabel="关闭邮箱"
      backLabel="返回邮件列表"
      mobileView={selected ? "detail" : "list"}
      onBack={selected ? () => setSelectedId("") : undefined}
      onClose={onClose}
      listLabel="邮件列表"
      detailLabelledBy={selected ? "mailbox-detail-title" : undefined}
      list={(
        <div className="mailbox-list-region">
          {error && <p className="form-error mailbox-error" role="alert">{error}</p>}
          {messages.length > 0 && (
            <ul className="mailbox-list">
              {messages.map((message) => (
                <li key={message.id}>
                  <button
                    className={`mailbox-list-item ${selected?.id === message.id ? "active" : ""} ${mailboxMessageStateClass(message)}`}
                    type="button"
                    aria-current={selected?.id === message.id ? "true" : undefined}
                    onClick={() => {
                      setSelectedId(message.id);
                      markRead(message);
                    }}
                  >
                    <span className="mailbox-list-title">
                      {!message.isRead && <i className="mailbox-unread-dot" aria-hidden="true" />}
                      {message.title}
                    </span>
                    <span className="mailbox-list-time">发件人：{displayMailboxSender(message.sender)}</span>
                    <span className="mailbox-list-time">{formatDateTime(message.createdAt)}</span>
                    <span className="mailbox-list-status">
                      {!message.isRead && <b>未读</b>}
                      {message.claimable && <b>待领取</b>}
                      {message.isRead && !message.claimable && <b>已完成</b>}
                    </span>
                  </button>
                </li>
              ))}
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
        <article className="mailbox-detail" aria-busy={busyId === selected.id || undefined}>
          <header className="mailbox-detail-header">
            <div className="mailbox-detail-heading">
              <h3 id="mailbox-detail-title">{selected.title}</h3>
              <p className="mailbox-detail-meta">
                <span>发件人：{displayMailboxSender(selected.sender)}</span>
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
              <span className="mailbox-attachment-label">附件</span>
              <AttachmentView attachment={selected.attachment} claimable={selected.claimable} />
              <ModalActionButton
                variant="primary"
                className="mailbox-claim-button"
                type="button"
                disabled={!selected.claimable || busyId === selected.id}
                onClick={() => claim(selected)}
              >
                {selected.claimable ? <Gift size={18} /> : <CheckCircle2 size={18} />}
                {selected.claimable ? "领取附件" : "已领取"}
              </ModalActionButton>
            </footer>
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

function mailboxMessageStateClass(message) {
  if (!message.isRead) return "state-new";
  if (message.claimable) return "state-claimable";
  return "state-done";
}

function sortMailboxMessages(messages) {
  return [...messages].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
}

function AttachmentView({ attachment, claimable }) {
  if (!hasAttachment(attachment)) return null;
  const isCoins = attachment.type === "coins";
  const itemPresentation = isCoins ? null : mailboxAttachmentItemPresentation(attachment);
  return (
    <div className={`mailbox-attachment ${claimable ? "claimable" : "claimed"}`}>
      {isCoins ? (
        <Coins size={18} />
      ) : (
        <span className="mailbox-attachment-item-art" aria-hidden="true">
          {itemPresentation.imageUrl ? (
            <img src={itemPresentation.imageUrl} alt="" loading="lazy" decoding="async" />
          ) : itemPresentation.itemId === RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket ? (
            <Ticket size={30} />
          ) : (
            <Archive size={28} />
          )}
        </span>
      )}
      <span className="mailbox-attachment-name">
        {isCoins ? `${attachment.quantity ?? 0} 金币` : itemPresentation.name}
      </span>
      {!isCoins && <span className="mailbox-attachment-quantity">x{attachment.quantity ?? 0}</span>}
      <b>{claimable ? "待领取" : "已领取"}</b>
    </div>
  );
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
    imageUrl: String(attachment?.imageUrl ?? builtinItem?.imageUrl ?? "").trim()
  };
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
