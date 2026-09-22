import { Flag } from "lucide-react";
import { canonicalCharacterId } from "../../shared/characterAliases.js";
import { characterThemeStyle } from "../../shared/characterDisplay.js";
import CharacterChainBadge from "../../shared/CharacterChainBadge.jsx";
import { CorruptionFragmentImage, CorruptionNoise, createCorruptionCadence } from "../../ui/CorruptionMarks.jsx";
import {
  activeCharacterItemEffects,
  characterCandyPortraitProps,
  characterSortieDisabledReason,
  selectSortieCharacter
} from "./houseStats.js";

export default function HouseCharacterGrid({
  audioSettings,
  characters,
  itemEffects,
  owned,
  selectedCharacter,
  user,
  candyEffectCancellationEnabled = false,
  cancellingCandyEffect = "",
  sigrikaCorrupted = false,
  onCancelCandyEffect,
  onOpenCharacterDetail,
  onSelectCharacter
}) {
  const emptySlots = Array.from({ length: Math.max(0, 10 - characters.length) }, (_, index) => index);

  return (
    <div className={`character-list character-grid-container${sigrikaCorrupted ? "" : " handbook-character-grid"}`}>
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
              role="img"
              aria-label="暂无情报"
            >
              <span className="hidden-intel-visual" aria-hidden="true">
                <span className="hidden-intel-brackets" />
                <span className="locked-portrait lock-text-title">?</span>
                <span className="hidden-intel-fragment hidden-intel-fragment-a" />
                <span className="hidden-intel-fragment hidden-intel-fragment-b" />
                <span className="hidden-intel-fragment hidden-intel-fragment-c" />
                <span className="hidden-intel-no-signal">NO SIGNAL</span>
              </span>
              <strong className="hidden-intel-label" aria-hidden="true">暂无情报</strong>
            </div>
          );
        }
        const corruptionFocused = sigrikaCorrupted && characterId === "sigrika";
        const displayName = corruptionFocused ? "西格莉卡？" : character.name;
        const portraitProps = characterCandyPortraitProps(character, itemEffects, user);
        const portraitSrc = portraitProps.src ?? character.portrait;
        const corruptionCadence = sigrikaCorrupted && !corruptionFocused
          ? createCorruptionCadence(`house-card-${characterId}`)
          : null;
        return (
          <div
            className={`character-card portrait-card ${sigrikaCorrupted ? "" : "handbook-character-card"} ${selectedCharacter === characterId ? "selected is-deployed" : ""} ${owned.has(characterId) ? "" : "unowned"} ${sigrikaCorrupted ? "is-corruption-locked" : ""} ${sigrikaCorrupted && characterId !== "sigrika" ? "is-corruption-obscured" : ""} ${corruptionFocused ? "is-corruption-focus" : ""}`}
            key={character.id}
            onClick={() => {
              if (!sigrikaCorrupted) onOpenCharacterDetail(character);
            }}
            role={sigrikaCorrupted ? "img" : "button"}
            aria-label={sigrikaCorrupted ? (corruptionFocused ? "西格莉卡？" : `${character.name}的数据已损坏`) : `${displayName}的角色卡片`}
            tabIndex={sigrikaCorrupted ? -1 : 0}
            data-ui-sound="none"
            style={{ ...characterThemeStyle(character), ...(corruptionCadence ? {
              "--corruption-card-delay": corruptionCadence.cardDelay,
              "--corruption-card-direction": corruptionCadence.cardDirection,
              "--corruption-card-duration": corruptionCadence.cardDuration,
              "--corruption-flash-first-end": corruptionCadence.flashFirstEnd,
              "--corruption-flash-first-start": corruptionCadence.flashFirstStart,
              "--corruption-flash-second-end": corruptionCadence.flashSecondEnd,
              "--corruption-flash-second-start": corruptionCadence.flashSecondStart,
              "--corruption-flash-third-end": corruptionCadence.flashThirdEnd,
              "--corruption-flash-third-start": corruptionCadence.flashThirdStart,
              "--corruption-flash-y-first": corruptionCadence.flashYFirst,
              "--corruption-flash-y-second": corruptionCadence.flashYSecond,
              "--corruption-flash-y-third": corruptionCadence.flashYThird,
              "--corruption-noise-delay": corruptionCadence.noiseDelay,
              "--corruption-noise-direction": corruptionCadence.noiseDirection,
              "--corruption-noise-duration": corruptionCadence.noiseDuration,
              "--corruption-slice-back": corruptionCadence.sliceBack,
              "--corruption-slice-band": corruptionCadence.sliceBand,
              "--corruption-slice-bottom": corruptionCadence.sliceBottom,
              "--corruption-slice-forward": corruptionCadence.sliceForward,
              "--corruption-slice-top": corruptionCadence.sliceTop,
              "--corruption-slice-y": corruptionCadence.sliceY
            } : {}) }}
            onKeyDown={(event) => {
              if (!sigrikaCorrupted && event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                onOpenCharacterDetail(character);
              }
            }}
          >
            {!sigrikaCorrupted && (
              <button
                className={`sortie-button ${selectedCharacter === characterId ? "selected" : ""}`}
                title={disabledReason || (selectedCharacter === characterId ? "出战中" : "设为出战")}
                aria-label={disabledReason || (selectedCharacter === characterId ? "出战中" : `设${displayName}为出战`)}
                data-ui-sound="confirm"
                disabled={sortieDisabled}
                onClick={(event) => {
                  event.stopPropagation();
                  selectSortieCharacter({
                    character,
                    disabled: sortieDisabled,
                    itemEffects,
                    audioSettings,
                    onSelectCharacter
                  });
                }}
              >
                <Flag size={18} />
              </button>
            )}
            {itemEffectBadges.length > 0 && (
              <div
                className={`character-item-effect-badges${candyEffectCancellationEnabled ? " is-interactive" : ""}`}
                aria-label={`${character.name}道具效果`}
              >
                {itemEffectBadges.map((effect) => candyEffectCancellationEnabled ? (
                  <button
                    key={`${characterId}-${effect.effectKey}`}
                    type="button"
                    className="character-item-effect-cancel"
                    aria-label={`取消${character.name}的${effect.label}`}
                    title="点击取消效果（仅开发环境）"
                    disabled={cancellingCandyEffect === characterId}
                    onPointerDown={(event) => event.stopPropagation()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      onCancelCandyEffect?.(characterId);
                    }}
                  >
                    <img className="character-item-effect-icon" src={effect.icon} alt={effect.label} title={effect.label} loading="lazy" decoding="async" />
                  </button>
                ) : (
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
            <img
              {...portraitProps}
              alt={displayName}
              className={sigrikaCorrupted && !corruptionFocused ? "character-corruption-source" : undefined}
              src={portraitSrc}
            />
            {sigrikaCorrupted && !corruptionFocused && (
              <>
                <CorruptionNoise
                  className="character-card-corruption-noise"
                  count={47}
                  seed={`house-card-${characterId}`}
                />
                <CorruptionFragmentImage
                  className="character-data-fragments"
                  seed={`house-${characterId}`}
                  src={portraitSrc}
                />
              </>
            )}
            <CharacterChainBadge user={user} characterId={characterId} />
            <strong>{displayName}</strong>
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
