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

  if (items.length === 0) return <WindowEmptyState className="warehouse-empty">暂无道具</WindowEmptyState>;

  const opensRecruitment = item?.usable === false;
  const disabled = !item || (opensRecruitment && !onOpenRecruitment) || Boolean(usingItemId) || item.quantity <= 0;
  const actionLabel = opensRecruitment ? "前去招募" : usingItemId === item?.itemId ? "使用中" : item?.quantity <= 0 ? "已用完" : "使用";
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
      </button>)}</div>
      {!visible.length && <WindowEmptyState>暂无这类道具</WindowEmptyState>}
      <footer className="wg-directory-footer">{visible.length} 种道具</footer>
    </section>
    {item && <section className="wg-inspector" aria-label="所选道具详情" aria-busy={Boolean(usingItemId)}>
      <div className="wg-hero"><span className="wg-orbit" aria-hidden="true"/><ItemArt item={item}/><span className="wg-hero-count">×{item.quantity}</span></div>
      <div className="wg-details"><span className="wg-type">{itemCategory(item)}</span><h3>{item.name}</h3><p>{item.description || "效果待配置"}</p>
      </div>
      <div className="wg-action-row">{item.actionVisible !== false && <button type="button" className="wg-use" disabled={disabled} aria-label={`${actionLabel}：${item.name}`} onClick={useSelected}>{actionLabel}<ArrowRight size={18}/></button>}</div>
      <nav className="wg-page-turn" aria-label="道具翻页">
        <button type="button" aria-label="上一件道具" disabled={visible.length < 2} onClick={() => select(visible[(index + visible.length - 1) % visible.length])}><ArrowLeft size={18}/></button>
        <span>{index + 1} / {visible.length}</span>
        <button type="button" aria-label="下一件道具" disabled={visible.length < 2} onClick={() => select(visible[(index + 1) % visible.length])}><ArrowRight size={18}/></button>
      </nav>
    </section>}
  </div>;
}
