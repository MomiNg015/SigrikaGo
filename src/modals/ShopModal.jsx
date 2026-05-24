import { useEffect, useState } from "react";
import { CircleDollarSign, ShoppingBag, X } from "lucide-react";
import { api } from "../api/client.js";
import { getStoneDecoration } from "../shared/stoneDecorations.js";
import StoneDecorationPreview from "./StoneDecorationPreview.jsx";

const SHOP_CATEGORIES = [
  ["character", "角色"],
  ["decoration", "装饰"]
];

export default function ShopModal({ token, user, onPurchased, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("character");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [purchasingId, setPurchasingId] = useState("");

  useEffect(() => {
    let alive = true;
    if (!token || !user) {
      setLoading(false);
      setItems([]);
      setError("请先登录");
      return () => {
        alive = false;
      };
    }
    setLoading(true);
    setError("");
    api("/api/shop", { token })
      .then((data) => {
        if (alive) setItems(data.items ?? []);
      })
      .catch((apiError) => {
        if (alive) setError(apiError.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token, user]);

  async function buyItem(item) {
    setMessage("");
    setError("");
    setPurchasingId(item.id);
    try {
      const data = await api(`/api/shop/${item.id}/purchase`, { method: "POST", token });
      onPurchased(data.user);
      setMessage(`已购买 ${item.name}`);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setPurchasingId("");
    }
  }

  const shopSlots = buildShopSlots(items, activeCategory);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="shop-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <header className="shop-header">
          <div className="shop-title-block">
            <h2>扎希拉商店</h2>
            <p className="shop-wallet"><CircleDollarSign size={18} />{user?.coins ?? 0}</p>
          </div>
          <div className="shop-mascot-slot" aria-label="扎希亚立绘">
            <img src="/assets/zahiya_shop.png" alt="扎希亚" />
          </div>
        </header>
        <div className="shop-tabs" role="tablist" aria-label="商城分类">
          {SHOP_CATEGORIES.map(([key, label]) => (
            <button key={key} className={activeCategory === key ? "active" : ""} onClick={() => setActiveCategory(key)}>
              <span>{label}</span>
            </button>
          ))}
        </div>
        {message && <p className="admin-success">{message}</p>}
        {error && <p className="form-error admin-action-error">{error}</p>}
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
            const disabled = owned || !item.purchasable || tooExpensive || purchasingId === item.id;
            return (
              <article className={`shop-item ${owned ? "owned" : ""}`} key={item.id}>
                {item.category === "decoration" && getStoneDecoration(item.targetId)
                  ? <StoneDecorationPreview decoration={getStoneDecoration(item.targetId)} label={item.name} large />
                  : item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <ShoppingBag />}
                <strong>{item.name}</strong>
                <p className="shop-price">
                  {item.discountPercent > 0 && <s>{item.priceCoins}</s>}
                  <b>{item.finalPrice}</b> 金币
                </p>
                <button className="primary-action" disabled={disabled} onClick={() => buyItem(item)}>
                  {owned ? "已拥有" : purchasingId === item.id ? "购买中" : !item.purchasable ? "不可购买" : tooExpensive ? "金币不足" : "购买"}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function buildShopSlots(items = [], activeCategory = "character") {
  const visibleItems = Array.isArray(items) ? items.filter((item) => item.category === activeCategory) : [];
  return Array.from({ length: 8 }, (_, index) => visibleItems[index] ?? null);
}

export function isShopItemOwned(item = {}, user = {}) {
  if (item.category === "character") return Boolean(user?.ownedCharacters?.includes(item.targetId));
  if (item.category === "decoration") return Boolean(user?.ownedDecorations?.includes(item.targetId));
  return false;
}
