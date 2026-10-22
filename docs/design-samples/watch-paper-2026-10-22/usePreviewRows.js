import { useLayoutEffect } from 'react';

// The prototype decorates the real modal without changing its production props.
// Measure natural content first so a long identity still fits inside its card.
export function usePreviewRows(rootRef, enabled) {
  useLayoutEffect(() => {
    if (!enabled) return undefined;
    const list = rootRef.current?.querySelector('.wl-scroll');
    if (!list) return undefined;
    let frame;
    let disposed = false;
    function fit() {
      if (disposed) return;
      const rows = [...list.querySelectorAll('.wl-row')];
      list.style.removeProperty('--wp-row-height');
      if (!rows.length) return;
      const style = getComputedStyle(list);
      const body = list.querySelector('tbody');
      const bodyStyle = getComputedStyle(body);
      const top = parseFloat(style.paddingTop);
      const bottom = parseFloat(style.paddingBottom);
      const head = list.querySelector('thead').getBoundingClientRect().height;
      const bodyTop = parseFloat(bodyStyle.paddingTop);
      const gap = parseFloat(bodyStyle.rowGap);
      const available = list.clientHeight - top - bottom - head - bodyTop;
      const minimum = Math.max(...rows.map(row => row.getBoundingClientRect().height));
      if (available <= 0 || !Number.isFinite(gap)) return;
      const count = Math.max(1, Math.floor((available + gap) / (minimum + gap)));
      list.style.setProperty('--wp-row-height', `${Math.max(minimum, (available - (count - 1) * gap) / count)}px`);
      list.style.setProperty('--wp-scroll-start', `${top + head + bodyTop}px`);
    }
    function schedule() {
      if (disposed) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    }
    const resize = new ResizeObserver(schedule);
    resize.observe(list);
    const mutation = new MutationObserver(schedule);
    mutation.observe(list, { childList: true, subtree: true, characterData: true });
    document.fonts.ready.then(schedule);
    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutation.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [rootRef, enabled]);
}
