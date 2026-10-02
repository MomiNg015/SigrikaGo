// Survives viewport-gate unmounts, without persisting across browser sessions.
const played = new Set();
const MAX_EVENTS = 128;

export function claimOpeningVoice(key) {
  if (played.has(key)) return false;
  played.add(key);
  if (played.size > MAX_EVENTS) played.delete(played.values().next().value);
  return true;
}
