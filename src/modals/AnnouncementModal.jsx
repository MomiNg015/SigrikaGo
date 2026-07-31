import { useEffect, useRef, useState } from "react";
import { FileText, Pin, RefreshCw } from "lucide-react";
import { api } from "../api/client.js";
import MarkdownLiteContent from "../shared/MarkdownLiteContent.jsx";
import InformationCenterLayout, { useNarrowInformationCenter } from "./InformationCenterLayout.jsx";
import { ModalActionButton } from "./modalComponents.jsx";

const KINDS = Object.freeze([
  { id: "announcement", label: "\u516c\u544a", mobileEmptyText: "\u6682\u65e0\u516c\u544a" },
  { id: "changelog", label: "\u66f4\u65b0\u65e5\u5fd7", mobileEmptyText: "\u6682\u65e0\u66f4\u65b0\u65e5\u5fd7" }
]);
const PAGE_SIZE = 20;

const TEXT = Object.freeze({
  title: "\u516c\u544a",
  close: "\u5173\u95ed\u516c\u544a\u7a97\u53e3",
  loading: "\u6b63\u5728\u8bfb\u53d6...",
  loadMore: "\u52a0\u8f7d\u66f4\u591a",
  loadingMore: "\u52a0\u8f7d\u4e2d...",
  retry: "\u91cd\u8bd5",
  pinned: "\u7f6e\u9876",
  unread: "\u672a\u8bfb",
  detailLoading: "\u6b63\u5728\u8bfb\u53d6\u8be6\u60c5...",
  lastEdited: "\u6700\u540e\u7f16\u8f91",
  back: "\u8fd4\u56de\u516c\u544a\u5217\u8868",
  empty: "\u8fd9\u91cc\u7a7a\u7a7a\u5982\u4e5f~"
});

function emptyListState() {
  return {
    items: [],
    loaded: false,
    loading: false,
    loadingMore: false,
    error: "",
    loadMoreError: "",
    nextOffset: 0,
    hasMore: false
  };
}

