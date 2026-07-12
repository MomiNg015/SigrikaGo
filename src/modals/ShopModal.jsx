import { RefreshCw, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { ModalDialog } from "./modalComponents.jsx";
import ShopItemDetailDialog from "./shop/ShopItemDetailDialog.jsx";
import ShopProductStage from "./shop/ShopProductStage.jsx";
import ShopSidebar from "./shop/ShopSidebar.jsx";
import { useShopCatalog } from "./shop/useShopCatalog.js";

export default function ShopModal({ token, user, musicTracks, onPurchased, onNotice, onClose }) {
  const [detailItem, setDetailItem] = useState(null);
  const {
    batchVersion,
    buyItem,
    catalogState,
    cooldownRemaining,
    currentBatch,
    mascotLine,
    mascotMood,
    purchasingId,
    refreshCatalog,
    refreshDisabled,
    refreshMode
  } = useShopCatalog({ token, user, musicTracks, onNotice, onPurchased });

  const refreshLabel = refreshMode === "retry"
    ? "重试获取商品"
    : cooldownRemaining > 0
      ? `${cooldownRemaining} 秒后可刷新商品`
      : refreshDisabled ? "暂无可刷新商品" : "刷新商品";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <ModalDialog
        className="shop-modal shop-window"
        ariaLabelledBy="shop-window-title"
        onClose={onClose}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="shop-header">
          <button
            className={`shop-refresh-button is-${refreshMode}`}
            type="button"
            aria-label={refreshLabel}
            title={refreshLabel}
            disabled={refreshDisabled}
            onClick={refreshCatalog}
            style={{ "--shop-refresh-progress": `${(cooldownRemaining / 3) * 360}deg` }}
          >
            {refreshMode === "retry" ? <RotateCcw aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
            {cooldownRemaining > 0 && <span className="shop-refresh-count" aria-hidden="true">{cooldownRemaining}</span>}
          </button>
          <h2 id="shop-window-title">扎希拉商铺</h2>
          <button className="close-button shop-close-button" type="button" aria-label="关闭扎希拉商铺" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="shop-layout shop-window-body" data-catalog-state={catalogState}>
          <ShopProductStage
            batch={currentBatch}
            batchVersion={batchVersion}
            purchasingId={purchasingId}
            user={user}
            onBuy={buyItem}
            onShowDetail={setDetailItem}
          />
          <ShopSidebar mascotLine={mascotLine} mascotMood={mascotMood} user={user} />
        </div>
        <ShopItemDetailDialog item={detailItem} user={user} onClose={() => setDetailItem(null)} />
      </ModalDialog>
    </div>
  );
}
