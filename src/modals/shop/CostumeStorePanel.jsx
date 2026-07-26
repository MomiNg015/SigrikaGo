import { useMemo, useRef } from "react";
import { buildShopCardPresentation } from "../shopModalHelpers.js";
import CostumeCard from "./CostumeCard.jsx";
import CostumeSidebar from "./CostumeSidebar.jsx";
import {
  createShopSeededRandom,
  layoutShopCards,
  SHOP_CARD_BASE_SIZE
} from "./shopLayout.js";
import { useShopStageSize } from "./useShopStageSize.js";

export default function CostumeStorePanel({
  batch,
  batchVersion,
  mascotLine,
  mascotMood,
  user,
  onShowDetail,
  onSwitchShop
}) {
  const stageRef = useRef(null);
  const size = useShopStageSize(stageRef);
  const presentations = useMemo(() => buildShopCardPresentation(
    batch,
    createShopSeededRandom((batchVersion * 131) + batch.length)
  ), [batch, batchVersion]);
  const entries = useMemo(() => {
    const placements = layoutShopCards({
      width: size.width,
      height: size.height,
      count: presentations.length,
      mobile: size.mobile,
      seed: (batchVersion * 97) + presentations.length
    });
    return placements.map((placement, index) => ({
      placement,
      presentation: presentations[index]
    })).sort((a, b) => (
      (a.placement.y - b.placement.y) || (a.placement.x - b.placement.x)
    ));
  }, [batchVersion, presentations, size]);

  return (
    <div className="costume-store-panel" data-batch-version={batchVersion}>
      <CostumeSidebar line={mascotLine} mood={mascotMood} user={user} />
      <section
        className={`costume-shop-stage costume-shop-count-${batch.length}`}
        ref={stageRef}
        aria-label="服装商品区"
      >
        <div className="shop-batch-layer costume-shop-batch-layer" key={batchVersion}>
          {entries.map(({ placement, presentation }, index) => {
            const { item: costume, rotation, floatDistance, floatDuration, floatDelay } = presentation;
            const baseSize = size.mobile ? SHOP_CARD_BASE_SIZE.mobile : SHOP_CARD_BASE_SIZE.desktop;
            return (
              <div
                className="shop-card-position costume-shop-card-slot"
                key={costume.id}
                style={{
                  "--costume-card-index": index,
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
                      <CostumeCard costume={costume} onShowDetail={onShowDetail} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {batch.length === 0 && <p className="costume-shop-empty">今天的衣架已经空了。</p>}
      </section>
      <button className="shop-switch-button costume-to-zahira" type="button" onClick={onSwitchShop}>
        <span>扎希拉商店</span>
      </button>
    </div>
  );
}
