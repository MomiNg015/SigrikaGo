import { useLayoutEffect } from "react";
import { HOME_ONBOARDING_STEPS } from "../../../src/home/onboarding/homeOnboardingScript.js";
import { visibleGuideTarget } from "../../../src/home/onboarding/HomeOnboarding.jsx";
import { copyHighlightPaint } from "./copyHighlightPaint.js";

export default function HomeComponentHighlight() {
  useLayoutEffect(() => {
    let frame, target = null, layer = null, clone = null, dirty = false, stopped = false;
    const observer = new MutationObserver(() => { dirty = true; });
    const resize = new ResizeObserver(() => { dirty = true; });
    const clear = () => {
      observer.disconnect(); resize.disconnect();
      layer?.remove(); layer = null; clone = null;
    };
    const measure = () => {
      const guide = document.querySelector(".home-onboarding");
      const step = HOME_ONBOARDING_STEPS.find(entry => entry.id === guide?.dataset.step);
      const selector = step?.target ? `[data-home-guide="${step.target}"]` : step?.surface;
      const next = selector ? visibleGuideTarget(selector) : null;
      if (next !== target) {
        clear(); target = next; dirty = Boolean(next);
        if (target) {
          observer.observe(target, { subtree: true, attributes: true, childList: true, characterData: true });
          resize.observe(target);
        }
      }
      if (target && guide && dirty) {
        layer?.remove();
        layer = document.createElement("div");
        layer.className = "home-component-highlight";
        layer.setAttribute("aria-hidden", "true");
        layer.inert = true;
        const paint = copyHighlightPaint(target);
        clone = paint.clone;
        layer.append(paint.styles, clone);
        guide.append(layer);
        const source = target;
        const entering = target.getAnimations({ subtree: true }).filter(animation => animation.playState === "running" && Number.isFinite(animation.effect?.getComputedTiming().endTime));
        if (entering.length) void Promise.allSettled(entering.map(animation => animation.finished)).then(() => {
          if (!stopped && target === source) dirty = true;
        });
        dirty = false;
      }
      if (layer && clone && target?.isConnected) {
        layer.dataset.sourceStep = step.id;
        const style = getComputedStyle(target);
        // Do not freeze the initial opacity/transform of a window's entry motion.
        clone.style.setProperty("opacity", style.opacity, "important");
        clone.style.setProperty("transform", style.transform, "important");
        const rect = target.getBoundingClientRect();
        layer.style.transform = "none";
        const painted = clone.getBoundingClientRect();
        const sx = rect.width / (painted.width || 1), sy = rect.height / (painted.height || 1);
        layer.style.transform = `translate(${rect.left - painted.left * sx}px, ${rect.top - painted.top * sy}px) scale(${sx}, ${sy})`;
      }
      frame = requestAnimationFrame(measure);
    };
    measure();
    return () => { stopped = true; cancelAnimationFrame(frame); clear(); };
  }, []);
  return null;
}
