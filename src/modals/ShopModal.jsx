import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, Package, ShoppingBag, X } from "lucide-react";
import { api } from "../api/client.js";
import { getStoneDecoration } from "../shared/stoneDecorations.js";
import StoneDecorationPreview from "./StoneDecorationPreview.jsx";
import {
  buildShopSlots,
  getShopItemDescription,
  getShopItemQuantityLabel,
  getShopPageCount,
  isShopItemOwned,
  isShopItemSoldOut,
  pickShopMascotLine
} from "./shopModalHelpers.js";

const SHOP_CATEGORIES = [
  ["character", "角色"],
  ["item", "道具"],
  ["decoration", "装饰"]
];

export default function ShopModal({ token, user, onPurchased, onNotice, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("character");
  const [activePage, setActivePage] = useState(1);
  const [mascotLine] = useState(() => pickShopMascotLine());
  const [purchasingId, setPurchasingId] = useState("");

  useEffect(() => {
    let alive = true;
    if (!token || !user) {
      setLoading(false);
      setItems([]);
      onNotice?.("请先登录", "danger");
      return () => {
        alive = false;
      };
    }
    setLoading(true);
    api("/api/shop", { token })
      .then((data) => {
        if (alive) setItems(data.items ?? []);
      })
      .catch((apiError) => {
        if (alive) onNotice?.(apiError.message, "danger");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token, user, onNotice]);

  async function buyItem(item) {
    setPurchasingId(item.id);
    try {
      const data = await api(`/api/shop/${item.id}/purchase`, { method: "POST", token });
      onPurchased(data.user);
      if (data.item) {
        setItems((current) => current.map((shopItem) => shopItem.id === data.item.id ? data.item : shopItem));
      }
      onNotice?.(`已购买${item.name}`, "success");
    } catch (apiError) {
      onNotice?.(apiError.message, "danger");
    } finally {
      setPurchasingId("");
    }
  }

  const pageCount = useMemo(() => getShopPageCount(items, activeCategory), [items, activeCategory]);

  useEffect(() => {
    setActivePage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  const shopSlots = useMemo(() => buildShopSlots(items, activeCategory, activePage), [items, activeCategory, activePage]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="shop-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <div className="shop-layout">
          <aside className="shop-sidebar" aria-label="扎希拉接待区">
            <div className="shop-mascot-bubble" aria-live="polite">{mascotLine}</div>
            <div className="shop-mascot-slot" aria-label="扎希拉立绘">
              <img src="/assets/zahiya_shop.png" alt="扎希拉" decoding="async" />
            </div>
            <div className="shop-wallet-wrap">
              <span>你当前拥有</span>
              <p className="shop-wallet"><CircleDollarSign size={18} />{user?.coins ?? 0}</p>
            </div>
          </aside>
          <div className="shop-content">
            <div className="shop-tabs" role="tablist" aria-label="商城分类">
              {SHOP_CATEGORIES.map(([key, label]) => (
                <button
                  key={key}
                  className={activeCategory === key ? "active" : ""}
                  onClick={() => {
                    setActiveCategory(key);
                    setActivePage(1);
                  }}
                >
                  <span>{label}</span>
                </button>
              ))}
            </div>
            {loading && <p className="quiet-text">加载中...</p>}
            <div className="shop-grid">
              {!loading && shopSlots.map((item, index) => {
                if (!item) {
                  return (
                    <article className="shop-item shop-item-empty" key={`empty-${activeCategory}-${index}`}>
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
                  <article className={`shop-item ${owned ? "owned" : ""}`} key={item.id}>
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
                    <button className="primary-action" disabled={disabled} onClick={() => buyItem(item)}>
                      {owned ? "已拥有" : soldOut ? "已售罄" : purchasingId === item.id ? "购买中" : !item.purchasable ? "不可购买" : tooExpensive ? "金币不足" : "购买"}
                    </button>
                  </article>
                );
              })}
            </div>
            <div className="shop-pagination" aria-label="商品页码">
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  className={activePage === page ? "active" : ""}
                  type="button"
                  onClick={() => setActivePage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
