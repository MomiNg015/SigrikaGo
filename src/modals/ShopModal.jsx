import { X } from "lucide-react";
import { useState } from "react";
import ShopItemCard from "./shop/ShopItemCard.jsx";
import ShopItemDetailDialog from "./shop/ShopItemDetailDialog.jsx";
import ShopSidebar from "./shop/ShopSidebar.jsx";
import ShopTabs from "./shop/ShopTabs.jsx";
import { useShopCatalog } from "./shop/useShopCatalog.js";

export default function ShopModal({ token, user, onPurchased, onNotice, onClose }) {
  const [detailItem, setDetailItem] = useState(null);
  const {
    activeCategory,
    activePage,
    buyItem,
    loading,
    mascotLine,
    pageCount,
    purchasingId,
    selectCategory,
    setActivePage,
    shopSlots
  } = useShopCatalog({ token, user, onNotice, onPurchased });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="shop-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <div className="shop-layout">
          <ShopSidebar mascotLine={mascotLine} user={user} />
          <div className={`shop-content shop-category-${activeCategory}`}>
            <ShopTabs activeCategory={activeCategory} onCategoryChange={selectCategory} />
            {loading && <p className="quiet-text">加载中...</p>}
            <div className="shop-grid">
              {!loading && shopSlots.map((item, index) => (
                <ShopItemCard
                  key={item?.id ?? `empty-${activeCategory}-${index}`}
                  activeCategory={activeCategory}
                  index={index}
                  item={item}
                  purchasingId={purchasingId}
                  user={user}
                  onBuy={buyItem}
                  onShowDetail={setDetailItem}
                />
              ))}
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
        <ShopItemDetailDialog item={detailItem} user={user} onClose={() => setDetailItem(null)} />
      </section>
    </div>
  );
}
