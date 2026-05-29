export const BGM_FADE_SECONDS = 0.35;
export const BGM_START_DELAY_SECONDS = 0.08;
export const BGM_DUCK_RATIO = 0.35;

export function createPlaybackKey(track) {
  if (!track) return "";
  return JSON.stringify({
    id: track.id,
    playback: track.playback
  });
}

export function createPlaybackSchedule({ playback, buffers, startAt }) {
  if (playback.mode === "intro-loop") {
    const intro = buffers[playback.introSrc];
    return [
      { src: playback.introSrc, startAt, loop: false },
      { src: playback.loopSrc, startAt: startAt + intro.duration, loop: true }
    ];
  }

  return [
    { src: playback.src, startAt, loop: Boolean(playback.loop) }
  ];
}

export function createVolumeRamp({ from, to, startAt, duration = BGM_FADE_SECONDS }) {
  return [
    { type: "set", value: from, time: startAt },
    { type: "linear", value: to, time: startAt + duration }
  ];
}

export function createDuckedVolume({ volume, activeVoiceCount, duckRatio = BGM_DUCK_RATIO }) {
  if (activeVoiceCount <= 0) return volume;
  return volume * duckRatio;
}
