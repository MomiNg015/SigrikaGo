import path from "node:path";
import { fileURLToPath } from "node:url";
import { processVoiceDirectory } from "./voiceLoudnessNormalization.mjs";

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_VOICE_ROOT = path.join(REPOSITORY_ROOT, "public", "assets", "voice");

export function normalizeCharacterVoices(argv = process.argv.slice(2), {
  voiceRoot = DEFAULT_VOICE_ROOT,
  log = console.log
} = {}) {
  const { mode, force } = voiceNormalizationOptions(argv);
  const results = processVoiceDirectory({ mode, force, voiceRoot, log });
  const normalized = results.filter((result) => result.status === "normalized");
  const invalid = results.filter((result) => result.status === "invalid");
  const valid = results.length - invalid.length;
  log(`Voices: ${valid} valid, ${normalized.length} normalized, ${invalid.length} invalid`);
  return { results, normalized, invalid };
}

export function voiceNormalizationOptions(argv = []) {
  const mode = argv.includes("--write") ? "write" : argv.includes("--check") ? "check" : "";
  if (!mode) {
    throw new Error("Usage: node scripts/normalize-character-voices.mjs <--write|--check> [--force]");
  }
  return {
    mode,
    force: mode === "write" && argv.includes("--force")
  };
}

function main() {
  try {
    const { invalid } = normalizeCharacterVoices();
    if (invalid.length > 0) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
