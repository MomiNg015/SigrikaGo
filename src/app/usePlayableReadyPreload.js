import { useEffect } from "react";
import {
  preloadPlayableReady,
  schedulePlayableReadyIdlePreload
} from "./playableReadyPreload.js";

export function usePlayableReadyPreload({
  preload = preloadPlayableReady,
  scheduleIdle = schedulePlayableReadyIdlePreload,
  user,
  view
} = {}) {
  const hasUser = Boolean(user);
  useEffect(() => {
    if (view !== "home" || !hasUser) return undefined;
    return scheduleIdle(() => {
      void preload({ reason: "home-idle" });
    });
  }, [hasUser, preload, scheduleIdle, view]);
}
