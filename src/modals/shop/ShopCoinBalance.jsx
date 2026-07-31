export default function ShopCoinBalance({ coins = 0 }) {
  return (
    <p className="shop-header-balance" aria-label={`持有金币 ${coins}`}>
      <span className="shop-header-balance-value">{coins}</span>
      <span className="shop-header-balance-unit">金币</span>
    </p>
  );
}
