import { SHOP_WALLET_IMAGE } from "../shopModalHelpers.js";

export default function ShopWallet({ className = "", user }) {
  return (
    <div className={`shop-wallet-wrap${className ? ` ${className}` : ""}`}>
      <img className="shop-wallet-image" src={SHOP_WALLET_IMAGE} alt="钱包" width="1024" height="768" />
      <p className="shop-wallet" aria-label={`持有金币 ${user?.coins ?? 0}`}>
        <span className="shop-wallet-value">{user?.coins ?? 0}</span>
        <span className="shop-wallet-unit">金币</span>
      </p>
    </div>
  );
}
