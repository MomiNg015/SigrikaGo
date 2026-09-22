import { useEffect, useId, useState } from "react";
import WindowTitleSticker from "./WindowTitleSticker.jsx";
import WindowBookmarkTabs from "./WindowBookmarkTabs.jsx";
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
  const [handbookTab, setHandbookTab] = useState("characters");
  const handbookId = useId();
  const [showCostumes, setShowCostumes] = useState(false);
  const [costumes, setCostumes] = useState([]);
  const [costumesLoading, setCostumesLoading] = useState(false);
  const [equippingCostumeId, setEquippingCostumeId] = useState("");
  const [applyingDecoration, setApplyingDecoration] = useState("");
  const [decorationError, setDecorationError] = useState("");
  const [cancellingCandyEffect, setCancellingCandyEffect] = useState("");
  const owned = new Set((user.ownedCharacters ?? []).map(canonicalCharacterId));
  const selectedCharacter = canonicalCharacterId(user.selectedCharacter);
  const itemEffects = user.itemEffects ?? {};
  const detailOwned = detailCharacter ? owned.has(canonicalCharacterId(detailCharacter.id)) : false;
  const sigrikaCorrupted = Boolean(user.sigrikaCandyArc?.corrupted);
  const activeTab = sigrikaCorrupted ? "characters" : handbookTab;

  function handleTabKeyDown(event) {
    const tabs = [...event.currentTarget.querySelectorAll('[role="tab"]')];
    const index = tabs.indexOf(event.target);
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
      : event.key === "ArrowDown" ? (index + 1) % tabs.length
        : event.key === "ArrowUp" ? (index + tabs.length - 1) % tabs.length : -1;
    if (next < 0) return;
    event.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  }

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

  async function cancelCandyEffect(characterId) {
    if (!import.meta.env.DEV || sigrikaCorrupted || cancellingCandyEffect) return;
    setCancellingCandyEffect(characterId);
    try {
      const data = await api(`/api/items/rainbow-bean-candy/effects/${characterId}/cancel`, {
        method: "POST",
        token
      });
      onUserChange?.(data.user);
      onNotice?.("已取消该角色的糖果效果（仅开发环境）", "success");
    } catch (error) {
      onNotice?.(error.message, "danger");
    } finally {
      setCancellingCandyEffect("");
    }
  }

  const characterGrid = (
    <HouseCharacterGrid
      audioSettings={audioSettings}
      characters={characterListView}
      itemEffects={itemEffects}
      owned={owned}
      selectedCharacter={selectedCharacter}
      user={user}
      candyEffectCancellationEnabled={import.meta.env.DEV && !sigrikaCorrupted}
      cancellingCandyEffect={cancellingCandyEffect}
      sigrikaCorrupted={sigrikaCorrupted}
      onCancelCandyEffect={cancelCandyEffect}
      onOpenCharacterDetail={openCharacterDetail}
      onSelectCharacter={onSelectCharacter}
    />
  );

  return (
    <div className={`modal-backdrop ${sigrikaCorrupted ? "sigrika-corruption-house-backdrop" : ""}`} onClick={closeHouseModal}>
      <section className={`house-modal ${sigrikaCorrupted ? "is-sigrika-corrupted" : "window-sticker-host window-bookmark-host handbook-modal"}`} onClick={(event) => event.stopPropagation()}>
        {!sigrikaCorrupted && <div className="handbook-open-art" aria-hidden="true" />}
        <button className="close-button" aria-label="关闭部员手册" onClick={closeHouseModal}><X size={20} /></button>
        <header className="house-header window-sticker-header">
          <WindowTitleSticker titleKey="handbook" enabled={!sigrikaCorrupted} />
        </header>
        {!sigrikaCorrupted && <WindowBookmarkTabs className="handbook-tabs" aria-label="部员手册分类" onKeyDown={handleTabKeyDown}>
          {[["characters", "角色"], ["decorations", "装饰"]].map(([id, label]) => (
            <button key={id} type="button" role="tab" id={`${handbookId}-${id}-tab`}
              aria-controls={`${handbookId}-${id}-panel`} aria-selected={activeTab === id}
              tabIndex={activeTab === id ? 0 : -1} onClick={() => setHandbookTab(id)}>
              {label}
            </button>
          ))}
        </WindowBookmarkTabs>}
        {sigrikaCorrupted ? characterGrid : (
          <div className="handbook-pages">
            <div className="handbook-page" role="tabpanel"
              id={`${handbookId}-characters-panel`} aria-labelledby={`${handbookId}-characters-tab`}
              hidden={activeTab !== "characters"} tabIndex={0}>
              {characterGrid}
            </div>
            <div className="handbook-page" role="tabpanel"
              id={`${handbookId}-decorations-panel`} aria-labelledby={`${handbookId}-decorations-tab`}
              hidden={activeTab !== "decorations"} tabIndex={0}>
              <HouseDecorationPicker
                applyingDecoration={applyingDecoration}
                decorationError={decorationError}
                ownedDecorations={user.ownedDecorations ?? []}
                selectedStoneDecoration={user.selectedStoneDecoration}
                onApplyDecoration={applyDecoration}
              />
            </div>
          </div>
        )}
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
