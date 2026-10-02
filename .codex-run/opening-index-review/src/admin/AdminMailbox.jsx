import React, { useEffect, useMemo, useState } from "react";
import { adminApi } from "../api/client.js";
import { AdminActionButton, AdminTableScroll } from "./adminComponents.jsx";

const TARGET_MODES = [
  { id: "user", label: "指定用户" },
  { id: "all_current", label: "当前全体" },
  { id: "all_with_future", label: "包含未来用户" }
];

const ATTACHMENT_TYPES = [
  { id: "none", label: "无附件" },
  { id: "coins", label: "金币" },
  { id: "item", label: "道具" }
];

const EMPTY_DRAFT = {
  targetMode: "user",
  recipientUserId: "",
  sender: "",
  title: "",
  body: "",
  attachmentType: "none",
  attachmentItemId: "",
  attachmentQuantity: "1"
};

export default function AdminMailbox({
  token,
  initialLoaded = false,
  initialBatches = [],
  initialDraft = EMPTY_DRAFT,
  shopItems = [],
  onNotice
}) {
  const [batches, setBatches] = useState(initialBatches);
  const [draft, setDraft] = useState(initialDraft);
  const [loaded, setLoaded] = useState(initialLoaded);
  const [submitting, setSubmitting] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const itemOptions = useMemo(() => shopItems.filter((item) => item.category === "item"), [shopItems]);

  async function refresh() {
    if (!token) return;
    try {
      const data = await adminApi("/mailbox/batches", token);
      setBatches(data.batches ?? []);
      setLoaded(true);
    } catch (error) {
      onNotice?.(error.message);
      setLoaded(true);
    }
  }

  useEffect(() => {
    if (initialLoaded) return;
    refresh();
  }, [token]);

  useEffect(() => {
    if (!initialLoaded) return;
    setBatches(initialBatches);
    setLoaded(true);
  }, [initialLoaded, initialBatches]);

  async function searchUsers() {
    if (!token || !userQuery.trim()) {
      setUserResults([]);
      return;
    }
    try {
      const data = await adminApi(`/mailbox/users?q=${encodeURIComponent(userQuery.trim())}`, token);
      setUserResults(data.users ?? []);
    } catch (error) {
      onNotice?.(error.message);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        ...draft,
        attachmentQuantity: Number(draft.attachmentQuantity || 0)
      };
      if (body.attachmentType !== "item") body.attachmentItemId = "";
      const data = await adminApi("/mailbox/batches", token, { method: "POST", body });
      setLastResult(data);
      setDraft(EMPTY_DRAFT);
      onNotice?.(`邮件发送完成：成功 ${data.batch?.deliveredCount ?? 0}，跳过 ${data.batch?.skippedCount ?? 0}`, "success");
      await refresh();
    } catch (error) {
      onNotice?.(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="admin-mailbox">
      <form className="admin-card admin-mailbox-compose" onSubmit={submit}>
        <h3>发送邮件</h3>
        <div className="segmented-control admin-mailbox-targets">
          {TARGET_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={draft.targetMode === mode.id ? "active" : ""}
              onClick={() => updateDraft("targetMode", mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {draft.targetMode === "user" && (
          <div className="admin-mailbox-user-search">
            <label>
              用户名搜索
              <input value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder="输入用户名" />
            </label>
            <AdminActionButton variant="secondary" type="button" onClick={searchUsers}>搜索</AdminActionButton>
            <div className="admin-mailbox-user-results">
              {userResults.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className={draft.recipientUserId === user.id ? "active" : ""}
                  onClick={() => updateDraft("recipientUserId", user.id)}
                >
                  <span>{user.username}</span>
                  <small>{user.status}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        <label>
          发件人
          <input
            value={draft.sender}
            required
            maxLength={40}
            onChange={(event) => updateDraft("sender", event.target.value)}
          />
        </label>
        <label>
          标题
          <input value={draft.title} maxLength={40} onChange={(event) => updateDraft("title", event.target.value)} />
        </label>
        <label>
          正文
          <textarea rows={5} maxLength={500} value={draft.body} onChange={(event) => updateDraft("body", event.target.value)} />
        </label>
        <div className="admin-mailbox-attachment-grid">
          <label>
            附件类型
            <select value={draft.attachmentType} onChange={(event) => updateDraft("attachmentType", event.target.value)}>
              {ATTACHMENT_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
            </select>
          </label>
          {draft.attachmentType === "item" && (
            <label>
              道具
              <select value={draft.attachmentItemId} onChange={(event) => updateDraft("attachmentItemId", event.target.value)}>
                <option value="">选择道具</option>
                {itemOptions.map((item) => (
                  <option key={item.targetId} value={item.targetId}>{item.name}</option>
                ))}
              </select>
            </label>
          )}
          {draft.attachmentType !== "none" && (
            <label>
              数量
              <input type="number" min="1" value={draft.attachmentQuantity} onChange={(event) => updateDraft("attachmentQuantity", event.target.value)} />
            </label>
          )}
        </div>
        <AdminActionButton variant="primary" type="submit" disabled={submitting}>
          {submitting ? "发送中..." : "发送邮件"}
        </AdminActionButton>
        {lastResult?.batch && (
          <p className="admin-success">成功 {lastResult.batch.deliveredCount}，跳过 {lastResult.batch.skippedCount}</p>
        )}
      </form>

      <section className="admin-card admin-mailbox-history">
        <h3>最近发送历史</h3>
        {!loaded && <p>正在读取...</p>}
        {loaded && batches.length === 0 && <p>暂无发送记录</p>}
        {loaded && batches.length > 0 && (
          <AdminTableScroll>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>发件人</th>
                  <th>标题</th>
                  <th>范围</th>
                  <th>附件</th>
                  <th>结果</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id}>
                    <td>{formatDateTime(batch.createdAt)}</td>
                    <td>{batch.sender}</td>
                    <td>{batch.title}</td>
                    <td>{targetModeLabel(batch.targetMode)}{batch.includeFutureUsers ? " · 未来用户" : ""}</td>
                    <td>{attachmentLabel(batch.attachment)}</td>
                    <td>成功 {batch.deliveredCount} · 跳过 {batch.skippedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableScroll>
        )}
      </section>
    </section>
  );
}

function targetModeLabel(mode) {
  return TARGET_MODES.find((item) => item.id === mode)?.label ?? mode;
}

function attachmentLabel(attachment) {
  if (!attachment || attachment.type === "none") return "无附件";
  if (attachment.type === "coins") return `${attachment.quantity ?? 0} 金币`;
  if (attachment.type === "item") return `${attachment.itemId ?? "道具"} x${attachment.quantity ?? 0}`;
  return "未知附件";
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
