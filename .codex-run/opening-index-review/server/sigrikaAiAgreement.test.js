import { describe, expect, it } from "vitest";
import { COLORS, GAME_PHASES } from "../src/shared/game.js";
import {
  createSigrikaAiAgreementAudit,
  createSigrikaAiAgreementSnapshot,
  evaluateSigrikaAiAgreementMove,
  markSigrikaAiAnalysisAttempt,
  shouldAnalyzeSigrikaHumanTurn
} from "./sigrikaAiAgreement.js";

function candidate(pointId, order, { scoreLead = 5 - order, winrate = 0.65 - order * 0.02, prior = 0.2 - order * 0.03 } = {}) {
  const [x, y] = pointId.split(",").map(Number);
  const columns = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
  return {
    move: `${columns[x]}${13 - y}`,
    order,
    visits: 300 - order * 20,
    scoreLead,
    winrate,
    prior
  };
}

function hardSnapshot(moveNumber) {
  const snapshot = createSigrikaAiAgreementSnapshot({
    analysis: {
      ok: true,
      rootInfo: { visits: 400 },
      candidates: [
        candidate("3,3", 0, { scoreLead: 5, winrate: 0.65, prior: 0.01 }),
        candidate("4,4", 1, { scoreLead: 3.5, winrate: 0.61, prior: 0.25 }),
        candidate("5,5", 2, { scoreLead: 3, winrate: 0.6, prior: 0.2 }),
        candidate("6,6", 3, { scoreLead: 2, winrate: 0.58, prior: 0.15 })
      ]
    },
    boardSize: 13,
    playerColor: COLORS.black,
    positionMoveNumber: moveNumber - 1,
    legalMoveCount: 20,
    minVisits: 200
  });
  return snapshot.snapshot;
}

function applyTop1(audit, moveNumber) {
  const withPending = markSigrikaAiAnalysisAttempt(audit, moveNumber - 1, hardSnapshot(moveNumber));
  return evaluateSigrikaAiAgreementMove(withPending, {
    type: "move",
    color: COLORS.black,
    id: "3,3",
    moveNumber
  }).audit;
}

describe("Sigrika AI agreement audit", () => {
  it("waits until the opening warm-up is over and only analyzes the human turn", () => {
    const room = {
      sigrikaCandyDuel: { humanColor: COLORS.black, aiAgreementAudit: createSigrikaAiAgreementAudit() },
      game: { phase: GAME_PHASES.playing, turn: COLORS.black, moveNumber: 19 }
    };
    expect(shouldAnalyzeSigrikaHumanTurn(room)).toBe(false);
    room.game.moveNumber = 20;
    expect(shouldAnalyzeSigrikaHumanTurn(room)).toBe(true);
    room.game.turn = COLORS.white;
    expect(shouldAnalyzeSigrikaHumanTurn(room)).toBe(false);
  });

  it("excludes forced positions, low-visit results, and equivalent best moves", () => {
    const base = {
      analysis: { ok: true, rootInfo: { visits: 300 }, candidates: [candidate("3,3", 0), candidate("4,4", 1)] },
      boardSize: 13,
      playerColor: COLORS.black,
      positionMoveNumber: 20,
      legalMoveCount: 2,
      minVisits: 200
    };
    expect(createSigrikaAiAgreementSnapshot(base)).toMatchObject({ ok: false, reason: "forced-move" });
    expect(createSigrikaAiAgreementSnapshot({ ...base, legalMoveCount: 20, minVisits: 400 })).toMatchObject({ ok: false, reason: "insufficient-visits" });
    const equivalent = {
      ...base,
      legalMoveCount: 20,
      analysis: {
        ok: true,
        rootInfo: { visits: 300 },
        candidates: [
          candidate("3,3", 0, { scoreLead: 5, winrate: 0.65 }),
          candidate("4,4", 1, { scoreLead: 4.9, winrate: 0.649 })
        ]
      }
    };
    expect(createSigrikaAiAgreementSnapshot(equivalent)).toMatchObject({ ok: false, reason: "equivalent-best-moves" });
  });

  it("does not count passes or a stale snapshot as eligible evidence", () => {
    const audit = markSigrikaAiAnalysisAttempt(createSigrikaAiAgreementAudit(), 20, hardSnapshot(21));
    const result = evaluateSigrikaAiAgreementMove(audit, { type: "pass", color: COLORS.black, moveNumber: 21 });
    expect(result.evaluated).toBe(false);
    expect(result.audit.eligibleMoves).toBe(0);
    expect(result.audit.pending).toBeNull();
  });

  it("requires 24 suspicious moves plus a separate six-move confirmation", () => {
    let audit = createSigrikaAiAgreementAudit();
    for (let moveNumber = 21; moveNumber <= 44; moveNumber += 1) audit = applyTop1(audit, moveNumber);
    expect(audit.stage).toBe("confirming");
    expect(audit.triggered).toBe(false);
    for (let moveNumber = 45; moveNumber <= 50; moveNumber += 1) audit = applyTop1(audit, moveNumber);
    expect(audit.triggered).toBe(true);
    expect(audit.triggerReason).toBe("rolling-confirmed");
  });

  it("uses the requested 35 eligible moves for the extreme 90-percent path", () => {
    let audit = createSigrikaAiAgreementAudit();
    for (let moveNumber = 1; moveNumber <= 35; moveNumber += 1) {
      if ([1, 13, 25].includes(moveNumber)) {
        const withPending = markSigrikaAiAnalysisAttempt(audit, moveNumber - 1, hardSnapshot(moveNumber));
        audit = evaluateSigrikaAiAgreementMove(withPending, {
          type: "move",
          color: COLORS.black,
          id: "12,12",
          moveNumber
        }).audit;
      } else {
        audit = applyTop1(audit, moveNumber);
      }
    }
    expect(audit.eligibleMoves).toBe(35);
    expect(audit.top1Hits).toBe(32);
    expect(audit.hardMoveHits).toBe(32);
    expect(audit.triggered).toBe(true);
    expect(audit.triggerReason).toBe("extreme-35");
    expect(audit.triggeredAtMoveNumber).toBe(35);

    const afterTrigger = markSigrikaAiAnalysisAttempt(audit, 35, hardSnapshot(36));
    const repeated = evaluateSigrikaAiAgreementMove(afterTrigger, {
      type: "move",
      color: COLORS.black,
      id: "3,3",
      moveNumber: 36
    });
    expect(repeated.trigger).toBeNull();
    expect(repeated.audit.eligibleMoves).toBe(35);
    expect(repeated.audit.pending).toBeNull();
  });
});
