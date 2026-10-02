import { useEffect, useMemo, useState } from "react";
import { Edit3, Eye, RefreshCw, Trash2 } from "lucide-react";
import { adminApi } from "../api/client.js";
import MarkdownLiteContent from "../shared/MarkdownLiteContent.jsx";
import { AdminSectionHeader, AdminStatusPill } from "./adminComponents.jsx";

const KINDS = Object.freeze([
  { id: "announcement", label: "\u516c\u544a" },
  { id: "changelog", label: "\u66f4\u65b0\u65e5\u5fd7" }
]);

const STATUS_FILTERS = Object.freeze([
  { id: "all", label: "\u5168\u90e8" },
  { id: "published", label: "\u5df2\u53d1\u5e03" },
  { id: "draft", label: "\u8349\u7a3f" }
]);

const TEXT = Object.freeze({
  title: "\u516c\u544a\u7ba1\u7406",
  meta: "\u7ba1\u7406\u5927\u5385\u516c\u544a\u4e0e\u66f4\u65b0\u65e5\u5fd7",
  newEntry: "\u65b0\u5efa",
  loading: "\u6b63\u5728\u8bfb\u53d6...",
  empty: "\u6682\u65e0\u5185\u5bb9",
  retry: "\u91cd\u8bd5",
  titleLabel: "\u6807\u9898",
  bodyLabel: "\u5185\u5bb9",
  pinned: "\u7f6e\u9876\u516c\u544a",
  saveDraft: "\u4fdd\u5b58\u8349\u7a3f",
  publish: "\u53d1\u5e03",
  savePublished: "\u4fdd\u5b58\u4fee\u6539",
  unpublish: "\u53d6\u6d88\u53d1\u5e03",
  delete: "\u5220\u9664",
  edit: "\u7f16\u8f91",
  preview: "\u9884\u89c8",
  status: "\u72b6\u6001",
  updatedAt: "\u66f4\u65b0\u65f6\u95f4",
  publishedAt: "\u9996\u6b21\u53d1\u5e03",
  draft: "\u8349\u7a3f",
  published: "\u5df2\u53d1\u5e03",
  confirmTitle: "\u786e\u8ba4\u5220\u9664\u5185\u5bb9\uff1f",
  confirmWarning: "\u5220\u9664\u540e\u4f1a\u4ece\u73a9\u5bb6\u548c\u540e\u53f0\u5217\u8868\u9690\u85cf\uff0c\u76ee\u524d\u6ca1\u6709\u6062\u590d\u5165\u53e3\u3002",
  cancel: "\u53d6\u6d88",
  titleRequired: "\u6807\u9898\u4e0d\u80fd\u4e3a\u7a7a",
  bodyRequired: "\u53d1\u5e03\u65f6\u5185\u5bb9\u4e0d\u80fd\u4e3a\u7a7a",
  saved: "\u5df2\u4fdd\u5b58",
  deleted: "\u5df2\u5220\u9664"
});

const TITLE_MAX_LENGTH = 80;
const BODY_MAX_LENGTH = 10000;

