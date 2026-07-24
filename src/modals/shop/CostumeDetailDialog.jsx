import { Shirt, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ModalDialog } from "../modalComponents.jsx";

export default function CostumeDetailDialog({
  costume,
  purchasing,
  equipping,
  onPurchase,
  onEquip,
  onClose
}) {
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [purchasedHere, setPurchasedHere] = useState(false);

  useEffect(() => {
    setPurchaseComplete(false);
    setPurchasedHere(false);
  }, [costume?.id]);
  if (!costume) return null;
  const owned = costume.owned || purchasedHere;
  const canPurchase = costume.characterOwned && costume.purchasable && !owned;

  async function purchase() {
    const purchased = await onPurchase(costume);
    if (purchased) {
      setPurchasedHere(true);
      setPurchaseComplete(true);
    }
  }

  return (
    <div className="nested-modal-backdrop costume-detail-backdrop" onClick={onClose}>
      <ModalDialog
        className="nested-modal costume-detail-modal"
        ariaLabel={`${costume.name}详情`}
        onClose={onClose}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="close-button" type="button" aria-label="关闭服装详情" onClick={onClose}><X size={18} /></button>
        <div className="costume-detail-art"><img src={costume.portraitUrl} alt="" /></div>
        <div className="costume-detail-copy">
          <span className="costume-detail-kicker">残星会服装</span>
          <h3>{costume.name}</h3>
          {costume.illustName && (
            costume.illustUrl
              ? <a href={costume.illustUrl} target="_blank" rel="noreferrer">illust：{costume.illustName}</a>
              : <span>illust：{costume.illustName}</span>
          )}
          <p>{costume.description || "这套服装的介绍尚未填写。"}</p>
          <div className="costume-detail-price"><strong>{costume.finalPrice}</strong><small>金币</small></div>
          {!costume.characterOwned && <p className="costume-detail-lock">需要先拥有对应角色</p>}
          {owned && !purchaseComplete && <p className="costume-detail-owned">已拥有</p>}
          {!owned && (
            <button className="primary-action" type="button" disabled={!canPurchase || purchasing} onClick={purchase}>
              {purchasing ? "购买中…" : "购买服装"}
            </button>
          )}
          {purchaseComplete && (
            <div className="costume-purchase-equip-prompt" role="status">
              <strong>购买成功，是否立即装扮该服装？</strong>
              <div className="inline-actions">
                <button className="primary-action" type="button" disabled={equipping} onClick={() => onEquip(costume)}>
                  <Shirt aria-hidden="true" />{equipping ? "装扮中…" : "立即装扮"}
                </button>
                <button className="secondary-action" type="button" onClick={() => setPurchaseComplete(false)}>暂不装扮</button>
              </div>
            </div>
          )}
        </div>
      </ModalDialog>
    </div>
  );
}
