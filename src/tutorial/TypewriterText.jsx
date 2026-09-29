import { useEffect, useState } from "react";

export function TypewriterText({ text, revealAll = false }) {
  const fullText = String(text ?? "");
  const [visibleText, setVisibleText] = useState(() => (
    canAnimateTypewriter() && !prefersReducedMotion() && !revealAll ? "" : fullText
  ));

  useEffect(() => {
    if (!fullText || !canAnimateTypewriter() || prefersReducedMotion() || revealAll) {
      setVisibleText(fullText);
      return undefined;
    }

    let index = 0;
    let timeoutId = null;
    setVisibleText("");

    const reveal = () => {
      index += 1;
      setVisibleText(fullText.slice(0, index));
      if (index < fullText.length) {
        timeoutId = window.setTimeout(reveal, 28);
      }
    };

    timeoutId = window.setTimeout(reveal, 80);
    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [fullText, revealAll]);

  return visibleText;
}


export function canAnimateTypewriter() {
  return typeof window !== "undefined" && typeof window.setTimeout === "function";
}

export function prefersReducedMotion() {
  return canAnimateTypewriter() && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}
