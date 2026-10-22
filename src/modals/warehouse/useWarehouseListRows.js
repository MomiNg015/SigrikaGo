import { useLayoutEffect, useRef } from "react";

// Fit both edges to whole rows; snapping alone only aligns the leading card.
export function useWarehouseListRows(enabled = true) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const list = ref.current;
    if (!enabled || !list) return undefined;
    const fit = () => {
      const style = getComputedStyle(list);
      const gap = parseFloat(style.rowGap);
      const height = list.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const minimum = parseFloat(style.getPropertyValue("--warehouse-row-min"));
      if (!(height > 0) || !(minimum > 0) || !Number.isFinite(gap)) return;
      const rows = Math.max(1, Math.floor((height + gap) / (minimum + gap)));
      list.style.setProperty("--warehouse-row-height", `${(height - gap * (rows - 1)) / rows}px`);
    };
    fit();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fit);
    observer?.observe(list);
    window.addEventListener("resize", fit);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [enabled]);
  return ref;
}
