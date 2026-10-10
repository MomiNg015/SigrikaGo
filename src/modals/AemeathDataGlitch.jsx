import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { AEMEATH_GLITCH_START_MS, AEMEATH_GLITCH_DURATION_MS } from "../shared/aemeathSkillForm.js";
import AemeathSignalFilter from "./AemeathSignalFilter.jsx";

export default function AemeathDataGlitch() {
  const [active, setActive] = useState(false);
  const id = useId().replace(/:/g, "");
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return undefined;
    const start = setTimeout(() => setActive(true), AEMEATH_GLITCH_START_MS);
    const stop = setTimeout(() => setActive(false), AEMEATH_GLITCH_START_MS + AEMEATH_GLITCH_DURATION_MS);
    const reduce = () => { if (motion.matches) { clearTimeout(start); setActive(false); } };
    motion.addEventListener("change", reduce);
    return () => { clearTimeout(start); clearTimeout(stop); motion.removeEventListener("change", reduce); };
  }, []);
  if (!active) return null;
  return createPortal(<div className="aemeath-data-glitch aemeath-signal-picture" aria-hidden="true" style={{
    "--glitch-duration": `${AEMEATH_GLITCH_DURATION_MS}ms`,
    "--signal-tick": `url("#${id}-tick")`,
    "--signal-break": `url("#${id}-break")`,
    "--signal-lock": `url("#${id}-lock")`,
    "--signal-noise": `url("#${id}-noise")`
  }}>
    <svg className="aemeath-signal-defs" width="0" height="0" focusable="false">
      <defs>
        <AemeathSignalFilter id={`${id}-tick`} displacement={24} split={2} seed={4} />
        <AemeathSignalFilter id={`${id}-break`} displacement={150} split={9} seed={12} />
        <AemeathSignalFilter id={`${id}-lock`} displacement={48} split={4} seed={7} />
        <filter id={`${id}-noise`} colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".8 .65" numOctaves="1" seed="19" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
    </svg>
    <div className="aemeath-signal-noise" />
    <div className="aemeath-signal-dropout" />
  </div>, document.body);
}
