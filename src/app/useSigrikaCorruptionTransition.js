import { useCallback, useEffect, useRef, useState } from "react";

const COMMIT_HOLD_MS = 32;

export const SIGRIKA_CORRUPTION_TRANSITION_DIRECTIONS = Object.freeze({
  enter: "enter",
  exit: "exit"
});

export function sigrikaCorruptionTransitionTimings(direction, reducedMotion = false) {
  if (reducedMotion) {
    return { coverMs: 90, commitHoldMs: COMMIT_HOLD_MS, revealMs: 90 };
  }
  return direction === SIGRIKA_CORRUPTION_TRANSITION_DIRECTIONS.exit
    ? { coverMs: 170, commitHoldMs: COMMIT_HOLD_MS, revealMs: 210 }
    : { coverMs: 210, commitHoldMs: COMMIT_HOLD_MS, revealMs: 260 };
}

function reducedMotionPreferred() {
  return typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

export function useSigrikaCorruptionTransition() {
  const [transition, setTransition] = useState(null);
  const activeRunRef = useRef(null);
  const mountedRef = useRef(true);
  const waitsRef = useRef(new Map());

  const waitFor = useCallback((durationMs) => new Promise((resolve) => {
    const timerId = window.setTimeout(() => {
      waitsRef.current.delete(timerId);
      resolve();
    }, durationMs);
    waitsRef.current.set(timerId, resolve);
  }), []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      for (const [timerId, resolve] of waitsRef.current) {
        window.clearTimeout(timerId);
        resolve();
      }
      waitsRef.current.clear();
    };
  }, []);

  const runTransition = useCallback(({ direction, request, commit }) => {
    if (activeRunRef.current) return activeRunRef.current;

    const timings = sigrikaCorruptionTransitionTimings(direction, reducedMotionPreferred());
    const run = (async () => {
      setTransition({ direction, phase: "covering", timings });
      const prepared = Promise.resolve()
        .then(request)
        .then(
          (value) => ({ ok: true, value }),
          (error) => ({ error, ok: false })
        );

      await waitFor(timings.coverMs);
      if (!mountedRef.current) return undefined;
      setTransition({ direction, phase: "covered", timings });

      const outcome = await prepared;
      if (!mountedRef.current) return outcome.ok ? outcome.value : undefined;
      if (outcome.ok) commit(outcome.value);

      await waitFor(timings.commitHoldMs);
      if (!mountedRef.current) return outcome.ok ? outcome.value : undefined;
      setTransition({ direction, phase: "revealing", timings });

      await waitFor(timings.revealMs);
      if (mountedRef.current) setTransition(null);
      if (!outcome.ok) throw outcome.error;
      return outcome.value;
    })();

    activeRunRef.current = run;
    void run.finally(() => {
      if (activeRunRef.current === run) activeRunRef.current = null;
    }).catch(() => {});
    return run;
  }, [waitFor]);

  return {
    runTransition,
    transition,
    transitioning: transition !== null
  };
}
