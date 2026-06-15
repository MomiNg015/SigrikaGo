import { useEffect, useState } from "react";
import { ChartNoAxesColumn, MonitorPlay, Star, Trophy, X } from "lucide-react";
import { api } from "../api/client.js";
import { CHARACTERS } from "../shared/characters.js";
import { resolveCandyPortrait } from "../shared/candyPortraits.js";
import CharacterChainBadge from "../shared/CharacterChainBadge.jsx";
import UserIdentity from "../shared/UserIdentity.jsx";
import { findCharacter } from "../shared/characterDisplay.js";
import { modeOrderedEntries, normalizeGameModeId } from "../shared/gameModes.js";
import RecentResultMarkers from "../components/RecentResultMarkers.jsx";
import { ReplayList } from "./ReplayList.jsx";

export function UserProfileCard({
  user,
  characters,
  token,
  onOpenReplay,
  replayDisabled = false,
  onAddFriend,
  onAddBlacklist
}) {
  const [mode, setMode] = useState(normalizeGameModeId(user.mode));
  const [profileUser, setProfileUser] = useState({ ...user, mode: normalizeGameModeId(user.mode) });
  const mainCharacter = findCharacter(characters, profileUser.characterId) ?? CHARACTERS.sigrika;
  const characterStats = profileUser.characterStats ?? [];
  const [replays, setReplays] = useState([]);
  const [showReplays, setShowReplays] = useState(false);
  const [loadingReplays, setLoadingReplays] = useState(false);
  const [replayError, setReplayError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [loadingProfileMode, setLoadingProfileMode] = useState(false);
  const recordSummary = splitRecordSummary(profileUser.record);

  useEffect(() => {
    const nextMode = normalizeGameModeId(user.mode);
    setProfileUser({ ...user, mode: nextMode });
    setMode(nextMode);
    setProfileError("");
    setReplays([]);
  }, [user]);

  async function changeMode(nextMode) {
    const normalizedMode = normalizeGameModeId(nextMode);
    if (normalizedMode === mode || loadingProfileMode) return;
    const previousMode = mode;
    setMode(normalizedMode);
    setReplays([]);
    setReplayError("");
    setProfileError("");
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

  return (
    <section className="user-profile-card">
      <div className="profile-resume-hero">
        <span className="profile-chain-portrait">
          <img src={resolveCandyPortrait(mainCharacter, profileUser.itemEffects)} alt={mainCharacter.name} />
          <CharacterChainBadge user={profileUser} characterId={mainCharacter.id} />
        </span>
        <div>
          <h3>
            <UserIdentity user={profileUser} />
          </h3>
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
            {entry.title}
          </button>
        ))}
      </div>
      {profileError && <p className="room-people-error">{profileError}</p>}
      <div className="profile-resume-stats">
        <span className="profile-record-stat">
          <small><ChartNoAxesColumn size={16} />战绩</small>
          <b className="profile-record-lines">
            <span className="profile-record-total">{recordSummary.total}</span>
            <span className="profile-record-separator"> · </span>
            <span className="profile-record-breakdown">{recordSummary.breakdown}</span>
          </b>
        </span>
        <span><small><Star size={16} />积分</small><b>{profileUser.rating}分</b></span>
        <span><small><Trophy size={16} />段位</small><b>{profileUser.rank}</b></span>
      </div>
      <RecentResultMarkers results={profileUser.recentResults} className="profile-rank-results" />
      <div className="profile-resume-section profile-character-section">
        <strong>角色战绩</strong>
        <div className="profile-character-list">
          {characterStats.map((item) => {
            const character = findCharacter(characters, item.characterId) ?? CHARACTERS.sigrika;
            return (
              <div className="profile-character-row" key={item.characterId}>
                <span className="profile-chain-portrait small">
                  <img src={resolveCandyPortrait(character, profileUser.itemEffects)} alt={character.name} />
                  <CharacterChainBadge user={profileUser} characterId={character.id} />
                </span>
                <span>{character.name}</span>
                <span>{item.record}</span>
                <b>{item.winRate}</b>
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
