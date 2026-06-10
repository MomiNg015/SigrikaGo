import { useState } from "react";
import {
  MonitorPlay,
  X
} from "lucide-react";
import { canonicalCharacterId } from "../shared/characterAliases.js";
import { derivePlayerRecordStats } from "../shared/gameRecords.js";
import { SYSTEM_VOICE_EVENTS } from "../shared/systemVoices.js";
import { playSystemVoice } from "../audio/systemVoicePlayback.js";
import HouseCharacterGrid from "./house/HouseCharacterGrid.jsx";
import HouseDecorationPicker from "./house/HouseDecorationPicker.jsx";
import {
  CharacterDetailDialog,
  CharacterRecordsDialog,
  HouseReplayDialog
} from "./house/HouseNestedDialogs.jsx";
import HouseProfileStats from "./house/HouseProfileStats.jsx";
import { deriveCharacterRecordStats } from "./house/houseStats.js";

export default function HouseModal({ user, records, characterListView, audioSettings, onClose, onSelectCharacter, onSelectCharacterMusic, onApplyDecoration, onOpenReplay }) {
  const [detailCharacter, setDetailCharacter] = useState(null);
  const [showReplays, setShowReplays] = useState(false);
  const [showCharacterRecords, setShowCharacterRecords] = useState(false);
  const [applyingDecoration, setApplyingDecoration] = useState("");
  const [decorationError, setDecorationError] = useState("");
  const stats = derivePlayerRecordStats(user, records);
  const characterRecords = deriveCharacterRecordStats(user, records, characterListView);
  const owned = new Set((user.ownedCharacters ?? []).map(canonicalCharacterId));
  const selectedCharacter = canonicalCharacterId(user.selectedCharacter);
  const itemEffects = user.itemEffects ?? {};
  const detailOwned = detailCharacter ? owned.has(canonicalCharacterId(detailCharacter.id)) : false;

  function openCharacterDetail(character) {
    setDetailCharacter(character);
    playSystemVoice(SYSTEM_VOICE_EVENTS.houseDetail, {
      character,
      audioSettings
    });
  }

  async function applyDecoration(decorationId) {
    setDecorationError("");
    setApplyingDecoration(decorationId || "default");
    try {
      await onApplyDecoration(decorationId);
    } catch (error) {
      setDecorationError(error.message);
    } finally {
      setApplyingDecoration("");
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="house-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <header className="house-header">
          <h2>部员手册</h2>
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
        <HouseCharacterGrid
          audioSettings={audioSettings}
          characters={characterListView}
          itemEffects={itemEffects}
          owned={owned}
          selectedCharacter={selectedCharacter}
          onOpenCharacterDetail={openCharacterDetail}
          onSelectCharacter={onSelectCharacter}
        />
        <HouseDecorationPicker
          applyingDecoration={applyingDecoration}
          decorationError={decorationError}
          ownedDecorations={user.ownedDecorations ?? []}
          selectedStoneDecoration={user.selectedStoneDecoration}
          onApplyDecoration={applyDecoration}
        />
        {detailCharacter && (
          <CharacterDetailDialog
            character={detailCharacter}
            detailOwned={detailOwned}
            itemEffects={itemEffects}
            user={user}
            audioSettings={audioSettings}
            onSelectCharacterMusic={onSelectCharacterMusic}
            onClose={() => setDetailCharacter(null)}
          />
        )}
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

export {
  characterCandyPortrait,
  characterSortieDisabledReason,
  deriveCharacterRecordStats,
  playerColorForReplayRecord,
  selectSortieCharacter
} from "./house/houseStats.js";
