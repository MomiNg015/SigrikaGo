import { createDuckedVolume } from "../shared/audioScheduling.js";

const backgroundDuckSubscribers = new Set();
let activeVoiceCount = 0;

export function subscribeBackgroundDuck(subscriber) {
  backgroundDuckSubscribers.add(subscriber);
  return () => {
    backgroundDuckSubscribers.delete(subscriber);
  };
}

export function currentDuckedBackgroundVolume(volume) {
  return createDuckedVolume({ volume, activeVoiceCount });
}

export function beginVoicePlayback() {
  activeVoiceCount += 1;
  notifyBackgroundDuckSubscribers();
}

export function endVoicePlaybackSoon() {
  const timeout = typeof window !== "undefined" ? window.setTimeout : setTimeout;
  timeout(() => {
    activeVoiceCount = Math.max(0, activeVoiceCount - 1);
    notifyBackgroundDuckSubscribers();
  }, 180);
}

function notifyBackgroundDuckSubscribers() {
  for (const subscriber of backgroundDuckSubscribers) subscriber();
}
