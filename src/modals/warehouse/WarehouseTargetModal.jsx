import { UserRound, X } from "lucide-react";
import { resolveCharacterPortrait } from "../../shared/characterPortraits.js";
import { canonicalCharacterId } from "../../shared/characterAliases.js";
import {
  RAINBOW_BEAN_CANDY_ID,
  RAINBOW_BEAN_CANDY_TARGET_RULES
} from "../../shared/rainbowBeanCandy.js";

export default function WarehouseTargetModal({
  characters,
  ownedCharacters,
  targetItem,
  targetResult,
  user,
  onClose,
  onUseItem
}) {
  if (!targetItem && !targetResult) return null;

  return (
    <div className="modal-backdrop nested-backdrop" onClick={onClose}>
      <section className="character-target-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose}><X size={18} /></button>
        {warehouseTargetState(targetResult).isResolved ? (
          <WarehouseEffectResult targetState={targetResult} characters={characters} user={user} />
        ) : (
          <>
            <h2>选择角色</h2>
            <div className="warehouse-character-grid">
              {ownedCharacters.map((character) => {
                const targetAvailability = warehouseCharacterTargetAvailability({
                  character,
                  item: targetItem,
                  itemEffects: user?.itemEffects
                });
                return (
                  <button
                    key={character.id}
                    type="button"
                    className={targetAvailability.disabled ? "warehouse-target-disabled" : ""}
                    disabled={targetAvailability.disabled}
                    aria-disabled={targetAvailability.disabled}
                    title={character.name}
                    onClick={() => {
                      if (!targetAvailability.disabled) onUseItem(targetItem, character.id);
                    }}
                  >
                    <img src={resolveCharacterPortrait(character, { itemEffects: user?.itemEffects, user })} alt={character.name} loading="lazy" decoding="async" />
                    <span>{character.name}</span>
                  </button>
                );
              })}
              {ownedCharacters.length === 0 && (
                <p className="quiet-text"><UserRound size={18} />暂无可选择角色</p>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function WarehouseEffectResult({ targetState, characters, user }) {
  const character = characters[targetState.characterId];
  if (!character) return null;
  return (
    <div className={`warehouse-effect-result warehouse-item-category-${targetState.item?.targetType || "self"}`}>
      <img src={resolveCharacterPortrait(character, { itemEffects: targetState.itemEffects, user })} alt={character.name} loading="lazy" decoding="async" />
      <strong>{character.name}</strong>
      <p>{targetState.effectText}</p>
    </div>
  );
}

export function warehouseTargetState(targetState) {
  return {
    isResolved: Boolean(targetState?.characterId && targetState?.effectText)
  };
}

export function warehouseCharacterTargetAvailability({ character, item, itemEffects = {} }) {
  if (!item || item.itemId !== RAINBOW_BEAN_CANDY_ID) return { disabled: false, reason: "" };
  const characterId = canonicalCharacterId(character?.id);
  const targetRule = RAINBOW_BEAN_CANDY_TARGET_RULES[characterId];
  if (!targetRule) return { disabled: true, reason: "无效果" };
  if (itemEffects?.[targetRule.effectKey]) return { disabled: true, reason: targetRule.activeLabel };
  return { disabled: false, reason: "" };
}
