// Sample-only adapter: the real components remain untouched. Whole-row sizing
// follows the warehouse model; native scroll snapping owns wheel/touch behavior.
export function fitPaperLists(root) {
  if (!root) return undefined;
  const lists = new Map();
  function attach() {
    for (const [list, observer] of lists) {
      if (!list.isConnected) { observer.disconnect(); lists.delete(list); }
    }
    root.querySelectorAll('.announcement-list, .mailbox-list').forEach(list => {
      if (lists.has(list)) return;
      const fit = () => {
        const style = getComputedStyle(list);
        const height = list.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
        const gap = parseFloat(style.rowGap);
        let minimum = 108;
        list.querySelectorAll('li > button').forEach(button => {
          const title = button.querySelector('.announcement-list-title, .mailbox-list-title');
          const meta = button.querySelector('.announcement-list-meta, .mailbox-list-meta');
          const css = getComputedStyle(button);
          minimum = Math.max(minimum, (title?.offsetHeight || 0) + (meta?.offsetHeight || 0) + parseFloat(css.paddingTop) + parseFloat(css.paddingBottom) + parseFloat(css.rowGap || '0') + 4);
        });
        if (!(height > 0) || !Number.isFinite(gap)) return;
        const count = Math.max(1, Math.floor((height + gap) / (minimum + gap)));
        list.style.setProperty('--paper-row-height', `${(height - gap * (count - 1)) / count}px`);
      };
      const observer = new ResizeObserver(fit);
      observer.observe(list);
      lists.set(list, observer);
      fit();
      document.fonts.ready.then(() => list.isConnected && fit());
    });
  }
  const mutation = new MutationObserver(attach);
  mutation.observe(root, { childList: true, subtree: true });
  attach();
  return () => { mutation.disconnect(); for (const observer of lists.values()) observer.disconnect(); };
}
