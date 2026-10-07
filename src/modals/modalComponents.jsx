import { createElement, useEffect, useLayoutEffect, useRef } from "react";
import Button from "../ui/primitives/Button.jsx";
import { requestBackgroundFocus } from "../audio/backgroundFocus.js";

const MODAL_ACTION_VARIANT_CLASSES = {
  primary: "primary-action",
  secondary: "secondary-action",
  danger: "danger-action"
};

export function ModalActionButton({ variant = "primary", className, type = "button", children, ...props }) {
  const variantClass = MODAL_ACTION_VARIANT_CLASSES[variant] ?? MODAL_ACTION_VARIANT_CLASSES.primary;

  return (
    <Button className={[variantClass, className]} type={type} {...props}>
      {children}
    </Button>
  );
}

export function ModalDialog({ as = "section", ariaLabel, ariaLabelledBy, className, children, onClose, ...props }) {
  const dialogRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const lastFocusedControlRef = useRef(null);

  useEffect(() => requestBackgroundFocus(), []);

  useEffect(() => {
    restoreFocusRef.current = document.activeElement;
    const dialog = dialogRef.current;
    const focusTarget = dialog?.querySelector(FOCUSABLE_SELECTOR);
    (focusTarget ?? dialog)?.focus();
    return () => {
      if (restoreFocusRef.current?.isConnected) restoreFocusRef.current.focus();
    };
  }, []);

  useLayoutEffect(() => {
    const previous = lastFocusedControlRef.current;
    const active = document.activeElement;
    if (previous && (active === document.body || active === previous)
      && (previous.disabled || !previous.isConnected)) {
      dialogRef.current?.focus();
    }
  });

  function handleFocusCapture(event) {
    props.onFocusCapture?.(event);
    if (dialogRef.current?.contains(event.target)) lastFocusedControlRef.current = event.target;
  }

  function handleKeyDown(event) {
    props.onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose?.();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...(dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) ?? [])]
      .filter((element) => !element.disabled && element.getAttribute("aria-hidden") !== "true");
    if (!focusable.length) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable.at(-1);
    if (document.activeElement === dialogRef.current) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return createElement(as, {
    ...props,
    ref: dialogRef,
    className,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    tabIndex: -1,
    onFocusCapture: handleFocusCapture,
    onKeyDown: handleKeyDown
  }, children);
}

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");
