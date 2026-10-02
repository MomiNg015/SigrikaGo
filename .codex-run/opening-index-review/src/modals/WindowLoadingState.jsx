/** A paper-and-pencil companion to the shared empty state. */
export default function WindowLoadingState({ children = "加载中…", compact = false }) {
  return <div className={`window-empty-state window-loading-state${compact ? " window-empty-compact window-loading-compact" : ""}`} role="status" aria-live="polite">
    <svg className="window-empty-art" viewBox="0 0 100 76" fill="none" aria-hidden="true" focusable="false">
      <path className="window-empty-shadow" d="M22 17 74 12 82 64 29 69Z" />
      <path className="window-empty-sheet" d="M27 9 72 12 78 21 74 65 23 62Z" />
      <path className="window-empty-fold" d="m72 12-1 11 7-2" />
      <path className="window-empty-rule" d="m34 32 25 2m-26 8 18 2m-19 8 12 1" />
      <g className="window-loading-pencil">
        <path d="m51 49 18-27 7 5-18 27-9 5Z" fill="var(--bright-yellow, #f5d879)" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="m51 49 7 5m-4-4 18-26m-23 35 3-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
    <span className="window-empty-label">{children}</span>
  </div>;
}
