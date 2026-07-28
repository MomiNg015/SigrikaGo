export const DEFAULT_IRIS_GREETING = "欢迎回来。今天想从哪盘棋开始复盘？";
export const MAX_IRIS_GREETING_LENGTH = 80;

export function normalizeIrisGreeting(value, fallback = DEFAULT_IRIS_GREETING) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_IRIS_GREETING_LENGTH);
  return normalized || fallback;
}
