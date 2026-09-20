import { useLayoutEffect, useRef } from "react";

// Measure the action tab even while another tab is selected. The visible dock
// may grow below this reserved row, but cannot redistribute board/player rows.
export function useMobileDockBaseline(enabled) {
  const viewportRef = useRef(null);
  const dockRef = useRef(null);
  const tabsRef = useRef(null);
  const actionsRef = useRef(null);

  useLayoutEffect(() => {
    if (!enabled) return undefined;
    const viewport = viewportRef.current;
    const dock = dockRef.current;
    const tabs = tabsRef.current;
    const actions = actionsRef.current;
    if (!viewport || !dock || !tabs || !actions) return undefined;
    let previousHeight = 0;
    const measure = () => {
      const style = getComputedStyle(dock);
      const chrome = ["borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"]
        .reduce((sum, key) => sum + (parseFloat(style[key]) || 0), 0);
      const height = Math.ceil(tabs.getBoundingClientRect().height + actions.getBoundingClientRect().height + chrome);
      if (height > 0 && height !== previousHeight) {
        previousHeight = height;
        viewport.style.setProperty("--mobile-action-dock-height", `${height}px`);
      }
    };
    measure();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    [dock, tabs, actions].forEach((element) => observer?.observe(element));
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      viewport.style.removeProperty("--mobile-action-dock-height");
    };
  }, [enabled]);

  return { viewportRef, dockRef, tabsRef, actionsRef };
}
