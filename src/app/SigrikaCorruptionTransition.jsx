import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ModalDialog } from "../modals/modalComponents.jsx";

const TRANSITION_SLICES = [
  { height: "11%", origin: "left", top: "8%", travel: "7vw" },
  { height: "18%", origin: "right", top: "24%", travel: "-9vw" },
  { height: "9%", origin: "left", top: "48%", travel: "11vw" },
  { height: "16%", origin: "right", top: "61%", travel: "-8vw" },
  { height: "12%", origin: "left", top: "83%", travel: "10vw" }
];

export default function SigrikaCorruptionTransition({ transition, onConfirm }) {
  if (!transition) return null;
  if (transition.direction === "enter") return <NegativeEntry transition={transition} onConfirm={onConfirm} />;
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
function NegativeEntry({ transition, onConfirm }) {
  const layerRef = useRef(null);
  const buttonRef = useRef(null);
  useEffect(() => {
    const root = document.getElementById("root");
    const previous = root?.inert;
    if (root) root.inert = true;
    layerRef.current?.focus({ preventScroll: true });
    return () => { if (root) root.inert = previous; };
  }, []);
  useEffect(() => {
    if (transition.phase === "choice" && transition.ready) buttonRef.current?.focus({ preventScroll: true });
  }, [transition.phase, transition.ready]);
  return createPortal(
    <div className="sigrika-negative-entry" data-phase={transition.phase} ref={layerRef} tabIndex={-1}
      onKeyDown={(event) => { if (event.key === "Escape" || event.key === "Tab") { event.preventDefault(); event.stopPropagation(); } }}>
      <div className="sigrika-negative-entry__film" aria-hidden="true" />
      {transition.phase === "choice" && <ModalDialog className="sigrika-negative-entry__dialog" ariaLabel="用户对话选项">
        <button ref={buttonRef} type="button" className="sigrika-negative-entry__choice" disabled={!transition.ready}
          aria-busy={!transition.ready || undefined} onClick={onConfirm} data-ui-sound="none">......怎么回事？？</button>
      </ModalDialog>}
    </div>, document.body
  );
}
