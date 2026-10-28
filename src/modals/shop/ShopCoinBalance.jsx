import StartorchCouponIcon from "../../shared/StartorchCouponIcon.jsx";

export default function ShopCoinBalance({ coins = 0 }) {
  return (
    <p className="shop-wallet shop-header-balance" aria-label={`持有星炬券 ${coins}`}>
      <StartorchCouponIcon decorative />
      <span className="shop-header-balance-value">{coins}</span>
    </p>
  );
}
