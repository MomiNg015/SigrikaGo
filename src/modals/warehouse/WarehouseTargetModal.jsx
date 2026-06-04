import { UserRound, X } from "lucide-react";
import { resolveCandyPortrait } from "../../shared/candyPortraits.js";

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
          <WarehouseEffectResult targetState={targetResult} characters={characters} />
        ) : (
          <>
            <h2>选择角色</h2>
            <div className="warehouse-character-grid">
              {ownedCharacters.map((character) => (
                <button key={character.id} type="button" onClick={() => onUseItem(targetItem, character.id)}>
                  <img src={resolveCandyPortrait(character, user?.itemEffects)} alt={character.name} loading="lazy" decoding="async" />
                  <span>{character.name}</span>
                </button>
              ))}
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

function WarehouseEffectResult({ targetState, characters }) {
  const character = characters[targetState.characterId];
  if (!character) return null;
  return (
    <div className={`warehouse-effect-result warehouse-item-category-${targetState.item?.targetType || "self"}`}>
      <img src={resolveCandyPortrait(character, targetState.itemEffects)} alt={character.name} loading="lazy" decoding="async" />
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
