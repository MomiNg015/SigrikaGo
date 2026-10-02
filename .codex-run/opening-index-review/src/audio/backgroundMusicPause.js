let pauseRequestCount = 0;
const subscribers = new Set();

export function requestBackgroundMusicPause() {
  pauseRequestCount += 1;
  notifyBackgroundPauseSubscribers();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    pauseRequestCount = Math.max(0, pauseRequestCount - 1);
    notifyBackgroundPauseSubscribers();
  };
}

export function subscribeBackgroundMusicPause(callback) {
  subscribers.add(callback);
  callback(isBackgroundMusicPauseRequested());
  return () => subscribers.delete(callback);
}

export function isBackgroundMusicPauseRequested() {
  return pauseRequestCount > 0;
}

function notifyBackgroundPauseSubscribers() {
  const paused = isBackgroundMusicPauseRequested();
  for (const callback of subscribers) callback(paused);
}
