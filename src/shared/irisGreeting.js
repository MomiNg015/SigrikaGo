export const DEFAULT_IRIS_GREETING = "欢迎回来。今天想从哪盘棋开始复盘？";
export const DEFAULT_IRIS_GREETINGS = Object.freeze([DEFAULT_IRIS_GREETING]);
export const MAX_IRIS_GREETING_LENGTH = 80;
export const MAX_IRIS_GREETING_POOL_SIZE = 12;

export function normalizeIrisGreeting(value, fallback = DEFAULT_IRIS_GREETING) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_IRIS_GREETING_LENGTH);
  return normalized || fallback;
}

export function normalizeIrisGreetings(value, fallback = DEFAULT_IRIS_GREETINGS) {
  const parsed = parseIrisGreetings(value);
  const normalized = parsed
    .map((line) => normalizeIrisGreeting(line, ""))
    .filter(Boolean)
    .slice(0, MAX_IRIS_GREETING_POOL_SIZE);
  if (normalized.length > 0) return normalized;

  const fallbackLines = Array.isArray(fallback) ? fallback : [fallback];
  const normalizedFallback = fallbackLines
    .map((line) => normalizeIrisGreeting(line, ""))
    .filter(Boolean)
    .slice(0, MAX_IRIS_GREETING_POOL_SIZE);
  return normalizedFallback.length > 0 ? normalizedFallback : [...DEFAULT_IRIS_GREETINGS];
}

export function irisGreetingsFromSettings(settings = {}) {
  return normalizeIrisGreetings(settings?.irisGreeting);
}

export function irisGreetingsSettingJson(value = DEFAULT_IRIS_GREETINGS) {
  return JSON.stringify(normalizeIrisGreetings(value), null, 2);
}

export function pickIrisGreeting(value, random = Math.random) {
  const greetings = normalizeIrisGreetings(value);
  const index = Math.min(
    greetings.length - 1,
    Math.max(0, Math.floor(random() * greetings.length))
  );
  return greetings[index];
}

function parseIrisGreetings(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray(value.greetings)) {
    return value.greetings;
  }

  const text = String(value ?? "").trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.greetings)) {
      return parsed.greetings;
    }
  } catch {
    // Legacy installations store one greeting as plain text.
  }
  return [text];
}
