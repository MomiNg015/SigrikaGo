import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  unlinkSync,
  rmSync
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const VOICE_BASELINE_TARGET_LUFS = -18;
const VOICE_BASELINE_MAX_TRUE_PEAK_DBTP = -2;
const VOICE_BASELINE_PROCESSING_TRUE_PEAK_DBTP = -2.5;
const VOICE_BASELINE_SHORT_TARGET_RMS_DBFS = -19;

export const VOICE_CALIBRATION_GAIN_RATIO = 1.15;
export const VOICE_CALIBRATION_GAIN_DB = 20 * Math.log10(VOICE_CALIBRATION_GAIN_RATIO);
export const VOICE_TARGET_LUFS = VOICE_BASELINE_TARGET_LUFS + VOICE_CALIBRATION_GAIN_DB;
export const VOICE_MAX_TRUE_PEAK_DBTP = VOICE_BASELINE_MAX_TRUE_PEAK_DBTP + VOICE_CALIBRATION_GAIN_DB;
export const VOICE_PROCESSING_TRUE_PEAK_DBTP = VOICE_BASELINE_PROCESSING_TRUE_PEAK_DBTP + VOICE_CALIBRATION_GAIN_DB;
export const VOICE_SHORT_TARGET_RMS_DBFS = VOICE_BASELINE_SHORT_TARGET_RMS_DBFS + VOICE_CALIBRATION_GAIN_DB;
export const VOICE_SHORT_MAX_DURATION_SECONDS = 0.5;
export const VOICE_LUFS_TOLERANCE = 0.7;
export const VOICE_TRUE_PEAK_TOLERANCE = 0;
export const VOICE_SHORT_RMS_TOLERANCE = 0.8;
export const VOICE_VORBIS_QUALITY = 8;

const LOUDNESS_RANGE_TARGET = 7;
const PROCESS_BUFFER_BYTES = 16 * 1024 * 1024;

export function parseLoudnormMetrics(output) {
  const blocks = String(output ?? "").match(/\{[\s\S]*?"input_i"[\s\S]*?\}/g) ?? [];
  if (blocks.length === 0) throw new Error("FFmpeg loudnorm output did not include JSON metrics");
  const parsed = JSON.parse(blocks.at(-1));
  return {
    integratedLufs: finiteMetric(parsed.input_i),
    truePeakDbtp: finiteMetric(parsed.input_tp),
    loudnessRange: finiteMetric(parsed.input_lra),
    thresholdLufs: finiteMetric(parsed.input_thresh),
    targetOffsetDb: finiteMetric(parsed.target_offset)
  };
}

export function parseVolumeDetectMetrics(output) {
  const text = String(output ?? "");
  const meanMatch = /mean_volume:\s*(-?[0-9.]+) dB/.exec(text);
  const maxMatch = /max_volume:\s*(-?[0-9.]+) dB/.exec(text);
  if (!meanMatch || !maxMatch) {
    throw new Error("FFmpeg volumedetect output did not include mean/max volume");
  }
  return {
    meanVolumeDbfs: Number(meanMatch[1]),
    maxVolumeDbfs: Number(maxMatch[1])
  };
}

export function normalizationStrategy(metrics) {
  if (
    Number.isFinite(metrics?.durationSeconds)
    && metrics.durationSeconds < VOICE_SHORT_MAX_DURATION_SECONDS
  ) {
    return "short-rms";
  }
  return Number.isFinite(metrics?.integratedLufs) ? "loudnorm" : "short-rms";
}

export function shortVoiceGainDb(metrics, {
  targetRmsDbfs = VOICE_SHORT_TARGET_RMS_DBFS
} = {}) {
  if (!Number.isFinite(metrics?.meanVolumeDbfs)) {
    throw new Error("Short-voice RMS fallback requires a finite mean volume");
  }
  return targetRmsDbfs - metrics.meanVolumeDbfs;
}

