import { useState } from "react";
import { X } from "lucide-react";
import { canonicalCharacterId } from "../shared/characterAliases.js";
import { SYSTEM_VOICE_EVENTS } from "../shared/systemVoices.js";
import { playUiDetailOpenSound, stopVoicePlayback } from "../audio/playback.jsx";
import { playSystemVoice } from "../audio/systemVoicePlayback.js";
import HouseCharacterGrid from "./house/HouseCharacterGrid.jsx";
import HouseDecorationPicker from "./house/HouseDecorationPicker.jsx";
import { CharacterDetailDialog } from "./house/HouseNestedDialogs.jsx";

export default function HouseModal({ user, characterListView, audioSettings, musicTracks, onClose, onSelectCharacter, onSelectCharacterMusic, onApplyDecoration }) {
  const [detailCharacter, setDetailCharacter] = useState(null);
  const [applyingDecoration, setApplyingDecoration] = useState("");
  const [decorationError, setDecorationError] = useState("");
  const owned = new Set((user.ownedCharacters ?? []).map(canonicalCharacterId));
  const selectedCharacter = canonicalCharacterId(user.selectedCharacter);
  const itemEffects = user.itemEffects ?? {};
  const detailOwned = detailCharacter ? owned.has(canonicalCharacterId(detailCharacter.id)) : false;

  function openCharacterDetail(character) {
    setDetailCharacter(character);
    playUiDetailOpenSound(audioSettings);
    playCharacterDetailVoice(character);
  }

  function playCharacterDetailVoice(character) {
    playSystemVoice(SYSTEM_VOICE_EVENTS.houseDetail, {
      character,
      audioSettings
    });
  }

  function closeCharacterDetail() {
    stopVoicePlayback();
    setDetailCharacter(null);
  }

  function closeHouseModal() {
    stopVoicePlayback();
    onClose?.();
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
    <div className="modal-backdrop" onClick={closeHouseModal}>
      <section className="house-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={closeHouseModal}><X size={20} /></button>
        <header className="house-header">
          <h2>部员手册</h2>
        </header>
        <HouseCharacterGrid
          audioSettings={audioSettings}
          characters={characterListView}
          itemEffects={itemEffects}
          owned={owned}
          selectedCharacter={selectedCharacter}
          user={user}
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
            musicTracks={musicTracks}
            onSelectCharacterMusic={onSelectCharacterMusic}
            onPlayDetailVoice={() => playCharacterDetailVoice(detailCharacter)}
            onClose={closeCharacterDetail}
          />
        )}
      </section>
    </div>
  );
}

export {
  activeCharacterItemEffects,
  characterCandyPortrait,
  characterSortieDisabledReason,
  deriveCharacterRecordStats,
  playerColorForReplayRecord,
  selectSortieCharacter
} from "./house/houseStats.js";
