import { useEffect, useMemo, useState } from "react";
import { Archive, CheckCircle2, Coins, Gift, MailOpen, Trash2, X } from "lucide-react";
import { api } from "../api/client.js";

export default function MailboxModal({
  token,
  initialLoaded = false,
  initialMessages = [],
  onClose,
  onNotice,
  onSummaryChange,
  onUserChange
}) {
  const [messages, setMessages] = useState(() => sortMailboxMessages(initialMessages));
  const [loaded, setLoaded] = useState(initialLoaded);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(() => sortMailboxMessages(initialMessages)[0]?.id ?? "");
  const [busyId, setBusyId] = useState("");
  const selected = useMemo(
    () => messages.find((message) => message.id === selectedId) ?? messages[0] ?? null,
    [messages, selectedId]
  );
  const listEmptyText = loaded ? "暂无邮件" : "正在读取邮件...";

  async function refresh() {
    if (!token) return;
    setError("");
    try {
      const data = await api("/api/mailbox", { token });
      const nextMessages = sortMailboxMessages(data.messages ?? []);
      setMessages(nextMessages);
      setSelectedId((current) => nextMessages.some((message) => message.id === current) ? current : nextMessages[0]?.id ?? "");
      setLoaded(true);
      onSummaryChange?.();
    } catch (err) {
      setError(err.message);
      setLoaded(true);
    }
  }

  useEffect(() => {
    if (initialLoaded) return;
    refresh();
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
    <div className="modal-backdrop mailbox-backdrop" onClick={onClose}>
      <section className="modal-panel mailbox-modal" onClick={(event) => event.stopPropagation()} aria-label="邮箱">
        <header className="mailbox-header">
          <h2>邮箱</h2>
          <button className="close-button" type="button" aria-label="关闭邮箱" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        {error && <p className="form-error mailbox-error">{error}</p>}
        <div className="mailbox-layout">
          <div className="mailbox-list" role="list">
            {messages.length === 0 && (
              <div className="mailbox-list-empty" role="listitem">
                {listEmptyText}
              </div>
            )}
            {messages.map((message) => (
              <button
                className={`mailbox-list-item ${selected?.id === message.id ? "active" : ""} ${mailboxMessageStateClass(message)}`}
                type="button"
                key={message.id}
                onClick={() => {
                  setSelectedId(message.id);
                  markRead(message);
                }}
              >
                <span className="mailbox-list-title">{message.title}</span>
                <span className="mailbox-list-time">{formatDateTime(message.createdAt)}</span>
                <span className="mailbox-list-status">
                  {!message.isRead && <b>未读</b>}
                  {message.claimable && <b>待领取</b>}
                  {message.isRead && !message.claimable && <b>已完成</b>}
                </span>
              </button>
            ))}
          </div>

          {selected ? (
            <article className="mailbox-detail">
              <div className="mailbox-detail-topline">
                <span className="mailbox-detail-time">{formatDateTime(selected.createdAt)}</span>
                <button
                  className="mailbox-delete-button"
                  type="button"
                  disabled={!selected.deletable || busyId === selected.id}
                  onClick={() => remove(selected)}
                  aria-label={selected.deletable ? "删除邮件" : "请先领取附件"}
                >
                  <Trash2 size={19} />
                </button>
              </div>
              <h3>{selected.title}</h3>
              <p className="mailbox-body">{selected.body}</p>
              <AttachmentView attachment={selected.attachment} claimable={selected.claimable} />
              {hasAttachment(selected.attachment) && (
                <div className="mailbox-actions">
                  <button
                    className="primary-action"
                    type="button"
                    disabled={!selected.claimable || busyId === selected.id}
                    onClick={() => claim(selected)}
                  >
                    {selected.claimable ? <Gift size={18} /> : <CheckCircle2 size={18} />}
                    {selected.claimable ? "领取附件" : "已领取"}
                  </button>
                </div>
              )}
            </article>
          ) : (
            <article className="mailbox-detail mailbox-detail-empty" aria-live="polite">
              <MailOpen size={28} />
              <h3>暂无选中邮件</h3>
            </article>
          )}
        </div>
      </section>
    </div>
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
  if (!hasAttachment(attachment)) {
    return (
      <div className="mailbox-attachment empty">
        <MailOpen size={18} />
        纯文本邮件
      </div>
    );
  }
  const isCoins = attachment.type === "coins";
  return (
    <div className={`mailbox-attachment ${claimable ? "claimable" : "claimed"}`}>
      {isCoins ? <Coins size={18} /> : <Archive size={18} />}
      <span>{attachmentLabel(attachment)}</span>
      <b>{claimable ? "待领取" : "已领取"}</b>
    </div>
  );
}

function hasAttachment(attachment) {
  return attachment?.type && attachment.type !== "none";
}

function attachmentLabel(attachment) {
  if (attachment?.type === "coins") return `${attachment.quantity ?? 0} 金币`;
  if (attachment?.type === "item") return `${attachment.itemId ?? "道具"} x${attachment.quantity ?? 0}`;
  return "无附件";
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
