import { useMemo, useState } from "react";

export function initialMatchSessionState() {
  return {
    matchStart: null,
    matchSuccess: null
  };
}

export function matchSessionView(state) {
  return {
    ...state,
    isMatchPending: Boolean(state.matchStart),
    isMatchTransitioning: Boolean(state.matchSuccess)
  };
}

export function useMatchSessionState() {
  const [matchStart, setMatchStart] = useState(null);
  const [matchSuccess, setMatchSuccess] = useState(null);

  return useMemo(() => ({
    ...matchSessionView({ matchStart, matchSuccess }),
    setMatchStart,
    setMatchSuccess
  }), [matchStart, matchSuccess]);
}