export function voiceMetricErrors(metrics, {
  targetLufs = VOICE_TARGET_LUFS,
  maxTruePeakDbtp = VOICE_MAX_TRUE_PEAK_DBTP,
  targetShortRmsDbfs = VOICE_SHORT_TARGET_RMS_DBFS,
  lufsTolerance = VOICE_LUFS_TOLERANCE,
  truePeakTolerance = VOICE_TRUE_PEAK_TOLERANCE,
  shortRmsTolerance = VOICE_SHORT_RMS_TOLERANCE
} = {}) {
  const errors = [];
  if (!Number.isFinite(metrics?.truePeakDbtp)) {
    errors.push("missing finite True Peak measurement");
  } else if (metrics.truePeakDbtp > maxTruePeakDbtp + truePeakTolerance) {
    errors.push(`True Peak ${formatDb(metrics.truePeakDbtp)} exceeds ${formatDb(maxTruePeakDbtp)}`);
  }

  if (normalizationStrategy(metrics) === "loudnorm") {
    const delta = Math.abs(metrics.integratedLufs - targetLufs);
    if (delta > lufsTolerance) {
      errors.push(`integrated loudness ${formatDb(metrics.integratedLufs)} is outside ${formatDb(targetLufs)} ± ${lufsTolerance.toFixed(1)} LU`);
    }
  } else if (!Number.isFinite(metrics?.meanVolumeDbfs)) {
    errors.push("missing finite RMS measurement for short voice");
  } else {
    const delta = Math.abs(metrics.meanVolumeDbfs - targetShortRmsDbfs);
    if (delta > shortRmsTolerance) {
      errors.push(`short-voice RMS ${formatDb(metrics.meanVolumeDbfs)} is outside ${formatDb(targetShortRmsDbfs)} ± ${shortRmsTolerance.toFixed(1)} dB`);
    }
  }
  return errors;
}

