import CostumeCard from "./CostumeCard.jsx";
import CostumeSidebar from "./CostumeSidebar.jsx";

export default function CostumeStorePanel({
  batch,
  batchVersion,
  mascotLine,
  mascotMood,
  user,
  onShowDetail,
  onSwitchShop
}) {
  return (
    <div className="costume-store-panel" data-batch-version={batchVersion}>
      <CostumeSidebar line={mascotLine} mood={mascotMood} user={user} />
      <section className={`costume-shop-stage costume-shop-count-${batch.length}`} aria-label="服装商品区">
        {batch.map((costume, index) => (
          <div className="costume-shop-card-slot" key={costume.id} style={{ "--costume-card-index": index }}>
            <CostumeCard costume={costume} onShowDetail={onShowDetail} />
          </div>
        ))}
        {batch.length === 0 && <p className="costume-shop-empty">今天的衣架已经空了。</p>}
      </section>
      <button className="shop-switch-button costume-to-zahira" type="button" onClick={onSwitchShop}>
        扎希拉商店 →
      </button>
    </div>
  );
}
