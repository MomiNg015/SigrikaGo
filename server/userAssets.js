import { canonicalCharacterId } from "../src/shared/characterAliases.js";

export function parseAssetList(value, { normalize = (item) => item } = {}) {
  const rawItems = Array.isArray(value)
    ? value
    : String(value ?? "").split(",");
  const seen = new Set();
  const result = [];
  for (const rawItem of rawItems) {
    const item = normalize(String(rawItem ?? "").trim());
    if (!item || seen.has(item)) continue;
    seen.add(item);
    result.push(item);
  }
  return result;
}

export function parseCharacterAssetList(value) {
  return parseAssetList(value, { normalize: canonicalCharacterId });
}

export function serializeAssetList(value, options = {}) {
  return parseAssetList(value, options).join(",");
}
