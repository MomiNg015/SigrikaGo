import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import MatchModeRuleText from "./MatchModeRuleText.jsx";

export default function MatchModeRulesTooltip({ hover }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const element = ref.current;
    const { width, height } = element.getBoundingClientRect();
    const left = hover.x + 14 + width <= window.innerWidth - 8 ? hover.x + 14 : hover.x - width - 14;
    const top = hover.y + 14 + height <= window.innerHeight - 8 ? hover.y + 14 : hover.y - height - 14;
    element.style.left = `${Math.max(8, Math.min(left, window.innerWidth - width - 8))}px`;
    element.style.top = `${Math.max(8, Math.min(top, window.innerHeight - height - 8))}px`;
  }, [hover]);

  return createPortal(
    <div ref={ref} id="match-mode-rules-tooltip" className={`match-mode-rules-tooltip${hover.tap ? " is-tap-open" : ""}`} role="tooltip">
      <strong>{hover.mode.title}</strong>
      <MatchModeRuleText rulesText={hover.mode.rulesText} />
    </div>,
    document.body,
  );
}
