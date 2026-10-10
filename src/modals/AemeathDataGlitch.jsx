import { useEffect, useState } from "react";
import { AEMEATH_GLITCH_START_MS, AEMEATH_GLITCH_DURATION_MS } from "../shared/aemeathSkillForm.js";

const BANDS = [
  [5, 2, 8, 64], [14, 7, -5, 91], [27, 3, 12, 73], [35, 12, -9, 100],
  [49, 2, 6, 48], [57, 8, 10, 95], [69, 4, -12, 78], [78, 10, 7, 100], [93, 2, -6, 58]
];
const DATA = "01 ▪ ▫ 7F / ▰ 10 : ∆ 0x ▪ 001 / ▱ 8E : 11 ▫ ";

export default function AemeathDataGlitch() {
  const [active, setActive] = useState(false);
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
  return <div className="aemeath-data-glitch" aria-hidden="true" style={{ "--glitch-duration": `${AEMEATH_GLITCH_DURATION_MS}ms` }}>
    {BANDS.map(([top, height, shift, width], index) => <div key={top} className="aemeath-glitch-band"
      style={{ top: `${top}%`, height: `${height}%`, width: `${width}%`, left: index % 2 ? "0" : "auto", right: index % 2 ? "auto" : "0", "--glitch-shift": `${shift}vw` }}>
      <span>{[0, 1, 2, 3].map(row => DATA.slice((index + row) % 12).repeat(7)).join("\n")}</span>
    </div>)}
  </div>;
}
