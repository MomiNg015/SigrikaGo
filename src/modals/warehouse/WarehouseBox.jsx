import { useRef, useState } from "react";
import { X } from "lucide-react";
import { ModalActionButton, ModalDialog } from "../modalComponents.jsx";
import WindowEmptyState from "../WindowEmptyState.jsx";
import { ItemArt, WarehouseDirectory, WarehouseInspector } from "./WarehouseItemGrid.jsx";
import { useWarehouseListRows } from "./useWarehouseListRows.js";

function scatterItems(items) {
  let slot = 0;
  return [...items].sort((first, second) => first.quantity - second.quantity).flatMap((item, index) =>
    Array.from({ length: Math.min(5, item.quantity) }, (_, copy) => {
      const position = slot++ + 1;
      return {
        item, key: `${item.itemId}-${copy}`,
        style: {
          left: `${14 + (position * 0.618 % 1) * 72}%`,
          top: `${24 + (position * 0.414 % 1) * 56}%`,
          "--wg-angle": `${(position * 7 % 41) - 20}deg`,
          zIndex: items.length - index
        }
      };
    })
  );
}

export default function WarehouseBox({ items, targetOpen, ...actions }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [itemId, setItemId] = useState("");
  const toggleRef = useRef(null);
  const listRef = useWarehouseListRows(drawerOpen);
  const stocked = items.filter(item => item.quantity > 0);
  const item = stocked.find(entry => entry.itemId === itemId);
  const detailOpen = Boolean(item) && !targetOpen;

  function handleEscape(event) {
    if (event.key !== "Escape" || !drawerOpen || targetOpen) return;
    event.preventDefault();
    event.stopPropagation();
    setDrawerOpen(false);
    toggleRef.current?.focus();
  }

  return <div className="wg-box-content" onKeyDown={handleEscape}>
    <ModalActionButton ref={toggleRef} variant="secondary" className="wg-drawer-toggle" disabled={!stocked.length} aria-controls="warehouse-box-directory" aria-expanded={drawerOpen && Boolean(stocked.length)} onClick={() => setDrawerOpen(open => !open)}>
      {drawerOpen && stocked.length ? "收起持有详情" : "展开持有详情"}
    </ModalActionButton>
    <div className="wg-pile" inert={drawerOpen && Boolean(stocked.length)} aria-label="箱内道具">
      {scatterItems(stocked).map(({ item: entry, key, style }) => <button type="button" className="wg-loot" key={key} style={style} aria-label={`查看道具详情：${entry.name}，持有 ${entry.quantity}`} onClick={() => setItemId(entry.itemId)}>
        <ItemArt item={entry} />
      </button>)}
      {!stocked.length && <WindowEmptyState compact>暂无道具</WindowEmptyState>}
    </div>
    <div className="wg-drawer" id="warehouse-box-directory" inert={!drawerOpen || !stocked.length}>
      {stocked.length > 0 && <WarehouseDirectory items={stocked} listRef={listRef} item={item} onSelect={entry => setItemId(entry.itemId)} />}
    </div>
    {detailOpen && <div className="wg-detail-backdrop" onClick={() => setItemId("")}>
      <ModalDialog className="wg-item-dialog" ariaLabel={`道具详情：${item.name}`} onClose={() => setItemId("")} onClick={event => event.stopPropagation()}>
        <button className="nested-modal-close" type="button" aria-label="关闭道具详情" onClick={() => setItemId("")}><X size={20} /></button>
        <WarehouseInspector item={item} {...actions} />
      </ModalDialog>
    </div>}
  </div>;
}
