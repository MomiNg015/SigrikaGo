import { Flag } from "lucide-react";
import { canonicalCharacterId } from "../../shared/characterAliases.js";
import { characterCandyPortrait, characterSortieDisabledReason, selectSortieCharacter } from "./houseStats.js";

export default function HouseCharacterGrid({
  audioSettings,
  characters,
  itemEffects,
  owned,
  selectedCharacter,
  onOpenCharacterDetail,
  onSelectCharacter
}) {
  const emptySlots = Array.from({ length: Math.max(0, 10 - characters.length) }, (_, index) => index);

  return (
    <div className="character-list character-grid-container">
      {characters.map((character) => {
        const characterId = canonicalCharacterId(character.id);
        const disabledReason = characterSortieDisabledReason(characterId, itemEffects);
        const sortieDisabled = !owned.has(characterId) || Boolean(disabledReason);
        return (
          <div
            className={`character-card portrait-card ${selectedCharacter === characterId ? "selected is-deployed" : ""} ${owned.has(characterId) ? "" : "unowned"}`}
            key={character.id}
            onClick={() => onOpenCharacterDetail(character)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onOpenCharacterDetail(character);
            }}
          >
            <button
              className={`sortie-button ${selectedCharacter === characterId ? "selected" : ""}`}
              title={disabledReason || (selectedCharacter === characterId ? "出战中" : "设为出战")}
              disabled={sortieDisabled}
              onClick={(event) => {
                event.stopPropagation();
                selectSortieCharacter({
                  character,
                  disabled: sortieDisabled,
                  audioSettings,
                  onSelectCharacter
                });
              }}
            >
              <Flag size={18} />
            </button>
            <img src={characterCandyPortrait(character, itemEffects)} alt={character.name} />
            {selectedCharacter === characterId && <span className="deploy-tag">[DEPLOYED]</span>}
            <strong>{character.name}</strong>
          </div>
        );
      })}
      {emptySlots.map((slot) => (
        <div className="character-card portrait-card locked lock-character-card" key={`empty-${slot}`}>
          <button className="sortie-button" disabled title="未获得">
            <Flag size={18} />
          </button>
          <span className="locked-portrait lock-text-title">LOCK</span>
          <strong>LOADING... (x_x)</strong>
          <small>LOCK / LOADING... (x_x)</small>
        </div>
      ))}
    </div>
  );
}
