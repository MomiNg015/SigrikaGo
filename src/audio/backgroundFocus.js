const owners = new Set();
const subscribers = new Set();

export const BGM_FOCUS = Object.freeze({ cutoff: 900, ratio: 0.72, seconds: 0.5 });

export function backgroundWindowFocused() {
  return owners.size > 0;
}

export function subscribeBackgroundFocus(subscriber) {
  subscribers.add(subscriber);
  subscriber(backgroundWindowFocused());
  return () => subscribers.delete(subscriber);
}

export function requestBackgroundFocus() {
  const owner = Symbol();
  owners.add(owner);
  notify();
  return () => {
    if (owners.delete(owner)) notify();
  };
}

function notify() {
  for (const subscriber of subscribers) subscriber(backgroundWindowFocused());
}

export function setBackgroundFocus(state, focused) {
  if (state.windowFocused === focused) return;
  state.windowFocused = focused;
  const context = state.context;
  if (!context || !state.focusFilter) return;
  const now = context.currentTime;
  const clearCutoff = Math.min(20000, context.sampleRate / 2);
  ramp(state.focusFilter.frequency, focused ? BGM_FOCUS.cutoff : clearCutoff, now);
  ramp(state.focusGain.gain, focused ? BGM_FOCUS.ratio : 1, now);
}

export function backgroundFocusDestination(state, context) {
  if (!state.focusFilter) {
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = "lowpass";
    filter.Q.value = 0.5;
    filter.frequency.value = state.windowFocused ? BGM_FOCUS.cutoff : Math.min(20000, context.sampleRate / 2);
    gain.gain.value = state.windowFocused ? BGM_FOCUS.ratio : 1;
    filter.connect(gain);
    gain.connect(context.destination);
    state.focusFilter = filter;
    state.focusGain = gain;
  }
  return state.focusFilter;
}

function ramp(param, target, now) {
  if (typeof param.cancelAndHoldAtTime === "function") {
    param.cancelAndHoldAtTime(now);
  } else {
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
  }
  param.exponentialRampToValueAtTime(target, now + BGM_FOCUS.seconds);
}
