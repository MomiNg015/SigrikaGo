import path from "node:path";
import { describe, expect, it } from "vitest";
import { voiceNormalizationOptions } from "./normalize-character-voices.mjs";
import {
  VOICE_CALIBRATION_GAIN_DB,
  VOICE_CALIBRATION_GAIN_RATIO,
  VOICE_MAX_TRUE_PEAK_DBTP,
  VOICE_PROCESSING_TRUE_PEAK_DBTP,
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
  it("supports forced writes when a global target shift overlaps the old tolerance", () => {
    expect(voiceNormalizationOptions(["--write"])).toEqual({ mode: "write", force: false });
    expect(voiceNormalizationOptions(["--write", "--force"])).toEqual({ mode: "write", force: true });
    expect(voiceNormalizationOptions(["--check", "--force"])).toEqual({ mode: "check", force: false });
    expect(() => voiceNormalizationOptions([])).toThrow("<--write|--check> [--force]");
  });

  it("raises every authored calibration target by the same 15 percent gain", () => {
    expect(VOICE_CALIBRATION_GAIN_RATIO).toBe(1.15);
    expect(VOICE_CALIBRATION_GAIN_DB).toBeCloseTo(1.2139568);
    expect(VOICE_TARGET_LUFS).toBeCloseTo(-16.7860432);
    expect(VOICE_SHORT_TARGET_RMS_DBFS).toBeCloseTo(-17.7860432);
    expect(VOICE_MAX_TRUE_PEAK_DBTP).toBeCloseTo(-0.7860432);
    expect(VOICE_PROCESSING_TRUE_PEAK_DBTP).toBeCloseTo(-1.2860432);
  });

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
    })).toBeCloseTo(12 + VOICE_CALIBRATION_GAIN_DB);
    expect(shortVoiceGainDb({
      meanVolumeDbfs: -31,
      truePeakDbtp: -5
    })).toBeCloseTo(12 + VOICE_CALIBRATION_GAIN_DB);
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
      truePeakDbtp: 0,
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
