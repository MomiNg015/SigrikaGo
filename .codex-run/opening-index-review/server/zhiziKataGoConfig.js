export const ZHIZI_KATAGO_ENGINE_ARGS = "--platform all --engine-type go --gpu-type vip-share --kata-name katago-TENSORRT --kata-weight 28bnbt";
export const ZHIZI_KATAGO_BASE_URL = "https://www.zhizigo.com";
export const ZHIZI_KATAGO_MAX_THINK_TIME_MS = 5_000;

export function resolveZhiziKataGoConfig(env = process.env) {
  return {
    enabled: enabledFlag(env.ZHIZI_ENABLED),
    phone: String(env.ZHIZI_ACCOUNT_PHONE ?? "").trim(),
    email: String(env.ZHIZI_ACCOUNT_EMAIL ?? "").trim(),
    password: String(env.ZHIZI_ACCOUNT_PASSWORD ?? ""),
    baseUrl: ZHIZI_KATAGO_BASE_URL,
    engineArgs: ZHIZI_KATAGO_ENGINE_ARGS,
    connectTimeoutMs: boundedInteger(env.ZHIZI_CONNECT_TIMEOUT_MS, 15_000, 2_000, 60_000),
    commandTimeoutMs: boundedInteger(env.ZHIZI_COMMAND_TIMEOUT_MS, 5_000, 500, 30_000),
    searchTimeoutMs: boundedInteger(
      env.ZHIZI_SEARCH_TIMEOUT_MS,
      ZHIZI_KATAGO_MAX_THINK_TIME_MS,
      1_000,
      ZHIZI_KATAGO_MAX_THINK_TIME_MS
    ),
    idleTimeoutMs: boundedInteger(env.ZHIZI_IDLE_TIMEOUT_MS, 90_000, 5_000, 15 * 60_000),
    analysisIntervalCs: boundedInteger(env.ZHIZI_ANALYSIS_INTERVAL_CS, 10, 5, 500),
    npcMinVisits: boundedInteger(env.ZHIZI_NPC_MIN_VISITS, 400, 25, 10_000),
    auditMinVisits: boundedInteger(env.ZHIZI_AUDIT_MIN_VISITS, 200, 25, 10_000),
    maxCandidates: boundedInteger(env.ZHIZI_MAX_CANDIDATES, 12, 3, 30)
  };
}

export function zhiziKataGoConfigErrors(env = process.env) {
  const config = resolveZhiziKataGoConfig(env);
  if (!config.enabled) return [];
  const errors = [];
  const identifierCount = Number(Boolean(config.phone)) + Number(Boolean(config.email));
  if (identifierCount !== 1) {
    errors.push("ZHIZI_ENABLED requires exactly one of ZHIZI_ACCOUNT_PHONE or ZHIZI_ACCOUNT_EMAIL");
  }
  if (!config.password) {
    errors.push("ZHIZI_ENABLED requires ZHIZI_ACCOUNT_PASSWORD");
  }
  return errors;
}

function enabledFlag(value) {
  return ["1", "true", "yes", "on"].includes(String(value ?? "").trim().toLowerCase());
}

function boundedInteger(value, fallback, minimum, maximum) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(number)));
}
