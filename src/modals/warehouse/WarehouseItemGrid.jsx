import { useState } from "react";
import { ArrowRight, Check, Package } from "lucide-react";
import WindowEmptyState from "../WindowEmptyState.jsx";
import { useWarehouseListRows } from "./useWarehouseListRows.js";

function ItemArt({ item }) {
  const [failedSource, setFailedSource] = useState("");
  return item.imageUrl && failedSource !== item.imageUrl
    ? <img src={item.imageUrl} alt="" loading="lazy" decoding="async" onError={() => setFailedSource(item.imageUrl)} />
    : <Package aria-hidden="true" />;
}

export default function WarehouseItemGrid({ items, usingItemId, onSelectTargetItem, onUseItem, onOpenRecruitment }) {
  const [selection, setSelection] = useState({ id: "", index: 0 });
  const listRef = useWarehouseListRows();
  const item = items.find(entry => entry.itemId === selection.id)
    ?? items[Math.min(selection.index, items.length - 1)];
  const select = (next) => setSelection({ id: next.itemId, index: items.indexOf(next) });

  const opensRecruitment = item?.usable === false;
  const disabled = !item || (opensRecruitment && !onOpenRecruitment) || Boolean(usingItemId) || item.quantity <= 0;
  const actionLabel = !item ? "使用" : opensRecruitment ? "前去招募" : usingItemId === item.itemId ? "使用中" : item.quantity <= 0 ? "已用完" : "使用";
  function useSelected() {
    if (disabled || item.actionVisible === false) return;
    if (opensRecruitment) { onOpenRecruitment(); return; }
    if (item.targetType === "character") onSelectTargetItem(item);
    else onUseItem(item);
  }

  return <div className="wg-book">
    <section className="wg-directory" aria-label="道具目录">
      <div className="wg-list" ref={listRef}>{items.map((entry) => <button type="button" className="wg-entry" key={entry.itemId} aria-pressed={item?.itemId === entry.itemId} aria-label={`${entry.name}，数量 ${entry.quantity}`} onClick={() => select(entry)}>
        <span className="wg-thumbnail"><ItemArt item={entry}/></span>
        <span className="wg-name">{entry.name}</span>
        <ItemQuantity value={entry.quantity}/>
        <Check className="wg-selected-mark" size={15} aria-hidden="true"/>
      </button>)}
        {!items.length && <WindowEmptyState className="wg-list-empty" compact>暂无道具</WindowEmptyState>}
      </div>
    </section>
    <section className="wg-inspector" aria-label={item ? "所选道具详情" : "道具详情"} aria-busy={Boolean(usingItemId)}>
      <div className="wg-hero"><span className="wg-orbit" aria-hidden="true"/>{item ? <ItemArt item={item}/> : <Package aria-hidden="true"/>}</div>
      <div className="wg-details"><h3>{item?.name ?? "道具详情"}</h3><p>{item ? item.description || "效果待配置" : "暂无道具说明"}</p>
      </div>
      <div className="wg-action-row"><ItemQuantity value={item?.quantity ?? 0}/>{item?.actionVisible !== false && <button type="button" className="wg-use" disabled={disabled} aria-label={item ? `${actionLabel}：${item.name}` : actionLabel} onClick={useSelected}>{actionLabel}<ArrowRight size={18}/></button>}</div>
    </section>
  </div>;
}

function ItemQuantity({ value }) {
  return <span className="wg-quantity" aria-label={`持有 ${value}`}><span>持有</span><strong>{value}</strong></span>;
}
