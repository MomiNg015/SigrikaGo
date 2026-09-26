import { COLORS, parsePointId, playMove } from "./game.js";
const GTP_COLUMNS = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
export function serializePracticePositionToSgf(gameView, botColor) {
  const size = boundedInteger(gameView?.size, 13, 2, 25);
  const komi = Number.isFinite(Number(gameView?.komi))
    ? Number(gameView.komi)
    : 2.75;
  const black = [];
  const white = [];
  for (const point of gameView?.points ?? []) {
    if (!point?.valid) continue;
    const coordinate = pointToSgfCoordinate(point, size);
    if (!coordinate) continue;
    if (point.stone === COLORS.black) black.push(coordinate);
    if (point.stone === COLORS.white) white.push(coordinate);
  }
  black.sort();
  white.sort();
  const setup = [
    black.length ? `AB${black.map((coordinate) => `[${coordinate}]`).join("")}` : "",
    white.length ? `AW${white.map((coordinate) => `[${coordinate}]`).join("")}` : ""
  ].filter(Boolean).join("");
  return `(;GM[1]FF[4]CA[UTF-8]SZ[${size}]KM[${komi}]RU[Chinese]PL[${gtpColor(botColor)[0].toUpperCase()}]${setup})`;
}

export function legalPracticeGtpVertices(gameView, botColor) {
  const size = boundedInteger(gameView?.size, 13, 2, GTP_COLUMNS.length);
  return (gameView?.points ?? [])
    .filter((point) => {
      if (!point?.valid || typeof point.id !== "string") return false;
      return playMove(gameView, botColor, point.id, { colorIllusion: null }).ok;
    })
    .map((point) => pointIdToGtpVertex(point.id, size))
    .filter(Boolean);
}

export function pointIdToGtpVertex(id, size) {
  const { x, y } = parsePointId(id);
  if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
  if (x < 0 || y < 0 || x >= size || y >= size || x >= GTP_COLUMNS.length) return null;
  return `${GTP_COLUMNS[x]}${size - y}`;
}

export function gtpVertexToPointId(vertex, size) {
  const match = /^([A-HJ-Z])(\d{1,2})$/i.exec(String(vertex ?? "").trim());
  if (!match) return null;
  const x = GTP_COLUMNS.indexOf(match[1].toUpperCase());
  const row = Number(match[2]);
  const y = size - row;
  if (x < 0 || x >= size || y < 0 || y >= size) return null;
  return `${x},${y}`;
}

export function parseGtpResponse(stdout, commandId) {
  const responsePattern = new RegExp(`^=\\s*${commandId}(?:\\s+([^\\r\\n]*))?\\s*$`, "mi");
  const match = responsePattern.exec(String(stdout ?? ""));
  return match ? String(match[1] ?? "").trim() : null;
}

function pointToSgfCoordinate(point, size) {
  const x = Number(point?.x);
  const y = Number(point?.y);
  if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
  if (x < 0 || y < 0 || x >= size || y >= size || x >= 26 || y >= 26) return null;
  return `${String.fromCharCode(97 + x)}${String.fromCharCode(97 + y)}`;
}

function boundedInteger(value, fallback, minimum, maximum) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.floor(number)));
}

function gtpColor(color) { return color === COLORS.white ? "white" : "black"; }
