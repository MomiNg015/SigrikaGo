import {
  SHOP_MASCOT_DEFAULT_IMAGE,
  SHOP_MASCOT_MOODS,
  SHOP_MASCOT_THANKS_IMAGE,
  SHOP_WALLET_IMAGE
} from "../shopModalHelpers.js";

export default function ShopSidebar({ mascotLine, mascotMood = SHOP_MASCOT_MOODS.default, user }) {
  const thanksActive = mascotMood === SHOP_MASCOT_MOODS.thanks;

  return (
    <aside className="shop-sidebar shop-host" aria-label="扎希拉接待区">
      <div className="shop-mascot-bubble" aria-live="polite">{mascotLine}</div>
      <div className="shop-mascot-slot" role="img" aria-label="扎希拉立绘" data-mascot-mood={mascotMood}>
        <img
          className={`shop-mascot-image shop-mascot-image-default${thanksActive ? "" : " is-active"}`}
          src={SHOP_MASCOT_DEFAULT_IMAGE}
          alt=""
          width="1448"
          height="1054"
          decoding="async"
          aria-hidden="true"
        />
        <img
          className={`shop-mascot-image shop-mascot-image-thanks${thanksActive ? " is-active" : ""}`}
          src={SHOP_MASCOT_THANKS_IMAGE}
          alt=""
          width="1448"
          height="1054"
          decoding="async"
          aria-hidden="true"
        />
      </div>
      <div className="shop-wallet-wrap">
        <img className="shop-wallet-image" src={SHOP_WALLET_IMAGE} alt="钱包" width="1024" height="768" />
        <p className="shop-wallet" aria-label={`持有金币 ${user?.coins ?? 0}`}>
          <span className="shop-wallet-value">{user?.coins ?? 0}</span>
          <span className="shop-wallet-unit">金币</span>
        </p>
      </div>
    </aside>
  );
}
