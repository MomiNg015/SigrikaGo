import { Shirt, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { canonicalCharacterId } from "../../shared/characterAliases.js";
import { defaultCostumeCard } from "../../shared/costumes.js";
import { ModalDialog } from "../modalComponents.jsx";

export default function CharacterCostumeDialog({
  character,
  characterOwned,
  costumes,
  loading,
  equippingId,
  user,
  onEquip,
  onClose
}) {
  const [detailCostume, setDetailCostume] = useState(null);
  const [portalTarget, setPortalTarget] = useState(null);
  const cards = useMemo(
    () => orderCostumeCards(character, costumes, user),
    [character, costumes, user]
  );

  useEffect(() => {
    setPortalTarget(document.querySelector(".app-shell") ?? document.body);
  }, []);

  const wardrobeDialog = (
    <div className="modal-backdrop character-costume-backdrop" onClick={onClose}>
      <ModalDialog
        className="nested-modal character-costume-dialog"
        ariaLabel={`${character.name}服装`}
        aria-hidden={detailCostume ? "true" : undefined}
        onClose={onClose}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="character-costume-header">
          <h3>{character.name}的衣柜</h3>
          <button className="close-button" type="button" aria-label="关闭服装列表" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="character-costume-grid">
          {loading && <p className="character-costume-empty">正在整理服装…</p>}
          {!loading && cards.map((costume) => {
            const owned = costume.isDefault || costume.owned;
            const equipped = characterOwned && (costume.isDefault
              ? !user?.equippedCostumes?.[character.id]
              : user?.equippedCostumes?.[character.id]?.id === costume.id);
            const equipDisabled = !characterOwned || !owned || equippingId === costume.id;
            return (
              <article
                className={`character-costume-card${owned || costume.isDefault ? "" : " is-unowned"}${equipped ? " is-equipped" : ""}`}
                aria-current={equipped ? "true" : undefined}
                key={costume.id}
              >
                <button
                  className="character-costume-detail-trigger"
                  type="button"
                  aria-label={`查看${costume.name}详情${equipped ? "，正在装扮" : ""}`}
                  onClick={() => setDetailCostume(costume)}
                >
                  <img src={costume.portraitUrl} alt="" loading="lazy" decoding="async" />
                  <strong>{costume.name}</strong>
                </button>
                <button
                  className="character-costume-equip-button"
                  type="button"
                  aria-label={`装扮${costume.name}`}
                  disabled={equipDisabled}
                  onClick={() => onEquip(costume)}
                >
                  <Shirt aria-hidden="true" />
                </button>
              </article>
            );
          })}
        </div>
      </ModalDialog>
    </div>
  );

  const detailDialog = detailCostume ? (
    <div className="modal-backdrop character-costume-detail-backdrop" onClick={() => setDetailCostume(null)}>
      <ModalDialog
        className="character-costume-detail"
        ariaLabel={`${detailCostume.name}详情`}
        onClose={() => setDetailCostume(null)}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="close-button" type="button" aria-label="关闭服装详情" onClick={() => setDetailCostume(null)}><X size={18} /></button>
        <img src={detailCostume.portraitUrl} alt="" />
        <div>
          <h4>{detailCostume.name}</h4>
          <p>{detailCostume.description || "这套服装的介绍尚未填写。"}</p>
          {detailCostume.illustName && (
            detailCostume.illustUrl
              ? <a href={detailCostume.illustUrl} target="_blank" rel="noreferrer">illust：{detailCostume.illustName}</a>
              : <span>illust：{detailCostume.illustName}</span>
          )}
        </div>
      </ModalDialog>
    </div>
  ) : null;

  const dialogs = <>{wardrobeDialog}{detailDialog}</>;
  if (typeof document === "undefined") return dialogs;
  if (!portalTarget) return null;
  return createPortal(dialogs, portalTarget);
}

export function orderCostumeCards(character, costumes = [], user = {}) {
  const defaultCard = defaultCostumeCard(character);
  const characterId = canonicalCharacterId(character?.id ?? character?.slug);
  const characterCostumes = costumes
    .filter((costume) => canonicalCharacterId(costume.characterSlug) === characterId && costume.enabled !== false);
  const equippedId = user?.equippedCostumes?.[characterId]?.id ?? "";
  return [
    defaultCard,
    ...characterCostumes
      .map((costume) => ({
        ...costume,
        owned: costume.owned || user?.ownedCostumeIds?.includes(costume.id)
      }))
      .sort((left, right) => (
        Number(right.id === equippedId) - Number(left.id === equippedId)
        || Number(right.owned) - Number(left.owned)
        || left.sortOrder - right.sortOrder
        || left.id.localeCompare(right.id)
      ))
  ];
}
