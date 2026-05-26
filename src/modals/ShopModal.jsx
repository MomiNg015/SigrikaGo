import { useEffect, useState } from "react";
import { CircleDollarSign, ShoppingBag, X } from "lucide-react";
import { api } from "../api/client.js";
import { getStoneDecoration } from "../shared/stoneDecorations.js";
import StoneDecorationPreview from "./StoneDecorationPreview.jsx";

const SHOP_CATEGORIES = [
  ["character", "角色"],
  ["decoration", "装饰"]
];

export const SHOP_MASCOT_LINES = [
  "今天想买些什么？",
  "刚刚进了一批好货哟~",
  "欢迎来到扎希拉商店！"
];

const SHOP_PAGE_SIZE = 8;

export default function ShopModal({ token, user, onPurchased, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("character");
  const [activePage, setActivePage] = useState(1);
  const [mascotLine] = useState(() => pickShopMascotLine());
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

  const pageCount = getShopPageCount(items, activeCategory);

  useEffect(() => {
    setActivePage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  const shopSlots = buildShopSlots(items, activeCategory, activePage);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="shop-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <div className="shop-layout">
          <aside className="shop-sidebar" aria-label="扎希拉接待区">
            <div className="shop-mascot-bubble" aria-live="polite">{mascotLine}</div>
            <div className="shop-mascot-slot" aria-label="扎希拉立绘">
              <img src="/assets/zahiya_shop.png" alt="扎希拉" />
            </div>
            <p className="shop-wallet"><CircleDollarSign size={18} />{user?.coins ?? 0}</p>
          </aside>
          <div className="shop-content">
            <header className="shop-header">
              <div className="shop-title-block">
                <h2>扎希拉商店</h2>
              </div>
            </header>
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

export function pickShopMascotLine(random = Math.random) {
  const value = Number(random());
  const index = Math.min(
    SHOP_MASCOT_LINES.length - 1,
    Math.max(0, Math.floor(value * SHOP_MASCOT_LINES.length))
  );
  return SHOP_MASCOT_LINES[index];
}

export function getShopPageCount(items = [], activeCategory = "character", pageSize = SHOP_PAGE_SIZE) {
  const visibleCount = Array.isArray(items) ? items.filter((item) => item.category === activeCategory).length : 0;
  return Math.max(1, Math.ceil(visibleCount / pageSize));
}

export function buildShopSlots(items = [], activeCategory = "character", page = 1, pageSize = SHOP_PAGE_SIZE) {
  const visibleItems = Array.isArray(items) ? items.filter((item) => item.category === activeCategory) : [];
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const safePage = Math.min(Math.max(Number(page) || 1, 1), pageCount);
  const start = (safePage - 1) * pageSize;
  return Array.from({ length: pageSize }, (_, index) => visibleItems[start + index] ?? null);
}

export function isShopItemOwned(item = {}, user = {}) {
  if (item.category === "character") return Boolean(user?.ownedCharacters?.includes(item.targetId));
  if (item.category === "decoration") return Boolean(user?.ownedDecorations?.includes(item.targetId));
  return false;
}
