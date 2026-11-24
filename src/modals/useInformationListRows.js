import { useLayoutEffect, useRef } from "react";

// Match both viewport edges to complete paper cards; native snap owns scrolling.
export function useInformationListRows(items) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const list = ref.current;
    if (!list) return undefined;
    let disposed = false;
    const fit = () => {
      if (disposed) return;
      const style = getComputedStyle(list);
      if (style.getPropertyValue("--information-paper-fit").trim() !== "1") {
        list.style.removeProperty("--information-paper-row-height");
        return;
      }
      const height = list.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const gap = parseFloat(style.rowGap);
      if (!(height > 0) || !Number.isFinite(gap)) return;
      let minimum = parseFloat(style.getPropertyValue("--information-card-min-height"));
      if (!Number.isFinite(minimum)) return;
      for (const item of list.children) {
        const button = item.firstElementChild;
        if (!button) continue;
        const title = button.querySelector(".announcement-list-title, .mailbox-list-heading");
        const meta = button.querySelector(".announcement-list-meta, .mailbox-list-meta");
        const css = getComputedStyle(button);
        const number = (value) => parseFloat(value) || 0;
        minimum = Math.max(minimum, (title?.offsetHeight || 0) + (meta?.offsetHeight || 0)
          + number(css.paddingTop) + number(css.paddingBottom) + number(css.rowGap)
          + number(css.borderTopWidth) + number(css.borderBottomWidth));
      }
      const count = Math.max(1, Math.floor((height + gap) / (minimum + gap)));
      const rowHeight = Math.max(minimum, (height - gap * (count - 1)) / count);
      list.style.setProperty("--information-paper-row-height", `${rowHeight}px`);
    };
    fit();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fit);
    observer?.observe(list);
    window.addEventListener("resize", fit);
    document.fonts?.ready.then(fit);
    return () => {
      disposed = true;
      observer?.disconnect();
      window.removeEventListener("resize", fit);
      list.style.removeProperty("--information-paper-row-height");
    };
  }, [items]);
  return ref;
}
