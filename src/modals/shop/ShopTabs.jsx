export const SHOP_CATEGORIES = [
  ["item", "杂物"],
  ["decoration", "装饰"],
  ["music", "音乐"]
];

export default function ShopTabs({ activeCategory, onCategoryChange }) {
  return (
    <div className="shop-tabs" role="tablist" aria-label="商城分类">
      {SHOP_CATEGORIES.map(([key, label]) => (
        <button
          key={key}
          className={activeCategory === key ? "active" : ""}
          onClick={() => onCategoryChange(key)}
        >
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
