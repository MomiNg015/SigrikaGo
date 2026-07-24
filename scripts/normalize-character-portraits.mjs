import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ADMIN_DEFAULT_CONFIG } from "../server/adminDefaultSnapshot.js";
import {
  builtinPortraitLegacySource,
  DENIA_CANDY_PORTRAIT_ASSET
} from "../src/shared/characterPortraitAssetCatalog.js";
import { FALLBACK_CHARACTERS } from "../src/shared/characterFallback.js";
import {
  isRemotePortraitUrl,
  isRepositoryPortraitUrl,
  normalizePortraitBuffer,
  portraitUrlToFilePath,
  validateNormalizedPortrait
} from "./characterPortraitNormalization.mjs";

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_PUBLIC_ROOT = path.join(REPOSITORY_ROOT, "public");

export function discoverConfiguredPortraitAssets({
  characters = ADMIN_DEFAULT_CONFIG.characters,
  costumes = ADMIN_DEFAULT_CONFIG.costumes,
  fallbackCharacters = FALLBACK_CHARACTERS,
  baseCandyPortraitUrl = DENIA_CANDY_PORTRAIT_ASSET.url
} = {}) {
  const discovered = new Map();
  const add = (url, owner) => {
    const normalizedUrl = String(url ?? "").trim();
    if (!normalizedUrl) return;
    const existing = discovered.get(normalizedUrl);
    if (existing) {
      existing.owners.push(owner);
      return;
    }
    discovered.set(normalizedUrl, {
      url: normalizedUrl,
      owners: [owner],
      legacySourceUrl: builtinPortraitLegacySource(normalizedUrl)
    });
  };

  for (const character of characters ?? []) {
    add(character?.portraitUrl, `admin character:${character?.slug ?? "unknown"}`);
  }
  for (const character of Object.values(fallbackCharacters ?? {})) {
    add(character?.portrait, `fallback character:${character?.id ?? "unknown"}`);
  }
  for (const costume of costumes ?? []) {
    add(costume?.portraitUrl, `costume:${costume?.id ?? "unknown"}`);
    add(costume?.candyEffectPortraitUrl, `costume candy:${costume?.id ?? "unknown"}`);
  }
  add(baseCandyPortraitUrl, "base candy:denia");

  return [...discovered.values()].sort((left, right) => left.url.localeCompare(right.url));
}

export async function processConfiguredPortraitAssets({
  mode,
  publicRoot = DEFAULT_PUBLIC_ROOT,
  assets = discoverConfiguredPortraitAssets(),
  log = console.log
} = {}) {
  if (!["check", "write"].includes(mode)) throw new Error(`Unknown portrait mode: ${mode}`);
  const results = [];

  for (const asset of assets) {
    if (isRemotePortraitUrl(asset.url)) {
      results.push({ ...asset, status: "skipped-remote" });
      log(`SKIP remote ${asset.url}`);
      continue;
    }
    if (!isRepositoryPortraitUrl(asset.url)) {
      results.push({ ...asset, status: "skipped-non-repository" });
      log(`SKIP non-repository ${asset.url}`);
      continue;
    }
    if (path.extname(asset.url).toLowerCase() !== ".webp") {
      results.push({ ...asset, status: "invalid", errors: ["repository portrait URL must end in .webp"] });
      log(`FAIL ${asset.url}: repository portrait URL must end in .webp`);
      continue;
    }

    const outputPath = portraitUrlToFilePath(asset.url, publicRoot);
    try {
      if (mode === "write") {
        const sourcePath = await resolveSourcePath(asset, publicRoot, outputPath);
        const input = await fs.readFile(sourcePath);
        const normalized = await normalizePortraitBuffer(input);
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, normalized.buffer);
      }
      const output = await fs.readFile(outputPath);
      const validation = await validateNormalizedPortrait(output);
      const status = validation.ok ? "valid" : "invalid";
      results.push({ ...asset, status, errors: validation.errors, bounds: validation.bounds });
      log(validation.ok
        ? `OK   ${asset.url} (${validation.bounds.width}x${validation.bounds.height} visible)`
        : `FAIL ${asset.url}: ${validation.errors.join("; ")}`);
    } catch (error) {
      results.push({ ...asset, status: "invalid", errors: [error.message] });
      log(`FAIL ${asset.url}: ${error.message}`);
    }
  }

  return results;
}

async function resolveSourcePath(asset, publicRoot, outputPath) {
  if (await fileExists(outputPath)) return outputPath;
  if (asset.legacySourceUrl) {
    const legacyPath = portraitUrlToFilePath(asset.legacySourceUrl, publicRoot);
    if (await fileExists(legacyPath)) return legacyPath;
  }
  throw new Error(`No source file found for ${asset.url}`);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const mode = process.argv.includes("--write") ? "write" : process.argv.includes("--check") ? "check" : "";
  if (!mode) {
    console.error("Usage: node scripts/normalize-character-portraits.mjs <--write|--check>");
    process.exitCode = 1;
    return;
  }
  const results = await processConfiguredPortraitAssets({ mode });
  const invalid = results.filter((result) => result.status === "invalid");
  const skipped = results.filter((result) => result.status.startsWith("skipped"));
  console.log(`Portraits: ${results.length - invalid.length - skipped.length} valid, ${skipped.length} skipped, ${invalid.length} invalid`);
  if (invalid.length) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
