import WindowLoadingState from "./WindowLoadingState.jsx";
import WindowTitleSticker from "./WindowTitleSticker.jsx";
import { X } from "lucide-react";
import WarehouseItemGrid from "./warehouse/WarehouseItemGrid.jsx";
import WarehouseTargetModal from "./warehouse/WarehouseTargetModal.jsx";
import { useWarehouseInventory } from "./warehouse/useWarehouseInventory.js";

export default function WarehouseModal({ token, user, characters, onUserChange, onNotice, onStoryScript, onSigrikaCorruptionEntry, onClose, onOpenRecruitment, initialTargetState = null }) {
  const {
    closeTargetModal,
    items,
    loading,
    ownedCharacters,
    setTargetItem,
    targetItem,
    targetResult,
    useItem,
    usingItemId
  } = useWarehouseInventory({ characters, initialTargetState, token, user, onNotice, onStoryScript, onSigrikaCorruptionEntry, onUserChange });

  return (
    <div className="modal-backdrop warehouse-guide-backdrop" onClick={onClose}>
      <section className="warehouse-modal warehouse-field-guide window-sticker-host" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" aria-label="关闭仓库" onClick={onClose}><X size={20} /></button>
        <header className="warehouse-header window-sticker-header">
          <WindowTitleSticker titleKey="warehouse" />
        </header>
        {loading && <WindowLoadingState>加载中...</WindowLoadingState>}
        {!loading && (
          <WarehouseItemGrid
            items={items}
            usingItemId={usingItemId}
            onSelectTargetItem={setTargetItem}
            onUseItem={useItem}
            onOpenRecruitment={onOpenRecruitment}
          />
        )}
        <WarehouseTargetModal
          characters={characters}
          ownedCharacters={ownedCharacters}
          targetItem={targetItem}
          targetResult={targetResult}
          busy={Boolean(usingItemId)}
          user={user}
          onClose={closeTargetModal}
          onUseItem={useItem}
        />
      </section>
    </div>
  );
}

export { warehouseTargetState } from "./warehouse/WarehouseTargetModal.jsx";
