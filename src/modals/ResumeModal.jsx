import { useEffect, useMemo, useState } from "react";
import { Award, CircleDollarSign, MonitorPlay, Palette, X } from "lucide-react";
import { api } from "../api/client.js";
import { findCharacter } from "../shared/characterDisplay.js";
import { modeOrderedEntries, normalizeGameModeId } from "../shared/gameModes.js";
import { HouseReplayDialog } from "./house/HouseNestedDialogs.jsx";
import HouseProfileStats from "./house/HouseProfileStats.jsx";
import { useReplayPagination } from "./useReplayPagination.js";

export default function ResumeModal({ user, token, characterListView, onClose, onOpenAchievements, onOpenPersonalization, onOpenReplay }) {
  const [mode, setMode] = useState("spark");
  const [showReplays, setShowReplays] = useState(false);
  const [profileResult, setProfileResult] = useState({ key: "", profile: null });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const profileKey = `${user.id}:${mode}`;
  const profile = profileResult.key === profileKey ? profileResult.profile : null;
  const modeUser = profile ?? userForMode(user, mode);
  const stats = profile?.recordStats
    ? { ...profile.recordStats, rating: profile.rating }
    : modeRecordStats(user, mode);
  const characterRecords = useMemo(() => profileCharacterRecords(
    profile?.characterStats,
    characterListView
  ), [characterListView, profile?.characterStats]);
  const itemEffects = user.itemEffects ?? {};
  const replayPagination = useReplayPagination({
    enabled: showReplays,
    endpoint: `/api/replays?mode=${encodeURIComponent(mode)}`,
    token
  });

  useEffect(() => {
    if (!token || !user.id) return undefined;
    let active = true;
    setProfileLoading(true);
    setProfileError("");
    api(`/api/users/${user.id}/profile?mode=${encodeURIComponent(mode)}`, { token })
      .then((data) => {
        if (active) setProfileResult({ key: profileKey, profile: data.profile ?? null });
      })
      .catch((error) => {
        if (active) setProfileError(error.message);
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mode, profileKey, token, user.id]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="house-modal resume-modal" onClick={(event) => event.stopPropagation()}>
        <header className="house-header resume-header">
          <h2>履历</h2>
          <div className="resume-title-actions">
            <button type="button" className="resume-mini-action achievement-entry-action" onClick={onOpenAchievements}>
              <Award size={16} />成就
            </button>
            <button type="button" className="resume-mini-action personalization-entry-action" onClick={onOpenPersonalization}>
              <Palette size={16} />个性化
            </button>
          </div>
          <div className="resume-header-actions">
            <p
              className="shop-wallet resume-wallet"
              title="金币：每胜一局+50，负一局+20，和棋或无效对局不获得金币。"
            >
              <CircleDollarSign size={18} />
              {user.coins}
            </p>
          </div>
          <button className="close-button resume-close-button" onClick={onClose} aria-label="关闭履历"><X size={20} /></button>
        </header>
        <ModeTabs mode={mode} onModeChange={setMode} />
        <button className="replay-open-button resume-replay-action" onClick={() => setShowReplays(true)}>
          <MonitorPlay size={18} />对局回放
        </button>
        {profileLoading && <p className="quiet-text resume-profile-status">正在同步真实战绩...</p>}
        {profileError && <p className="room-people-error resume-profile-status">{profileError}</p>}
        <HouseProfileStats
          rank={modeUser.rank}
          stats={stats}
          recentResults={modeUser.recentResults}
          characterRecords={characterRecords}
          itemEffects={itemEffects}
        />
        {showReplays && (
          <HouseReplayDialog
            characterListView={characterListView}
            currentUser={modeUser}
            onClose={() => setShowReplays(false)}
            onOpenReplay={onOpenReplay}
            pagination={replayPagination}
          />
        )}
      </section>
    </div>
  );
}

function modeRecordStats(user, mode) {
  const stats = user.modeStats?.[mode] ?? {};
  const wins = Number(stats.wins ?? 0);
  const losses = Number(stats.losses ?? 0);
  const draws = Number(stats.draws ?? 0);
  return {
    totalGames: wins + losses + draws,
    wins,
    losses,
    draws,
    rating: Number(stats.rating ?? user.rating ?? 1000)
  };
}

function profileCharacterRecords(characterStats = [], characters = []) {
  return [...(Array.isArray(characterStats) ? characterStats : [])]
    .sort((a, b) => Number(b.total ?? 0) - Number(a.total ?? 0))
    .map((entry) => {
      const character = findCharacter(characters, entry.characterId);
      return character ? { ...entry, character } : null;
    })
    .filter(Boolean);
}

function userForMode(user, mode) {
  const stats = user.modeStats?.[mode];
  if (!stats) return user;
  return {
    ...user,
    rating: stats.rating,
    rank: stats.rank ?? user.rank ?? "3段",
    recentResults: stats.recentResults ?? [],
    wins: stats.wins,
    losses: stats.losses
  };
}

function ModeTabs({ mode, onModeChange }) {
  return (
    <div className="mode-tabs" role="tablist" aria-label="对弈模式">
      {modeOrderedEntries().map((entry) => (
        <button
          key={entry.id}
          type="button"
          role="tab"
          aria-selected={mode === entry.id}
          className={mode === entry.id ? "active" : ""}
          onClick={() => onModeChange(entry.id)}
        >
          {entry.shortTitle}
        </button>
      ))}
    </div>
  );
}
