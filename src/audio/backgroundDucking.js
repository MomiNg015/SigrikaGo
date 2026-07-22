const backgroundDuckSubscribers = new Set();
let nextDuckRequestId = 0;
const backgroundDuckRequests = new Map();

export function subscribeBackgroundDuck(subscriber) {
  backgroundDuckSubscribers.add(subscriber);
  return () => {
    backgroundDuckSubscribers.delete(subscriber);
  };
}

export function currentDuckedBackgroundVolume(volume) {
  const requestedRatio = [...backgroundDuckRequests.values()]
    .reduce((ratio, request) => Math.min(ratio, request.ratio), 1);
  return volume * requestedRatio;
}

export function requestBackgroundMusicDuck({ ratio = 0.15, attackMs = 350, releaseMs = 500 } = {}) {
  const id = ++nextDuckRequestId;
  backgroundDuckRequests.set(id, {
    ratio: clampRatio(ratio),
    releaseMs: positiveDuration(releaseMs, 500)
  });
  notifyBackgroundDuckSubscribers(positiveDuration(attackMs, 350));
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const request = backgroundDuckRequests.get(id);
    backgroundDuckRequests.delete(id);
    notifyBackgroundDuckSubscribers(request?.releaseMs ?? positiveDuration(releaseMs, 500));
  };
}

function notifyBackgroundDuckSubscribers(durationMs) {
  for (const subscriber of backgroundDuckSubscribers) subscriber({ durationMs });
}

function clampRatio(value) {
  const ratio = Number(value);
  if (!Number.isFinite(ratio)) return 0.15;
  return Math.max(0, Math.min(1, ratio));
}

function positiveDuration(value, fallback) {
  const duration = Number(value);
  return Number.isFinite(duration) && duration >= 0 ? duration : fallback;
}
