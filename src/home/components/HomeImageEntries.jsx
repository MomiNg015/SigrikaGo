export function HouseManualEntry({ onOpenHouse }) {
  return (
    <button className="home-image-entry house-manual-entry hologram-entry" data-ui-sound="none" onClick={onOpenHouse} aria-label="部员手册">
      <img src="/assets/home/book-entry.webp" alt="" aria-hidden="true" decoding="async" />
    </button>
  );
}

export function MatchEntry({ onStartMatch }) {
  return (
    <section className="home-match-feature" aria-label="星炬对弈入口">
      <button className="home-image-entry match-image-entry hologram-entry" data-ui-sound="none" onClick={onStartMatch} aria-label="星炬对弈">
        <img src="/assets/home/fantasy-match-entry.webp" alt="" aria-hidden="true" decoding="async" />
      </button>
    </section>
  );
}
