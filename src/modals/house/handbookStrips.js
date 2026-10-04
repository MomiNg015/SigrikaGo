export const HANDBOOK_STRIP_PAGE_SIZE = 10;

// The catalog has already applied backend sortOrder. Pagination must not
// replace that order with a portrait- or ownership-dependent order.
export function handbookStripPage(characters, page) {
  const pages = Math.max(1, Math.ceil(characters.length / HANDBOOK_STRIP_PAGE_SIZE));
  const currentPage = Math.max(0, Math.min(page, pages - 1));
  return { pages, currentPage, roster: characters.slice(currentPage * HANDBOOK_STRIP_PAGE_SIZE,
    (currentPage + 1) * HANDBOOK_STRIP_PAGE_SIZE) };
}

export function handbookStripArtStyle(portrait, { width, height }, { mobile, expanded, count, index = 0 }) {
  const compactMascot = mobile && !expanded && portrait.visibleTop === 175;
  const artHeight = mobile
    ? compactMascot ? 120 : portrait.isStandard ? (expanded ? 510 : 470) : Math.min(expanded ? 294 : 270, width - 16)
    : portrait.isStandard
      ? Math.min(width / Math.max(1, count) * 1.35, height * .38) / (portrait.headWidth ?? 260) * portrait.height * (portrait.desktopScale ?? 1)
      : Math.min(280, height * .7, width / Math.max(1, count) * 3);
  const scale = artHeight / portrait.height;
  const top = mobile && (expanded || compactMascot) ? 8 - (portrait.visibleTop ?? 0) * scale
    : (mobile ? 48 : height * .25) - portrait.focal[1] * scale;
  return {
    width: portrait.width * scale, height: artHeight,
    left: `calc(${mobile ? index % 2 ? 72 : 28 : expanded ? 20 : 50}% - ${portrait.focal[0] * scale}px)`,
    top,
    ...portrait.style
  };
}
