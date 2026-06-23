import { useCallback, useEffect, useRef } from "react";

const MODAL_HISTORY_MARKER = "__sigrikaModal";
const ROOT_BACK_HISTORY_MARKER = "__sigrikaRootBackGuard";
let modalBackDismissedInCurrentPop = false;
let modalHistoryCleanupInCurrentPop = false;

export const APP_MODAL_DISMISS_ORDER = [
  "result",
  "matchStart",
  "matchModePicker",
  "house",
  "resume",
  "achievements",
  "personalization",
  "warehouse",
  "leaderboard",
  "watch",
  "friends",
  "shop",
  "recruitment",
  "settings",
  "mailbox",
  "messageBoard"
];

export function topDismissibleModalKey(state = {}) {
  for (let index = APP_MODAL_DISMISS_ORDER.length - 1; index >= 0; index -= 1) {
    const key = APP_MODAL_DISMISS_ORDER[index];
    if (state[key]) return key;
  }
  return null;
}

function modalHistoryState(id) {
  return { [MODAL_HISTORY_MARKER]: id };
}

function modalIdFromHistoryState(state) {
  return state?.[MODAL_HISTORY_MARKER] ?? null;
}

function rootBackHistoryState() {
  return { [ROOT_BACK_HISTORY_MARKER]: true };
}

function isRootBackHistoryState(state) {
  return state?.[ROOT_BACK_HISTORY_MARKER] === true;
}

export function rootBackExitGuardEnabled({ activeId, view }) {
  return !activeId && ["login", "preloading", "match-preloading", "home", "admin", "room"].includes(view);
}

export function isMobileBackCapable(win = typeof window === "undefined" ? undefined : window) {
  if (!win?.matchMedia) return false;
  return win.matchMedia("(hover: none), (pointer: coarse), (max-width: 768px)").matches;
}

export function useModalDismissal({ activeId, onDismiss }) {
  const activeIdRef = useRef(activeId);
  const onDismissRef = useRef(onDismiss);
  const historyStackRef = useRef([]);
  const closingFromPopRef = useRef(false);
  const suppressNextPopRef = useRef(false);

  useEffect(() => {
    activeIdRef.current = activeId;
    onDismissRef.current = onDismiss;
  }, [activeId, onDismiss]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== "Escape" || !activeIdRef.current) return;
      event.preventDefault();
      onDismissRef.current?.();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handlePopState = (event) => {
      if (suppressNextPopRef.current) {
        suppressNextPopRef.current = false;
        return;
      }

      const currentActiveId = activeIdRef.current;
      if (!currentActiveId) return;

      const nextModalId = modalIdFromHistoryState(event.state);
      const stack = historyStackRef.current;
      const nextIndex = nextModalId ? stack.lastIndexOf(nextModalId) : -1;
      historyStackRef.current = nextIndex >= 0 ? stack.slice(0, nextIndex + 1) : [];
      closingFromPopRef.current = true;
      modalBackDismissedInCurrentPop = true;
      onDismissRef.current?.();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const stack = historyStackRef.current;

    if (!activeId) {
      if (stack.length > 0 && !closingFromPopRef.current) {
        suppressNextPopRef.current = true;
        modalHistoryCleanupInCurrentPop = true;
        window.history.go(-stack.length);
      }
      historyStackRef.current = [];
      closingFromPopRef.current = false;
      return undefined;
    }

    const currentTop = stack.at(-1);
    if (currentTop === activeId) {
      closingFromPopRef.current = false;
      return undefined;
    }

    const existingIndex = stack.lastIndexOf(activeId);
    if (existingIndex >= 0) {
      const stepsBack = stack.length - 1 - existingIndex;
      historyStackRef.current = stack.slice(0, existingIndex + 1);
      if (stepsBack > 0 && !closingFromPopRef.current) {
        suppressNextPopRef.current = true;
        modalHistoryCleanupInCurrentPop = true;
        window.history.go(-stepsBack);
      }
      closingFromPopRef.current = false;
      return undefined;
    }

    window.history.pushState(modalHistoryState(activeId), "", window.location.href);
    historyStackRef.current = [...stack, activeId];
    closingFromPopRef.current = false;
    return undefined;
  }, [activeId]);
}

export function useRootBackExitGuard({
  confirmationOpen = false,
  enabled,
  onCancelExit,
  onRequestExit
}) {
  const allowNextBackRef = useRef(false);
  const confirmationOpenRef = useRef(confirmationOpen);
  const enabledRef = useRef(enabled);
  const guardActiveRef = useRef(false);
  const onCancelExitRef = useRef(onCancelExit);
  const onRequestExitRef = useRef(onRequestExit);

  useEffect(() => {
    confirmationOpenRef.current = confirmationOpen;
    enabledRef.current = enabled;
    onCancelExitRef.current = onCancelExit;
    onRequestExitRef.current = onRequestExit;
  }, [confirmationOpen, enabled, onCancelExit, onRequestExit]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handlePopState = (event) => {
      if (modalBackDismissedInCurrentPop || modalHistoryCleanupInCurrentPop) {
        modalBackDismissedInCurrentPop = false;
        modalHistoryCleanupInCurrentPop = false;
        return;
      }
      if (!guardActiveRef.current || !enabledRef.current) return;
      if (allowNextBackRef.current) {
        allowNextBackRef.current = false;
        guardActiveRef.current = false;
        return;
      }
      window.history.pushState(rootBackHistoryState(), "", window.location.href);
      if (confirmationOpenRef.current) {
        onCancelExitRef.current?.();
      } else {
        onRequestExitRef.current?.();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (!enabled || !isMobileBackCapable(window)) return undefined;
    if (guardActiveRef.current && isRootBackHistoryState(window.history.state)) return undefined;

    window.history.pushState(rootBackHistoryState(), "", window.location.href);
    guardActiveRef.current = true;
    return undefined;
  });

  return useCallback(() => {
    allowNextBackRef.current = true;
    if (typeof window !== "undefined") {
      const exitFromUrl = window.location.href;
      window.history.go(-2);
      window.setTimeout(() => {
        if (window.location.href === exitFromUrl) {
          window.location.replace("about:blank");
        }
      }, 300);
    }
  }, []);
}
