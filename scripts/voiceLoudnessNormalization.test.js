import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  VOICE_MAX_TRUE_PEAK_DBTP,
  VOICE_SHORT_TARGET_RMS_DBFS,
  VOICE_TARGET_LUFS,
  normalizationStrategy,
  parseLoudnormMetrics,
  parseVolumeDetectMetrics,
  shortVoiceGainDb,
  voiceAssetPath,
  voiceMetricErrors
} from "./voiceLoudnessNormalization.mjs";

describe("voice loudness normalization", () => {
  it("parses finite FFmpeg loudnorm and volumedetect metrics", () => {
    const loudness = parseLoudnormMetrics(`
      {
        "input_i" : "-22.31",
        "input_tp" : "-4.27",
        "input_lra" : "1.20",
        "input_thresh" : "-32.61",
        "target_offset" : "0.10"
      }
    `);
    const volume = parseVolumeDetectMetrics("mean_volume: -23.4 dB\nmax_volume: -4.1 dB");

    expect(loudness).toEqual({
      integratedLufs: -22.31,
      truePeakDbtp: -4.27,
      loudnessRange: 1.2,
      thresholdLufs: -32.61,
      targetOffsetDb: 0.1
    });
    expect(volume).toEqual({
      meanVolumeDbfs: -23.4,
      maxVolumeDbfs: -4.1
    });
  });

  it("routes sub-window clips with non-finite integrated loudness to RMS fallback", () => {
    const metrics = parseLoudnormMetrics(`
      {
        "input_i" : "-inf",
        "input_tp" : "-13.77",
        "input_lra" : "0.00",
        "input_thresh" : "-70.00",
        "target_offset" : "0.00"
      }
    `);

    expect(metrics.integratedLufs).toBeNull();
    expect(normalizationStrategy(metrics)).toBe("short-rms");
    expect(normalizationStrategy({ integratedLufs: -18, durationSeconds: 0.49 })).toBe("short-rms");
    expect(normalizationStrategy({ integratedLufs: -18, durationSeconds: 0.5 })).toBe("loudnorm");
    expect(normalizationStrategy({ integratedLufs: -18 })).toBe("loudnorm");
  });

  it("computes short-voice gain from the RMS target before peak limiting", () => {
    expect(shortVoiceGainDb({
      meanVolumeDbfs: -31,
      truePeakDbtp: -21
    })).toBeCloseTo(12);
    expect(shortVoiceGainDb({
      meanVolumeDbfs: -31,
      truePeakDbtp: -5
    })).toBeCloseTo(12);
  });

  it("validates ordinary and short calibrated voices against separate contracts", () => {
    expect(voiceMetricErrors({
      integratedLufs: VOICE_TARGET_LUFS,
      truePeakDbtp: VOICE_MAX_TRUE_PEAK_DBTP,
      meanVolumeDbfs: -20
    })).toEqual([]);
    expect(voiceMetricErrors({
      integratedLufs: null,
      truePeakDbtp: -3,
      meanVolumeDbfs: VOICE_SHORT_TARGET_RMS_DBFS
    })).toEqual([]);

    expect(voiceMetricErrors({
      integratedLufs: -20,
      truePeakDbtp: -1,
      meanVolumeDbfs: -22
    })).toEqual(expect.arrayContaining([
      expect.stringContaining("True Peak"),
      expect.stringContaining("integrated loudness")
    ]));
  });

  it("rejects voice asset paths that escape the configured root", () => {
    const root = path.resolve("public/assets/voice");
    expect(voiceAssetPath(root, "lynae_sortie.ogg")).toBe(path.join(root, "lynae_sortie.ogg"));
    expect(() => voiceAssetPath(root, "../music/main_bgm.ogg")).toThrow("escapes voice root");
  });
});
