import { CorruptionFragmentImage } from "../../ui/CorruptionMarks.jsx";

const HOUSE_MANUAL_IMAGE = "/assets/home/book-entry.webp";

export function HouseManualEntry({ onOpenHouse, sigrikaCorrupted = false }) {
  return (
    <button className={`home-image-entry house-manual-entry hologram-entry${sigrikaCorrupted ? " is-corruption-access-point" : ""}`} data-ui-sound="none" onClick={onOpenHouse} aria-label="部员手册">
      <span className="home-entry-motion" aria-hidden="true">
        <img
          className={sigrikaCorrupted ? "house-manual-corruption-source" : undefined}
          src={HOUSE_MANUAL_IMAGE}
          alt=""
          decoding="async"
        />
        {sigrikaCorrupted && (
          <CorruptionFragmentImage
            className="house-manual-data-fragments"
            columns={10}
            rows={12}
            seed="home-house-access"
            src={HOUSE_MANUAL_IMAGE}
          />
        )}
      </span>
    </button>
  );
}

export function MatchEntry({ onStartMatch, onPreloadPlayableReady, sigrikaCorrupted = false }) {
  return (
    <section className="home-match-feature" aria-label="星炬对弈入口">
      <button
        className={`home-image-entry match-image-entry hologram-entry${sigrikaCorrupted ? " is-corruption-access-point" : ""}`}
        data-ui-sound="none"
        onClick={onStartMatch}
        onFocus={onPreloadPlayableReady}
        onPointerEnter={onPreloadPlayableReady}
        aria-label="星炬对弈"
      >
        <span className="home-entry-motion" aria-hidden="true">
          <img src="/assets/home/fantasy-match-entry.webp" alt="" decoding="async" />
        </span>
      </button>
    </section>
  );
}
