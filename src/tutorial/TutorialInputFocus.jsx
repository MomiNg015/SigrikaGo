import { useLayoutEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { tutorialFocusShape } from "./tutorialFocusShape.js";

export function tutorialInputFocusMode({ node, phase, choicesVisible, pendingWait, loading, confirmExit }) {
  if (loading || pendingWait || confirmExit) return "";
  if (choicesVisible) return "";
  if (phase === "continue") return "";
  if (["skill-button", "button"].includes(phase)) return "actions";
  if (node?.type === "player-move" || phase === "skill-board") return "board";
  return "";
}

export default function TutorialInputFocus({ mode, targetPointId }) {
  const maskId = useId();
  const [holes, setHoles] = useState([]);
  useLayoutEffect(() => {
    if (!mode) { setHoles([]); return; }
    let frame;
    let previous = "";
    const measure = () => {
      const root = document.querySelector(".tutorial-battle-root");
      let targets = [];
      if (mode === "board") {
        targets = [...(root?.querySelectorAll(".point") ?? [])].filter((point) => point.dataset.pointId === targetPointId);
        if (!targets.length) targets = [...(root?.querySelectorAll(".board") ?? [])];
      } else if (mode === "actions") {
        targets = [...(root?.querySelectorAll('.battle-arcade-controls [data-tutorial-target="true"]:not(:disabled)') ?? [])]
          .map(button => button.querySelector(".action-keycap") || button);
      }
      const rects = targets.map((target) => {
        const rect = target.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return null;
        const style = getComputedStyle(target);
        return { path: tutorialFocusShape(rect, [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius]) };
      }).filter(Boolean);
      const key = JSON.stringify(rects);
      if (key !== previous) { previous = key; setHoles(rects); }
      frame = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(frame);
  }, [mode, targetPointId]);
  if (!mode) return null;
  return createPortal(
    <svg className="tutorial-input-focus" aria-hidden="true" data-focus-mode={mode}>
      <defs><mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
        <rect width="100%" height="100%" fill="white" />
        {holes.map((hole, index) => <path key={index} d={hole.path} fill="black" />)}
      </mask></defs>
      <rect width="100%" height="100%" fill="black" fillOpacity="0.2" mask={`url(#${maskId})`} />
    </svg>, document.body
  );
}
