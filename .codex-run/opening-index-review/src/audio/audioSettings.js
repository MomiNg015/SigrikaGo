export const DEFAULT_AUDIO_SETTINGS = {
  master: 100,
  bgm: 60,
  sfx: 100,
  voice: 100,
  muted: {}
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
  if (settings?.muted?.master === true || settings?.muted?.[channel] === true) {
    return 0;
  }

  const master = safePercent(settings?.master, DEFAULT_AUDIO_SETTINGS.master);
  const channelValue = safePercent(settings?.[channel], DEFAULT_AUDIO_SETTINGS[channel] ?? 100);
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
