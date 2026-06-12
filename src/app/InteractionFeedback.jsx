import { useEffect } from "react";
import {
  playUiCloseWindowSound,
  playUiConfirmSound,
  playUiUnavailableSound,
  UI_UNAVAILABLE_SHAKE_MS
} from "../audio/playback.jsx";

const INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  "[role='button']",
  "[role='tab']",
  "[role='menuitem']",
  "[data-ui-interactive]"
].join(",");

const UNAVAILABLE_SELECTOR = [
  "button:disabled",
  "input:disabled",
  "select:disabled",
  "textarea:disabled",
  "[aria-disabled='true']",
  ".lock-character-card",
  ".terminal-locked-slot",
  ".shop-item-empty"
].join(",");

const SOUND_MODE_SELECTOR = "[data-ui-sound]";
const CLOSE_INTERACTION_SELECTOR = [
  "[data-ui-sound='close']",
  ".close-button",
  ".inline-close"
].join(",");
const QUIET_INTERACTION_SELECTOR = [
  ".room-screen .board-wrap",
  ".room-screen .player-info",
  ".room-screen .room-title-stack",
  ".room-screen .replay-bar"
].join(",");

export default function InteractionFeedback({ audioSettings }) {
  useEffect(() => {
    function handlePointerDown(event) {
      const target = findUnavailableTarget(event.target);
      if (!target || shouldSuppressUnavailableSound(target)) return;
      playUiUnavailableSound(audioSettings);
      triggerUnavailableShake(target);
    }

    function handleClick(event) {
      const unavailableTarget = findUnavailableTarget(event.target);
      if (unavailableTarget) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const target = findInteractiveTarget(event.target);
      if (!target || shouldSuppressConfirmSound(target)) return;
      if (findCloseTarget(event.target)) {
        playUiCloseWindowSound(audioSettings);
        return;
      }
      playUiConfirmSound(audioSettings);
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("click", handleClick, true);
    };
  }, [audioSettings]);

  return null;
}

export function findInteractiveTarget(target) {
  return closestElement(target, INTERACTIVE_SELECTOR);
}

export function findUnavailableTarget(target) {
  return closestElement(target, UNAVAILABLE_SELECTOR);
}

export function findCloseTarget(target) {
  return closestElement(target, CLOSE_INTERACTION_SELECTOR);
}

function shouldSuppressUnavailableSound(target) {
  return closestElement(target, SOUND_MODE_SELECTOR)?.dataset.uiSound === "none";
}

function shouldSuppressConfirmSound(target) {
  return shouldSuppressUnavailableSound(target)
    || Boolean(closestElement(target, QUIET_INTERACTION_SELECTOR));
}

function triggerUnavailableShake(target) {
  target.classList.remove("ui-unavailable-shake");
  target.style.setProperty("--ui-unavailable-shake-duration", `${UI_UNAVAILABLE_SHAKE_MS}ms`);
  scheduleAnimationFrame(() => {
    target.classList.add("ui-unavailable-shake");
  });
  window.setTimeout(() => {
    target.classList.remove("ui-unavailable-shake");
  }, UI_UNAVAILABLE_SHAKE_MS);
}

function scheduleAnimationFrame(callback) {
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(callback);
    return;
  }
  window.setTimeout(callback, 0);
}

function closestElement(target, selector) {
  if (!target || typeof target.closest !== "function") return null;
  return target.closest(selector);
}
