export const DEFAULT_NPC_DIALOGUE_AUTO_CONTINUE_SECONDS = 1.5;
export const NODE_ADVANCE_MODES = Object.freeze({
  auto: "auto",
  manual: "manual"
});

export function optionalDelaySeconds(value) {
  if (value == null || value === "") return null;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

export function optionalDelayMs(value) {
  const seconds = optionalDelaySeconds(value);
  return seconds == null ? null : Math.round(seconds * 1000);
}

export function delayMs(value, fallbackSeconds) {
  const seconds = optionalDelaySeconds(value);
  return Math.round((seconds ?? fallbackSeconds) * 1000);
}

export function optionTransitionDelayMs(option) {
  return optionalDelayMs(option?.transitionDelaySeconds) ?? 0;
}

export function manualContinueEnabled(node) {
  return node?.manualContinueEnabled !== false;
}

export function autoContinueEnabled(node, defaultEnabled = false) {
  if (node?.autoContinueEnabled == null || node.autoContinueEnabled === "") return defaultEnabled;
  return node.autoContinueEnabled !== false;
}

export function nodeAutoContinueDelayMs(node, fallbackSeconds = 0) {
  return delayMs(node?.autoContinueDelaySeconds, fallbackSeconds);
}

export function nodeAdvanceMode(node) {
  return node?.autoContinueEnabled === false || node?.autoContinueEnabled === "false"
    ? NODE_ADVANCE_MODES.manual
    : NODE_ADVANCE_MODES.auto;
}

export function nodeAdvanceModePatch(mode) {
  return mode === NODE_ADVANCE_MODES.manual
    ? { manualContinueEnabled: true, autoContinueEnabled: false }
    : { manualContinueEnabled: false, autoContinueEnabled: true };
}

export function nodeAdvanceControls(node) {
  const mode = nodeAdvanceMode(node);
  return {
    manualContinue: mode === NODE_ADVANCE_MODES.manual,
    autoContinue: mode === NODE_ADVANCE_MODES.auto
  };
}
