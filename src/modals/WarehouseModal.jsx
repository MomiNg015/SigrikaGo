import WindowLoadingState from "./WindowLoadingState.jsx";
import { X } from "lucide-react";
import WarehouseBox from "./warehouse/WarehouseBox.jsx";
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
    <div className="modal-backdrop warehouse-guide-backdrop" onClick={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="warehouse-modal warehouse-field-guide warehouse-box window-sticker-host" role="dialog" aria-modal="true" aria-label="物品收纳箱">
        <button className="close-button" type="button" aria-label="关闭仓库" onClick={onClose}><X size={20} /></button>
        {loading && <WindowLoadingState>加载中...</WindowLoadingState>}
        {!loading && (
          <WarehouseBox
            items={items}
            usingItemId={usingItemId}
            targetOpen={Boolean(targetItem || targetResult)}
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
