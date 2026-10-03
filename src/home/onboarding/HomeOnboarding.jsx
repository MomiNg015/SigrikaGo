import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SkipForward } from "lucide-react";
import NpcDialogue, { NpcDialoguePortrait } from "../../tutorial/NpcDialogue.jsx";
import { prefersReducedMotion } from "../../tutorial/TypewriterText.jsx";
import { HOME_ONBOARDING_STEPS, HOME_ONBOARDING_WINDOWS } from "./homeOnboardingScript.js";
import { resolveStoryPortraitPresentation } from "../../shared/characterStorySprites.js";
import { preloadImageAssets } from "../../shared/preloadAssets.js";

export function visibleGuideTarget(selector) {
  return [...document.querySelectorAll(selector)].find((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && !element.closest('[aria-hidden="true"], [inert]')
      && getComputedStyle(element).visibility !== "hidden";
  });
}

export function revealGuideTarget(target) {
  const bounds = target.getBoundingClientRect();
  let clipped = bounds.top < 6 || bounds.bottom > window.innerHeight - 6
    || bounds.left < 6 || bounds.right > window.innerWidth - 6;
  for (let parent = target.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
    const style = getComputedStyle(parent);
    const box = parent.getBoundingClientRect();
    if (/(auto|scroll|hidden)/.test(style.overflowY) && parent.scrollHeight > parent.clientHeight) {
      clipped ||= bounds.top < box.top || bounds.bottom > box.bottom;
    }
  }
  if (clipped) target.scrollIntoView?.({ block: "nearest", inline: "nearest", behavior: "instant" });
}

