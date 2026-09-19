import { Children, cloneElement, isValidElement, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const CAMPUS_SELECTOR = ".app-shell.player-theme-enabled.theme-bright-school:not(.is-sigrika-corrupted)";

/** Relocate opted-in window tabs without moving their data or action ownership. */
export default function WindowBookmarkTabs({ children, className, ...props }) {
  const anchorRef = useRef(null);
  const railRef = useRef(null);
  const [host, setHost] = useState(null);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const shell = anchor?.closest('.window-bookmark-host, [role="dialog"], .user-profile-modal');
    const app = anchor?.closest(".app-shell");
    if (!shell?.matches(".window-bookmark-host") || !app) return undefined;
    const sync = () => setHost(app.matches(CAMPUS_SELECTOR) ? shell : null);
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(app, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!host) return;
    const rail = railRef.current;
    const selected = rail?.querySelector('[aria-selected="true"]');
    if (!selected || !rail) return;
    const top = selected.offsetTop;
    const bottom = top + selected.offsetHeight;
    if (top < rail.scrollTop) rail.scrollTop = top;
    else if (bottom > rail.scrollTop + rail.clientHeight) rail.scrollTop = bottom - rail.clientHeight;
  }, [children, host]);

  function handleKeyDown(event) {
    if (!host) return;
    const forward = "ArrowDown";
    const backward = "ArrowUp";
    if (![forward, backward, "Home", "End"].includes(event.key)) return;
    const buttons = [...event.currentTarget.querySelectorAll('[role="tab"]')]
      .filter((button) => !button.disabled && button.getAttribute("aria-disabled") !== "true");
    const index = buttons.indexOf(event.target.closest('[role="tab"]'));
    if (index < 0 || !buttons.length) return;
    event.preventDefault();
    event.stopPropagation();
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
      : (index + (event.key === forward ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus();
    buttons[next].click();
  }

  const tabs = Children.map(children, (child) => {
    if (!host || !isValidElement(child) || child.type !== "button") return child;
    const selected = child.props["aria-selected"] ?? /(?:^|\s)active(?:\s|$)/u.test(child.props.className ?? "");
    const common = { role: "tab", "aria-selected": selected, tabIndex: selected ? 0 : -1 };
    return cloneElement(child, {
      ...common,
      className: `window-bookmark-tab${selected ? " active" : ""}`
    }, <BookmarkPaper />, <span className="window-bookmark-label">{child.props.children}</span>);
  });

  const list = <div
    {...props}
    ref={railRef}
    className={host ? "window-bookmark-rail" : className}
    role="tablist"
    aria-orientation={host ? "vertical" : "horizontal"}
    onKeyDownCapture={handleKeyDown}
  >{tabs}</div>;

  return <><span ref={anchorRef} hidden data-bookmark-anchor="" />{host ? createPortal(list, host) : list}</>;
}

function BookmarkPaper() {
  return <svg className="window-bookmark-paper" viewBox="0 0 124 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path className="window-bookmark-fill" d="M10 3 Q26 1 46 3 L80 2 L123 4 L123 56 L87 57 Q63 56 43 58 L10 56 L4 53 L5 39 L3 23 L5 8 Z" />
    <path className="window-bookmark-pencil" d="M11 7 Q30 5 46 7 L80 6 L118 7 M8 14 L9 35 L8 49 Q37 54 53 52 L116 53" />
  </svg>;
}
