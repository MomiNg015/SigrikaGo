import { useEffect, useRef } from "react";

/** Transient cap feedback; native button semantics and game callbacks stay intact. */
export default function ActionKey({ children, disabled, onClick, ...props }) {
  const buttonRef = useRef(null);
  const releaseTimer = useRef(null);
  const clearPress = () => {
    clearTimeout(releaseTimer.current);
    buttonRef.current?.removeAttribute("data-pressed");
  };
  const press = () => {
    if (disabled) return;
    clearTimeout(releaseTimer.current);
    buttonRef.current?.setAttribute("data-pressed", "true");
  };
  const release = () => {
    clearTimeout(releaseTimer.current);
    releaseTimer.current = setTimeout(clearPress, 120);
  };

  useEffect(() => {
    const cancel = () => {
      clearTimeout(releaseTimer.current);
      buttonRef.current?.removeAttribute("data-pressed");
    };
    if (disabled) cancel();
    window.addEventListener("blur", cancel);
    return () => {
      clearTimeout(releaseTimer.current);
      window.removeEventListener("blur", cancel);
    };
  }, [disabled]);

  return (
    <button
      {...props}
      ref={buttonRef}
      type="button"
      disabled={disabled}
      onPointerDown={(event) => { if (event.button === 0) press(); }}
      onPointerUp={release}
      onPointerCancel={clearPress}
      onPointerLeave={clearPress}
      onBlur={clearPress}
      onKeyDown={(event) => {
        if (!event.repeat && (event.key === "Enter" || event.key === " ")) press();
      }}
      onKeyUp={(event) => { if (event.key === "Enter" || event.key === " ") release(); }}
      onClick={(event) => { press(); release(); onClick?.(event); }}
    >
      <span className="action-keycap">{children}</span>
    </button>
  );
}
