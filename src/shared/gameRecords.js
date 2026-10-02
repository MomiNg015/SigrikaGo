export const GAME_RESULT_REASONS = {
  scoring: "scoring",
  resign: "resign",
  timeout: "timeout",
  agreement: "agreement",
  unknown: "unknown"
};

const LEGACY_MOJIBAKE_DRAW_TEXT = "\u935c\u5c7e\ue5d0";

export function gameResultMetadata(winner = null) {
  return {
    winnerColor: normalizeWinnerColor(winner?.winnerColor ?? null),
    resultReason: normalizeResultReason(winner?.reason)
  };
}

export function recordWinnerColor(record = {}) {
  return normalizeWinnerColor(record.winnerColor) ?? winnerColorFromText(record.resultText);
}

export function winnerColorFromText(text = "") {
  const value = String(text ?? "");
  if (startsWithAny(value, ["黑方认输", "黑方超时", "榛戞柟璁よ緭", "榛戞柟瓒呮椂"])) return "white";
  if (startsWithAny(value, ["白方认输", "白方超时", "鐧芥柟璁よ緭", "鐧芥柟瓒呮椂"])) return "black";
  if (startsWithAny(value, ["黑", "榛戣", "姒"])) {
    if (includesAny(value, ["胜", "中盘胜", "鑳", "璐"])) return "black";
  }
  if (startsWithAny(value, ["白", "鐧", "閻"])) {
    if (includesAny(value, ["胜", "中盘胜", "鑳", "璐"])) return "white";
  }
  return null;
}

export function derivePlayerRecordStats(user = {}, records = []) {
  let totalGames = 0;
  let wins = 0;
  let losses = 0;
  let draws = 0;
  for (const record of Array.isArray(records) ? records : []) {
    if (record.mode === "team" || record.matchSource === "team") continue;
    const color = playerColorForRecord(user, record);
    const winner = recordWinnerColor(record);
    if (!color) continue;
    totalGames += 1;
    if (!winner) {
      if (recordIsDraw(record)) draws += 1;
      continue;
    }
    if (color === winner) wins += 1;
    else losses += 1;
  }
  return {
    totalGames,
    wins,
    losses,
    draws,
    rating: Number.isFinite(user.rating) ? user.rating : 0
  };
}

function recordIsDraw(record = {}) {
  if (record.resultReason === GAME_RESULT_REASONS.agreement) return true;
  const text = String(record.resultText ?? "");
  return text === "和棋" || text === LEGACY_MOJIBAKE_DRAW_TEXT;
}

function playerColorForRecord(user, record) {
  if (user.id && record.blackUserId === user.id) return "black";
  if (user.id && record.whiteUserId === user.id) return "white";
  if (user.username && record.blackName === user.username) return "black";
  if (user.username && record.whiteName === user.username) return "white";
  return null;
}

function normalizeWinnerColor(color) {
  return color === "black" || color === "white" ? color : null;
}

function normalizeResultReason(reason) {
  if (reason === GAME_RESULT_REASONS.resign) return reason;
  if (reason === GAME_RESULT_REASONS.timeout) return reason;
  if (reason === GAME_RESULT_REASONS.agreement) return reason;
  if (reason === GAME_RESULT_REASONS.scoring) return reason;
  return GAME_RESULT_REASONS.unknown;
}

function startsWithAny(value, prefixes) {
  return prefixes.some((prefix) => value.startsWith(prefix));
}

function includesAny(value, needles) {
  return needles.some((needle) => value.includes(needle));
}
