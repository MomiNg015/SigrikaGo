import { useLayoutEffect } from "react";

const BACKDROP_SELECTOR = ".modal-backdrop, .nested-modal-backdrop";
const MOBILE_QUERY = "(hover: none), (pointer: coarse), (max-width: 768px)";

function containsBackdrop(node) {
  return node.nodeType === 1 && (node.matches(BACKDROP_SELECTOR) || node.querySelector(BACKDROP_SELECTOR));
}

function canScrollWithinBackdrop(target, deltaX, deltaY, root) {
  const element = target?.nodeType === 1 ? target : target?.parentElement;
  const backdrop = element?.closest(BACKDROP_SELECTOR);
  if (!backdrop || !root.contains(backdrop)) return false;
  const horizontal = Math.abs(deltaX) > Math.abs(deltaY);
  const delta = horizontal ? deltaX : deltaY;
  if (!delta) return true;
  // Native range dragging is independent of scroll-container capacity.
  if (horizontal && element.closest('input[type="range"]')) return true;

  for (let node = element; node; node = node.parentElement) {
    const style = window.getComputedStyle(node);
    const overflow = horizontal ? style.overflowX : style.overflowY;
    const max = horizontal ? node.scrollWidth - node.clientWidth : node.scrollHeight - node.clientHeight;
    if (/^(auto|scroll)$/.test(overflow) && max > 1) {
      const position = horizontal ? node.scrollLeft : node.scrollTop;
      if (delta < 0 ? position > 0 : position < max - 1) return true;
      const overscroll = horizontal ? style.overscrollBehaviorX : style.overscrollBehaviorY;
      if (overscroll === "contain" || overscroll === "none") return false;
    }
    if (node === backdrop) break;
  }
  return false;
}

// Actual backdrop ownership also covers local dialogs and portals that never
// enter App's dismissible-overlay registry. Keep one owner for the whole shell.
export function useModalScrollLock(shellRef) {
  useLayoutEffect(() => {
    const root = shellRef.current;
    if (!root || !window.matchMedia) return undefined;
    const mobile = window.matchMedia(MOBILE_QUERY);
    const lockedElements = new Map();
    let listening = false;
    let previousTouch = null;

    const restore = (element, previous) => {
      if (previous.value) element.style.setProperty("overflow-y", previous.value, previous.priority);
      else element.style.removeProperty("overflow-y");
    };
    const onTouchStart = (event) => {
      previousTouch = event.touches.length === 1 ? event.touches[0] : null;
    };
    const onTouchEnd = () => { previousTouch = null; };
    const onTouchMove = (event) => {
      if (event.touches.length !== 1) { previousTouch = null; return; }
      const touch = event.touches[0];
      if (previousTouch && event.cancelable && !canScrollWithinBackdrop(
        event.target, previousTouch.clientX - touch.clientX, previousTouch.clientY - touch.clientY, root
      )) event.preventDefault();
      previousTouch = touch;
    };
    const onWheel = (event) => {
      if (!event.ctrlKey && event.cancelable && !canScrollWithinBackdrop(event.target, event.deltaX, event.deltaY, root)) {
        event.preventDefault();
      }
    };
    const setListening = (enabled) => {
      if (listening === enabled) return;
      listening = enabled;
      previousTouch = null;
      if (enabled) {
        document.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
        document.addEventListener("touchmove", onTouchMove, { capture: true, passive: false });
        document.addEventListener("touchend", onTouchEnd, true);
        document.addEventListener("touchcancel", onTouchEnd, true);
        document.addEventListener("wheel", onWheel, { capture: true, passive: false });
      } else {
        document.removeEventListener("touchstart", onTouchStart, true);
        document.removeEventListener("touchmove", onTouchMove, true);
        document.removeEventListener("touchend", onTouchEnd, true);
        document.removeEventListener("touchcancel", onTouchEnd, true);
        document.removeEventListener("wheel", onWheel, true);
      }
    };
    const sync = () => {
      const backdrops = mobile.matches ? [...root.querySelectorAll(BACKDROP_SELECTOR)] : [];
      const next = new Set();
      if (backdrops.length) {
        next.add(document.documentElement).add(document.body).add(root);
        for (const backdrop of backdrops) {
          // Lock the real ancestor scrollers as well as the document: on phones
          // the home shell scrolls independently, and nested dialogs can live
          // inside an already-scrollable parent window.
          for (let node = backdrop.parentElement; node && node !== root; node = node.parentElement) {
            if (lockedElements.has(node) || /^(auto|scroll)$/.test(window.getComputedStyle(node).overflowY)) next.add(node);
          }
        }
      }
      for (const [element, previous] of lockedElements) {
        if (next.has(element)) continue;
        restore(element, previous);
        lockedElements.delete(element);
      }
      for (const element of next) {
        if (lockedElements.has(element)) continue;
        lockedElements.set(element, {
          value: element.style.getPropertyValue("overflow-y"),
          priority: element.style.getPropertyPriority("overflow-y")
        });
        // Existing phone theme rules use !important. Preserve both the value
        // and priority on cleanup; never fix body position or reset scrollTop.
        element.style.setProperty("overflow-y", "hidden", "important");
      }
      setListening(backdrops.length > 0);
    };
    const observer = new MutationObserver((records) => {
      if (records.some(record => [...record.addedNodes, ...record.removedNodes].some(containsBackdrop))) sync();
    });
    observer.observe(root, { childList: true, subtree: true });
    mobile.addEventListener("change", sync);
    sync();
    return () => {
      observer.disconnect();
      mobile.removeEventListener("change", sync);
      setListening(false);
      for (const [element, previous] of lockedElements) restore(element, previous);
    };
  }, [shellRef]);
}
