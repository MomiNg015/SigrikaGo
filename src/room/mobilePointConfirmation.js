export function shouldUsePointConfirmation({ pointerType = "", matchMedia = defaultMatchMedia() } = {}) {
  if (pointerType === "touch" || pointerType === "pen") return true;
  if (pointerType === "mouse") return false;
  return Boolean(matchMedia?.("(pointer: coarse)")?.matches || matchMedia?.("(hover: none)")?.matches);
}

export function nextPointConfirmation(current, target) {
  if (pointConfirmationMatches(current, target.pointId, target.actionType)) {
    return { confirmed: true, next: null };
  }
  return {
    confirmed: false,
    next: {
      pointId: target.pointId,
      actionType: target.actionType
    }
  };
}

export function pointConfirmationMatches(current, pointId, actionType) {
  return current?.pointId === pointId && current?.actionType === actionType;
}

function defaultMatchMedia() {
  if (typeof window === "undefined") return null;
  return window.matchMedia?.bind(window);
}
