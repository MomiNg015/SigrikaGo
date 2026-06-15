import { useState } from "react";
import { Award, CircleDollarSign, Gem, MonitorPlay, Palette, X } from "lucide-react";
import { derivePlayerRecordStats } from "../shared/gameRecords.js";
import { modeOrderedEntries, normalizeGameModeId } from "../shared/gameModes.js";
import { HouseReplayDialog } from "./house/HouseNestedDialogs.jsx";
import HouseProfileStats from "./house/HouseProfileStats.jsx";
import { deriveCharacterRecordStats } from "./house/houseStats.js";

export default function ResumeModal({ user, records, characterListView, onClose, onOpenAchievements, onOpenPersonalization, onOpenReplay }) {
  const [mode, setMode] = useState("spark");
  const [showReplays, setShowReplays] = useState(false);
  const modeRecords = records.filter((record) => normalizeGameModeId(record.mode) === mode);
  const modeUser = userForMode(user, mode);
  const stats = derivePlayerRecordStats(modeUser, modeRecords);
  const characterRecords = deriveCharacterRecordStats(modeUser, modeRecords, characterListView);
  const itemEffects = user.itemEffects ?? {};

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
            <p className="shop-wallet resume-wallet blue-gem-wallet" title="蓝色宝石">
              <Gem size={18} />
              {user.blueGems ?? 0}
            </p>
          </div>
          <button className="close-button resume-close-button" onClick={onClose} aria-label="关闭履历"><X size={20} /></button>
        </header>
        <ModeTabs mode={mode} onModeChange={setMode} />
        <button className="replay-open-button resume-replay-action" onClick={() => setShowReplays(true)}>
          <MonitorPlay size={18} />对局回放
        </button>
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
            records={modeRecords}
            currentUser={modeUser}
            onClose={() => setShowReplays(false)}
            onOpenReplay={onOpenReplay}
          />
        )}
      </section>
    </div>
  );
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
          {entry.title}
        </button>
      ))}
    </div>
  );
}