export default function HomeOnboarding({ character, overlaySetters, saving, error, onFinish }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [geometry, setGeometry] = useState(null);
  const [panelHeight, setPanelHeight] = useState(200);
  const [dialogueHeight, setDialogueHeight] = useState(200);
  const [retryOutcome, setRetryOutcome] = useState("completed");
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const dispatching = useRef(false);
  const targetRef = useRef(null);
  const step = HOME_ONBOARDING_STEPS[index];
  const portrait = resolveStoryPortraitPresentation(step, { character });
  const text = step.text || HOME_ONBOARDING_STEPS.slice(0, index).findLast((entry) => entry.text)?.text || "";
  const selector = step.target ? `[data-home-guide="${step.target}"]` : step.surface;
  const rect = geometry?.id === step.id ? geometry.rect : null;
  const ready = !selector || Boolean(rect);

  useEffect(() => {
    const urls = [...new Set(HOME_ONBOARDING_STEPS.map((entry) => resolveStoryPortraitPresentation(entry, { character }).src).filter(Boolean))];
    void preloadImageAssets(urls, { concurrency: 4 });
  }, [character]);

  const invoke = (element) => {
    if (!element) return;
    dispatching.current = true;
    try { element.click(); } finally { dispatching.current = false; }
  };

  useEffect(() => {
    setRevealed(!step.text || prefersReducedMotion());
    if (!step.text || prefersReducedMotion()) return;
    const timer = window.setTimeout(() => setRevealed(true), 80 + step.text.length * 28);
    return () => window.clearTimeout(timer);
  }, [step]);

  useLayoutEffect(() => {
    for (const [name, setter] of Object.entries(HOME_ONBOARDING_WINDOWS)) {
      if (name !== step.window) overlaySetters[setter]?.(false);
    }
    // The phone has the same mailbox action inside its existing header menu.
    const menu = visibleGuideTarget('[data-home-guide="mobile-menu"]');
    if (menu && (menu.getAttribute("aria-expanded") === "true") !== (step.target === "mailbox")) invoke(menu);
  }, [overlaySetters, step]);

  useLayoutEffect(() => {
    const measure = () => {
      const height = step.choice ? 0 : panelRef.current?.getBoundingClientRect().height || 200;
      setPanelHeight(height);
      setDialogueHeight(panelRef.current?.querySelector(".tutorial-battle-dialogue")?.getBoundingClientRect().height || height);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (panelRef.current) observer.observe(panelRef.current);
    const dialogue = panelRef.current?.querySelector(".tutorial-battle-dialogue");
    if (dialogue) observer.observe(dialogue);
    return () => observer.disconnect();
  }, [step.choice]);

  useEffect(() => {
    let frame;
    let scrolledElement;
    const measure = () => {
      const target = selector ? visibleGuideTarget(selector) : null;
      targetRef.current = target;
      if (target && target !== scrolledElement && step.target) {
        revealGuideTarget(target);
        scrolledElement = target;
      }
      const bounds = target?.getBoundingClientRect();
      const width = document.documentElement.clientWidth || window.innerWidth;
      const height = window.visualViewport?.height || window.innerHeight;
      const next = bounds ? {
        left: Math.max(6, bounds.left - 5), top: Math.max(6, bounds.top - 5),
        right: Math.min(width - 6, bounds.right + 5), bottom: Math.min(height - 6, bounds.bottom + 5)
      } : null;
      const usable = next && next.right > next.left && next.bottom > next.top ? next : null;
      setGeometry((current) => {
        const value = { id: step.id, rect: usable, width, height };
        return JSON.stringify(current) === JSON.stringify(value) ? current : value;
      });
      frame = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(frame);
  }, [selector, step]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    rootRef.current?.focus({ preventScroll: true });
    const blockOutside = (event) => {
      if (dispatching.current) return;
      if (!rootRef.current?.contains(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    const blockScroll = (event) => {
      const panel = event.target.closest?.(".home-guide-panel");
      if (!panel || panel.scrollHeight <= panel.clientHeight) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    const keyboard = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
      } else if (event.key === "Tab") {
        event.preventDefault();
        event.stopImmediatePropagation();
        const buttons = [...rootRef.current.querySelectorAll("button:not(:disabled)")];
        const current = buttons.indexOf(document.activeElement);
        buttons[(current + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length]?.focus({ preventScroll: true });
      } else if (event.key === " " && rootRef.current?.contains(event.target)) {
        // Let the focused guide control handle Space without scrolling the page.
        if (event.target === rootRef.current) event.preventDefault();
      } else if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
        blockScroll(event);
      } else blockOutside(event);
    };
    const focus = (event) => {
      if (!dispatching.current && !rootRef.current?.contains(event.target)) rootRef.current?.focus({ preventScroll: true });
    };
    const events = ["click", "dblclick", "pointerdown", "pointerup", "touchstart", "touchmove", "wheel", "contextmenu", "keyup"];
    for (const name of events) window.addEventListener(name, blockOutside, { capture: true, passive: false });
    window.addEventListener("wheel", blockScroll, { capture: true, passive: false });
    window.addEventListener("touchmove", blockScroll, { capture: true, passive: false });
    window.addEventListener("keydown", keyboard, true);
    document.addEventListener("focusin", focus, true);
    return () => {
      for (const name of events) window.removeEventListener(name, blockOutside, true);
      window.removeEventListener("wheel", blockScroll, true);
      window.removeEventListener("touchmove", blockScroll, true);
      window.removeEventListener("keydown", keyboard, true);
      document.removeEventListener("focusin", focus, true);
      for (const setter of Object.values(HOME_ONBOARDING_WINDOWS)) overlaySetters[setter]?.(false);
      const menu = visibleGuideTarget('[data-home-guide="mobile-menu"]');
      if (menu?.getAttribute("aria-expanded") === "true") menu.click();
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [overlaySetters]);

  const finish = (outcome) => { setRetryOutcome(outcome); onFinish(outcome); };
  const advance = () => {
    if (saving || error || !ready) return;
    if (!revealed) { setRevealed(true); return; }
    if (step.action || step.choice) return;
    if (index === HOME_ONBOARDING_STEPS.length - 1) finish("completed");
    else setIndex((value) => value + 1);
  };
  const activateTarget = () => {
    if (!revealed) { setRevealed(true); return; }
    if (!ready || saving || error || !targetRef.current?.isConnected) return;
    invoke(targetRef.current);
    setIndex((value) => value + 1);
  };
  const height = geometry?.height || window.innerHeight;
  const width = geometry?.width || window.innerWidth;
  const panelWidth = Math.min(560, width - 28);
  const minimumTop = 66;
  let panelTop = minimumTop;
  let panelLeft = (width - panelWidth) / 2;
  if (step.target && rect) {
    const below = rect.bottom + 16;
    const above = rect.top - panelHeight - 16;
    panelTop = below + panelHeight <= height - 14 ? below : Math.max(minimumTop, above);
    panelLeft = Math.max(14, Math.min(width - panelWidth - 14, (rect.left + rect.right - panelWidth) / 2));
  }
  const panelStyle = { top: panelTop, left: panelLeft, width: panelWidth, "--npc-dialogue-height": `${dialogueHeight}px` };
  const npcBubble = { id: step.id, text, portrait: portrait.src, standardPortrait: portrait.standard, fallbackPortrait: portrait.fallbackSrc, appearanceId: portrait.appearanceId, expressionId: portrait.expressionId, palette: character.color, speakerName: "西格莉卡" };
  const hole = rect ? `M${rect.left},${rect.top} H${rect.right} V${rect.bottom} H${rect.left} Z` : "";

  return (
    <div ref={rootRef} className="home-onboarding" role="dialog" aria-modal="true" aria-label="主界面引导" data-step={step.id} tabIndex={-1}
      onClick={(event) => { if (!event.target.closest("button")) advance(); }}
      onKeyDown={(event) => { if (event.target === event.currentTarget && ["Enter", " "].includes(event.key)) { event.preventDefault(); advance(); } }}>
      <svg className="home-guide-scrim" aria-hidden="true" width="100%" height="100%">
        <path fillRule="evenodd" d={`M0,0 H${geometry?.width || window.innerWidth} V${height} H0 Z ${hole}`} />
      </svg>
      <div className="home-guide-advance-plane" aria-hidden="true" />
      {rect && <div key={step.id} className="home-guide-spotlight" aria-hidden="true" style={{ left: rect.left, top: rect.top, width: rect.right - rect.left, height: rect.bottom - rect.top }} />}
      {rect && step.action && <button className="home-guide-target" type="button" aria-label={`点击${targetRef.current?.getAttribute("aria-label") || step.target}继续引导`}
        disabled={saving || Boolean(error)} onClick={activateTarget}
        style={{ left: rect.left, top: rect.top, width: rect.right - rect.left, height: rect.bottom - rect.top }} />}
      <button className="home-guide-skip" type="button" aria-label="跳过引导" title="跳过引导" disabled={saving} onClick={() => finish("skipped")}>
        <SkipForward size={22} aria-hidden="true" />
      </button>
      {step.choice ? <div className="home-guide-choice-panel">
        <button type="button" className="home-guide-choice" onClick={() => { if (!saving && !error) setIndex((value) => value + 1); }} disabled={saving || Boolean(error)}>{step.choice}</button>
      </div> : <div ref={panelRef} style={panelStyle} className="home-guide-panel">
        <NpcDialogue bubble={npcBubble} revealAll={revealed} portraitDetached={portrait.standard} />
        {!ready && <span className="home-guide-status" role="status">正在准备介绍的窗口…</span>}
      </div>}
      {!step.choice && portrait.standard && <div className="home-guide-portrait-layer" style={panelStyle} aria-hidden="true">
        <NpcDialoguePortrait bubble={npcBubble} />
      </div>}
      {(error || saving) && <div className="home-guide-feedback">
        {error ? <><span role="alert">{error}</span><button type="button" onClick={() => finish(retryOutcome)} disabled={saving}>重试保存并领取邮件</button></>
          : <span role="status">正在送出招新物资…</span>}
      </div>}

    </div>
  );
}
