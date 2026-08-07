import { GAME_PHASES } from "../src/shared/game.js";
import { kataCandidateToAction } from "./zhiziKataGoProtocol.js";

export const SIGRIKA_AI_AUDIT_OPENING_MOVES = 20;
export const SIGRIKA_AI_AUDIT_ROLLING_MOVES = 24;
export const SIGRIKA_AI_AUDIT_CONFIRMATION_MOVES = 6;
export const SIGRIKA_AI_AUDIT_EXTREME_MOVES = 35;

const MAX_PERSISTED_RECENT = SIGRIKA_AI_AUDIT_ROLLING_MOVES;
const MISSING_CANDIDATE_SCORE_LOSS = 5;
const MISSING_CANDIDATE_WINRATE_LOSS = 0.15;

export function createSigrikaAiAgreementAudit(value = {}) {
  return {
    version: 1,
    eligibleMoves: boundedCount(value.eligibleMoves),
    top1Hits: boundedCount(value.top1Hits),
    top3Hits: boundedCount(value.top3Hits),
    hardMoveHits: boundedCount(value.hardMoveHits),
    scoreLossTotal: boundedNumber(value.scoreLossTotal),
    winrateLossTotal: boundedNumber(value.winrateLossTotal),
    largeMistakes: boundedCount(value.largeMistakes),
    currentNearOptimalStreak: boundedCount(value.currentNearOptimalStreak),
    longestNearOptimalStreak: boundedCount(value.longestNearOptimalStreak),
    stage: value.stage === "confirming" ? "confirming" : "monitoring",
    recent: normalizeEntries(value.recent, MAX_PERSISTED_RECENT),
    confirmation: normalizeEntries(value.confirmation, SIGRIKA_AI_AUDIT_CONFIRMATION_MOVES),
    pending: normalizePending(value.pending),
    lastAnalysisAttemptMoveNumber: boundedMoveNumber(value.lastAnalysisAttemptMoveNumber, -1),
    lastEvaluatedMoveNumber: boundedMoveNumber(value.lastEvaluatedMoveNumber, 0),
    triggered: Boolean(value.triggered),
    triggerReason: safeReason(value.triggerReason),
    triggeredAtMoveNumber: value.triggeredAtMoveNumber == null
      ? null
      : boundedMoveNumber(value.triggeredAtMoveNumber, 0)
  };
}

export function shouldAnalyzeSigrikaHumanTurn(room) {
  const duel = room?.sigrikaCandyDuel;
  if (!duel || room?.game?.phase !== GAME_PHASES.playing) return false;
  if (room.game.turn !== duel.humanColor) return false;
  if (Number(room.game.moveNumber ?? 0) < SIGRIKA_AI_AUDIT_OPENING_MOVES) return false;
  const audit = createSigrikaAiAgreementAudit(duel.aiAgreementAudit);
  if (audit.triggered || audit.pending) return false;
  return audit.lastAnalysisAttemptMoveNumber !== Number(room.game.moveNumber ?? 0);
}

