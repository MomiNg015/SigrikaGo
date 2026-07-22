export const VOICE_PLAYBACK_PROFILES = Object.freeze({
  standard: "standard",
  countdown: "countdown"
});

const STANDARD_VOICE_PLAYBACK = Object.freeze({
  reverb: true
});

const COUNTDOWN_VOICE_PLAYBACK = Object.freeze({
  reverb: false
});

export function voicePlaybackOptions(profile = VOICE_PLAYBACK_PROFILES.standard) {
  return profile === VOICE_PLAYBACK_PROFILES.countdown
    ? COUNTDOWN_VOICE_PLAYBACK
    : STANDARD_VOICE_PLAYBACK;
}
