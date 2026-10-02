export default function MatchModeWatermark({ mode }) {
  return (
    <span className="match-mode-watermark" aria-hidden="true">
      <img className="match-mode-watermark-icon" src={mode.iconUrl} alt="" decoding="async" />
      <span className="match-mode-watermark-label text-display-accent">{mode.englishLabel}</span>
    </span>
  );
}