export function voiceAssetPath(voiceRoot, fileName) {
  const root = path.resolve(voiceRoot);
  const resolved = path.resolve(root, fileName);
  const relative = path.relative(root, resolved);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Voice asset escapes voice root: ${fileName}`);
  }
  return resolved;
}

export function discoverVoiceAssets(voiceRoot) {
  const root = path.resolve(voiceRoot);
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".ogg")
    .map((entry) => ({
      name: entry.name,
      path: voiceAssetPath(root, entry.name)
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function ensureFfmpegTools() {
  for (const command of ["ffmpeg", "ffprobe"]) {
    const result = spawnSync(command, ["-version"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: PROCESS_BUFFER_BYTES
    });
    if (result.error || result.status !== 0) {
      throw new Error(`${command} is required and must be available on PATH`);
    }
  }
}

export function probeVoiceFile(filePath) {
  const output = runProcess("ffprobe", [
    "-v", "error",
    "-select_streams", "a:0",
    "-show_entries", "stream=codec_name,sample_rate,channels",
    "-show_entries", "format=duration",
    "-of", "json",
    filePath
  ]);
  const parsed = JSON.parse(output);
  const stream = parsed.streams?.[0];
  if (!stream) throw new Error(`No audio stream found: ${filePath}`);
  return {
    codec: stream.codec_name,
    sampleRate: Number(stream.sample_rate),
    channels: Number(stream.channels),
    durationSeconds: Number(parsed.format?.duration)
  };
}

export function measureVoiceFile(filePath) {
  const probe = probeVoiceFile(filePath);
  const filter = loudnormFilter({ printFormat: "json" });
  const output = runProcess("ffmpeg", [
    "-hide_banner",
    "-nostats",
    "-i", filePath,
    "-map", "0:a:0",
    "-af", `volumedetect,${filter}`,
    "-f", "null",
    nullDevice()
  ], { combineOutput: true });
  return {
    ...probe,
    ...parseVolumeDetectMetrics(output),
    ...parseLoudnormMetrics(output)
  };
}

export function normalizeVoiceFile(inputPath, outputPath, metrics) {
  const strategy = normalizationStrategy(metrics);
  let gainDb = strategy === "loudnorm"
    ? VOICE_TARGET_LUFS - metrics.integratedLufs
    : shortVoiceGainDb(metrics);
  const measurementPath = path.join(
    path.dirname(outputPath),
    `.${path.basename(outputPath, path.extname(outputPath))}-measurement.wav`
  );

  try {
    for (let iteration = 0; iteration < 5; iteration += 1) {
      renderVoiceFile(inputPath, measurementPath, metrics, gainDb, {
        measurement: true,
        limiterDbtp: VOICE_PROCESSING_TRUE_PEAK_DBTP
      });
      const measured = measureVoiceFile(measurementPath);
      const actual = strategy === "loudnorm"
        ? measured.integratedLufs
        : measured.meanVolumeDbfs;
      const target = strategy === "loudnorm"
        ? VOICE_TARGET_LUFS
        : VOICE_SHORT_TARGET_RMS_DBFS;
      if (!Number.isFinite(actual)) {
        throw new Error(`Normalization measurement stayed non-finite for ${path.basename(inputPath)}`);
      }
      const correction = target - actual;
      if (Math.abs(correction) <= 0.1) break;
      gainDb += correction;
    }
  } finally {
    if (existsSync(measurementPath)) unlinkSync(measurementPath);
  }

  let limiterDbtp = VOICE_PROCESSING_TRUE_PEAK_DBTP;
  for (let iteration = 0; iteration < 5; iteration += 1) {
    renderVoiceFile(inputPath, outputPath, metrics, gainDb, { measurement: false, limiterDbtp });
    const measured = measureVoiceFile(outputPath);
    const actual = strategy === "loudnorm"
      ? measured.integratedLufs
      : measured.meanVolumeDbfs;
    const target = strategy === "loudnorm"
      ? VOICE_TARGET_LUFS
      : VOICE_SHORT_TARGET_RMS_DBFS;
    if (!Number.isFinite(actual)) {
      throw new Error(`Encoded normalization measurement stayed non-finite for ${path.basename(inputPath)}`);
    }
    const correction = target - actual;
    if (!Number.isFinite(measured.truePeakDbtp)) {
      throw new Error(`Encoded True Peak measurement stayed non-finite for ${path.basename(inputPath)}`);
    }
    const peakCorrection = measured.truePeakDbtp > VOICE_MAX_TRUE_PEAK_DBTP
      ? VOICE_PROCESSING_TRUE_PEAK_DBTP - measured.truePeakDbtp
      : 0;
    if (Math.abs(correction) <= 0.1 && peakCorrection === 0) break;
    gainDb += correction;
    limiterDbtp += peakCorrection;
  }
  return strategy;
}

function renderVoiceFile(inputPath, outputPath, metrics, gainDb, { measurement, limiterDbtp }) {
  const filter = peakLimitedGainFilter(gainDb, limiterDbtp);
  const result = spawnSync("ffmpeg", [
    "-hide_banner",
    "-nostats",
    "-y",
    "-i", inputPath,
    "-map", "0:a:0",
    "-map_metadata", "0",
    "-af", filter,
    "-c:a", measurement ? "pcm_s24le" : "libvorbis",
    ...(measurement ? [] : ["-q:a", String(VOICE_VORBIS_QUALITY)]),
    "-ar", String(metrics.sampleRate),
    "-ac", String(metrics.channels),
    outputPath
  ], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: PROCESS_BUFFER_BYTES
  });
  if (result.error || result.status !== 0) {
    throw new Error(`FFmpeg normalization failed for ${path.basename(inputPath)}: ${result.stderr || result.error?.message || "unknown error"}`);
  }
}

export function processVoiceDirectory({
  mode,
  voiceRoot,
  log = console.log,
  force = false
}) {
  if (!["check", "write"].includes(mode)) throw new Error(`Unknown voice normalization mode: ${mode}`);
  ensureFfmpegTools();
  const root = path.resolve(voiceRoot);
  const assets = discoverVoiceAssets(root);
  const stagingRoot = mode === "write"
    ? mkdtempSync(path.join(os.tmpdir(), "sigrikago-voice-normalization-"))
    : null;
  const results = [];
  const replacements = [];

  try {
    for (const [index, asset] of assets.entries()) {
      const before = measureVoiceFile(asset.path);
      const beforeErrors = voiceMetricErrors(before);
      if (beforeErrors.length === 0 && !(mode === "write" && force)) {
        results.push({ ...asset, status: "valid", strategy: normalizationStrategy(before), metrics: before, errors: [] });
        log(`OK   ${asset.name} (${index + 1}/${assets.length})`);
        continue;
      }
      if (mode === "check") {
        results.push({ ...asset, status: "invalid", strategy: normalizationStrategy(before), metrics: before, errors: beforeErrors });
        log(`FAIL ${asset.name}: ${beforeErrors.join("; ")}`);
        continue;
      }

      try {
        const stagedPath = voiceAssetPath(stagingRoot, asset.name);
        const strategy = normalizeVoiceFile(asset.path, stagedPath, before);
        const after = measureVoiceFile(stagedPath);
        const afterErrors = voiceMetricErrors(after);
        if (after.codec !== "vorbis") afterErrors.push(`expected Vorbis output, got ${after.codec ?? "unknown"}`);
        if (after.sampleRate !== before.sampleRate) afterErrors.push(`sample rate changed from ${before.sampleRate} to ${after.sampleRate}`);
        if (after.channels !== before.channels) afterErrors.push(`channel count changed from ${before.channels} to ${after.channels}`);
        if (afterErrors.length > 0) {
          results.push({ ...asset, status: "invalid", strategy, metrics: after, errors: afterErrors });
          log(`FAIL ${asset.name}: ${afterErrors.join("; ")}`);
          continue;
        }
        results.push({ ...asset, status: "normalized", strategy, metrics: after, errors: [] });
        replacements.push({ source: stagedPath, destination: asset.path });
        log(`WRITE ${asset.name} via ${strategy} (${index + 1}/${assets.length})`);
      } catch (error) {
        results.push({
          ...asset,
          status: "invalid",
          strategy: normalizationStrategy(before),
          metrics: before,
          errors: [error.message]
        });
        log(`FAIL ${asset.name}: ${error.message}`);
      }
    }

    if (mode === "write" && results.every((result) => result.status !== "invalid")) {
      for (const replacement of replacements) {
        copyFileSync(replacement.source, replacement.destination);
      }
    }
    return results;
  } finally {
    if (stagingRoot && existsSync(stagingRoot)) {
      const temporaryRoot = path.resolve(os.tmpdir());
      const resolvedStaging = path.resolve(stagingRoot);
      const relative = path.relative(temporaryRoot, resolvedStaging);
      if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
        rmSync(resolvedStaging, { recursive: true, force: true });
      }
    }
  }
}

function loudnormFilter({
  measuredI,
  measuredTp,
  measuredLra,
  measuredThreshold,
  offset,
  linear,
  printFormat
} = {}) {
  const options = [
    `I=${VOICE_TARGET_LUFS}`,
    `LRA=${LOUDNESS_RANGE_TARGET}`,
    `TP=${VOICE_PROCESSING_TRUE_PEAK_DBTP}`
  ];
  if (Number.isFinite(measuredI)) options.push(`measured_I=${measuredI}`);
  if (Number.isFinite(measuredTp)) options.push(`measured_TP=${measuredTp}`);
  if (Number.isFinite(measuredLra)) options.push(`measured_LRA=${measuredLra}`);
  if (Number.isFinite(measuredThreshold)) options.push(`measured_thresh=${measuredThreshold}`);
  if (Number.isFinite(offset)) options.push(`offset=${offset}`);
  if (typeof linear === "boolean") options.push(`linear=${linear}`);
  if (printFormat) options.push(`print_format=${printFormat}`);
  return `loudnorm=${options.join(":")}`;
}

function peakLimitedGainFilter(gainDb, limiterDbtp) {
  const limiter = 10 ** (limiterDbtp / 20);
  return [
    `volume=${gainDb.toFixed(4)}dB`,
    `alimiter=limit=${limiter.toFixed(6)}:attack=5:release=50:level=false:latency=true`
  ].join(",");
}

function finiteMetric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function runProcess(command, args, { combineOutput = false } = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: PROCESS_BUFFER_BYTES
  });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} failed: ${result.stderr || result.error?.message || "unknown error"}`);
  }
  return combineOutput ? `${result.stdout ?? ""}\n${result.stderr ?? ""}` : result.stdout;
}

function nullDevice() {
  return process.platform === "win32" ? "NUL" : "/dev/null";
}

function formatDb(value) {
  return `${Number(value).toFixed(1)} dB`;
}
