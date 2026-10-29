export function browserAudioContextClass() {
  if (typeof window === "undefined") return null;
  return window.AudioContext || window.webkitAudioContext || null;
}

// Decoding can happen before a gesture; resume the same playback context on input.
export function unlockAudioContextOnInteraction(context, target = globalThis.window) {
  if (!target?.addEventListener || context.state === "running") return;
  const events = ["pointerdown", "touchstart", "keydown"];
  const cleanup = () => events.forEach((event) => target.removeEventListener(event, unlock, true));
  const unlock = () => {
    if (context.state === "closed" || context.state === "running") { cleanup(); return; }
    try {
      Promise.resolve(context.resume()).then(() => {
        if (context.state === "running" || context.state === "closed") cleanup();
      }).catch(() => {});
    } catch { /* A later gesture can retry when the browser is ready. */ }
  };
  events.forEach((event) => target.addEventListener(event, unlock, true));
}
