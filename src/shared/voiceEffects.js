export const VOICE_EFFECT_SETTINGS = {
  boost: 1.35,
  wet: 0.28,
  dry: 0.9,
  reverbSeconds: 1.6,
  reverbDecay: 2.2,
  preDelaySeconds: 0.035
};

export function boostedVoiceVolume(volume, settings = VOICE_EFFECT_SETTINGS) {
  return Math.max(0, Math.min(1, volume * settings.boost));
}

export function deterministicReverbSample(index, length, channel, settings = VOICE_EFFECT_SETTINGS) {
  const t = length <= 1 ? 0 : index / length;
  const seed = Math.sin((index + 1) * 12.9898 + (channel + 1) * 78.233) * 43758.5453;
  const noise = (seed - Math.floor(seed)) * 2 - 1;
  return noise * ((1 - t) ** settings.reverbDecay);
}

export function createAiryReverbImpulse(context, settings = VOICE_EFFECT_SETTINGS) {
  const length = Math.max(1, Math.floor(context.sampleRate * settings.reverbSeconds));
  const impulse = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      data[i] = deterministicReverbSample(i, length, channel, settings);
    }
  }
  return impulse;
}
