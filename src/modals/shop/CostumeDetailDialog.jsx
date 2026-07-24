import { Shirt, X } from "lucide-react";
import { useId } from "react";
import { canonicalCharacterId } from "../../shared/characterAliases.js";
import { CHARACTERS } from "../../shared/characters.js";
import { ModalActionButton, ModalDialog } from "../modalComponents.jsx";

export default function CostumeDetailDialog({
  costume,
  purchasing,
  onPurchase,
  onPurchaseSuccess,
  onClose
}) {
  if (!costume) return null;
  const owned = costume.owned;
  const canPurchase = costume.characterOwned && costume.purchasable && !owned;
  const characterName = CHARACTERS[canonicalCharacterId(costume.characterSlug)]?.name ?? "角色";
  const purchaseLabel = purchasing
    ? "购买中…"
    : owned
      ? "已拥有"
      : !costume.characterOwned
        ? "需要先拥有对应角色"
        : !costume.purchasable
          ? "暂不可购买"
          : "购买服装";

  async function purchase() {
    let purchased = null;
    try {
      purchased = await onPurchase(costume);
    } finally {
      onClose();
    }
    if (purchased) onPurchaseSuccess?.({ ...costume, ...purchased, owned: true });
  }

  return (
    <div className="nested-modal-backdrop costume-detail-backdrop" onClick={onClose}>
      <ModalDialog
        className="nested-modal shop-item-detail-modal costume-detail-modal"
        ariaLabel={`${costume.name}详情`}
        onClose={onClose}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="close-button" type="button" aria-label="关闭服装详情" onClick={onClose}><X size={18} /></button>
        <div className="shop-detail-art costume-detail-art" aria-hidden="true">
          <img src={costume.portraitUrl} alt="" />
        </div>
        <div className="shop-detail-copy costume-detail-copy">
          <span className="shop-detail-category costume-detail-category">{characterName}服装</span>
          <div className="shop-detail-title-row costume-detail-title-row">
            <h3>{costume.name}</h3>
            {costume.illustName && (
              costume.illustUrl
                ? <a className="shop-detail-illust-label" href={costume.illustUrl} target="_blank" rel="noreferrer">illust：{costume.illustName}</a>
                : <span className="shop-detail-illust-label">illust：{costume.illustName}</span>
            )}
          </div>
          <p>{costume.description || "这套服装的介绍尚未填写。"}</p>
          <div className="shop-detail-stats costume-detail-actions">
            <section className="costume-detail-purchase-row" aria-label="服装售价与购买">
              <dl className="costume-detail-price">
                <dt>售价</dt>
                <dd>{costume.finalPrice} 金币</dd>
              </dl>
              <button
                className="primary-action costume-detail-purchase-button"
                type="button"
                aria-label={purchaseLabel}
                disabled={!canPurchase || purchasing}
                onClick={purchase}
              >
                <strong>{purchaseLabel}</strong>
              </button>
            </section>
          </div>
        </div>
      </ModalDialog>
    </div>
  );
}

export function CostumePurchaseEquipDialog({ costume, equipping, onEquip, onClose }) {
  const titleId = useId();
  if (!costume) return null;

  async function equip() {
    const equipped = await onEquip(costume);
    if (equipped) onClose();
  }

  return (
    <div className="nested-modal-backdrop costume-equip-prompt-backdrop" onClick={onClose}>
      <ModalDialog
        className="nested-modal costume-equip-prompt-modal"
        ariaLabelledBy={titleId}
        onClose={onClose}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="close-button" type="button" aria-label="关闭装扮确认" onClick={onClose}><X size={18} /></button>
        <Shirt className="costume-equip-prompt-icon" aria-hidden="true" />
        <h3 id={titleId}>购买成功</h3>
        <p>是否立即装扮“{costume.name}”？</p>
        <div className="inline-actions costume-equip-prompt-actions">
          <ModalActionButton disabled={equipping} onClick={equip}>
            {equipping ? "装扮中…" : "立即装扮"}
          </ModalActionButton>
          <ModalActionButton variant="secondary" disabled={equipping} onClick={onClose}>
            暂不装扮
          </ModalActionButton>
        </div>
      </ModalDialog>
    </div>
  );
}
