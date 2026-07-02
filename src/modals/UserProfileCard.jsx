import { useEffect, useState } from "react";
import { ChartNoAxesColumn, CircleAlert, MonitorPlay, Star, ThumbsUp, Trophy, X } from "lucide-react";
import { api } from "../api/client.js";
import { CHARACTERS } from "../shared/characters.js";
import { resolveCandyPortrait } from "../shared/candyPortraits.js";
import CharacterChainBadge from "../shared/CharacterChainBadge.jsx";
import UserIdentity from "../shared/UserIdentity.jsx";
import { findCharacter } from "../shared/characterDisplay.js";
import { modeOrderedEntries, normalizeGameModeId } from "../shared/gameModes.js";
import RecentResultMarkers from "../components/RecentResultMarkers.jsx";
import { ModalActionButton } from "./modalComponents.jsx";
import { ReplayList } from "./ReplayList.jsx";

export function UserProfileCard({
  user,
  characters,
  token,
  onOpenReplay,
  replayDisabled = false,
  onAddFriend,
  onAddBlacklist,
  onNotice
}) {
  const [mode, setMode] = useState(normalizeGameModeId(user.mode));
  const [profileUser, setProfileUser] = useState({ ...user, mode: normalizeGameModeId(user.mode) });
  const mainCharacter = findCharacter(characters, profileUser.characterId) ?? CHARACTERS.sigrika;
  const characterStats = sortCharacterStatsByGames(profileUser.characterStats);
  const [replays, setReplays] = useState([]);
  const [showReplays, setShowReplays] = useState(false);
  const [loadingReplays, setLoadingReplays] = useState(false);
  const [replayError, setReplayError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [loadingProfileMode, setLoadingProfileMode] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportContent, setReportContent] = useState("");
  const [reportPending, setReportPending] = useState(false);
  const recordSummary = splitRecordSummary(profileUser.record);
  const canActOnProfile = profileUser.relation !== "self";
  const canLikeProfile = canActOnProfile && !profileUser.likedToday && !likePending;

  useEffect(() => {
    const nextMode = normalizeGameModeId(user.mode);
    setProfileUser({ ...user, mode: nextMode });
    setMode(nextMode);
    setProfileError("");
    setProfileNotice("");
    setReplays([]);
    setReportContent("");
    setShowReportDialog(false);
  }, [user]);

  function notify(message, tone = "danger") {
    if (onNotice) onNotice(message, tone);
    else if (tone === "success") setProfileNotice(message);
    else setProfileError(message);
  }

  async function changeMode(nextMode) {
    const normalizedMode = normalizeGameModeId(nextMode);
    if (normalizedMode === mode || loadingProfileMode) return;
    const previousMode = mode;
    setMode(normalizedMode);
    setReplays([]);
    setReplayError("");
    setProfileError("");
    setProfileNotice("");
    if (!token || !profileUser.id) return;
    setLoadingProfileMode(true);
    try {
      const data = await api(`/api/users/${profileUser.id}/profile?mode=${encodeURIComponent(normalizedMode)}`, { token });
      setProfileUser({ ...(data.profile ?? profileUser), mode: normalizedMode });
    } catch (error) {
      setMode(previousMode);
      setProfileError(error.message);
    } finally {
      setLoadingProfileMode(false);
    }
  }

  async function openReplays() {
    if (replayDisabled) return;
    setShowReplays(true);
    if (replays.length > 0 || loadingReplays) return;
    setLoadingReplays(true);
    setReplayError("");
    try {
      const data = await api(`/api/users/${profileUser.id}/replays?mode=${encodeURIComponent(mode)}`, { token });
      setReplays(data.records ?? []);
    } catch (error) {
      setReplayError(error.message);
    } finally {
      setLoadingReplays(false);
    }
  }

  async function likeProfile() {
    if (!canLikeProfile || !token) return;
    setLikePending(true);
    setProfileError("");
    setProfileNotice("");
    try {
      const data = await api(`/api/users/${profileUser.id}/like`, { method: "POST", token });
      setProfileUser((current) => ({
        ...current,
        likeCount: data.likeCount ?? current.likeCount ?? 0,
        likedToday: data.likedToday ?? true
      }));
    } catch (error) {
      notify(error.message, "danger");
    } finally {
      setLikePending(false);
    }
  }

  async function submitReport(event) {
    event.preventDefault();
    if (!canActOnProfile || !token || reportPending) return;
    setReportPending(true);
    setProfileError("");
    setProfileNotice("");
    try {
      await api(`/api/users/${profileUser.id}/report`, {
        method: "POST",
        token,
        body: { content: reportContent }
      });
      setShowReportDialog(false);
      setReportContent("");
      notify("举报已提交", "success");
    } catch (error) {
      setProfileError(error.message);
    } finally {
      setReportPending(false);
    }
  }

  return (
    <section className="user-profile-card">
      <div className="profile-resume-hero">
        <span className="profile-chain-portrait">
          <img src={resolveCandyPortrait(mainCharacter, profileUser.itemEffects)} alt={mainCharacter.name} />
          <CharacterChainBadge user={profileUser} characterId={mainCharacter.id} />
        </span>
        <div className="profile-identity-block">
          <h3>
            <UserIdentity user={profileUser} />
          </h3>
        </div>
        <div className="profile-social-actions" aria-label="用户互动">
          <button
            className="profile-like-button"
            type="button"
            title="点赞"
            aria-label={`点赞，当前 ${profileUser.likeCount ?? 0} 次`}
            disabled={!canLikeProfile}
            onClick={likeProfile}
          >
            <ThumbsUp size={17} />
            <span>{profileUser.likeCount ?? 0}</span>
          </button>
          <button
            className="profile-report-button"
            type="button"
            title="举报"
            aria-label="举报用户"
            disabled={!canActOnProfile}
            onClick={() => setShowReportDialog(true)}
          >
            <CircleAlert size={18} />
          </button>
        </div>
      </div>
      <div className="mode-tabs profile-mode-tabs" role="tablist" aria-label="对弈模式">
        {modeOrderedEntries().map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={mode === entry.id}
            className={mode === entry.id ? "active" : ""}
            disabled={loadingProfileMode && mode !== entry.id}
            onClick={() => changeMode(entry.id)}
          >
            {entry.shortTitle}
          </button>
        ))}
      </div>
      {profileError && <p className="room-people-error">{profileError}</p>}
      {profileNotice && <p className="profile-inline-notice">{profileNotice}</p>}
      <div className="profile-resume-stats">
        <span className="profile-record-stat">
          <small><ChartNoAxesColumn size={16} />战绩</small>
          <b className="profile-record-lines">
            <span className="profile-record-total">{recordSummary.total}</span>
            <span className="profile-record-separator"> · </span>
            <span className="profile-record-breakdown">{recordSummary.breakdown}</span>
          </b>
        </span>
        <span><small><Star size={16} />积分</small><b className="text-rating-value">{profileUser.rating}分</b></span>
        <span><small><Trophy size={16} />段位</small><b>{profileUser.rank}</b></span>
      </div>
      <RecentResultMarkers results={profileUser.recentResults} className="profile-rank-results" label="最近十盘的战绩" />
      <div className="profile-resume-section profile-character-section">
        <strong>角色战绩</strong>
        <div className="profile-character-list">
          {characterStats.map((item) => {
            const character = findCharacter(characters, item.characterId) ?? CHARACTERS.sigrika;
            const record = characterRecordColumns(item);
            return (
              <div className="profile-character-row" key={item.characterId}>
                <span className="profile-chain-portrait small">
                  <img src={resolveCandyPortrait(character, profileUser.itemEffects)} alt={character.name} />
                  <CharacterChainBadge user={profileUser} characterId={character.id} />
                </span>
                <span>{character.name}</span>
                <span className="profile-character-total">{record.total}局</span>
                <span className="profile-character-wins">{record.wins}胜</span>
                <span className="profile-character-losses">{record.losses}负</span>
                <span className="profile-character-draws">{record.draws}和</span>
                <b className="profile-character-rate">{record.winRate}</b>
              </div>
            );
          })}
          {characterStats.length === 0 && <p className="quiet-text">暂无角色战绩。</p>}
        </div>
      </div>
      <div className="profile-resume-section">
        <div className="profile-footer-actions">
          <button className="profile-replay-button" type="button" disabled={replayDisabled} onClick={openReplays}>
            <MonitorPlay size={18} />
            对局回放
          </button>
          <div className="profile-relation-actions">
            <button type="button" disabled={profileUser.relation === "self" || profileUser.relation === "friend"} onClick={() => onAddFriend?.(profileUser)}>
              {profileUser.relation === "friend" ? "已是好友" : "加为好友"}
            </button>
            <button type="button" disabled={profileUser.relation === "self" || profileUser.relation === "blacklist"} onClick={() => onAddBlacklist?.(profileUser)}>
              {profileUser.relation === "blacklist" ? "已在黑名单" : "加入黑名单"}
            </button>
          </div>
        </div>
      </div>
      {showReplays && (
        <div className="modal-backdrop profile-modal-backdrop" onClick={() => setShowReplays(false)}>
          <section className="room-floating-modal replay-dialog profile-replay-dialog" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={() => setShowReplays(false)}><X size={18} /></button>
            <h3><UserIdentity user={profileUser} compact showNameplate={false} /> 的对局回放</h3>
            <div className="profile-replay-list-scroll">
              {loadingReplays && <p className="quiet-text">加载中...</p>}
              {replayError && <p className="room-people-error">{replayError}</p>}
              {!loadingReplays && !replayError && (
                <ReplayList records={replays} characters={characters} currentUser={profileUser} onOpenReplay={onOpenReplay} />
              )}
            </div>
          </section>
        </div>
      )}
      {showReportDialog && (
        <div className="modal-backdrop profile-modal-backdrop" onClick={() => setShowReportDialog(false)}>
          <section className="room-floating-modal confirm-inline-modal profile-report-dialog" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" type="button" onClick={() => setShowReportDialog(false)}><X size={18} /></button>
            <form onSubmit={submitReport}>
              <label htmlFor="profile-report-content">举报内容</label>
              <textarea
                id="profile-report-content"
                value={reportContent}
                maxLength={400}
                onChange={(event) => setReportContent(event.target.value)}
                rows={5}
              />
              <small>{reportContent.length}/400</small>
              <div>
                <ModalActionButton variant="danger" type="submit" disabled={reportPending || reportContent.trim().length === 0}>提交</ModalActionButton>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}

export function splitRecordSummary(record = "0局 · 0胜0负0和") {
  const fallback = "0局 · 0胜0负0和";
  const normalized = String(record || fallback).trim();
  const [total, ...rest] = normalized.split(/\s*·\s*/);
  if (rest.length > 0) return { total, breakdown: rest.join(" · ") };

  const compactMatch = normalized.match(/^(\d+\s*局)\s*(.+)$/u);
  if (compactMatch) {
    return { total: compactMatch[1], breakdown: compactMatch[2] };
  }

  return { total: normalized, breakdown: "0胜0负0和" };
}

export function sortCharacterStatsByGames(characterStats = []) {
  return [...(Array.isArray(characterStats) ? characterStats : [])].sort((a, b) => (
    characterStatGames(b) - characterStatGames(a)
      || String(a.characterId ?? "").localeCompare(String(b.characterId ?? ""), "zh-CN")
  ));
}

export function characterRecordColumns(item = {}) {
  const total = finiteRecordNumber(item.total);
  const wins = finiteRecordNumber(item.wins);
  const losses = finiteRecordNumber(item.losses);
  const draws = finiteRecordNumber(item.draws);
  if (total !== null || wins !== null || losses !== null || draws !== null) {
    const normalized = {
      total: total ?? Math.max(0, (wins ?? 0) + (losses ?? 0) + (draws ?? 0)),
      wins: wins ?? 0,
      losses: losses ?? 0,
      draws: draws ?? 0
    };
    return {
      ...normalized,
      winRate: item.winRate ?? winRateText(normalized.wins, normalized.total)
    };
  }

  const compact = String(item.record ?? "").match(/(\d+)\s*\u5c40\s*(?:[\u00b7\u2022]\s*)?(\d+)\s*\u80dc\s*(\d+)\s*\u8d1f\s*(\d+)\s*\u548c/u);
  if (compact) {
    const normalized = {
      total: Number(compact[1]),
      wins: Number(compact[2]),
      losses: Number(compact[3]),
      draws: Number(compact[4])
    };
    return {
      ...normalized,
      winRate: item.winRate ?? winRateText(normalized.wins, normalized.total)
    };
  }

  return { total: 0, wins: 0, losses: 0, draws: 0, winRate: item.winRate ?? "0.0%" };
}

function characterStatGames(item = {}) {
  if (Number.isFinite(item.total)) return item.total;
  const match = String(item.record ?? "").match(/(\d+)\s*局/u);
  return match ? Number(match[1]) : 0;
}

function finiteRecordNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : null;
}

function winRateText(wins, total) {
  return total > 0 ? ((wins / total) * 100).toFixed(1) + "%" : "0.0%";
}

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
