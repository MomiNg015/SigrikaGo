import { useState } from "react";
import { ArrowLeft, ArrowRight, Package } from "lucide-react";
import WindowEmptyState from "../WindowEmptyState.jsx";
import { isRecruitmentItemType } from "../../shared/recruitment.js";

const filters = ["全部", "消耗品", "招募"];
const itemCategory = (item) => isRecruitmentItemType(item.itemId) || item.usable === false ? "招募" : "消耗品";

function ItemArt({ item }) {
  const [failedSource, setFailedSource] = useState("");
  return item.imageUrl && failedSource !== item.imageUrl
    ? <img src={item.imageUrl} alt="" loading="lazy" decoding="async" onError={() => setFailedSource(item.imageUrl)} />
    : <Package aria-hidden="true" />;
}

export default function WarehouseItemGrid({ items, usingItemId, onSelectTargetItem, onUseItem, onOpenRecruitment }) {
  const [filter, setFilter] = useState("全部");
  const [selection, setSelection] = useState({ id: "", index: 0 });
  const visible = items.filter(item => filter === "全部" || itemCategory(item) === filter);
  const item = visible.find(entry => entry.itemId === selection.id)
    ?? visible[Math.min(selection.index, visible.length - 1)];
  const index = visible.indexOf(item);
  const select = (next) => setSelection({ id: next.itemId, index: visible.indexOf(next) });

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
      <nav className="wg-filters" aria-label="道具分类">{filters.map(label => <button type="button" key={label} aria-pressed={filter === label} onClick={() => { setFilter(label); setSelection({ id: "", index: 0 }); }}>{label}</button>)}</nav>
      <div className="wg-list">{visible.map((entry) => <button type="button" className="wg-entry" key={entry.itemId} aria-pressed={item?.itemId === entry.itemId} aria-label={`${entry.name}，数量 ${entry.quantity}`} onClick={() => select(entry)}>
        <span className="wg-thumbnail"><ItemArt item={entry}/></span>
        <span className="wg-name">{entry.name}</span>
        <span className="wg-quantity" aria-label={`数量 ${entry.quantity}`}>×{entry.quantity}</span>
      </button>)}
        {!visible.length && <WindowEmptyState className="wg-list-empty" compact>{items.length ? "暂无这类道具" : "暂无道具"}</WindowEmptyState>}
      </div>
      <footer className="wg-directory-footer">{visible.length} 种道具</footer>
    </section>
    <section className="wg-inspector" aria-label={item ? "所选道具详情" : "道具详情"} aria-busy={Boolean(usingItemId)}>
      <div className="wg-hero"><span className="wg-orbit" aria-hidden="true"/>{item ? <ItemArt item={item}/> : <Package aria-hidden="true"/>}<span className="wg-hero-count">×{item?.quantity ?? 0}</span></div>
      <div className="wg-details"><span className="wg-type">{item ? itemCategory(item) : filter}</span><h3>{item?.name ?? "道具详情"}</h3><p>{item ? item.description || "效果待配置" : "暂无道具说明"}</p>
      </div>
      <div className="wg-action-row">{item?.actionVisible !== false && <button type="button" className="wg-use" disabled={disabled} aria-label={item ? `${actionLabel}：${item.name}` : actionLabel} onClick={useSelected}>{actionLabel}<ArrowRight size={18}/></button>}</div>
      <nav className="wg-page-turn" aria-label="道具翻页">
        <button type="button" aria-label="上一件道具" disabled={visible.length < 2} onClick={() => select(visible[(index + visible.length - 1) % visible.length])}><ArrowLeft size={18}/></button>
        <span>{index + 1} / {visible.length}</span>
        <button type="button" aria-label="下一件道具" disabled={visible.length < 2} onClick={() => select(visible[(index + 1) % visible.length])}><ArrowRight size={18}/></button>
      </nav>
    </section>
  </div>;
}
