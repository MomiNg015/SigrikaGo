import { useState } from "react";
import { MonitorPlay, X } from "lucide-react";
import { derivePlayerRecordStats } from "../shared/gameRecords.js";
import { modeOrderedEntries, normalizeGameModeId } from "../shared/gameModes.js";
import { rankFromRating } from "../shared/ratingRank.js";
import {
  CharacterRecordsDialog,
  HouseReplayDialog
} from "./house/HouseNestedDialogs.jsx";
import HouseProfileStats from "./house/HouseProfileStats.jsx";
import { deriveCharacterRecordStats } from "./house/houseStats.js";

export default function ResumeModal({ user, records, characterListView, onClose, onOpenReplay }) {
  const [mode, setMode] = useState("spark");
  const [showReplays, setShowReplays] = useState(false);
  const [showCharacterRecords, setShowCharacterRecords] = useState(false);
  const modeRecords = records.filter((record) => normalizeGameModeId(record.mode) === mode);
  const modeUser = userForMode(user, mode);
  const stats = derivePlayerRecordStats(modeUser, modeRecords);
  const characterRecords = deriveCharacterRecordStats(modeUser, modeRecords, characterListView);
  const itemEffects = user.itemEffects ?? {};

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="house-modal resume-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <header className="house-header resume-header">
          <h2>履历</h2>
          <button className="replay-open-button" onClick={() => setShowReplays(true)}>
            <MonitorPlay size={18} />对局回放
          </button>
        </header>
        <ModeTabs mode={mode} onModeChange={setMode} />
        <HouseProfileStats
          coins={user.coins}
          rank={modeUser.rank}
          stats={stats}
          onOpenCharacterRecords={() => setShowCharacterRecords(true)}
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
        {showCharacterRecords && (
          <CharacterRecordsDialog
            characterRecords={characterRecords}
            itemEffects={itemEffects}
            onClose={() => setShowCharacterRecords(false)}
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
    rank: rankFromRating(stats.rating),
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
