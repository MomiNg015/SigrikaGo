import { useEffect, useState } from "react";

export const DESKTOP_MINIMUM_VIEWPORT = Object.freeze({
  width: 1440,
  height: 768
});

export const COMPACT_VIEWPORT_RANGE = Object.freeze({
  minShortSide: 320,
  maxShortSide: 480,
  minLongSide: 568,
  maxLongSide: 1024
});
export const NARROW_PORTRAIT_VIEWPORT_RANGE = Object.freeze({
  minWidth: 320,
  maxWidth: 520,
  minHeight: 568
});

export function isCompactViewport({ height = 0, width = 0 } = {}) {
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  const fitsRotatableRange =
    shortSide >= COMPACT_VIEWPORT_RANGE.minShortSide &&
    shortSide <= COMPACT_VIEWPORT_RANGE.maxShortSide &&
    longSide >= COMPACT_VIEWPORT_RANGE.minLongSide &&
    longSide <= COMPACT_VIEWPORT_RANGE.maxLongSide;
  const fitsNarrowPortraitRange =
    width >= NARROW_PORTRAIT_VIEWPORT_RANGE.minWidth &&
    width <= NARROW_PORTRAIT_VIEWPORT_RANGE.maxWidth &&
    height >= NARROW_PORTRAIT_VIEWPORT_RANGE.minHeight;

  return fitsRotatableRange || fitsNarrowPortraitRange;
}

export function shouldBlockDesktopViewport({
  compactLayout = false,
  height = 0,
  width = 0
} = {}) {
  if (compactLayout) return false;
  return width < DESKTOP_MINIMUM_VIEWPORT.width || height < DESKTOP_MINIMUM_VIEWPORT.height;
}

function readDesktopViewportState(viewport = globalThis.window) {
  if (!viewport) return false;

  return shouldBlockDesktopViewport({
    compactLayout: isCompactViewport({
      height: viewport.innerHeight,
      width: viewport.innerWidth
    }),
    height: viewport.innerHeight,
    width: viewport.innerWidth
  });
}

export function useDesktopViewportGate() {
  const [blocked, setBlocked] = useState(() => readDesktopViewportState());

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const update = () => setBlocked(readDesktopViewportState());

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return blocked;
}

export default function DesktopViewportGate({ children }) {
  const blocked = useDesktopViewportGate();

  if (!blocked) return children;

  return (
    <main className="desktop-viewport-gate" role="alert" aria-live="polite">
      <section className="desktop-viewport-gate-panel">
        <span className="desktop-viewport-gate-mark" aria-hidden="true">↗</span>
        <h1>请用合适尺寸窗口进行游玩</h1>
      </section>
    </main>
  );
}
