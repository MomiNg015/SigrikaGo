/** React ref callback; also usable from list owners that already manage a ref. */
export function observeCardList(list) {
  const shell = list?.closest(".app-shell");
  if (!shell || typeof ResizeObserver === "undefined") return undefined;
  let frame = 0;
  function update() {
    frame = 0;
    const rect = list.getBoundingClientRect();
    let top;
    for (let node = list; node && node !== shell; node = node.parentElement) {
      const css = getComputedStyle(node);
      if (!/(auto|scroll)/.test(css.overflowY) || node.scrollHeight <= node.clientHeight + 1) continue;
      if (css.scrollbarWidth === "none" && node.scrollTop + node.clientHeight < node.scrollHeight - 1 && rect.height) {
        const bottom = node.getBoundingClientRect().top + node.clientTop + node.clientHeight;
        if (node === list || (rect.top < bottom && rect.bottom > bottom + 1)) {
          top = list.scrollTop + bottom - rect.top - list.clientTop - 14;
        }
      }
      break;
    }
    if (top !== undefined) {
      list.style.setProperty("--card-list-hint-top", top + "px");
      if (getComputedStyle(list).position === "static") list.dataset.cardListAnchor = "";
    }
    list.toggleAttribute("data-card-list-more", top !== undefined);
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  const resize = new ResizeObserver(schedule);
  function observeSizes() {
    resize.disconnect();
    resize.observe(list);
    if (list.parentElement) resize.observe(list.parentElement);
    for (const child of list.children) resize.observe(child);
    schedule();
  }
  const changes = new MutationObserver(observeSizes);
  changes.observe(list, { childList: true, subtree: true, characterData: true });
  observeSizes();
  shell.addEventListener("scroll", schedule, true);
  window.addEventListener("resize", schedule);
  return () => {
    changes.disconnect();
    resize.disconnect();
    shell.removeEventListener("scroll", schedule, true);
    window.removeEventListener("resize", schedule);
    cancelAnimationFrame(frame);
    delete list.dataset.cardListAnchor;
    delete list.dataset.cardListMore;
    list.style.removeProperty("--card-list-hint-top");
  };
}
