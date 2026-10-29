import { useLayoutEffect, useRef } from "react";
import { copyGuidePaint } from "./copyGuidePaint.js";

export default function HomeGuideHighlight({ target, selector }) {
  const hostRef = useRef(null);
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!target || !host) return;
    let frame, paint, dirty = true, stopped = false, paintBounds = null, lastTransform = "";
    let animationSignature = "";
    const rebuild = () => { dirty = true; };
    const observer = new MutationObserver(rebuild);
    const resize = new ResizeObserver(rebuild);
    observer.observe(target, { subtree: true, attributes: true, childList: true, characterData: true });
    resize.observe(target);
    target.addEventListener("load", rebuild, true);
    const measure = () => {
      if (!target.isConnected) { host.replaceChildren(); return; }
      if (dirty) {
        paint = copyGuidePaint(target);
        paintBounds = null; animationSignature = "";
        host.replaceChildren(paint.styles, paint.clone);
        paint.syncScroll();
        const entering = target.getAnimations?.({ subtree: true }).filter(animation => animation.playState === "running" && Number.isFinite(animation.effect?.getComputedTiming().endTime)) || [];
        if (entering.length) void Promise.allSettled(entering.map(animation => animation.finished)).then(() => { if (!stopped) dirty = true; });
        dirty = false;
      }
      const sourceStyle = getComputedStyle(target);
      const signature = [sourceStyle.opacity, sourceStyle.transform, sourceStyle.translate, sourceStyle.scale, sourceStyle.rotate].join("|");
      if (signature !== animationSignature) {
        animationSignature = signature;
        paintBounds = null;
        for (const name of ["opacity", "transform", "translate", "scale", "rotate"]) paint.clone.style.setProperty(name, sourceStyle[name], "important");
      }
      const rect = target.getBoundingClientRect();
      if (!paintBounds) { host.style.transform = "none"; paintBounds = paint.clone.getBoundingClientRect(); lastTransform = ""; }
      const sx = rect.width / (paintBounds.width || 1), sy = rect.height / (paintBounds.height || 1);
      const transform = `translate(${rect.left - paintBounds.left * sx}px, ${rect.top - paintBounds.top * sy}px) scale(${sx}, ${sy})`;
      if (transform !== lastTransform) { host.style.transform = transform; lastTransform = transform; }
      paint.syncScroll();
      frame = requestAnimationFrame(measure);
    };
    measure();
    return () => {
      stopped = true; cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect();
      target.removeEventListener("load", rebuild, true); host.replaceChildren();
    };
  }, [target]);
  return <div ref={hostRef} className="home-guide-highlight" data-guide-source={selector} aria-hidden="true" inert/>;
}
