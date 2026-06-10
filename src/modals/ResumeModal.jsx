import { useState } from "react";
import { MonitorPlay, X } from "lucide-react";
import { derivePlayerRecordStats } from "../shared/gameRecords.js";
import {
  CharacterRecordsDialog,
  HouseReplayDialog
} from "./house/HouseNestedDialogs.jsx";
import HouseProfileStats from "./house/HouseProfileStats.jsx";
import { deriveCharacterRecordStats } from "./house/houseStats.js";

export default function ResumeModal({ user, records, characterListView, onClose, onOpenReplay }) {
  const [showReplays, setShowReplays] = useState(false);
  const [showCharacterRecords, setShowCharacterRecords] = useState(false);
  const stats = derivePlayerRecordStats(user, records);
  const characterRecords = deriveCharacterRecordStats(user, records, characterListView);
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
        <HouseProfileStats
          coins={user.coins}
          rank={user.rank}
          stats={stats}
          onOpenCharacterRecords={() => setShowCharacterRecords(true)}
        />
        {showReplays && (
          <HouseReplayDialog
            characterListView={characterListView}
            records={records}
            currentUser={user}
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
