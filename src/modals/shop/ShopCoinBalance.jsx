import { CircleDollarSign } from "lucide-react";

export default function ShopCoinBalance({ coins = 0 }) {
  return (
    <p className="shop-wallet shop-header-balance" aria-label={`持有金币 ${coins}`}>
      <CircleDollarSign size={18} aria-hidden="true" />
      <span className="shop-header-balance-value">{coins}</span>
    </p>
  );
}
