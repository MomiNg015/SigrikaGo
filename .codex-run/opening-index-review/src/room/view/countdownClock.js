const TICK_MS = 1000;
const JITTER_WINDOW_MS = 300;

export function reconcileCountdownClock(previous, key, seconds, now) {
  if (!key) return null;
  if (previous?.key === key && previous.latestSeconds === seconds) return previous;
  const expectedAt = previous
    ? previous.anchorAt + (previous.initialSeconds - seconds) * TICK_MS
    : now;
  if (previous?.key === key && seconds < previous.latestSeconds
    && Math.abs(now - expectedAt) <= JITTER_WINDOW_MS) {
    return { ...previous, latestSeconds: seconds };
  }
  return { key, initialSeconds: seconds, latestSeconds: seconds, anchorAt: now };
}

export function countdownClockFrame(clock, now) {
  const elapsedTicks = Math.max(0, Math.floor((now - clock.anchorAt) / TICK_MS));
  // Predict only one tick beyond a confirmed snapshot; never invent a new period or timeout.
  const seconds = Math.max(1, clock.latestSeconds - 1, clock.initialSeconds - elapsedTicks);
  const canAdvance = seconds > 1 && seconds > clock.latestSeconds - 1;
  return {
    seconds,
    nextAt: canAdvance ? clock.anchorAt + (clock.initialSeconds - seconds + 1) * TICK_MS : null
  };
}
