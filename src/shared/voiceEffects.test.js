import { describe, expect, it } from "vitest";
import { VOICE_EFFECT_SETTINGS, boostedVoiceVolume, deterministicReverbSample, voiceNormalizationGain } from "./voiceEffects.js";

describe("voice effects", () => {
  it("boosts skill voice volume without exceeding one", () => {
    expect(boostedVoiceVolume(0.4)).toBeCloseTo(0.54);
    expect(boostedVoiceVolume(0.9)).toBe(1);
  });

  it("uses a light airy reverb preset", () => {
    expect(VOICE_EFFECT_SETTINGS).toMatchObject({
      boost: 1.35,
      wet: 0.28,
      dry: 0.9,
      reverbSeconds: 1.6
    });
  });

  it("generates deterministic reverb samples", () => {
    expect(deterministicReverbSample(0, 10, 0, VOICE_EFFECT_SETTINGS))
      .toBe(deterministicReverbSample(0, 10, 0, VOICE_EFFECT_SETTINGS));
    expect(deterministicReverbSample(0, 10, 0, VOICE_EFFECT_SETTINGS))
      .not.toBe(deterministicReverbSample(1, 10, 0, VOICE_EFFECT_SETTINGS));
  });

  it("raises quiet voices and lowers loud voices toward the same target", () => {
    expect(voiceNormalizationGain({ rms: 0.05, peak: 0.2 })).toBeCloseTo(2.4);
    expect(voiceNormalizationGain({ rms: 0.3, peak: 0.7 })).toBeCloseTo(0.4);
  });

  it("keeps normalized voice gain inside safe playback bounds", () => {
    expect(voiceNormalizationGain({ rms: 0.001, peak: 0.01 })).toBe(2.4);
    expect(voiceNormalizationGain({ rms: 0.8, peak: 0.95 })).toBe(0.4);
    expect(voiceNormalizationGain(null)).toBe(1);
  });
});
