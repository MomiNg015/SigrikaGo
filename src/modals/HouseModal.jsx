import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "../api/client.js";
import { canonicalCharacterId } from "../shared/characterAliases.js";
import { SYSTEM_VOICE_EVENTS } from "../shared/systemVoices.js";
import { playUiDetailOpenSound, stopVoicePlayback } from "../audio/playback.jsx";
import { playSystemVoice } from "../audio/systemVoicePlayback.js";
import HouseCharacterGrid from "./house/HouseCharacterGrid.jsx";
import HouseDecorationPicker from "./house/HouseDecorationPicker.jsx";
import { CharacterDetailDialog } from "./house/HouseNestedDialogs.jsx";
import CharacterCostumeDialog from "./house/CharacterCostumeDialog.jsx";

export default function HouseModal({ token, user, characterListView, audioSettings, musicTracks, onClose, onSelectCharacter, onSelectCharacterMusic, onApplyDecoration, onUserChange, onNotice }) {
  const [detailCharacter, setDetailCharacter] = useState(null);
  const [showCostumes, setShowCostumes] = useState(false);
  const [costumes, setCostumes] = useState([]);
  const [costumesLoading, setCostumesLoading] = useState(false);
  const [equippingCostumeId, setEquippingCostumeId] = useState("");
  const [applyingDecoration, setApplyingDecoration] = useState("");
  const [decorationError, setDecorationError] = useState("");
  const owned = new Set((user.ownedCharacters ?? []).map(canonicalCharacterId));
  const selectedCharacter = canonicalCharacterId(user.selectedCharacter);
  const itemEffects = user.itemEffects ?? {};
  const detailOwned = detailCharacter ? owned.has(canonicalCharacterId(detailCharacter.id)) : false;

  useEffect(() => {
    let alive = true;
    if (!token || !user?.id) return undefined;
    setCostumesLoading(true);
    api("/api/costumes", { token })
      .then((data) => {
        if (alive) setCostumes(data.costumes ?? []);
      })
      .catch((error) => {
        if (alive) onNotice?.(error.message, "danger");
      })
      .finally(() => {
        if (alive) setCostumesLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [onNotice, token, user?.id]);

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
    setShowCostumes(false);
    setDetailCharacter(null);
  }

  async function equipCostume(costume) {
    if (!detailCharacter) return;
    setEquippingCostumeId(costume.id);
    try {
      const data = await api("/api/costumes/equip", {
        method: "POST",
        token,
        body: {
          characterSlug: canonicalCharacterId(detailCharacter.id),
          costumeId: costume.id
        }
      });
      onUserChange?.(data.user);
      setCostumes((current) => current.map((entry) => ({
        ...entry,
        equipped: entry.characterSlug === data.characterSlug ? entry.id === data.costumeId : entry.equipped
      })));
      onNotice?.(`已装扮${costume.name}`, "success");
    } catch (error) {
      onNotice?.(error.message, "danger");
    } finally {
      setEquippingCostumeId("");
    }
  }

  function closeHouseModal() {
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
            onOpenCostumes={() => setShowCostumes(true)}
            onPlayDetailVoice={() => playCharacterDetailVoice(detailCharacter)}
            onClose={closeCharacterDetail}
          />
        )}
        {detailCharacter && showCostumes && (
          <CharacterCostumeDialog
            character={detailCharacter}
            characterOwned={detailOwned}
            costumes={costumes}
            loading={costumesLoading}
            equippingId={equippingCostumeId}
            user={user}
            onEquip={equipCostume}
            onClose={() => setShowCostumes(false)}
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