export default function AdminAnnouncements({ token, onNotice }) {
  const [activeKind, setActiveKind] = useState("announcement");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState(() => emptyDraft("announcement"));
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [previewMode, setPreviewMode] = useState("edit");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const activeKindLabel = KINDS.find((kind) => kind.id === activeKind)?.label ?? "";
  const selectedEntry = useMemo(() => entries.find((entry) => entry.id === draft.id) ?? null, [draft.id, entries]);

  useEffect(() => {
    setDraft(emptyDraft(activeKind));
    setFieldError("");
    refresh();
  }, [activeKind, statusFilter, token]);

  async function refresh() {
    if (!token) return;
    setLoading(true);
    try {
      const data = await adminApi(`/announcements?kind=${encodeURIComponent(activeKind)}&status=${encodeURIComponent(statusFilter)}`, token);
      setEntries(data.entries ?? []);
      setLoaded(true);
    } catch (error) {
      onNotice?.(error.message);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  function startNew() {
    setDraft(emptyDraft(activeKind));
    setFieldError("");
    setPreviewMode("edit");
  }

  function editEntry(entry) {
    setDraft({
      id: entry.id,
      kind: entry.kind,
      title: entry.title ?? "",
      body: entry.body ?? "",
      pinned: Boolean(entry.pinned),
      status: entry.status ?? "draft"
    });
    setFieldError("");
    setPreviewMode("edit");
  }

  async function submit(action) {
    const validation = validateDraftForAction(draft, action);
    if (validation) {
      setFieldError(validation);
      return;
    }
    setSubmitting(true);
    setFieldError("");
    try {
      const body = {
        kind: activeKind,
        title: draft.title.trim(),
        body: draft.body.trim(),
        pinned: activeKind === "announcement" && Boolean(draft.pinned),
        action
      };
      const data = draft.id
        ? await adminApi(`/announcements/${draft.id}`, token, { method: "PATCH", body })
        : await adminApi("/announcements", token, { method: "POST", body });
      const nextEntry = data.entry;
      setDraft({
        id: nextEntry.id,
        kind: nextEntry.kind,
        title: nextEntry.title,
        body: nextEntry.body,
        pinned: Boolean(nextEntry.pinned),
        status: nextEntry.status
      });
      onNotice?.(TEXT.saved, "success");
      await refresh();
    } catch (error) {
      setFieldError(error.message);
      onNotice?.(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget?.id) return;
    setSubmitting(true);
    try {
      await adminApi(`/announcements/${deleteTarget.id}`, token, { method: "DELETE" });
      setDeleteTarget(null);
      startNew();
      onNotice?.(TEXT.deleted, "success");
      await refresh();
    } catch (error) {
      onNotice?.(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="admin-announcements">
      <AdminSectionHeader title={TEXT.title} meta={TEXT.meta} actionLabel={`${TEXT.newEntry}${activeKindLabel}`} onAction={startNew}>
        <button className="secondary-action" type="button" onClick={refresh} disabled={loading}>
          <RefreshCw size={16} />{TEXT.retry}
        </button>
      </AdminSectionHeader>

      <div className="admin-announcement-toolbar">
        <div className="segmented-control admin-announcement-kind-tabs" role="tablist" aria-label={TEXT.title}>
          {KINDS.map((kind) => (
            <button key={kind.id} type="button" className={activeKind === kind.id ? "active" : ""} onClick={() => setActiveKind(kind.id)}>
              {kind.label}
            </button>
          ))}
        </div>
        <div className="segmented-control admin-announcement-status-tabs" aria-label={TEXT.status}>
          {STATUS_FILTERS.map((filter) => (
            <button key={filter.id} type="button" className={statusFilter === filter.id ? "active" : ""} onClick={() => setStatusFilter(filter.id)}>
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-announcement-board">
        <section className="admin-card admin-announcement-list-card">
          {!loaded && <p>{TEXT.loading}</p>}
          {loaded && !loading && entries.length === 0 && <p className="admin-table-empty">{TEXT.empty}</p>}
          <div className="admin-announcement-list" role="list">
            {entries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={`admin-announcement-row ${draft.id === entry.id ? "active" : ""}`}
                onClick={() => editEntry(entry)}
              >
                <span>
                  <strong>{entry.title}</strong>
                  <small>{TEXT.updatedAt}: {formatDateTime(entry.updatedAt)}</small>
                </span>
                <span className="admin-announcement-row-meta">
                  <AdminStatusPill tone={entry.isPublished ? "green" : "neutral"}>
                    {entry.isPublished ? TEXT.published : TEXT.draft}
                  </AdminStatusPill>
                  {entry.pinned && <AdminStatusPill tone="blue">{TEXT.pinned}</AdminStatusPill>}
                </span>
              </button>
            ))}
          </div>
        </section>

        <form className="admin-card admin-announcement-editor" onSubmit={(event) => event.preventDefault()}>
          <div className="admin-announcement-editor-heading">
            <div>
              <h3>{draft.id ? draft.title || activeKindLabel : `${TEXT.newEntry}${activeKindLabel}`}</h3>
              {selectedEntry?.firstPublishedAt && <small>{TEXT.publishedAt}: {formatDateTime(selectedEntry.firstPublishedAt)}</small>}
            </div>
            <AdminStatusPill tone={draft.status === "published" ? "green" : "neutral"}>
              {draft.status === "published" ? TEXT.published : TEXT.draft}
            </AdminStatusPill>
          </div>

          <div className="segmented-control admin-announcement-preview-switch">
            <button type="button" className={previewMode === "edit" ? "active" : ""} onClick={() => setPreviewMode("edit")}>
              <Edit3 size={16} />{TEXT.edit}
            </button>
            <button type="button" className={previewMode === "preview" ? "active" : ""} onClick={() => setPreviewMode("preview")}>
              <Eye size={16} />{TEXT.preview}
            </button>
          </div>

          <div className={`admin-announcement-editor-body is-${previewMode}`}>
            <div className="admin-announcement-edit-pane">
              <label>
                {TEXT.titleLabel}
                <input
                  maxLength={TITLE_MAX_LENGTH}
                  value={draft.title}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                />
              </label>
              <label>
                {TEXT.bodyLabel}
                <textarea
                  maxLength={BODY_MAX_LENGTH}
                  rows={14}
                  value={draft.body}
                  onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
                />
              </label>
              {activeKind === "announcement" && (
                <label className="admin-toggle-row admin-announcement-pin-row">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.pinned)}
                    onChange={(event) => setDraft((current) => ({ ...current, pinned: event.target.checked }))}
                  />
                  <span>{TEXT.pinned}</span>
                </label>
              )}
            </div>
            <div className="admin-announcement-preview-pane">
              <article className="admin-announcement-preview">
                <h4>{draft.title || TEXT.titleLabel}</h4>
                <MarkdownLiteContent value={draft.body || ""} />
              </article>
            </div>
          </div>

          {fieldError && <p className="form-error">{fieldError}</p>}

          <div className="inline-actions admin-announcement-actions">
            {draft.status === "published" ? (
              <>
                <button className="primary-action" type="button" disabled={submitting} onClick={() => submit("save-published")}>{TEXT.savePublished}</button>
                <button className="secondary-action" type="button" disabled={submitting} onClick={() => submit("unpublish")}>{TEXT.unpublish}</button>
              </>
            ) : (
              <>
                <button className="secondary-action" type="button" disabled={submitting} onClick={() => submit("save-draft")}>{TEXT.saveDraft}</button>
                <button className="primary-action" type="button" disabled={submitting} onClick={() => submit("publish")}>{TEXT.publish}</button>
              </>
            )}
            {draft.id && (
              <button className="danger-action" type="button" disabled={submitting} onClick={() => setDeleteTarget(selectedEntry ?? draft)}>
                <Trash2 size={16} />{TEXT.delete}
              </button>
            )}
          </div>
        </form>
      </div>

      {deleteTarget && (
        <div className="modal-backdrop admin-announcement-confirm-backdrop" onClick={() => setDeleteTarget(null)}>
          <section className="confirm-modal admin-announcement-confirm" onClick={(event) => event.stopPropagation()}>
            <h2>{TEXT.confirmTitle}</h2>
            <p><strong>{deleteTarget.title}</strong></p>
            <p>{TEXT.confirmWarning}</p>
            <div className="inline-actions confirm-actions">
              <button className="danger-action" type="button" disabled={submitting} onClick={confirmDelete}>{TEXT.delete}</button>
              <button className="secondary-action" type="button" disabled={submitting} onClick={() => setDeleteTarget(null)}>{TEXT.cancel}</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export function validateDraftForAction(draft, action) {
  const title = String(draft?.title ?? "").trim();
  const body = String(draft?.body ?? "").trim();
  if (!title) return TEXT.titleRequired;
  if (["publish", "save-published"].includes(action) && !body) return TEXT.bodyRequired;
  return "";
}

function emptyDraft(kind) {
  return {
    id: "",
    kind,
    title: "",
    body: "",
    pinned: false,
    status: "draft"
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
