import WindowTitleSticker from "../WindowTitleSticker.jsx";
import { UserRound, X } from "lucide-react";
import { createPortal } from "react-dom";
import { ModalDialog } from "../modalComponents.jsx";
import { characterPortraitImageProps } from "../../shared/characterPortraits.js";
import MatchCharacterCardContent from "../../home/MatchCharacterCardContent.jsx";
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
  busy = false,
  user,
  onClose,
  onUseItem
}) {
  if (!targetItem && !targetResult) return null;

  const dialog = (
    <div className="modal-backdrop nested-backdrop" onClick={onClose}>
      <ModalDialog
        className={`character-target-modal${warehouseTargetState(targetResult).isResolved ? "" : " window-sticker-host match-character-picker"}`}
        ariaLabel={warehouseTargetState(targetResult).isResolved ? "道具效果" : undefined}
        ariaLabelledBy={warehouseTargetState(targetResult).isResolved ? undefined : "warehouse-target-title"}
        aria-busy={busy || undefined}
        onClose={onClose}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="close-button" type="button" aria-label="关闭角色选择" onClick={onClose}><X size={18} /></button>
        {warehouseTargetState(targetResult).isResolved ? (
          <WarehouseEffectResult targetState={targetResult} characters={characters} user={user} />
        ) : (
          <>
            <WindowTitleSticker titleKey="select-character" id="warehouse-target-title" />
            <div className="team-character-options">
              {ownedCharacters.map((character) => {
                const targetAvailability = warehouseCharacterTargetAvailability({
                  character,
                  item: targetItem,
                  itemEffects: user?.itemEffects
                });
                return (
                  <div className="match-character-option-wrap" key={character.id}>
                    <button
                      type="button"
                      className={`team-character-option${targetAvailability.disabled ? " warehouse-target-disabled" : ""}`}
                      disabled={busy || targetAvailability.disabled}
                      aria-disabled={busy || targetAvailability.disabled}
                      title={targetAvailability.reason ? `${character.name}：${targetAvailability.reason}` : character.name}
                      aria-label={targetAvailability.reason ? `${character.name}：${targetAvailability.reason}` : character.name}
                      onClick={() => {
                        if (!busy && !targetAvailability.disabled) onUseItem(targetItem, character.id);
                      }}
                    >
                      <MatchCharacterCardContent character={character} user={user ?? {}} />
                    </button>
                  </div>
                );
              })}
              {ownedCharacters.length === 0 && (
                <p className="quiet-text"><UserRound size={18} />暂无角色</p>
              )}
            </div>
          </>
        )}
      </ModalDialog>
    </div>
  );
  if (typeof document === "undefined") return dialog;
  return createPortal(dialog, document.querySelector(".app-shell") ?? document.body);
}

function WarehouseEffectResult({ targetState, characters, user }) {
  const character = characters[targetState.characterId];
  if (!character) return null;
  return (
    <div className={`warehouse-effect-result warehouse-item-category-${targetState.item?.targetType || "self"}`}>
      <img {...characterPortraitImageProps(character, { variant: "avatar", itemEffects: targetState.itemEffects, user })} alt={character.name} loading="lazy" decoding="async" />
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
  const characterId = canonicalCharacterId(character?.id);
  const disabledReason = item?.disabledCharacterReasons?.[characterId];
  if (disabledReason) return { disabled: true, reason: disabledReason };
  if (!item || item.itemId !== RAINBOW_BEAN_CANDY_ID) return { disabled: false, reason: "" };
  const targetRule = RAINBOW_BEAN_CANDY_TARGET_RULES[characterId];
  if (!targetRule) return { disabled: true, reason: "无效果" };
  if (itemEffects?.[targetRule.effectKey]) return { disabled: true, reason: targetRule.activeLabel };
  return { disabled: false, reason: "" };
}
