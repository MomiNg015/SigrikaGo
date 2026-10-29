/** Keep the complete animated corner paint inside the viewport. */
export function guideFocusGeometry(rect, viewport, padding = 0) {
  const left = Math.max(4, rect.left - padding);
  const top = Math.max(4, rect.top - padding);
  const right = Math.min(viewport.width - 4, rect.right + padding);
  const bottom = Math.min(viewport.height - 4, rect.bottom + padding);
  const width = right - left, height = bottom - top;
  if (width <= 0 || height <= 0) return null;
  const roomX = Math.max(0, Math.min(left, viewport.width - right) - 4);
  const roomY = Math.max(0, Math.min(top, viewport.height - bottom) - 4);
  return {
    left, top, width, height,
    "--guide-focus-out-x": 1 + Math.min(10, roomX) * 2 / width,
    "--guide-focus-out-y": 1 + Math.min(10, roomY) * 2 / height,
    "--guide-focus-in-x": 1 - Math.min(5, width * .04) * 2 / width,
    "--guide-focus-in-y": 1 - Math.min(5, height * .04) * 2 / height
  };
}
