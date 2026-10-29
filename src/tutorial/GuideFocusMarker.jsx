import { guideFocusGeometry } from "./guideFocusGeometry.js";
import "../styles/room/tutorial-battle-screen/guide-focus.css";

export default function GuideFocusMarker({ rect, viewport, padding = 0, className = "" }) {
  const style = guideFocusGeometry(rect, viewport, padding);
  if (!style) return null;
  return <div className={`guide-focus-marker ${className}`.trim()} style={style} aria-hidden="true">
    <div className="guide-focus-corners">
      {["tl", "tr", "bl", "br"].map(corner => <i key={corner} className={`guide-focus-corner guide-focus-${corner}`}/>)}
    </div>
  </div>;
}
