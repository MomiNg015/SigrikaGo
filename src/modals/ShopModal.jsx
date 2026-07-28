import { RefreshCw, RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";
import { shopMascotDialoguesFromSettings } from "../shared/shopMascotDialogues.js";
import { ModalDialog } from "./modalComponents.jsx";
import ShopItemDetailDialog from "./shop/ShopItemDetailDialog.jsx";
import ShopProductStage from "./shop/ShopProductStage.jsx";
import ShopSidebar from "./shop/ShopSidebar.jsx";
import CostumeDetailDialog, { CostumePurchaseEquipDialog } from "./shop/CostumeDetailDialog.jsx";
import CostumeStorePanel from "./shop/CostumeStorePanel.jsx";
import { useCostumeCatalog } from "./shop/useCostumeCatalog.js";
import { useShopCatalog } from "./shop/useShopCatalog.js";

export default function ShopModal({
  token,
  user,
  musicTracks,
  siteSettings = DEFAULT_SITE_SETTINGS,
  onPurchased,
  onNotice,
  onClose
}) {
  const [activeStore, setActiveStore] = useState("zahira");
  const [detailItem, setDetailItem] = useState(null);
  const [detailCostume, setDetailCostume] = useState(null);
  const [equipPromptCostume, setEquipPromptCostume] = useState(null);
  const mascotDialogues = useMemo(
    () => shopMascotDialoguesFromSettings(siteSettings),
    [siteSettings?.shopMascotDialogues]
  );
  const zahiraCatalog = useShopCatalog({
    token,
    user,
    musicTracks,
    onNotice,
    onPurchased,
    dialogueConfig: mascotDialogues.zahira
  });
  const costumeCatalog = useCostumeCatalog({
    token,
    user,
    onNotice,
    onPurchased,
    dialogueConfig: mascotDialogues.nabomo
  });
  const activeCatalog = activeStore === "costume" ? costumeCatalog : zahiraCatalog;
  const {
    batchVersion,
    buyItem,
    catalogState,
    currentBatch,
    mascotLine,
    mascotMood,
    purchasingId,
  } = zahiraCatalog;

  const refreshLabel = activeCatalog.refreshMode === "retry"
    ? "重试获取商品"
    : activeCatalog.cooldownRemaining > 0
      ? `${activeCatalog.cooldownRemaining} 秒后可刷新商品`
      : activeCatalog.refreshDisabled ? "暂无可刷新商品" : "刷新商品";

  function switchStore(nextStore) {
    setDetailItem(null);
    setDetailCostume(null);
    setEquipPromptCostume(null);
    setActiveStore(nextStore);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <ModalDialog
        className="shop-modal shop-window"
        ariaLabelledBy="shop-window-title"
        onClose={onClose}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="shop-header" data-store={activeStore}>
          <button
            className={`shop-refresh-button is-${activeCatalog.refreshMode}`}
            type="button"
            aria-label={refreshLabel}
            title={refreshLabel}
            disabled={activeCatalog.refreshDisabled}
            onClick={activeCatalog.refreshCatalog}
            style={{ "--shop-refresh-progress": `${(activeCatalog.cooldownRemaining / 3) * 360}deg` }}
          >
            {activeCatalog.refreshMode === "retry" ? <RotateCcw aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
            {activeCatalog.cooldownRemaining > 0 && <span className="shop-refresh-count" aria-hidden="true">{activeCatalog.cooldownRemaining}</span>}
          </button>
          <h2 id="shop-window-title" className={activeStore === "costume" ? "is-costume-title" : undefined}>
            {activeStore === "costume" ? "残星会cosplay部" : "扎希拉商铺"}
          </h2>
          <button className="close-button shop-close-button" type="button" aria-label="关闭商店" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </header>

        <div className={`shop-store-viewport is-${activeStore}`}>
          <div className="shop-store-track">
            <div className="shop-store-page zahira-store-page">
              <div className="shop-layout shop-window-body" data-catalog-state={catalogState}>
                <ShopProductStage
                  batch={currentBatch}
                  batchVersion={batchVersion}
                  purchasingId={purchasingId}
                  user={zahiraCatalog.effectiveUser}
                  onBuy={buyItem}
                  onShowDetail={setDetailItem}
                />
                <ShopSidebar mascotLine={mascotLine} mascotMood={mascotMood} user={zahiraCatalog.effectiveUser} />
                <button className="shop-switch-button zahira-to-costume" type="button" onClick={() => switchStore("costume")}>
                  <span>残星会</span>
                </button>
              </div>
            </div>
            <div className="shop-store-page costume-store-page">
              <CostumeStorePanel
                batch={costumeCatalog.currentBatch}
                batchVersion={costumeCatalog.batchVersion}
                mascotLine={costumeCatalog.mascotLine}
                mascotMood={costumeCatalog.mascotMood}
                user={costumeCatalog.effectiveUser}
                onShowDetail={setDetailCostume}
                onSwitchShop={() => switchStore("zahira")}
              />
            </div>
          </div>
        </div>
        <ShopItemDetailDialog item={detailItem} user={zahiraCatalog.effectiveUser} onClose={() => setDetailItem(null)} />
        <CostumeDetailDialog
          costume={detailCostume}
          purchasing={costumeCatalog.purchasingId === detailCostume?.id}
          onPurchase={costumeCatalog.purchaseCostume}
          onPurchaseSuccess={setEquipPromptCostume}
          onClose={() => setDetailCostume(null)}
        />
        <CostumePurchaseEquipDialog
          costume={equipPromptCostume}
          equipping={costumeCatalog.equippingId === equipPromptCostume?.id}
          onEquip={costumeCatalog.equipCostume}
          onClose={() => setEquipPromptCostume(null)}
        />
      </ModalDialog>
    </div>
  );
}
