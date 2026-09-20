/** Shared empty result, with a small paper sketch instead of another framed panel. */
export default function WindowEmptyState({ children, className = "", compact = false, as: Tag = "div", ...props }) {
  return <Tag {...props} className={`window-empty-state${compact ? " window-empty-compact" : ""}${className ? ` ${className}` : ""}`}>
    <svg className="window-empty-art" viewBox="0 0 100 76" fill="none" aria-hidden="true" focusable="false">
      <path className="window-empty-shadow" d="M22 17 74 12 82 64 29 69Z" />
      <path className="window-empty-sheet" d="M27 9 72 12 78 21 74 65 23 62Z" />
      <path className="window-empty-fold" d="m72 12-1 11 7-2" />
      <path className="window-empty-rule" d="m34 32 28 2m-29 8 24 2m-25 8 15 1" />
      <path className="window-empty-pencil" d="m12 47-5 2m9-28-4-4m73 18 6-1" />
    </svg>
    <span className="window-empty-label">{children}</span>
  </Tag>;
}
