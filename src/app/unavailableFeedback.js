import { UI_UNAVAILABLE_SHAKE_MS } from "../audio/playback.jsx";

const SHAKE = [[0, 0], [0.12, -5], [0.24, 5], [0.36, -5], [0.48, 5], [0.6, -5], [0.72, 5], [0.84, -5], [1, 0]];
const PULSE = [[0, 1], [0.35, 1.12], [0.65, 1.12], [1, 1]];

// Transient inline priority bypasses theme motion resets without changing authored transforms.
// Only style values are read; restarting feedback never measures layout.
export function triggerUnavailableShake(target, onFinish) {
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const property = reduced ? "filter" : "translate";
  const original = target.style.getPropertyValue(property);
  const priority = target.style.getPropertyPriority(property);
  const computed = window.getComputedStyle(target);
  const translation = computed.translate && computed.translate !== "none" ? computed.translate.split(/\s+/) : ["0px"];
  const filter = computed.filter && computed.filter !== "none" ? computed.filter : "";
  const start = performance.now();
  let frame;
  let timer;
  let stopped = false;

  function cancel() {
    if (stopped) return;
    stopped = true;
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    window.clearTimeout(timer);
    if (original) target.style.setProperty(property, original, priority);
    else target.style.removeProperty(property);
    target.classList.remove("ui-unavailable-shake");
    onFinish?.();
  }

  function tick() {
    const progress = Math.min((performance.now() - start) / UI_UNAVAILABLE_SHAKE_MS, 1);
    if (progress >= 1 || !target.isConnected) { cancel(); return; }
    const value = interpolate(reduced ? PULSE : SHAKE, progress);
    target.style.setProperty(property, reduced
      ? `${filter} brightness(${value})`.trim()
      : `calc(${translation[0]} + ${value}px) ${translation[1] ?? "0px"}${translation[2] ? ` ${translation[2]}` : ""}`, "important");
    if (typeof window.requestAnimationFrame === "function") frame = window.requestAnimationFrame(tick);
    else timer = window.setTimeout(tick, 16);
  }

  target.classList.add("ui-unavailable-shake");
  tick();
  return cancel;
}

function interpolate(points, progress) {
  const index = points.findIndex(([time]) => time > progress);
  const [fromTime, from] = points[index - 1];
  const [toTime, to] = points[index];
  // Smooth each leg, matching the existing alternating ease-in-out shake.
  const ratio = (progress - fromTime) / (toTime - fromTime);
  const eased = ratio * ratio * (3 - 2 * ratio);
  return from + (to - from) * eased;
}
