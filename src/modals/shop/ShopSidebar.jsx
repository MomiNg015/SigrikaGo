import { CircleDollarSign } from "lucide-react";

export default function ShopSidebar({ mascotLine, user }) {
  return (
    <aside className="shop-sidebar" aria-label="扎希拉接待区">
      <div className="shop-mascot-bubble" aria-live="polite">{mascotLine}</div>
      <div className="shop-mascot-slot" aria-label="扎希拉立绘">
        <img src="/assets/zahiya_shop.webp" alt="扎希拉" decoding="async" />
      </div>
      <div className="shop-wallet-wrap">
        <span>你当前拥有</span>
        <p className="shop-wallet"><CircleDollarSign size={18} />{user?.coins ?? 0}</p>
      </div>
    </aside>
  );
}
