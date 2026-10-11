import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { AEMEATH_GLITCH_START_MS, AEMEATH_GLITCH_DURATION_MS } from "../shared/aemeathSkillForm.js";
import AemeathSignalFilter from "./AemeathSignalFilter.jsx";

// Deterministic compression fragments; no particles or per-frame DOM updates.
const SIGNAL_FRAGMENTS = Array.from({ length: 36 }, (_, index) => ({
  x: (index * 271) % 1000,
  y: (index * 137) % 1000,
  width: 24 + (index * 59) % 240,
  height: 2 + (index * 13) % 24,
  opacity: .12 + (index % 4) * .08
}));
// Chromium does not reliably repaint SVG backdrop URLs in a CSS animation.
// Discrete signal changes invalidate the actual backdrop, without a frame loop.
const SIGNAL_CUTS = [[.02, "tick"], [.16, "none"], [.22, "lock"], [.30, "break"],
  [.37, "lock"], [.42, "break"], [.50, "lock"], [.54, "break"], [.66, "lock"], [.73, "tick"],
  [.79, "lock"], [.85, "tick"], [.94, "none"]];

export default function AemeathDataGlitch() {
  const [active, setActive] = useState(false);
  const [signal, setSignal] = useState("none");
  const id = useId().replace(/:/g, "");
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return undefined;
    const start = setTimeout(() => setActive(true), AEMEATH_GLITCH_START_MS);
    const stop = setTimeout(() => setActive(false), AEMEATH_GLITCH_START_MS + AEMEATH_GLITCH_DURATION_MS);
    const cuts = SIGNAL_CUTS.map(([progress, value]) => setTimeout(() => setSignal(value),
      AEMEATH_GLITCH_START_MS + Math.round(AEMEATH_GLITCH_DURATION_MS * progress)));
    const clear = () => { clearTimeout(start); clearTimeout(stop); cuts.forEach(timer => clearTimeout(timer)); };
    const reduce = () => { if (motion.matches) { clear(); setActive(false); } };
    motion.addEventListener("change", reduce);
    return () => { clear(); motion.removeEventListener("change", reduce); };
  }, []);
  if (!active) return null;
  return createPortal(<div className="aemeath-data-glitch aemeath-signal-picture" aria-hidden="true" style={{
    "--glitch-duration": `${AEMEATH_GLITCH_DURATION_MS}ms`,
    backdropFilter: signal === "none" ? "none" : `url("#${id}-${signal}")`,
    "--signal-noise": `url("#${id}-noise")`
  }}>
    <svg className="aemeath-signal-defs" width="0" height="0" focusable="false">
      <defs>
        <AemeathSignalFilter id={`${id}-tick`} displacement={60} split={3} seed={4} />
        <AemeathSignalFilter id={`${id}-break`} displacement={640} split={16} seed={12} />
        <AemeathSignalFilter id={`${id}-lock`} displacement={210} split={6} seed={7} />
        <filter id={`${id}-noise`} colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".8 .65" numOctaves="1" seed="19" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
    </svg>
    <svg className="aemeath-signal-blocks" viewBox="0 0 1000 1000" preserveAspectRatio="none">
      <g fill="rgb(150 173 192)">
        {SIGNAL_FRAGMENTS.map((fragment, index) => <rect key={index} {...fragment} />)}
      </g>
      <g fill="rgb(81 213 224)">
        <path d="M0 123h640v3H0z M620 344h380v7H620z M70 586h330v5H70z M480 873h520v2H480z" />
        <path opacity=".25" d="M140 126h360v17H140z M760 350h240v22H760z M0 748h180v11H0z" />
      </g>
      <g fill="rgb(97 85 174)">
        <path d="M430 215h570v12H430z M0 468h250v4H0z M220 755h550v7H220z" />
        <path opacity=".35" d="M0 234h580v40H0z M380 611h620v29H380z M0 940h270v18H0z" />
      </g>
    </svg>
    <div className="aemeath-signal-noise" />
  </div>, document.body);
}
