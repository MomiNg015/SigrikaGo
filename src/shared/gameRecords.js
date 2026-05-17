export const GAME_RESULT_REASONS = {
  scoring: "scoring",
  resign: "resign",
  timeout: "timeout",
  agreement: "agreement",
  unknown: "unknown"
};

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
  if ((value.startsWith("黑") || value.startsWith("榛")) && (value.includes("胜") || value.includes("贏"))) return "black";
  if ((value.startsWith("白") || value.startsWith("鐧")) && (value.includes("胜") || value.includes("贏"))) return "white";
  return null;
}

export function derivePlayerRecordStats(user = {}, records = []) {
  let wins = 0;
  let losses = 0;
  for (const record of Array.isArray(records) ? records : []) {
    const color = playerColorForRecord(user, record);
    const winner = recordWinnerColor(record);
    if (!color || !winner) continue;
    if (color === winner) wins += 1;
    else losses += 1;
  }
  return {
    wins,
    losses,
    rating: 1000 + wins * 20
  };
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
