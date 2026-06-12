import { CircleDollarSign, Gem, History, List, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { buildGachaRewardLabel, formatGachaDateRange, formatGachaRemaining, gachaPrizeTypeLabel } from "./gacha/gachaHelpers.js";
import { useGachaCatalog } from "./gacha/useGachaCatalog.js";

export default function GachaModal({ token, user, initialPools = [], onUserChange, onNotice, onClose }) {
  const [panel, setPanel] = useState("");
  const {
    activePool,
    activePoolId,
    draw,
    drawing,
    history,
    loading,
    pools,
    refreshHistory,
    result,
    setActivePoolId,
    setResult,
    wallet
  } = useGachaCatalog({ token, user, initialPools, onNotice, onUserChange });

  function openHistory() {
    setPanel("history");
    refreshHistory();
  }

  return (
    <div className="modal-backdrop gacha-backdrop" onClick={onClose}>
      <section className={`gacha-modal ${drawing ? "drawing" : ""}`} onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" onClick={onClose}><X size={20} /></button>
        <aside className="gacha-pool-tabs" role="tablist" aria-label="扭蛋池">
          {pools.map((pool) => (
            <button
              key={pool.id}
              className={`gacha-ticket-tab ${activePoolId === pool.id ? "active" : ""}`}
              type="button"
              role="tab"
              onClick={() => setActivePoolId(pool.id)}
            >
              <img src={pool.featuredPrize?.imageUrl || "/assets/items/rainbow-bean-candy.webp"} alt="" decoding="async" />
              <span>{pool.name}</span>
              <small>{formatGachaDateRange(pool)}</small>
            </button>
          ))}
        </aside>

        <div className="gacha-main">
          {loading && <p className="quiet-text">加载扭蛋池...</p>}
          {!loading && !activePool && <p className="quiet-text">当前没有开放中的扭蛋池</p>}
          {activePool && (
            <>
              <div className="gacha-featured-stage">
                <div className="gacha-machine" aria-hidden="true">
                  <div className="gacha-drum">
                    <span className="gacha-capsule cap-a" />
                    <span className="gacha-capsule cap-b" />
                    <span className="gacha-capsule cap-c" />
                  </div>
                  <div className="gacha-slot" />
                </div>
                <div className="gacha-featured-prize">
                  <img src={activePool.featuredPrize?.imageUrl || "/assets/items/rainbow-bean-candy.webp"} alt={activePool.featuredPrize?.name ?? activePool.name} decoding="async" />
                  <div>
                    <span>Featured</span>
                    <strong>{activePool.featuredPrize?.name || activePool.name}</strong>
                    <small>{formatGachaRemaining(activePool.remainingMs)}</small>
                  </div>
                </div>
              </div>

              <div className="gacha-control-panel">
                <div className="gacha-wallet" aria-label="钱包">
                  <span><CircleDollarSign size={18} />{wallet.coins}</span>
                  <span><Gem size={18} />{wallet.blueGems}</span>
                </div>
                <div className="gacha-round-actions">
                  <button className="gacha-round-button" type="button" onClick={() => setPanel("prizes")} title="奖项列表"><List size={20} /></button>
                  <button className="gacha-round-button" type="button" onClick={openHistory} title="抽奖记录"><History size={20} /></button>
                </div>
                <div className="gacha-draw-actions">
                  <button className="primary-action" type="button" disabled={drawing} onClick={() => draw(1)}>
                    <Sparkles size={18} /> 单抽 {activePool.singleDrawPrice}
                  </button>
                  <button className="primary-action gacha-ten-draw" type="button" disabled={drawing} onClick={() => draw(10)}>
                    <Sparkles size={18} /> 十连 {activePool.tenDrawPrice}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {panel === "prizes" && <GachaPrizePanel pool={activePool} onClose={() => setPanel("")} />}
        {panel === "history" && <GachaHistoryPanel records={history} onClose={() => setPanel("")} />}
        {result && <GachaResultDialog result={result} onClose={() => setResult(null)} />}
      </section>
    </div>
  );
}

function GachaPrizePanel({ pool, onClose }) {
  return (
    <div className="nested-modal-backdrop" onClick={onClose}>
      <section className="nested-modal gacha-list-dialog" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" onClick={onClose}><X size={18} /></button>
        <h2>奖项列表</h2>
        <div className="gacha-prize-list">
          {(pool?.prizes ?? []).map((prize) => (
            <article className="gacha-prize-row" key={prize.id}>
              <img src={prize.imageUrl || "/assets/items/rainbow-bean-candy.webp"} alt="" decoding="async" />
              <strong>{prize.name || prize.targetId || gachaPrizeTypeLabel(prize.type)}</strong>
              <span>{gachaPrizeTypeLabel(prize.type)} x{prize.quantity}</span>
              <b>{prize.probabilityPercent}%</b>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function GachaHistoryPanel({ records, onClose }) {
  return (
    <div className="nested-modal-backdrop" onClick={onClose}>
      <section className="nested-modal gacha-list-dialog" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" onClick={onClose}><X size={18} /></button>
        <h2>抽奖记录</h2>
        <div className="gacha-history-list">
          {records.map((record) => (
            <article key={record.id}>
              <strong>{record.poolName}</strong>
              <span>{record.drawCount} pulls / {record.coinCost} coins</span>
              <small>{new Date(record.createdAt).toLocaleString()}</small>
            </article>
          ))}
          {records.length === 0 && <p className="quiet-text">暂无记录</p>}
        </div>
      </section>
    </div>
  );
}

function GachaResultDialog({ result, onClose }) {
  return (
    <div className="nested-modal-backdrop gacha-result-backdrop" onClick={onClose}>
      <section className="nested-modal gacha-result-dialog" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" onClick={onClose}><X size={18} /></button>
        <h2>本次获得</h2>
        <div className="gacha-result-grid">
          {(result.rewards ?? []).map((reward, index) => (
            <article className="gacha-result-card" key={`${reward.prizeId}-${index}`}>
              <span className="gacha-result-orb" />
              <strong>{buildGachaRewardLabel(reward)}</strong>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
