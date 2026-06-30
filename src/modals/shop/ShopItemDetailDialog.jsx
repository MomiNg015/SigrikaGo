import { Package, ShoppingBag, X } from "lucide-react";
import { normalizeShopItemIllustName, normalizeShopItemIllustUrl } from "../../shared/shopItemIllust.js";
import { getStoneDecoration } from "../../shared/stoneDecorations.js";
import StoneDecorationPreview from "../StoneDecorationPreview.jsx";
import { getShopItemDescription } from "../shopModalHelpers.js";
import {
  getShopCategoryLabel,
  getShopItemDetailOwned,
  getShopItemDetailStatus
} from "./shopItemDetail.js";

export default function ShopItemDetailDialog({ item, user, onClose }) {
  if (!item) return null;
  const decoration = item.category === "decoration" ? getStoneDecoration(item.targetId) : null;
  const owned = getShopItemDetailOwned(item, user);
  const illustName = normalizeShopItemIllustName(item.illustName);
  const illustUrl = normalizeShopItemIllustUrl(item.illustUrl);
  const illustLabel = illustName ? `illust：${illustName}` : "";

  return (
    <div className="nested-modal-backdrop shop-detail-backdrop" onClick={onClose}>
      <section className="nested-modal shop-item-detail-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" onClick={onClose}><X size={18} /></button>
        <div className="shop-detail-art" aria-hidden="true">
          {decoration
            ? <StoneDecorationPreview decoration={decoration} label={item.name} large />
            : item.imageUrl
              ? <img src={item.imageUrl} alt="" loading="lazy" decoding="async" />
              : item.category === "item" ? <Package /> : <ShoppingBag />}
        </div>
        <div className="shop-detail-copy">
          <span className="shop-detail-category">{getShopCategoryLabel(item.category)}</span>
          <div className="shop-detail-title-row">
            <h3>{item.name}</h3>
            {illustLabel && (illustUrl ? (
              <a className="shop-detail-illust-label" href={illustUrl} target="_blank" rel="noreferrer">{illustLabel}</a>
            ) : (
              <span className="shop-detail-illust-label">{illustLabel}</span>
            ))}
          </div>
          <p>{getShopItemDescription(item)}</p>
          <dl className="shop-detail-stats">
            <div className={owned ? "shop-detail-status-owned" : ""}>
              <dt>持有状态</dt>
              <dd>{getShopItemDetailStatus(item, user)}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
