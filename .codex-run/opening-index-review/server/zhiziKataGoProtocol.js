import { COLORS } from "../src/shared/game.js";
import { gtpVertexToPointId, pointIdToGtpVertex } from "./practiceBotEngine.js";

const TOP_LEVEL_ANALYSIS_TOKEN = /\b(?:info\s+move|rootInfo|ownership|ownershipStdev)\b/g;
const CANDIDATE_NUMERIC_FIELDS = Object.freeze([
  "visits",
  "edgeVisits",
  "utility",
  "winrate",
  "scoreMean",
  "scoreStdev",
  "scoreLead",
  "scoreSelfplay",
  "prior",
  "lcb",
  "utilityLcb",
  "weight",
  "noResultValue",
  "order"
]);
const ROOT_NUMERIC_FIELDS = Object.freeze([
  "visits",
  "utility",
  "winrate",
  "scoreMean",
  "scoreStdev",
  "scoreLead",
  "scoreSelfplay",
  "weight",
  "rawStWrError",
  "rawStScoreError",
  "rawVarTimeLeft"
]);

export function decodeZhiziSocketPayload(payload) {
  const value = payload?.data ?? payload;
  if (typeof value === "string") return value;
  if (value instanceof ArrayBuffer) return Buffer.from(value).toString("utf8");
  if (ArrayBuffer.isView(value)) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString("utf8");
  }
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  return String(value ?? "");
}

export function internalKomiToGtpKomi(value) {
  const komi = Number(value);
  return Number.isFinite(komi) ? komi * 2 : 5.5;
}

export function buildKataGoPositionCommands(gameView) {
  const size = boundedInteger(gameView?.size, 13, 2, 25);
  const commands = [
    `boardsize ${size}`,
    "kata-set-rules chinese",
    `komi ${formatGtpNumber(internalKomiToGtpKomi(gameView?.komi))}`,
    "clear_board"
  ];

  for (const entry of gameView?.history ?? []) {
    if (entry?.type === "pass") {
      if (!isPlayerColor(entry.color)) return { ok: false, reason: "unsupported-history" };
      commands.push(`play ${gtpColor(entry.color)} pass`);
      continue;
    }
    if (entry?.type !== "move") return { ok: false, reason: "unsupported-history" };
    const vertex = pointIdToGtpVertex(entry.id, size);
    if (!vertex || !isPlayerColor(entry.color)) {
      return { ok: false, reason: "unsupported-history" };
    }
    commands.push(`play ${gtpColor(entry.color)} ${vertex}`);
  }

  return { ok: true, commands, size };
}

export function parseKataAnalyzeLine(line) {
  const text = String(line ?? "").trim();
  if (!text) return { candidates: [], rootInfo: null };
  const markers = [...text.matchAll(TOP_LEVEL_ANALYSIS_TOKEN)];
  const candidates = [];
  let rootInfo = null;

  for (const [index, marker] of markers.entries()) {
    const start = marker.index ?? 0;
    const end = markers[index + 1]?.index ?? text.length;
    const block = text.slice(start, end).trim();
    if (block.startsWith("info ")) {
      const candidate = parseCandidateBlock(block);
      if (candidate) candidates.push(candidate);
    } else if (block.startsWith("rootInfo")) {
      rootInfo = parseNumericFields(block, ROOT_NUMERIC_FIELDS);
    }
  }

  return {
    candidates: candidates.sort((left, right) => left.order - right.order),
    rootInfo
  };
}

export function kataCandidateToAction(candidate, size) {
  const move = String(candidate?.move ?? "").trim();
  if (/^pass$/i.test(move)) return { type: "pass" };
  if (!move || /^resign$/i.test(move)) return null;
  const pointId = gtpVertexToPointId(move, boundedInteger(size, 13, 2, 25));
  return pointId ? { type: "move", pointId } : null;
}

function parseCandidateBlock(block) {
  const move = /^info\s+move\s+(\S+)/.exec(block)?.[1];
  if (!move) return null;
  const candidate = {
    move,
    ...parseNumericFields(block, CANDIDATE_NUMERIC_FIELDS)
  };
  candidate.order = Number.isFinite(candidate.order) ? Math.trunc(candidate.order) : Number.MAX_SAFE_INTEGER;
  candidate.visits = Number.isFinite(candidate.visits) ? Math.max(0, Math.trunc(candidate.visits)) : 0;
  const pvMatch = /\bpv\s+(.+)$/.exec(block);
  candidate.pv = pvMatch
    ? pvMatch[1].trim().split(/\s+/).filter(Boolean)
    : [];
  return candidate;
}

function parseNumericFields(block, fields) {
  const values = {};
  for (const field of fields) {
    const match = new RegExp(`\\b${field}\\s+(-?(?:\\d+(?:\\.\\d+)?|\\.\\d+)(?:[eE][+-]?\\d+)?)`).exec(block);
    if (!match) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value)) values[field] = value;
  }
  return values;
}

function isPlayerColor(color) {
  return color === COLORS.black || color === COLORS.white;
}

function gtpColor(color) {
  return color === COLORS.white ? "W" : "B";
}

function formatGtpNumber(value) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));
}

function boundedInteger(value, fallback, minimum, maximum) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(number)));
}
