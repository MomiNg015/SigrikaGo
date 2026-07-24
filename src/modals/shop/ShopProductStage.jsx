import { useMemo, useRef } from "react";
import ShopItemCard from "./ShopItemCard.jsx";
import { layoutShopCards, SHOP_CARD_BASE_SIZE } from "./shopLayout.js";
import { useShopStageSize } from "./useShopStageSize.js";

export default function ShopProductStage({ batch, batchVersion, purchasingId, user, onBuy, onShowDetail }) {
  const stageRef = useRef(null);
  const size = useShopStageSize(stageRef);

  const entries = useMemo(() => {
    const placements = layoutShopCards({
      width: size.width,
      height: size.height,
      count: batch.length,
      mobile: size.mobile,
      seed: (batchVersion * 97) + batch.length
    });
    return placements.map((placement, index) => ({ presentation: batch[index], placement }))
      .sort((a, b) => (a.placement.y - b.placement.y) || (a.placement.x - b.placement.x));
  }, [batch, batchVersion, size]);

  return (
    <div
      className={`shop-product-stage shop-product-count-${batch.length}`}
      ref={stageRef}
      aria-label="商品区"
      data-batch-version={batchVersion}
    >
      <div className="shop-batch-layer" key={batchVersion}>
        {entries.map(({ presentation, placement }) => {
          const { item, rotation, floatDistance, floatDuration, floatDelay } = presentation;
          const baseSize = size.mobile ? SHOP_CARD_BASE_SIZE.mobile : SHOP_CARD_BASE_SIZE.desktop;
          return (
            <div
              className="shop-card-position"
              key={item.id}
              style={{
                "--shop-card-left": `${placement.x}px`,
                "--shop-card-top": `${placement.y}px`,
                "--shop-card-width": `${baseSize.width}px`,
                "--shop-card-height": `${baseSize.height}px`,
                "--shop-card-scale": placement.scale,
                "--shop-card-rotation": `${rotation}deg`,
                "--shop-card-float": `${floatDistance}px`,
                "--shop-card-float-duration": `${floatDuration}s`,
                "--shop-card-float-delay": `${floatDelay}s`
              }}
            >
              <div className="shop-card-scale">
                <div className="shop-card-rotation">
                  <div className="shop-card-float">
                    <ShopItemCard
                      item={item}
                      purchasingId={purchasingId}
                      user={user}
                      onBuy={onBuy}
                      onShowDetail={onShowDetail}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
