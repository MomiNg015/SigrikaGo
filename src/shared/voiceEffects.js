export const VOICE_EFFECT_SETTINGS = {
  boost: 1.35,
  wet: 0.28,
  dry: 0.9,
  reverbSeconds: 1.6,
  reverbDecay: 2.2,
  preDelaySeconds: 0.035,
  targetRms: 0.12,
  minNormalizationGain: 0.4,
  maxNormalizationGain: 2.4
};

export function boostedVoiceVolume(volume, settings = VOICE_EFFECT_SETTINGS) {
  return Math.max(0, Math.min(1, volume * settings.boost));
}

export function voiceNormalizationGain(stats, settings = VOICE_EFFECT_SETTINGS) {
  if (!stats?.rms || stats.rms <= 0) return 1;
  const unclamped = settings.targetRms / stats.rms;
  return Math.max(settings.minNormalizationGain, Math.min(settings.maxNormalizationGain, unclamped));
}

export function audioBufferStats(buffer) {
  if (!buffer?.numberOfChannels || !buffer?.length) return null;
  let sumSquares = 0;
  let sampleCount = 0;
  let peak = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) {
      const sample = data[i];
      sumSquares += sample * sample;
      peak = Math.max(peak, Math.abs(sample));
      sampleCount += 1;
    }
  }
  if (sampleCount === 0) return null;
  return {
    rms: Math.sqrt(sumSquares / sampleCount),
    peak
  };
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
