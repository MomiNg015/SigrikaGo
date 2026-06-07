export const DEFAULT_AUDIO_SETTINGS = {
  master: 80,
  bgm: 50,
  sfx: 80,
  voice: 80
};

export function loadAudioSettings() {
  try {
    return {
      ...DEFAULT_AUDIO_SETTINGS,
      ...JSON.parse(localStorage.getItem("sigrika-audio-settings") ?? "{}")
    };
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

export function audioVolume(settings, channel) {
  const master = safePercent(settings?.master, DEFAULT_AUDIO_SETTINGS.master);
  const channelValue = safePercent(settings?.[channel], 100);
  return Math.max(
    0,
    Math.min(
      1,
      (master / 100) * (channelValue / 100)
    )
  );
}

function safePercent(value, fallback) {
  const number = Number(value ?? fallback);
  return Number.isFinite(number) ? number : fallback;
}
