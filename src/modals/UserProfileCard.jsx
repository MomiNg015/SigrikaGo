import { useEffect, useRef, useState } from "react";
import { CircleAlert, MonitorPlay, ThumbsUp, UserPlus, UserRoundX, X } from "lucide-react";
import { api } from "../api/client.js";
import { normalizeGameModeId } from "../shared/gameModes.js";
import { ModalActionButton, ModalDialog } from "./modalComponents.jsx";
import ProfileResumeView, {
  characterRecordColumns,
  orderedProfileModes,
  recordStatsFromUser,
  sortCharacterStatsByGames
} from "./ProfileResumeView.jsx";
import { HouseReplayDialog } from "./house/HouseNestedDialogs.jsx";
import { useReplayPagination } from "./useReplayPagination.js";

export function UserProfileCard({
  user,
  characters,
  token,
  onClose,
  onOpenReplay,
  replayDisabled = false,
  onAddFriend,
  onAddBlacklist,
  onNotice
}) {
  const [mode, setMode] = useState(normalizeGameModeId(user.mode));
  const [profileUser, setProfileUser] = useState({ ...user, mode: normalizeGameModeId(user.mode) });
  const [showReplays, setShowReplays] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [loadingProfileMode, setLoadingProfileMode] = useState(false);
  const [requestedMode, setRequestedMode] = useState("");
  const [failedMode, setFailedMode] = useState("");
  const [likePending, setLikePending] = useState(false);
  const [friendPending, setFriendPending] = useState(false);
  const [blacklistPending, setBlacklistPending] = useState(false);
  const [showBlacklistConfirm, setShowBlacklistConfirm] = useState(false);
  const [blacklistError, setBlacklistError] = useState("");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportContent, setReportContent] = useState("");
  const [reportPending, setReportPending] = useState(false);
  const [reportError, setReportError] = useState("");
  const modeRequestRef = useRef(null);
  const requestSequenceRef = useRef(0);
  const activeUserIdRef = useRef(user.id);
  const canActOnProfile = profileUser.relation !== "self";
  const canLikeProfile = canActOnProfile && !profileUser.likedToday && !likePending;
  const isFriend = profileUser.relation === "friend";
  const isBlacklisted = profileUser.relation === "blacklist";
  const replayPagination = useReplayPagination({
    enabled: showReplays && !replayDisabled,
    endpoint: profileUser.id
      ? `/api/users/${profileUser.id}/replays?mode=${encodeURIComponent(mode)}`
      : "",
    token
  });

  useEffect(() => {
    const nextMode = normalizeGameModeId(user.mode);
    requestSequenceRef.current += 1;
    activeUserIdRef.current = user.id;
    modeRequestRef.current = null;
    setProfileUser({ ...user, mode: nextMode });
    setMode(nextMode);
    setRequestedMode("");
    setFailedMode("");
    setLoadingProfileMode(false);
    setProfileError("");
    setProfileNotice("");
    setShowReplays(false);
    setLikePending(false);
    setFriendPending(false);
    setBlacklistPending(false);
    setReportPending(false);
    setReportContent("");
    setReportError("");
    setShowReportDialog(false);
    setShowBlacklistConfirm(false);
    setBlacklistError("");
  }, [user]);

  function notify(message, tone = "danger") {
    if (onNotice) onNotice(message, tone);
    else if (tone === "success") setProfileNotice(message);
    else setProfileError(message);
  }

  async function changeMode(nextMode) {
    const normalizedMode = normalizeGameModeId(nextMode);
    if (normalizedMode === mode || modeRequestRef.current) return;
    if (!token || !profileUser.id) return;
    const requestedUserId = profileUser.id;
    const sequence = ++requestSequenceRef.current;
    setRequestedMode(normalizedMode);
    setFailedMode("");
    setProfileError("");
    setProfileNotice("");
    setLoadingProfileMode(true);
    const request = api(`/api/users/${requestedUserId}/profile?mode=${encodeURIComponent(normalizedMode)}`, { token });
    modeRequestRef.current = { request, sequence, requestedUserId };
    try {
      const data = await request;
      if (requestSequenceRef.current !== sequence || activeUserIdRef.current !== requestedUserId) return;
      setProfileUser((current) => ({ ...current, ...(data.profile ?? {}), mode: normalizedMode }));
      setMode(normalizedMode);
      setFailedMode("");
    } catch (error) {
      if (requestSequenceRef.current === sequence && activeUserIdRef.current === requestedUserId) {
        setFailedMode(normalizedMode);
        setProfileError(error.message);
      }
    } finally {
      if (modeRequestRef.current?.sequence === sequence) modeRequestRef.current = null;
      if (requestSequenceRef.current === sequence && activeUserIdRef.current === requestedUserId) {
        setLoadingProfileMode(false);
        setRequestedMode("");
      }
    }
  }

  function openReplays() {
    if (!replayDisabled) setShowReplays(true);
  }

  async function likeProfile() {
    if (!canLikeProfile || !token) return;
    const requestedUserId = profileUser.id;
    setLikePending(true);
    setProfileError("");
    setProfileNotice("");
    try {
      const data = await api(`/api/users/${requestedUserId}/like`, { method: "POST", token });
      if (activeUserIdRef.current !== requestedUserId) return;
      setProfileUser((current) => ({
        ...current,
        likeCount: data.likeCount ?? current.likeCount ?? 0,
        likedToday: data.likedToday ?? true
      }));
    } catch (error) {
      if (activeUserIdRef.current === requestedUserId) notify(error.message, "danger");
    } finally {
      if (activeUserIdRef.current === requestedUserId) setLikePending(false);
    }
  }

  async function addFriend() {
    if (!canActOnProfile || isFriend || friendPending || !onAddFriend) return;
    const requestedUserId = profileUser.id;
    setFriendPending(true);
    setProfileError("");
    try {
      await onAddFriend(profileUser);
      if (activeUserIdRef.current !== requestedUserId) return;
      setProfileUser((current) => ({ ...current, relation: "friend" }));
    } catch (error) {
      if (activeUserIdRef.current === requestedUserId) notify(error.message, "danger");
    } finally {
      if (activeUserIdRef.current === requestedUserId) setFriendPending(false);
    }
  }

  async function addBlacklist() {
    if (!canActOnProfile || isBlacklisted || blacklistPending || !onAddBlacklist) return;
    const requestedUserId = profileUser.id;
    setBlacklistPending(true);
    setBlacklistError("");
    try {
      await onAddBlacklist(profileUser);
      if (activeUserIdRef.current !== requestedUserId) return;
      setProfileUser((current) => ({ ...current, relation: "blacklist" }));
      setShowBlacklistConfirm(false);
    } catch (error) {
      if (activeUserIdRef.current === requestedUserId) setBlacklistError(error.message);
    } finally {
      if (activeUserIdRef.current === requestedUserId) setBlacklistPending(false);
    }
  }

  function openBlacklistConfirm() {
    setBlacklistError("");
    setShowBlacklistConfirm(true);
  }

  function closeReportDialog() {
    if (reportPending) return;
    setShowReportDialog(false);
    setReportError("");
  }

  async function submitReport(event) {
    event.preventDefault();
    if (!canActOnProfile || !token || reportPending) return;
    const requestedUserId = profileUser.id;
    setReportPending(true);
    setReportError("");
    setProfileNotice("");
    try {
      await api(`/api/users/${requestedUserId}/report`, {
        method: "POST",
        token,
        body: { content: reportContent }
      });
      if (activeUserIdRef.current !== requestedUserId) return;
      setShowReportDialog(false);
      setReportContent("");
      setReportError("");
      notify("举报已提交", "success");
    } catch (error) {
      if (activeUserIdRef.current === requestedUserId) setReportError(error.message);
    } finally {
      if (activeUserIdRef.current === requestedUserId) setReportPending(false);
    }
  }

  const likeCount = profileUser.likeCount ?? 0;
  const likeLabel = likePending ? `点赞中 ${likeCount}` : profileUser.likedToday ? `已点赞 ${likeCount}` : `点赞 ${likeCount}`;
  const friendLabel = friendPending ? "添加中…" : isFriend ? "已是好友" : "加好友";
  const blacklistLabel = blacklistPending ? "处理中…" : isBlacklisted ? "已在黑名单" : "加入黑名单";

  return (
    <ModalDialog
      className="room-floating-modal user-profile-modal profile-dossier-modal user-profile-card"
      ariaLabelledBy="user-profile-modal-title"
      onClose={onClose}
      onClick={(event) => event.stopPropagation()}
    >
      <header className="profile-modal-header">
        <h2 id="user-profile-modal-title">详细资料</h2>
        <button className="close-button" type="button" onClick={onClose} aria-label="关闭详细资料"><X size={20} /></button>
      </header>

      <ProfileResumeView
        context="social"
        user={profileUser}
        characters={characters}
        mode={mode}
        modePending={loadingProfileMode}
        onModeChange={changeMode}
        stats={{ ...recordStatsFromUser(profileUser), rating: profileUser.rating }}
        recentResults={profileUser.recentResults}
        characterStats={profileUser.characterStats}
        identityActions={(
          <>
            <button
              className="profile-like-button"
              type="button"
              aria-label={likeLabel}
              disabled={!canLikeProfile}
              onClick={likeProfile}
            >
              <ThumbsUp size={18} />
              <span className="profile-like-count" aria-hidden="true">{likeCount}</span>
            </button>
            <button
              className="profile-friend-button"
              type="button"
              aria-label={friendLabel}
              disabled={!canActOnProfile || isFriend || friendPending || !onAddFriend}
              onClick={addFriend}
            >
              <UserPlus size={18} />
            </button>
            <button
              className="profile-blacklist-button"
              type="button"
              aria-label={blacklistLabel}
              disabled={!canActOnProfile || isBlacklisted || blacklistPending || !onAddBlacklist}
              onClick={openBlacklistConfirm}
            >
              <UserRoundX size={18} />
            </button>
            <button
              className="profile-report-button"
              type="button"
              aria-label="举报"
              disabled={!canActOnProfile || reportPending}
              onClick={() => {
                setReportError("");
                setShowReportDialog(true);
              }}
            >
              <CircleAlert size={18} />
            </button>
          </>
        )}
        recentAction={(
          <button className="profile-replay-button" type="button" disabled={replayDisabled} onClick={openReplays}>
            <MonitorPlay size={18} />对局回放
          </button>
        )}
        status={(loadingProfileMode || profileError || profileNotice) ? (
          <div className="profile-mode-feedback">
            {loadingProfileMode && (
              <p className="quiet-text">
                正在载入{profileModeTitle(requestedMode)}战绩，当前仍显示{profileModeTitle(mode)}。
              </p>
            )}
            {profileError && <p className="room-people-error" role="alert">{profileError}</p>}
            {failedMode && (
              <button type="button" className="profile-retry-button" onClick={() => changeMode(failedMode)}>重新加载</button>
            )}
            {profileNotice && <p className="profile-inline-notice">{profileNotice}</p>}
          </div>
        ) : null}
      />

      {showReplays && (
        <HouseReplayDialog
          characterListView={characters}
          currentUser={profileUser}
          onClose={() => setShowReplays(false)}
          onOpenReplay={onOpenReplay}
          pagination={replayPagination}
        />
      )}

      {showReportDialog && (
        <div className="modal-backdrop profile-modal-backdrop" onClick={closeReportDialog}>
          <ModalDialog
            className="room-floating-modal confirm-inline-modal profile-report-dialog"
            ariaLabelledBy="profile-report-title"
            onClose={closeReportDialog}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="close-button" type="button" aria-label="关闭举报窗口" onClick={closeReportDialog}><X size={18} /></button>
            <form onSubmit={submitReport}>
              <h3 id="profile-report-title">举报用户</h3>
              <label htmlFor="profile-report-content">举报内容</label>
              <textarea
                id="profile-report-content"
                value={reportContent}
                maxLength={400}
                onChange={(event) => setReportContent(event.target.value)}
                rows={5}
              />
              <small>{reportContent.length}/400</small>
              {reportError && <p className="profile-dialog-error" role="alert">{reportError}</p>}
              <div>
                <ModalActionButton variant="danger" type="submit" disabled={reportPending || reportContent.trim().length === 0}>
                  {reportPending ? "提交中…" : "提交举报"}
                </ModalActionButton>
              </div>
            </form>
          </ModalDialog>
        </div>
      )}

      {showBlacklistConfirm && (
        <div className="modal-backdrop profile-modal-backdrop" onClick={() => { if (!blacklistPending) setShowBlacklistConfirm(false); }}>
          <ModalDialog
            className="room-floating-modal confirm-inline-modal profile-blacklist-dialog"
            ariaLabelledBy="profile-blacklist-title"
            onClose={() => { if (!blacklistPending) setShowBlacklistConfirm(false); }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-button"
              type="button"
              aria-label="关闭黑名单确认窗口"
              disabled={blacklistPending}
              onClick={() => setShowBlacklistConfirm(false)}
            >
              <X size={18} />
            </button>
            <section className="profile-blacklist-confirm">
              <h3 id="profile-blacklist-title">加入黑名单</h3>
              <p>加入后将限制与该用户的社交互动，确定继续吗？</p>
              {blacklistError && <p className="profile-dialog-error" role="alert">{blacklistError}</p>}
              <div>
                <ModalActionButton variant="danger" type="button" disabled={blacklistPending} onClick={addBlacklist}>
                  {blacklistPending ? "处理中…" : "确认加入"}
                </ModalActionButton>
                <ModalActionButton variant="secondary" type="button" disabled={blacklistPending} onClick={() => setShowBlacklistConfirm(false)}>
                  暂不处理
                </ModalActionButton>
              </div>
            </section>
          </ModalDialog>
        </div>
      )}
    </ModalDialog>
  );
}

function profileModeTitle(mode) {
  return orderedProfileModes().find((entry) => entry.id === mode)?.shortTitle ?? "当前模式";
}

export function splitRecordSummary(record = "0局 · 0胜0负0和") {
  const fallback = "0局 · 0胜0负0和";
  const normalized = String(record || fallback).trim();
  const [total, ...rest] = normalized.split(/\s*·\s*/);
  if (rest.length > 0) return { total, breakdown: rest.join(" · ") };

  const compactMatch = normalized.match(/^(\d+\s*局)\s*(.+)$/u);
  if (compactMatch) return { total: compactMatch[1], breakdown: compactMatch[2] };

  return { total: normalized, breakdown: "0胜0负0和" };
}

export { characterRecordColumns, sortCharacterStatsByGames };

export function ConfirmPanel({ message, confirmText = "确定", cancelText = "返回", onConfirm, onCancel }) {
  return (
    <section className="inline-confirm-panel">
      <p>{message}</p>
      <div>
        <button className="danger-action" type="button" onClick={onConfirm}>{confirmText}</button>
        <button type="button" onClick={onCancel}>{cancelText}</button>
      </div>
    </section>
  );
}
