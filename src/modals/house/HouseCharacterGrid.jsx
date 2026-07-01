import { Flag } from "lucide-react";
import { canonicalCharacterId } from "../../shared/characterAliases.js";
import CharacterChainBadge from "../../shared/CharacterChainBadge.jsx";
import { activeCharacterItemEffects, characterCandyPortrait, characterSortieDisabledReason, selectSortieCharacter } from "./houseStats.js";

export default function HouseCharacterGrid({
  audioSettings,
  characters,
  itemEffects,
  owned,
  selectedCharacter,
  user,
  onOpenCharacterDetail,
  onSelectCharacter
}) {
  const emptySlots = Array.from({ length: Math.max(0, 10 - characters.length) }, (_, index) => index);

  return (
    <div className="character-list character-grid-container">
      {characters.map((character) => {
        const characterId = canonicalCharacterId(character.id);
        const hideIntel = characterId === "baconbits" && !owned.has(characterId);
        const disabledReason = characterSortieDisabledReason(characterId, itemEffects);
        const itemEffectBadges = activeCharacterItemEffects(characterId, itemEffects);
        const sortieDisabled = hideIntel || !owned.has(characterId) || Boolean(disabledReason);
        if (hideIntel) {
          return (
            <div
              className="character-card portrait-card unowned hidden-intel-card"
              key={character.id}
              aria-label="暂无情报"
            >
              <span className="locked-portrait lock-text-title">?</span>
              <strong>暂无情报</strong>
              <small>暂不可获取</small>
            </div>
          );
        }
        return (
          <div
            className={`character-card portrait-card ${selectedCharacter === characterId ? "selected is-deployed" : ""} ${owned.has(characterId) ? "" : "unowned"}`}
            key={character.id}
            onClick={() => onOpenCharacterDetail(character)}
            role="button"
            tabIndex={0}
            data-ui-sound="none"
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onOpenCharacterDetail(character);
            }}
          >
            <button
              className={`sortie-button ${selectedCharacter === characterId ? "selected" : ""}`}
              title={disabledReason || (selectedCharacter === characterId ? "出战中" : "设为出战")}
              data-ui-sound="confirm"
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
            {itemEffectBadges.length > 0 && (
              <div className="character-item-effect-badges" aria-label={`${character.name}道具效果`}>
                {itemEffectBadges.map((effect) => (
                  <img
                    key={`${characterId}-${effect.effectKey}`}
                    className="character-item-effect-icon"
                    src={effect.icon}
                    alt={effect.label}
                    title={effect.label}
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
            )}
            <img src={characterCandyPortrait(character, itemEffects)} alt={character.name} />
            <CharacterChainBadge user={user} characterId={characterId} />
            <strong>{character.name}</strong>
          </div>
        );
      })}
      {emptySlots.map((slot) => (
        <div className="character-card portrait-card locked lock-character-card" key={`empty-${slot}`}>
          <span className="locked-portrait lock-text-title text-display-accent">LOCK</span>
          <strong className="text-display-accent">LOADING... (x_x)</strong>
          <small className="text-display-accent">LOCK / LOADING... (x_x)</small>
        </div>
      ))}
    </div>
  );
}
