import { Package, ShoppingBag } from "lucide-react";
import { getStoneDecoration } from "../../shared/stoneDecorations.js";
import StoneDecorationPreview from "../StoneDecorationPreview.jsx";
import {
  getShopItemCategoryLabel,
  getShopItemQuantityBadge,
  isShopItemOwned,
  isShopItemSoldOut
} from "../shopModalHelpers.js";

export default function ShopItemCard({ item, purchasingId, user, onBuy, onShowDetail }) {
  const owned = isShopItemOwned(item, user);
  const tooExpensive = (user?.coins ?? 0) < item.finalPrice;
  const soldOut = isShopItemSoldOut(item);
  const disabled = owned || soldOut || !item.purchasable || tooExpensive || purchasingId === item.id;
  const actionStateClass = owned ? "shop-action-owned" : soldOut ? "shop-action-sold-out" : "";
  const categoryLabel = getShopItemCategoryLabel(item);
  const quantityBadge = getShopItemQuantityBadge(item);
  const openDetail = () => onShowDetail?.(item);
  const buyWithoutOpeningDetail = (event) => {
    event.stopPropagation();
    onBuy(item);
  };

  return (
    <article
      className={`shop-item shop-category-${item.category} ${owned ? "owned store-owned-tag" : ""} ${purchasingId === item.id ? "is-purchasing" : ""}`}
      key={item.id}
    >
      <span
        className={`shop-corner-badge shop-category-badge shop-category-badge-${item.category}`}
        aria-label={`分类：${categoryLabel}`}
      >
        {categoryLabel}
      </span>
      {quantityBadge && (
        <span className="shop-corner-badge shop-quantity-badge" aria-label={quantityBadge.ariaLabel}>
          {quantityBadge.text}
        </span>
      )}
      <button
        className="shop-item-detail-trigger"
        type="button"
        aria-label={`查看${item.name}详情`}
        onClick={openDetail}
      >
        {item.category === "decoration" && getStoneDecoration(item.targetId)
          ? <StoneDecorationPreview decoration={getStoneDecoration(item.targetId)} label={item.name} large />
          : item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" decoding="async" /> : item.category === "item" ? <Package /> : <ShoppingBag />}
        <strong>{item.name}</strong>
        <div className="shop-card-meta shop-card-meta-price-only">
          <p className="shop-price">
            <span className="shop-price-number-wrap">
              {item.discountPercent > 0 && <s className="shop-original-price">{item.priceCoins}</s>}
              <b>{item.finalPrice}</b>
            </span>
            <span className="shop-price-unit">金币</span>
          </p>
        </div>
      </button>
      <button className={`primary-action ${actionStateClass}`} disabled={disabled} onClick={buyWithoutOpeningDetail}>
        {owned ? "已拥有" : soldOut ? "已售罄" : purchasingId === item.id ? "购买中" : !item.purchasable ? "不可购买" : tooExpensive ? "金币不足" : "购买"}
      </button>
    </article>
  );
}
