import { Package, ShoppingBag } from "lucide-react";
import { getStoneDecoration } from "../../shared/stoneDecorations.js";
import StoneDecorationPreview from "../StoneDecorationPreview.jsx";
import {
  getShopItemDescription,
  getShopItemQuantityLabel,
  isShopItemOwned,
  isShopItemSoldOut
} from "../shopModalHelpers.js";

export default function ShopItemCard({ item, index, activeCategory, purchasingId, user, onBuy }) {
  if (!item) {
    return (
      <article className={`shop-item shop-item-empty terminal-locked-slot shop-category-${activeCategory}`} key={`empty-${activeCategory}-${index}`}>
        <ShoppingBag />
        <strong>暂未上架</strong>
      </article>
    );
  }

  const owned = isShopItemOwned(item, user);
  const tooExpensive = (user?.coins ?? 0) < item.finalPrice;
  const soldOut = isShopItemSoldOut(item);
  const disabled = owned || soldOut || !item.purchasable || tooExpensive || purchasingId === item.id;

  return (
    <article className={`shop-item shop-category-${item.category} ${owned ? "owned store-owned-tag" : ""}`} key={item.id}>
      {item.category === "decoration" && getStoneDecoration(item.targetId)
        ? <StoneDecorationPreview decoration={getStoneDecoration(item.targetId)} label={item.name} large />
        : item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" decoding="async" /> : item.category === "item" ? <Package /> : <ShoppingBag />}
      <strong>{item.name}</strong>
      <p className="shop-description">{getShopItemDescription(item)}</p>
      <div className="shop-card-meta">
        <span>{getShopItemQuantityLabel(item)}</span>
        <p className="shop-price">
          <span className="shop-price-number-wrap">
            {item.discountPercent > 0 && <s className="shop-original-price">{item.priceCoins}</s>}
            <b>{item.finalPrice}</b>
          </span>
          <span className="shop-price-unit">金币</span>
        </p>
      </div>
      <button className="primary-action" disabled={disabled} onClick={() => onBuy(item)}>
        {owned ? "已拥有" : soldOut ? "已售罄" : purchasingId === item.id ? "购买中" : !item.purchasable ? "不可购买" : tooExpensive ? "金币不足" : "购买"}
      </button>
    </article>
  );
}
