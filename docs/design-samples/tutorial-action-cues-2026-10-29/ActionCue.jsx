import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

// Sample-only decoration: measure the real target; never animate or intercept it.
export default function ActionCue({ variant, paused, source = "battle" }) {
  const [anchor, setAnchor] = useState(null);
  useLayoutEffect(() => {
    let frame, previous = "", previousMode = "", hadTarget = false, trackedTarget = null;
    const measure = () => {
      const home = source === "home" ? document.querySelector(".home-onboarding") : null;
      const homeAction = home?.querySelector(".home-guide-target:not(:disabled)");
      const homeTarget = homeAction || home?.querySelector(".home-guide-spotlight");
      const mode = source === "home" ? homeTarget ? "home" : null : document.querySelector(".tutorial-input-focus")?.dataset.focusMode;
      const root = document.querySelector(".tutorial-battle-root");
      const button = root?.querySelector('.battle-arcade-controls [data-tutorial-target="true"]:not(:disabled)');
      const element = homeTarget || (mode === "actions" ? button?.querySelector(".action-keycap") || button : mode === "board" ? root?.querySelector('.point[data-point-id="6,6"]') : null);
      const rect = element?.getBoundingClientRect();
      // The production room scrolls on very short phones. Reveal a newly selected
      // sample target once without shrinking the board or fighting manual scrolling.
      if (root && element && element !== trackedTarget) {
        trackedTarget = element;
        if (rect.bottom > innerHeight - 24) root.scrollTop += rect.bottom - innerHeight + 24;
        else if (rect.top < 24) root.scrollTop -= 24 - rect.top;
      }
      const next = rect?.width > 0 ? {
        x: rect.x, y: rect.y, width: rect.width, height: rect.height,
        radius: mode === "board" ? "50%" : getComputedStyle(element).borderRadius,
        mode, actionable: Boolean(homeAction), fromAbove: mode === "actions" || rect.y + rect.height / 2 > innerHeight - 130,
        handAngle: rect.x + rect.width / 2 < innerWidth / 2 ? "205deg" : "155deg",
        haloX: Math.min(1.5, 1 + Math.max(0, Math.min(rect.left, innerWidth - rect.right) - 12) * 2 / (rect.width + 8)),
        haloY: Math.min(1.5, 1 + Math.max(0, Math.min(rect.top, innerHeight - rect.bottom) - 12) * 2 / (rect.height + 8))
      } : null;
      const key = JSON.stringify(next);
      if (key !== previous) { previous = key; setAnchor(next); }
      if (next) hadTarget = true;
      const status = next?.mode === "home" ? homeAction ? "home-action" : "home-narration" : next?.mode || (home ? "narration" : hadTarget ? "complete" : "loading");
      if (status !== previousMode) {
        previousMode = status;
        parent.postMessage({ source: "action-cue-scene", message: status === "home-action" ? "点击聚焦的位置；文字未显示完时，首次点击会先展开台词。" : ["narration", "home-narration"].includes(status) ? "当前为讲解步骤：窗口／组件保持明亮并带聚焦标记，点击对白继续。" : status === "actions" ? "点击提示的按钮试试 →" : status === "board" ? "现在，点击提示的棋盘落点 →" : status === "complete" ? "这一步完成了 ✓  可以重试，或切换另一种效果。" : "正在准备预览…" }, location.origin);
      }
      frame = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(frame);
  }, [source]);
  if (!anchor || variant === "focus") return null;
  const { x, y, width, height, radius, mode, fromAbove } = anchor;
  return createPortal(<div className={`action-cue action-cue-${variant}${paused ? " is-paused" : ""}`} data-cue-variant={variant} data-cue-mode={mode} data-cue-actionable={anchor.actionable} aria-hidden="true"
    style={{ left: x, top: y, width, height, "--cue-radius": radius, "--halo-x": anchor.haloX, "--halo-y": anchor.haloY, "--hand-angle": anchor.handAngle }}>
    {variant === "halo" && <><div className="halo-edge"/><div className="halo-wave halo-first"/><div className="halo-wave halo-second"/></>}
    {variant === "hand" && <>
      <div className="hand-target"/>
      <div className={`hand-anchor${fromAbove ? " from-above" : ""}`}>
        <div className="hand-motion"><img className="pointing-hand" src="./hand.svg" alt=""/></div>
        <svg className="tap-rays" width="70" height="44" viewBox="0 0 70 44"><path d="M35 6V16M10 14L18 21M60 14L52 21"/></svg>
      </div>
    </>}
  </div>, source === "home" ? document.querySelector(".home-onboarding") || document.body : document.body);
}