export default function AnnouncementModal({
  token,
  unreadByKind = {},
  onClose,
  onNotice,
  onSummaryChange
}) {
  const isNarrow = useNarrowInformationCenter();
  const [activeKind, setActiveKind] = useState("announcement");
  const activeKindRef = useRef("announcement");
  const [lists, setLists] = useState(() => ({
    announcement: emptyListState(),
    changelog: emptyListState()
  }));
  const [detail, setDetail] = useState({
    open: false,
    loading: false,
    item: null,
    entry: null,
    error: "",
    readError: ""
  });
  const activeMeta = KINDS.find((kind) => kind.id === activeKind) ?? KINDS[0];
  const activeList = lists[activeKind] ?? emptyListState();

  useEffect(() => {
    if (!token) return;
    const state = lists[activeKind] ?? emptyListState();
    if (!state.loaded && !state.loading) {
      loadPage(activeKind, { reset: true });
    }
  }, [activeKind, token]);

  async function loadPage(kind, { reset = false } = {}) {
    if (!token) return;
    const snapshot = lists[kind] ?? emptyListState();
    const offset = reset ? 0 : snapshot.nextOffset;
    setLists((current) => ({
      ...current,
      [kind]: {
        ...(current[kind] ?? emptyListState()),
        loading: reset,
        loadingMore: !reset,
        error: reset ? "" : current[kind]?.error ?? "",
        loadMoreError: ""
      }
    }));
    try {
      const data = await api(`/api/announcements?kind=${encodeURIComponent(kind)}&offset=${offset}&limit=${PAGE_SIZE}`, { token });
      const incomingItems = data.items ?? [];
      setLists((current) => {
        const previous = reset ? emptyListState() : current[kind] ?? emptyListState();
        return {
          ...current,
          [kind]: {
            ...previous,
            items: reset ? incomingItems : [...previous.items, ...incomingItems],
            loaded: true,
            loading: false,
            loadingMore: false,
            error: "",
            loadMoreError: "",
            nextOffset: Number(data.nextOffset ?? offset),
            hasMore: Boolean(data.hasMore)
          }
        };
      });
      if (reset && !isNarrow && kind === activeKindRef.current) {
        if (incomingItems[0]) openDetail(incomingItems[0]);
        else closeDetail();
      }
    } catch (error) {
      setLists((current) => ({
        ...current,
        [kind]: {
          ...(current[kind] ?? emptyListState()),
          loaded: true,
          loading: false,
          loadingMore: false,
          error: reset ? error.message : current[kind]?.error ?? "",
          loadMoreError: reset ? "" : error.message
        }
      }));
      onNotice?.(error.message);
    }
  }

  async function openDetail(item) {
    if (!item || !token) return;
    setDetail({ open: true, loading: true, item, entry: null, error: "", readError: "" });
    try {
      const data = await api(`/api/announcements/${item.id}`, { token });
      const entry = data.entry;
      setDetail((current) => ({ ...current, loading: false, entry, error: "" }));
      try {
        const readData = await api(`/api/announcements/${item.id}/read`, { method: "POST", token });
        markLocalRead(item.id);
        onSummaryChange?.(readData.summary);
      } catch (error) {
        setDetail((current) => ({ ...current, readError: error.message }));
      }
    } catch (error) {
      setDetail((current) => ({ ...current, loading: false, error: error.message }));
    }
  }

  function markLocalRead(itemId) {
    setLists((current) => Object.fromEntries(
      Object.entries(current).map(([kind, state]) => [
        kind,
        {
          ...state,
          items: state.items.map((item) => item.id === itemId ? { ...item, isUnread: false } : item)
        }
      ])
    ));
  }

  function closeDetail() {
    setDetail({
      open: false,
      loading: false,
      item: null,
      entry: null,
      error: "",
      readError: ""
    });
  }

  function selectKind(kind) {
    activeKindRef.current = kind;
    setActiveKind(kind);
    const nextList = lists[kind] ?? emptyListState();
    if (!isNarrow && nextList.loaded && nextList.items[0]) openDetail(nextList.items[0]);
    else closeDetail();
  }

  function handleTabKeyDown(event, index) {
    const keyOffsets = { ArrowLeft: -1, ArrowRight: 1 };
    let nextIndex = index;
    if (event.key in keyOffsets) nextIndex = (index + keyOffsets[event.key] + KINDS.length) % KINDS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = KINDS.length - 1;
    else return;
    event.preventDefault();
    const nextKind = KINDS[nextIndex];
    selectKind(nextKind.id);
    document.getElementById(`announcement-tab-${nextKind.id}`)?.focus();
  }

  const announcementStatus = activeList.loading
    ? TEXT.loading
    : activeList.error || activeList.loadMoreError || detail.error || detail.readError || "";

  return (
    <InformationCenterLayout
      backdropClassName="announcement-backdrop"
      modalClassName="announcement-modal"
      title={TEXT.title}
      titleId="announcement-modal-title"
      closeLabel={TEXT.close}
      backLabel={TEXT.back}
      mobileView={detail.open ? "detail" : "list"}
      onBack={detail.open ? closeDetail : undefined}
      onClose={onClose}
      listLabel="公告与更新日志列表"
      detailLabelledBy={detail.open ? "announcement-detail-title" : undefined}
      list={(
        <>
          <div className="announcement-tabs" role="tablist" aria-label={TEXT.title}>
            {KINDS.map((kind, index) => (
              <button
                key={kind.id}
                id={`announcement-tab-${kind.id}`}
                type="button"
                role="tab"
                aria-selected={activeKind === kind.id}
                aria-controls={`announcement-panel-${kind.id}`}
                tabIndex={activeKind === kind.id ? 0 : -1}
                className={activeKind === kind.id ? "active" : ""}
                onClick={() => selectKind(kind.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                <span>{kind.label}</span>
                {unreadByKind[kind.id] && <i className="announcement-unread-dot" aria-hidden="true" />}
              </button>
            ))}
          </div>

          <section
            className="announcement-list-region"
            id={`announcement-panel-${activeKind}`}
            role="tabpanel"
            aria-labelledby={`announcement-tab-${activeKind}`}
          >
            {activeList.error && (
              <div className="announcement-inline-error">
                <span>{activeList.error}</span>
                <ModalActionButton variant="secondary" type="button" onClick={() => loadPage(activeKind, { reset: true })}>
                  <RefreshCw size={16} />{TEXT.retry}
                </ModalActionButton>
              </div>
            )}
            {activeList.loading && <div className="announcement-empty">{TEXT.loading}</div>}
            {!activeList.loading && activeList.loaded && activeList.items.length === 0 && (
              <div className="announcement-empty">{isNarrow ? activeMeta.mobileEmptyText : TEXT.empty}</div>
            )}
            {activeList.items.length > 0 && (
              <ul className="announcement-list">
                {activeList.items.map((item) => (
                  <li key={item.id}>
                    <button
                      className={`announcement-list-item ${item.isUnread ? "is-unread" : ""} ${detail.item?.id === item.id ? "active" : ""}`}
                      type="button"
                      aria-current={detail.item?.id === item.id ? "true" : undefined}
                      onClick={() => openDetail(item)}
                    >
                      <span className="announcement-list-title">
                        {item.isUnread && <i className="announcement-unread-dot" aria-hidden="true" />}
                        {item.title}
                      </span>
                      <span className="announcement-list-meta">
                        {item.pinned && (
                          <b>
                            <Pin size={13} />{TEXT.pinned}
                          </b>
                        )}
                        {item.isUnread && <b>{TEXT.unread}</b>}
                        <time>{formatDateTime(item.firstPublishedAt)}</time>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {activeList.loadMoreError && (
              <div className="announcement-inline-error">
                <span>{activeList.loadMoreError}</span>
                <ModalActionButton variant="secondary" type="button" onClick={() => loadPage(activeKind)}>
                  <RefreshCw size={16} />{TEXT.retry}
                </ModalActionButton>
              </div>
            )}
            {activeList.hasMore && !activeList.error && (
              <ModalActionButton variant="secondary" className="announcement-load-more" type="button" disabled={activeList.loadingMore} onClick={() => loadPage(activeKind)}>
                {activeList.loadingMore ? TEXT.loadingMore : TEXT.loadMore}
              </ModalActionButton>
            )}
          </section>
          <div className="information-center-status" role="status" aria-live="polite">{announcementStatus}</div>
        </>
      )}
      detail={detail.open ? (
        <article className="announcement-detail">
          <header className="announcement-detail-header">
            <span className="announcement-detail-kind">
              {KINDS.find((kind) => kind.id === (detail.entry?.kind ?? detail.item?.kind))?.label ?? ""}
            </span>
            <h3 id="announcement-detail-title">{detail.entry?.title ?? detail.item?.title ?? TEXT.detailLoading}</h3>
            {detail.entry && (
              <p>
                <time>{formatDateTime(detail.entry.firstPublishedAt)}</time>
                {detail.entry.updatedAt && changedAfterPublish(detail.entry) && (
                  <span>{TEXT.lastEdited}: {formatDateTime(detail.entry.updatedAt)}</span>
                )}
              </p>
            )}
          </header>
          {detail.loading && <div className="announcement-empty announcement-detail-loading">{TEXT.detailLoading}</div>}
          {detail.error && (
            <div className="announcement-inline-error">
              <span>{detail.error}</span>
              <ModalActionButton variant="secondary" type="button" onClick={() => openDetail(detail.item)}>
                <RefreshCw size={16} />{TEXT.retry}
              </ModalActionButton>
            </div>
          )}
          {detail.entry && (
            <MarkdownLiteContent className="information-center-prose announcement-detail-body" value={detail.entry.body} />
          )}
          {detail.readError && <p className="form-error announcement-read-error">{detail.readError}</p>}
        </article>
      ) : (
        <div className="information-center-empty-reader">
          <FileText size={34} aria-hidden="true" />
          <h3>{TEXT.empty}</h3>
        </div>
      )}
    />
  );
}

function changedAfterPublish(entry) {
  if (!entry?.firstPublishedAt || !entry?.updatedAt) return false;
  return Math.abs(new Date(entry.updatedAt).getTime() - new Date(entry.firstPublishedAt).getTime()) > 1000;
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
