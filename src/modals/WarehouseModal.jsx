import { X } from "lucide-react";
import WarehouseItemGrid from "./warehouse/WarehouseItemGrid.jsx";
import WarehouseTargetModal, { warehouseTargetState } from "./warehouse/WarehouseTargetModal.jsx";
import { useWarehouseInventory } from "./warehouse/useWarehouseInventory.js";

export default function WarehouseModal({ token, user, characters, onUserChange, onNotice, onStoryScript, onClose, initialTargetState = null }) {
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
  } = useWarehouseInventory({ characters, initialTargetState, token, user, onNotice, onStoryScript, onUserChange });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="warehouse-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" aria-label="关闭仓库" onClick={onClose}><X size={20} /></button>
        <header className="warehouse-header">
          <h2>仓库</h2>
        </header>
        {loading && <p className="quiet-text">加载中...</p>}
        {!loading && (
          <WarehouseItemGrid
            items={items}
            usingItemId={usingItemId}
            onSelectTargetItem={setTargetItem}
            onUseItem={useItem}
          />
        )}
        <WarehouseTargetModal
          characters={characters}
          ownedCharacters={ownedCharacters}
          targetItem={targetItem}
          targetResult={targetResult}
          user={user}
          onClose={closeTargetModal}
          onUseItem={useItem}
        />
      </section>
    </div>
  );
}

export { warehouseTargetState } from "./warehouse/WarehouseTargetModal.jsx";
