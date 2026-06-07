export function HouseManualEntry({ onOpenHouse }) {
  return (
    <button className="home-image-entry house-manual-entry hologram-entry" data-hud="部员手册" onClick={onOpenHouse} aria-label="部员手册">
      <img src="/assets/home/book-entry.webp" alt="部员手册" decoding="async" />
    </button>
  );
}

export function MatchEntry({ matchmakingCount, onStartMatch }) {
  return (
    <section className="home-match-feature" aria-label="空想对局入口">
      <button className="home-image-entry match-image-entry hologram-entry" data-hud="匹配对局" onClick={onStartMatch} aria-describedby="matchmaking-count-popup">
        <img src="/assets/home/fantasy-match-entry.webp" alt="空想对局" decoding="async" />
      </button>
      <div id="matchmaking-count-popup" className="matchmaking-popup" role="status" aria-label="匹配状态、规则与用时">
        <span>当前匹配人数：{matchmakingCount}</span>
        <span>路数：13路</span>
        <span>用时：5分钟30秒3次</span>
        <span>规则：黑贴2又3/4子，中国数子规则</span>
      </div>
    </section>
  );
}
