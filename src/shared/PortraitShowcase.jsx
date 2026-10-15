import { PORTRAIT_VISIBLE_BOUNDS } from "./portraitVisibleBounds.js";

// Compare visible figures, not the transparent canvases supplied by artists.
export function portraitShowcaseAspect(sources) {
  return Math.max(0.7, ...sources.map((src) => {
    const bounds = PORTRAIT_VISIBLE_BOUNDS[src];
    return bounds ? bounds[4] / bounds[5] : 0.7;
  }));
}

export function portraitShowcaseViewBox(src, groupAspect) {
  const bounds = PORTRAIT_VISIBLE_BOUNDS[src];
  if (!bounds) return null;
  const [width, height, left, top, visibleWidth, visibleHeight] = bounds;
  const aspect = Math.max(groupAspect ?? 0.7, visibleWidth / visibleHeight);
  const frameWidth = visibleHeight * aspect * 1.12;
  const frameHeight = visibleHeight * 1.12;
  return {
    width,
    height,
    viewBox: `${left + visibleWidth / 2 - frameWidth / 2} ${top - visibleHeight * 0.06} ${frameWidth} ${frameHeight}`
  };
}

export default function PortraitShowcase({ src, alt = "", groupAspect }) {
  const frame = portraitShowcaseViewBox(src, groupAspect);
  const image = <img src={src} alt={alt} loading="lazy" decoding="async" />;
  return (
    <span className="portrait-showcase" data-normalized={Boolean(frame)}>
      {frame ? (
        <svg viewBox={frame.viewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <foreignObject x="0" y="0" width={frame.width} height={frame.height}>
            {image}
          </foreignObject>
        </svg>
      ) : image}
    </span>
  );
}
