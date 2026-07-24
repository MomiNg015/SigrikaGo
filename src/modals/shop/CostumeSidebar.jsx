import { COSTUME_MASCOT_IMAGES } from "../costumeShopHelpers.js";
import ShopWallet from "./ShopWallet.jsx";

export default function CostumeSidebar({ line, mood, user }) {
  return (
    <aside className="costume-shop-host" aria-label="娜波摩接待区">
      <div className="costume-shop-mascot-slot" role="img" aria-label="娜波摩立绘" data-mascot-mood={mood}>
        {Object.entries(COSTUME_MASCOT_IMAGES).map(([imageMood, src]) => (
          <img
            key={imageMood}
            className={`costume-shop-mascot costume-shop-mascot-${imageMood}${mood === imageMood ? " is-active" : ""}`}
            src={src}
            alt=""
            width="1024"
            height="1024"
            decoding="async"
            aria-hidden="true"
          />
        ))}
      </div>
      <div className="costume-shop-bubble" aria-live="polite">{line}</div>
      <ShopWallet className="costume-shop-wallet-wrap" user={user} />
    </aside>
  );
}
