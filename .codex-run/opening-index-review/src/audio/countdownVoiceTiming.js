const onsetCache = new WeakMap();
const SILENCE_THRESHOLD = 0.01;
const PRE_ROLL_SECONDS = 0.01;

// Remove only leading silence, retaining a short lead-in for soft consonants.
// Never normalize against the loudest vowel: that would cut off quiet word starts.
export function countdownVoiceOffset(buffer) {
  if (onsetCache.has(buffer)) return onsetCache.get(buffer);
  let firstSample = buffer.length;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const samples = buffer.getChannelData(channel);
    for (let index = 0; index < firstSample; index += 1) {
      if (Math.abs(samples[index]) >= SILENCE_THRESHOLD) {
        firstSample = index;
        break;
      }
    }
  }
  const offset = firstSample < buffer.length
    ? Math.max(0, firstSample / buffer.sampleRate - PRE_ROLL_SECONDS)
    : 0;
  onsetCache.set(buffer, offset);
  return offset;
}
