import { useRef, useState } from "react";
import { X } from "lucide-react";
import { ModalActionButton, ModalDialog } from "../modalComponents.jsx";
import WindowEmptyState from "../WindowEmptyState.jsx";
import { ItemArt, WarehouseDirectory, WarehouseInspector } from "./WarehouseItemGrid.jsx";
import { useWarehouseListRows } from "./useWarehouseListRows.js";

const MAX_COPIES_PER_ITEM = 10;
const GOLDEN_ANGLE = 137.508;

function itemRandom(seed, itemId) {
  let state = seed;
  for (const character of String(itemId)) state = Math.imul(state ^ character.codePointAt(0), 16777619);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 0x100000000;
  };
}

function scatterItems(items, seed) {
  return [...items].sort((first, second) => first.quantity - second.quantity).flatMap((item, index) => {
    const random = itemRandom(seed, item.itemId);
    const baseAngle = random() * 360;
    return Array.from({ length: Math.min(MAX_COPIES_PER_ITEM, item.quantity) }, (_, copy) => {
      return {
        item, key: `${item.itemId}-${copy}`,
        style: {
          left: `${19 + random() * 62}%`,
          top: `${33 + random() * 43}%`,
          "--wg-angle": `${(baseAngle + copy * GOLDEN_ANGLE + random() * 18) % 360}deg`,
          zIndex: items.length - index
        }
      };
    });
  });
}

export default function WarehouseBox({ items, targetOpen, ...actions }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [itemId, setItemId] = useState("");
  const [scatterSeed] = useState(() => Math.floor(Math.random() * 0x100000000));
  const toggleRef = useRef(null);
  const listRef = useWarehouseListRows(drawerOpen);
  const stocked = items.filter(item => item.quantity > 0);
  const sparse = stocked.reduce((total, entry) => total + Math.min(MAX_COPIES_PER_ITEM, entry.quantity), 0) <= 5;
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
    <div className="wg-pile" data-sparse={sparse || undefined} inert={drawerOpen && Boolean(stocked.length)} aria-label="箱内道具">
      {scatterItems(stocked, scatterSeed).map(({ item: entry, key, style }) => <button type="button" className="wg-loot" key={key} style={style} aria-label={`查看道具详情：${entry.name}，持有 ${entry.quantity}`} onClick={() => setItemId(entry.itemId)}>
        <ItemArt item={entry} />
      </button>)}
      {!stocked.length && <WindowEmptyState compact>暂无道具</WindowEmptyState>}
    </div>
    <div className="wg-drawer" id="warehouse-box-directory" inert={!drawerOpen || !stocked.length}>
      <p className="wg-drawer-summary">目前已持有{stocked.length}种物品</p>
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
