import { useCallback, useMemo, useState } from "react";
import { APP_OVERLAYS, OVERLAY_STATE_KEYS } from "./overlayRegistry.js";

export { OVERLAY_STATE_KEYS };

export function initialOverlayState(value = false) {
  return Object.fromEntries(OVERLAY_STATE_KEYS.map((key) => [key, value]));
}

export function closeOverlayState(state) {
  return {
    ...state,
    ...initialOverlayState(false)
  };
}

export function useOverlayState() {
  const [overlays, setOverlays] = useState(() => initialOverlayState(false));
  const setOverlay = useCallback((key, nextValue) => {
    setOverlays((current) => {
      const value = typeof nextValue === "function" ? nextValue(current[key]) : nextValue;
      if (current[key] === value) return current;
      return { ...current, [key]: value };
    });
  }, []);

  const setters = useMemo(
    () => Object.fromEntries(
      APP_OVERLAYS.map(({ key, setterProp }) => [setterProp, (value) => setOverlay(key, value)])
    ),
    [setOverlay]
  );

  return useMemo(() => ({
    overlayState: overlays,
    overlaySetters: setters,
    ...Object.fromEntries(APP_OVERLAYS.map(({ key, showProp }) => [showProp, overlays[key]])),
    ...setters
  }), [overlays, setters]);
}
