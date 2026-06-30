import { normalizeCreditName, normalizeCreditUrl } from "./creditLink.js";

export function normalizeCharacterCvName(value) {
  return normalizeCreditName(value);
}

export function normalizeCharacterCvUrl(value) {
  return normalizeCreditUrl(value);
}
