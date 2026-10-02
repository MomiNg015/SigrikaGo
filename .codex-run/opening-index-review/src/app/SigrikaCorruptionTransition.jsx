const TRANSITION_SLICES = [
  { height: "11%", origin: "left", top: "8%", travel: "7vw" },
  { height: "18%", origin: "right", top: "24%", travel: "-9vw" },
  { height: "9%", origin: "left", top: "48%", travel: "11vw" },
  { height: "16%", origin: "right", top: "61%", travel: "-8vw" },
  { height: "12%", origin: "left", top: "83%", travel: "10vw" }
];

export default function SigrikaCorruptionTransition({ transition }) {
  if (!transition) return null;
  const { direction, phase, timings } = transition;

  return (
    <div
      aria-hidden="true"
      className="sigrika-theme-transition"
      data-direction={direction}
      data-phase={phase}
      style={{
        "--sigrika-transition-cover-duration": `${timings.coverMs}ms`,
        "--sigrika-transition-reveal-duration": `${timings.revealMs}ms`
      }}
    >
      <span className="sigrika-theme-transition__veil" />
      <span className="sigrika-theme-transition__pulse" />
      <span className="sigrika-theme-transition__slices">
        {TRANSITION_SLICES.map((slice, index) => (
          <span
            className="sigrika-theme-transition__slice"
            key={`${slice.top}-${slice.height}`}
            style={{
              "--sigrika-transition-slice-height": slice.height,
              "--sigrika-transition-slice-index": index,
              "--sigrika-transition-slice-origin": slice.origin,
              "--sigrika-transition-slice-top": slice.top,
              "--sigrika-transition-slice-travel": slice.travel
            }}
          />
        ))}
      </span>
      <span className="sigrika-theme-transition__fault sigrika-theme-transition__fault--upper" />
      <span className="sigrika-theme-transition__fault sigrika-theme-transition__fault--lower" />
    </div>
  );
}
