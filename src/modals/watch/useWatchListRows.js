import { useLayoutEffect, useRef } from "react";

// Fit whole cards at both viewport edges, including wrapped player identities.
export function useWatchListRows() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const list = ref.current;
    if (!list) return undefined;
    let frame;
    let disposed = false;
    function fit() {
      if (disposed) return;
      list.style.removeProperty("--wl-row-height");
      list.style.removeProperty("--wl-scroll-start");
      const style = getComputedStyle(list);
      const minimum = parseFloat(style.getPropertyValue("--wl-row-min"));
      const body = list.querySelector("tbody");
      const rows = [...list.querySelectorAll(".wl-row")];
      if (!(minimum > 0) || !body || !rows.length) return;
      const bodyStyle = getComputedStyle(body);
      const top = parseFloat(style.paddingTop);
      const bottom = parseFloat(style.paddingBottom);
      const head = list.querySelector("thead")?.getBoundingClientRect().height ?? 0;
      const bodyTop = parseFloat(bodyStyle.paddingTop);
      const gap = parseFloat(bodyStyle.rowGap);
      const available = list.clientHeight - top - bottom - head - bodyTop;
      const naturalHeight = Math.max(minimum, ...rows.map(row => row.getBoundingClientRect().height));
      if (!(available > 0) || !Number.isFinite(gap)) return;
      const count = Math.max(1, Math.floor((available + gap) / (naturalHeight + gap)));
      list.style.setProperty("--wl-row-height", `${Math.max(naturalHeight, (available - (count - 1) * gap) / count)}px`);
      list.style.setProperty("--wl-scroll-start", `${top + head + bodyTop}px`);
    }
    function schedule() {
      if (disposed) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    }
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    resize?.observe(list);
    const mutation = new MutationObserver(schedule);
    mutation.observe(list, { childList: true, subtree: true, characterData: true });
    document.fonts?.ready.then(schedule);
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize?.disconnect();
      mutation.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, []);
  return ref;
}
