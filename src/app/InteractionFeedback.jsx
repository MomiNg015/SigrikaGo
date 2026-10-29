import { useEffect } from "react";
import {
  playUiCloseWindowSound,
  playUiConfirmSound,
  playUiUnavailableSound
} from "../audio/playback.jsx";
import { triggerUnavailableShake } from "./unavailableFeedback.js";

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
    const animations = new Map();
    let pointerTarget = null;
    let keyboardTarget = null;

    function feedback(target) {
      animations.get(target)?.();
      playUiUnavailableSound(audioSettings);
      animations.set(target, triggerUnavailableShake(target, () => animations.delete(target)));
    }

    function handlePointerDown(event) {
      if (event.button !== 0) return;
      keyboardTarget = null;
      const target = findUnavailableTarget(event.target);
      pointerTarget = target;
      if (!target) return;
      feedback(target);
      event.preventDefault();
      event.stopPropagation();
    }

    function handlePointerCancel() {
      pointerTarget = null;
    }

    function handleKeyDown(event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      const target = findUnavailableTarget(event.target);
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      pointerTarget = null;
      keyboardTarget = target;
      if (!event.repeat) feedback(target);
    }

    function handleKeyUp(event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (!findUnavailableTarget(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      keyboardTarget = null;
    }

    function handleClick(event) {
      const unavailableTarget = findUnavailableTarget(event.target);
      if (unavailableTarget) {
        if (keyboardTarget !== unavailableTarget && (event.detail === 0 || pointerTarget !== unavailableTarget)) {
          feedback(unavailableTarget);
        }
        pointerTarget = null;
        keyboardTarget = null;
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
    document.addEventListener("pointercancel", handlePointerCancel, true);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("keyup", handleKeyUp, true);
    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("pointercancel", handlePointerCancel, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("keyup", handleKeyUp, true);
      document.removeEventListener("click", handleClick, true);
      for (const cancel of animations.values()) cancel();
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

function shouldSuppressConfirmSound(target) {
  return closestElement(target, SOUND_MODE_SELECTOR)?.dataset.uiSound === "none"
    || Boolean(closestElement(target, QUIET_INTERACTION_SELECTOR));
}

function closestElement(target, selector) {
  if (!target || typeof target.closest !== "function") return null;
  return target.closest(selector);
}
