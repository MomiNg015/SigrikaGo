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
      {items.map((item) => {
        const disabled = item.usable === false || usingItemId === item.itemId || item.quantity <= 0;
        const actionLabel = item.usable === false ? "请去招募" : usingItemId === item.itemId ? "使用中" : "使用";
        return (
          <article className={`warehouse-item warehouse-item-category-${item.targetType || "self"}`} key={item.itemId}>
            <div className="warehouse-item-media">
              {item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" decoding="async" /> : <Package aria-hidden="true" />}
              <span className="warehouse-item-quantity" aria-label={`数量 ${item.quantity}`}>×{item.quantity}</span>
            </div>
            <div className="warehouse-item-copy">
              <strong>{item.name}</strong>
              <p>{item.description || "效果待配置"}</p>
            </div>
            <button
              type="button"
              className="primary-action"
              disabled={disabled}
              aria-label={`${actionLabel}：${item.name}`}
              onClick={() => item.targetType === "character" ? onSelectTargetItem(item) : onUseItem(item)}
            >
              {actionLabel}
            </button>
          </article>
        );
      })}
    </div>
  );
}
