import { modeOrderedEntries } from "../../shared/gameModes.js";

export function HouseManualEntry({ onOpenHouse }) {
  return (
    <button className="home-image-entry house-manual-entry hologram-entry" data-hud="部员手册" data-ui-sound="none" onClick={onOpenHouse} aria-label="部员手册">
      <img src="/assets/home/book-entry.webp" alt="部员手册" decoding="async" />
    </button>
  );
}

export function MatchEntry({ matchmakingCounts = {}, onStartMatch }) {
  return (
    <section className="home-match-feature" aria-label="星炬对弈入口">
      <button className="home-image-entry match-image-entry hologram-entry" data-hud="匹配对局" data-ui-sound="none" onClick={onStartMatch} aria-label="星炬对弈">
        <img src="/assets/home/fantasy-match-entry.webp" alt="星炬对弈" decoding="async" />
      </button>
      <div className="home-match-mode-tickets" aria-label="各模式匹配人数">
        {modeOrderedEntries().map((mode) => (
          <span className={`home-match-mode-ticket home-match-mode-ticket-${mode.id}`} key={mode.id}>
            <b>{mode.shortTitle}</b>
            <small>
              <span className="home-match-mode-count">{Number(matchmakingCounts[mode.id] ?? 0)}</span>
              <span className="home-match-mode-label">匹配中</span>
            </small>
          </span>
        ))}
      </div>
    </section>
  );
}