export function createSigrikaAiAgreementSnapshot({
  analysis,
  boardSize,
  playerColor,
  positionMoveNumber,
  legalMoveCount,
  minVisits
}) {
  if (!analysis?.ok || !Array.isArray(analysis.candidates)) {
    return { ok: false, reason: analysis?.reason ?? "invalid-result" };
  }
  const candidates = analysis.candidates
    .map((candidate) => {
      const action = kataCandidateToAction(candidate, boardSize);
      if (action?.type !== "move") return null;
      return {
        pointId: action.pointId,
        order: boundedCount(candidate.order, Number.MAX_SAFE_INTEGER),
        visits: boundedCount(candidate.visits),
        winrate: finiteOrNull(candidate.winrate),
        scoreLead: finiteOrNull(candidate.scoreLead),
        prior: finiteOrNull(candidate.prior)
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.order - right.order);
  const topVisits = Math.max(
    boundedCount(analysis.rootInfo?.visits),
    boundedCount(candidates[0]?.visits)
  );
  if (!candidates.length || topVisits < boundedCount(minVisits)) {
    return { ok: false, reason: "insufficient-visits" };
  }
  if (boundedCount(legalMoveCount) <= 2) return { ok: false, reason: "forced-move" };
  if (hasEquivalentBestMoves(candidates)) return { ok: false, reason: "equivalent-best-moves" };
  return {
    ok: true,
    snapshot: {
      playerColor,
      positionMoveNumber: boundedMoveNumber(positionMoveNumber, 0),
      expectedMoveNumber: boundedMoveNumber(positionMoveNumber, 0) + 1,
      topVisits,
      candidates
    }
  };
}

export function markSigrikaAiAnalysisAttempt(auditInput, positionMoveNumber, pending = null) {
  const audit = createSigrikaAiAgreementAudit(auditInput);
  audit.lastAnalysisAttemptMoveNumber = boundedMoveNumber(positionMoveNumber, 0);
  audit.pending = normalizePending(pending);
  return audit;
}

export function evaluateSigrikaAiAgreementMove(auditInput, historyEntry) {
  const audit = createSigrikaAiAgreementAudit(auditInput);
  const pending = audit.pending;
  if (!pending) return { audit, evaluated: false, trigger: null };
  audit.pending = null;
  if (audit.triggered) return { audit, evaluated: false, trigger: null };
  const moveNumber = boundedMoveNumber(historyEntry?.moveNumber, 0);
  if (
    historyEntry?.type !== "move"
    || historyEntry?.color !== pending.playerColor
    || moveNumber !== pending.expectedMoveNumber
    || typeof historyEntry?.id !== "string"
  ) {
    audit.lastEvaluatedMoveNumber = Math.max(audit.lastEvaluatedMoveNumber, moveNumber);
    return { audit, evaluated: false, trigger: null };
  }

  const entry = scoreMoveAgainstSnapshot(pending, historyEntry.id);
  audit.lastEvaluatedMoveNumber = moveNumber;
  audit.eligibleMoves += 1;
  audit.top1Hits += Number(entry.top1);
  audit.top3Hits += Number(entry.top3);
  audit.hardMoveHits += Number(entry.hardMove);
  audit.scoreLossTotal += entry.scoreLoss;
  audit.winrateLossTotal += entry.winrateLoss;
  audit.largeMistakes += Number(entry.largeMistake);
  audit.currentNearOptimalStreak = entry.nearOptimal ? audit.currentNearOptimalStreak + 1 : 0;
  audit.longestNearOptimalStreak = Math.max(audit.longestNearOptimalStreak, audit.currentNearOptimalStreak);
  audit.recent = [...audit.recent, entry].slice(-MAX_PERSISTED_RECENT);

  let trigger = null;
  if (audit.stage === "confirming") {
    audit.confirmation = [...audit.confirmation, entry].slice(-SIGRIKA_AI_AUDIT_CONFIRMATION_MOVES);
    if (audit.confirmation.length === SIGRIKA_AI_AUDIT_CONFIRMATION_MOVES) {
      if (passesConfirmation(audit.confirmation)) {
        trigger = triggerAudit(audit, "rolling-confirmed", moveNumber);
      } else {
        audit.stage = "monitoring";
        audit.confirmation = [];
      }
    }
  } else if (passesRollingWindow(audit.recent)) {
    audit.stage = "confirming";
    audit.confirmation = [];
  }

  if (!audit.triggered && passesExtremeThreshold(audit)) {
    trigger = triggerAudit(audit, "extreme-35", moveNumber);
  }

  return { audit, evaluated: true, entry, trigger };
}

function scoreMoveAgainstSnapshot(snapshot, pointId) {
  const best = snapshot.candidates[0];
  const actual = snapshot.candidates.find((candidate) => candidate.pointId === pointId) ?? null;
  const top1 = actual?.order === 0;
  const top3 = Number(actual?.order) <= 2;
  const scoreLoss = positiveDifference(best?.scoreLead, actual?.scoreLead, MISSING_CANDIDATE_SCORE_LOSS);
  const winrateLoss = positiveDifference(best?.winrate, actual?.winrate, MISSING_CANDIDATE_WINRATE_LOSS);
  const priorRank = actual
    ? [...snapshot.candidates]
        .sort((left, right) => (right.prior ?? -1) - (left.prior ?? -1))
        .findIndex((candidate) => candidate.pointId === actual.pointId) + 1
    : 0;
  const bestGap = positiveDifference(best?.scoreLead, snapshot.candidates[1]?.scoreLead, 0);
  const hardMove = top1 && priorRank >= 4 && bestGap >= 1;
  return {
    moveNumber: snapshot.expectedMoveNumber,
    top1,
    top3,
    hardMove,
    scoreLoss: roundMetric(scoreLoss),
    winrateLoss: roundMetric(winrateLoss),
    largeMistake: scoreLoss > 2.5,
    nearOptimal: top3 && scoreLoss <= 1
  };
}

function passesRollingWindow(entries) {
  if (entries.length !== SIGRIKA_AI_AUDIT_ROLLING_MOVES) return false;
  const totals = entryTotals(entries);
  return totals.top1 / entries.length >= 0.75
    && totals.top3 / entries.length >= 0.92
    && totals.scoreLoss / entries.length <= 0.8
    && totals.largeMistakes <= 1
    && totals.hardMoves >= 5;
}

function passesConfirmation(entries) {
  if (entries.length !== SIGRIKA_AI_AUDIT_CONFIRMATION_MOVES) return false;
  const totals = entryTotals(entries);
  return totals.top3 >= 5
    && totals.scoreLoss / entries.length <= 1
    && entries.every((entry) => entry.scoreLoss <= 3);
}

function passesExtremeThreshold(audit) {
  return audit.eligibleMoves >= SIGRIKA_AI_AUDIT_EXTREME_MOVES
    && audit.top1Hits / audit.eligibleMoves >= 0.9
    && audit.hardMoveHits >= 6;
}

function triggerAudit(audit, reason, moveNumber) {
  audit.triggered = true;
  audit.triggerReason = reason;
  audit.triggeredAtMoveNumber = moveNumber;
  audit.stage = "monitoring";
  audit.confirmation = [];
  return { reason, moveNumber };
}

function hasEquivalentBestMoves(candidates) {
  const [best, second] = candidates;
  if (!best || !second) return false;
  if (best.scoreLead == null || second.scoreLead == null || best.winrate == null || second.winrate == null) return false;
  return Math.abs(best.scoreLead - second.scoreLead) <= 0.15
    && Math.abs(best.winrate - second.winrate) <= 0.002;
}

function entryTotals(entries) {
  return entries.reduce((totals, entry) => ({
    top1: totals.top1 + Number(entry.top1),
    top3: totals.top3 + Number(entry.top3),
    hardMoves: totals.hardMoves + Number(entry.hardMove),
    scoreLoss: totals.scoreLoss + boundedNumber(entry.scoreLoss),
    largeMistakes: totals.largeMistakes + Number(entry.largeMistake)
  }), { top1: 0, top3: 0, hardMoves: 0, scoreLoss: 0, largeMistakes: 0 });
}

function normalizePending(value) {
  if (!value || !Array.isArray(value.candidates) || !value.candidates.length) return null;
  return {
    playerColor: value.playerColor,
    positionMoveNumber: boundedMoveNumber(value.positionMoveNumber, 0),
    expectedMoveNumber: boundedMoveNumber(value.expectedMoveNumber, 1),
    topVisits: boundedCount(value.topVisits),
    candidates: value.candidates.slice(0, 30).map((candidate) => ({
      pointId: String(candidate.pointId ?? ""),
      order: boundedCount(candidate.order, Number.MAX_SAFE_INTEGER),
      visits: boundedCount(candidate.visits),
      winrate: finiteOrNull(candidate.winrate),
      scoreLead: finiteOrNull(candidate.scoreLead),
      prior: finiteOrNull(candidate.prior)
    })).filter((candidate) => candidate.pointId)
  };
}

function normalizeEntries(value, limit) {
  if (!Array.isArray(value)) return [];
  return value.slice(-limit).map((entry) => ({
    moveNumber: boundedMoveNumber(entry.moveNumber, 0),
    top1: Boolean(entry.top1),
    top3: Boolean(entry.top3),
    hardMove: Boolean(entry.hardMove),
    scoreLoss: boundedNumber(entry.scoreLoss),
    winrateLoss: boundedNumber(entry.winrateLoss),
    largeMistake: Boolean(entry.largeMistake),
    nearOptimal: Boolean(entry.nearOptimal)
  }));
}

function positiveDifference(best, actual, fallback) {
  if (!Number.isFinite(best) || !Number.isFinite(actual)) return fallback;
  return Math.max(0, best - actual);
}

function boundedCount(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : fallback;
}

function boundedMoveNumber(value, fallback) {
  return boundedCount(value, fallback);
}

function boundedNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function roundMetric(value) {
  return Number(value.toFixed(6));
}

function safeReason(value) {
  return ["rolling-confirmed", "extreme-35"].includes(value) ? value : "";
}
