import { Package } from "lucide-react";

export default function WarehouseItemGrid({ items, usingItemId, onSelectTargetItem, onUseItem }) {
  if (items.length === 0) {
    return (
      <div className="warehouse-empty">
        <Package />
        <strong>暂无道具</strong>
      </div>
    );
  }

  return (
    <div className="warehouse-grid">
      {items.map((item) => (
        <article className={`warehouse-item warehouse-item-category-${item.targetType || "self"}`} key={item.itemId}>
          {item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" decoding="async" /> : <Package />}
          <div>
            <strong>{item.name}</strong>
            <p>{item.description || "效果待配置"}</p>
            <span>数量 {item.quantity}</span>
          </div>
          <button
            className="primary-action"
            disabled={usingItemId === item.itemId || item.quantity <= 0}
            onClick={() => item.targetType === "character" ? onSelectTargetItem(item) : onUseItem(item)}
          >
            {usingItemId === item.itemId ? "使用中" : "使用"}
          </button>
        </article>
      ))}
    </div>
  );
}
