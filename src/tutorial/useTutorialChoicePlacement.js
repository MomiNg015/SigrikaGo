import { useLayoutEffect } from "react";

/** Measure only this tutorial's board and overlay; reply layout never resizes the room. */
export function useTutorialChoicePlacement(groupRef, count) {
  useLayoutEffect(() => {
    const group = groupRef.current;
    const root = group?.closest(".tutorial-battle-root");
    const board = root?.querySelector(".board-stage");
    const self = root?.querySelector(".player-info.self");
    if (!group || !board || !self || !count) return undefined;
    let frame;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const overlay = group.parentElement.getBoundingClientRect();
      const boardBox = board.getBoundingClientRect();
      const selfBox = self.getBoundingClientRect();
      const mobile = root.classList.contains("mobile-room-screen");
      const viewportRight = Math.min(overlay.right, window.innerWidth);
      const viewportBottom = Math.min(overlay.bottom, window.visualViewport ? window.visualViewport.offsetTop + window.visualViewport.height : window.innerHeight);
      const step = Math.min(mobile ? 8 : 14, (mobile ? 30 : 48) / Math.max(1, count - 1));
      const span = step * (count - 1);
      const width = mobile ? Math.min(330, overlay.width - 28 - span) : Math.min(360, viewportRight - boardBox.right - 42 - span);
      const top = mobile ? boardBox.bottom + 8 : selfBox.bottom + 20;
      const available = Math.max(0, mobile ? viewportBottom - top - 8 : viewportBottom - overlay.top - 96);
      group.style.setProperty("--choice-step", `${step}px`);
      group.style.setProperty("--choice-width", `${Math.max(0, width)}px`);
      group.style.setProperty("--choice-span", `${span}px`);
      group.style.right = `${overlay.right - viewportRight + (mobile ? 12 : 22)}px`;
      const modes = mobile ? [[15, 44, 14, 9], [14, 40, 12, 7], [13, 34, 9, 5], [12, 27, 7, 2]] : [[16, 48, 12, 12], [15, 42, 9, 8], [14, 36, 7, 6]];
      let height = 0;
      for (const [font, minHeight, gap, padding] of modes) {
        group.style.setProperty("--choice-font", `${font}px`);
        group.style.setProperty("--choice-height", `${minHeight}px`);
        group.style.setProperty("--choice-gap", `${gap}px`);
        group.style.setProperty("--choice-pad", `${padding}px`);
        height = group.firstElementChild.getBoundingClientRect().height + 12;
        if (height <= available) break;
      }
      group.style.top = `${(mobile ? top : Math.max(overlay.top + 80, Math.min(top, viewportBottom - height - 20))) - overlay.top}px`;
      group.style.maxHeight = `${available}px`;
      group.dataset.scroll = String(height > available);
      group.dataset.ready = "true";
    };
    const schedule = () => { if (disposed) return; cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    [board, self, group.parentElement, group.firstElementChild].forEach(element => observer.observe(element));
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    window.visualViewport?.addEventListener("resize", schedule);
    document.fonts?.ready.then(schedule);
    measure();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  }, [groupRef, count]);
}
