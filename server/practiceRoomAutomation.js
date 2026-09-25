import {
  GAME_PHASES,
  exposeHiddenHands,
  gameViewForColor,
  markDeadGroup,
  playMove,
  resignGame
} from "../src/shared/game.js";
import {
  isPracticeRoom,
  practiceCaptureResignThreshold,
  practiceDifficulty,
  PRACTICE_DIFFICULTIES
} from "../src/shared/practiceMode.js";
import { choosePracticeAction, obviousDeadBotGroups } from "./practiceBotDecision.js";
import { isCaptureChallenge } from "../src/shared/captureChallenge.js";
import { legalPracticeGtpVertices, practiceBotEngine } from "./practiceBotEngine.js";
import {
  SIGRIKA_CANDY_DUEL,
  SIGRIKA_CANDY_DUEL_PRESENTATION
} from "../src/shared/sigrikaCandyArc.js";
import { chooseSigrikaDuelAction } from "./sigrikaDuelEngine.js";
import {
  createSigrikaAiAgreementAudit,
  createSigrikaAiAgreementSnapshot,
  evaluateSigrikaAiAgreementMove,
  markSigrikaAiAnalysisAttempt,
  shouldAnalyzeSigrikaHumanTurn
} from "./sigrikaAiAgreement.js";
import { zhiziKataGoEngine } from "./zhiziKataGoEngine.js";

const SIGRIKA_DIALOGUE_HOLD_MS = 1800;
const SIGRIKA_SKILL_HOLD_MS = 2100;
const SIGRIKA_PRESENTATION_START_DELAY_MS = 120;

export function createPracticeRoomAutomation({
  rooms,
  scheduleRoomTimeout,
  handleGameAction,
  respondCounting,
  respondDraw,
  handleScoringAction,
  appendSystem,
  appendNotices,
  scheduleRoomClose,
  broadcastRoom,
  persistRoom = () => {},
  random = Math.random,
  practiceEngine = practiceBotEngine,
  zhiziEngine = zhiziKataGoEngine
}) {
  const scheduled = new Map();
  const inFlight = new Map();

  function schedule(room, io) {
    if ((!isPracticeRoom(room) && room.matchSource !== SIGRIKA_CANDY_DUEL.matchSource) || !room.practice) return false;
    reconcileSigrikaHumanAudit(room);
    if (inFlight.has(room.code)) return false;
    const instruction = nextInstruction(room);
    if (!instruction) {
      scheduled.delete(room.code);
      return false;
    }
    const key = instructionKey(room, instruction);
    if (scheduled.get(room.code) === key) return false;
    scheduled.set(room.code, key);
    scheduleRoomTimeout(room, () => {
      if (scheduled.get(room.code) !== key) return;
      scheduled.delete(room.code);
      const latest = rooms.get(room.code);
      if (!latest || instructionKey(latest, nextInstruction(latest)) !== key) return;
      inFlight.set(room.code, key);
      return execute(latest, instruction, io, key).catch(() => null).finally(() => {
        if (inFlight.get(room.code) === key) inFlight.delete(room.code);
        const current = rooms.get(room.code);
        if (current) schedule(current, io);
      });
    }, instruction.delayMs);
    return true;
  }

  function nextInstruction(room) {
    if (!humanPlayer(room)?.socketId || room.game.pendingSkill) return null;
    const bot = botPlayer(room);
    if (!bot) return null;
    normalizeSigrikaDuelPresentationState(room);
    const difficulty = practiceDifficulty(room.practice.difficulty) ?? PRACTICE_DIFFICULTIES.beginner;
    if (zhiziEngine?.isEnabled?.() && shouldAnalyzeSigrikaHumanTurn(room)) {
      return { type: "analyze-human", delayMs: 0 };
    }
    if (room.game.phase === GAME_PHASES.playing && room.game.turn === bot.color) {
      const presentationInstruction = nextSigrikaPresentationInstruction(room);
      if (presentationInstruction) return presentationInstruction;
      const human = humanPlayer(room);
      if (!room.sigrikaCandyDuel && !isCaptureChallenge(room) && Number(room.game.captures?.[human.color] ?? 0) >= practiceCaptureResignThreshold(room.practice)) {
        return { type: "resign", delayMs: 120 };
      }
      return { type: "play", delayMs: randomDelay(difficulty.delayMs, random) };
    }
    if (room.game.phase === GAME_PHASES.countingRequested && room.game.scoring?.requestedBy !== bot.user.id) {
      return { type: "accept-counting", delayMs: 700 };
    }
    if (!room.sigrikaCandyDuel && room.game.phase === GAME_PHASES.drawRequested && room.game.drawRequest?.requestedBy !== bot.user.id) {
      return { type: "accept-draw", delayMs: 900 };
    }
    if (room.game.phase === GAME_PHASES.markingDead && !(room.game.scoring?.confirmedBy ?? []).includes(bot.user.id)) {
      return { type: "confirm-dead", delayMs: 650 };
    }
    if (room.game.phase === GAME_PHASES.resultReview && !(room.game.scoring?.resultAcceptedBy ?? []).includes(bot.user.id)) {
      return { type: "accept-result", delayMs: 650 };
    }
    return null;
  }

  async function execute(room, instruction, io, key) {
    const bot = botPlayer(room);
    let result = null;
    if (instruction.type === "analyze-human") {
      await analyzeHumanTurn(room, key);
    } else if (isSigrikaPresentationInstruction(instruction)) {
      result = applySigrikaPresentationInstruction(room, instruction);
    } else if (instruction.type === "resign") {
      result = resignForCaptureThreshold(room, bot, io);
    } else if (instruction.type === "play") {
      const view = gameViewForColor(room.game, bot.color);
      const difficulty = practiceDifficulty(room.practice.difficulty) ?? PRACTICE_DIFFICULTIES.beginner;
      const decision = room.sigrikaCandyDuel
        ? await chooseSigrikaAction(room, view, bot.color)
        : await chooseBotAction(view, bot.color, difficulty);
      const latest = rooms.get(room.code);
      if (!latest || instructionKey(latest, nextInstruction(latest)) !== key) return null;
      const latestBot = botPlayer(latest);
      if (!latestBot) return null;
      if (!decision.ok) {
        result = handleEngineFailure(latest, latestBot, decision.reason, io);
      } else {
        latest.practice.engineFailureCount = 0;
        result = handleGameAction(latest.code, latestBot.user.id, decision.action, io);
      }
    } else if (instruction.type === "accept-counting") {
      result = respondCounting(room.code, bot.user.id, true);
    } else if (instruction.type === "accept-draw") {
      result = respondDraw(room.code, bot.user.id, true, io);
    } else if (instruction.type === "confirm-dead") {
      markObviousDeadGroupsOnce(room, bot);
      result = handleScoringAction(room.code, bot.user.id, { type: "confirm-dead" }, io);
    } else if (instruction.type === "accept-result") {
      result = handleScoringAction(room.code, bot.user.id, { type: "accept-result" }, io);
    }
    if (result?.ok) broadcastRoom(io, result.room);
    return result;
  }

  async function chooseBotAction(view, botColor, difficulty) {
    try {
      if (difficulty.strategy === "heuristic") {
        const action = choosePracticeAction(view, botColor, difficulty, { random });
        return isLegalPracticeAction(view, botColor, action)
          ? { ok: true, action }
          : { ok: false, reason: "invalid-result" };
      }
      const engineResult = await practiceEngine.search(view, botColor, difficulty);
      if (engineResult?.ok && isLegalPracticeAction(view, botColor, engineResult.action)) {
        return { ok: true, action: engineResult.action };
      }
      return { ok: false, reason: engineResult?.reason ?? "invalid-result" };
    } catch {
      return { ok: false, reason: "error" };
    }
  }

  async function chooseSigrikaAction(room, view, botColor) {
    return chooseSigrikaDuelAction({
      view,
      botColor,
      zhiziEngine,
      practiceEngine,
      chooseHeuristicAction: (nextView, nextColor, difficulty) => choosePracticeAction(nextView, nextColor, difficulty, { random }),
      isLegalAction: isLegalPracticeAction,
      onFallback: (difficultyId) => {
        const labels = { zhizi: "智子云 KataGo", advanced: "高级 GNU Go", intermediate: "中级 GNU Go", beginner: "入门策略" };
        appendSystem(room, `${labels[difficultyId] ?? difficultyId} 响应异常，正在切换后备计算。`, { kind: "engine-fallback" });
      }
    });
  }

  async function analyzeHumanTurn(room, key) {
    const human = humanPlayer(room);
    if (!human) return;
    const positionMoveNumber = Number(room.game.moveNumber ?? 0);
    const view = gameViewForColor(room.game, human.color);
    const legalMoveCount = legalPracticeGtpVertices(view, human.color).length;
    let analysis = null;
    try {
      analysis = await zhiziEngine.analyze(view, human.color, { purpose: "audit" });
    } catch {
      analysis = { ok: false, reason: "error" };
    }
    const latest = rooms.get(room.code);
    if (!latest || instructionKey(latest, nextInstruction(latest)) !== key) return;
    const snapshot = createSigrikaAiAgreementSnapshot({
      analysis,
      boardSize: latest.game.size,
      playerColor: human.color,
      positionMoveNumber,
      legalMoveCount,
      minVisits: analysis?.minVisits ?? 1
    });
    const currentAudit = createSigrikaAiAgreementAudit(latest.sigrikaCandyDuel?.aiAgreementAudit);
    latest.sigrikaCandyDuel.aiAgreementAudit = markSigrikaAiAnalysisAttempt(
      currentAudit,
      positionMoveNumber,
      snapshot.ok ? snapshot.snapshot : null
    );
    persistRoom(latest, { force: true });
  }

  function reconcileSigrikaHumanAudit(room) {
    const duel = room.sigrikaCandyDuel;
    if (!duel) return false;
    const audit = createSigrikaAiAgreementAudit(duel.aiAgreementAudit);
    const pending = audit.pending;
    if (!pending || Number(room.game.moveNumber ?? 0) < pending.expectedMoveNumber) {
      duel.aiAgreementAudit = audit;
      return false;
    }
    const historyEntry = findHistoryMove(room.game.history, pending.expectedMoveNumber, pending.playerColor);
    const evaluation = evaluateSigrikaAiAgreementMove(audit, historyEntry);
    duel.aiAgreementAudit = evaluation.audit;
    if (evaluation.trigger && !duel.aiAgreementTriggered) {
      duel.aiAgreementTriggered = true;
      duel.aiAgreementEventSeq = Number(duel.aiAgreementEventSeq ?? 0) + 1;
      duel.aiAgreementTrigger = evaluation.trigger;
      duel.aiReactionPresentationStage = "pending";
    }
    persistRoom(room, { force: true });
    return evaluation.evaluated;
  }

  function applySigrikaPresentationInstruction(room, instruction) {
    const duel = room.sigrikaCandyDuel;
    if (!duel) return null;
    if (instruction.type === "sigrika-opening-dialogue") {
      duel.openingPresentationStage = "dialogue";
      publishSigrikaDialogue(room, SIGRIKA_CANDY_DUEL_PRESENTATION.openingDialogue, "sigrika-opening-dialogue");
    } else if (instruction.type === "sigrika-opening-skill") {
      duel.openingPresentationStage = "skill";
      publishSigrikaSkill(room, SIGRIKA_CANDY_DUEL_PRESENTATION.openingSkillName, "sigrika-opening-skill");
    } else if (instruction.type === "sigrika-opening-finish") {
      duel.openingPresentationStage = "done";
      duel.presentation = null;
    } else if (instruction.type === "sigrika-ai-reaction-dialogue-1") {
      duel.aiReactionPresentationStage = "dialogue-1";
      publishSigrikaDialogue(room, SIGRIKA_CANDY_DUEL_PRESENTATION.aiReactionDialogues[0], "sigrika-ai-reaction-dialogue");
    } else if (instruction.type === "sigrika-ai-reaction-dialogue-2") {
      duel.aiReactionPresentationStage = "dialogue-2";
      publishSigrikaDialogue(room, SIGRIKA_CANDY_DUEL_PRESENTATION.aiReactionDialogues[1], "sigrika-ai-reaction-dialogue");
    } else if (instruction.type === "sigrika-ai-reaction-dialogue-3") {
      duel.aiReactionPresentationStage = "dialogue-3";
      publishSigrikaDialogue(room, SIGRIKA_CANDY_DUEL_PRESENTATION.aiReactionDialogues[2], "sigrika-ai-reaction-dialogue");
    } else if (instruction.type === "sigrika-ai-reaction-skill") {
      duel.aiReactionPresentationStage = "skill";
      publishSigrikaSkill(room, SIGRIKA_CANDY_DUEL_PRESENTATION.aiReactionSkillName, "sigrika-ai-reaction-skill");
    } else if (instruction.type === "sigrika-ai-reaction-finish") {
      duel.aiReactionPresentationStage = "done";
      duel.presentation = null;
    } else {
      return null;
    }
    return { ok: true, room };
  }

  function publishSigrikaDialogue(room, text, kind) {
    const duel = room.sigrikaCandyDuel;
    const sequence = Number(duel.presentationSequence ?? 0) + 1;
    duel.presentationSequence = sequence;
    duel.presentation = {
      sequence,
      type: "dialogue",
      speaker: SIGRIKA_CANDY_DUEL_PRESENTATION.speaker,
      text
    };
    appendSystem(room, text, { kind });
  }

  function publishSigrikaSkill(room, skillName, kind) {
    const duel = room.sigrikaCandyDuel;
    const sequence = Number(duel.presentationSequence ?? 0) + 1;
    duel.presentationSequence = sequence;
    duel.presentation = {
      sequence,
      type: "skill",
      speaker: SIGRIKA_CANDY_DUEL_PRESENTATION.speaker,
      skillName
    };
    appendSystem(room, `${SIGRIKA_CANDY_DUEL_PRESENTATION.speaker}发动了“${skillName}”。`, { kind });
  }

  function handleEngineFailure(room, bot, reason, io) {
    if (reason === "busy") return null;
    room.practice.engineFailureCount = Number(room.practice.engineFailureCount ?? 0) + 1;
    if (room.practice.engineFailureCount < 3) return null;
    const result = resignGame(room.game, bot.color);
    room.game = result.state;
    if (room.game.winner) delete room.game.winner.invalid;
    appendNotices(room, exposeHiddenHands(room.game));
    appendSystem(room, "准时宝的 GNU Go 引擎暂时不可用，本局已结束。");
    scheduleRoomClose(room.code, io);
    return { ok: true, room };
  }

  function resignForCaptureThreshold(room, bot, io) {
    const result = resignGame(room.game, bot.color);
    room.game = result.state;
    if (room.game.winner) delete room.game.winner.invalid;
    appendNotices(room, exposeHiddenHands(room.game));
    appendSystem(room, "准时宝判断普通提子已达到练习阈值，认输了。");
    scheduleRoomClose(room.code, io);
    return { ok: true, room };
  }

  function markObviousDeadGroupsOnce(room, bot) {
    const requestId = room.game.scoring?.requestedBy ?? "counting";
    if (room.practice.deadAnalysisRequestId === requestId) return;
    room.practice.deadAnalysisRequestId = requestId;
    for (const pointId of obviousDeadBotGroups(room.game, bot.color)) {
      const result = markDeadGroup(room.game, pointId, bot.color);
      if (result.ok) room.game = result.state;
    }
  }

  return {
    schedule,
    close: () => zhiziEngine?.close?.()
  };
}

function botPlayer(room) {
  return room.players.find((player) => player.isBot || player.user?.isBot) ?? null;
}

function humanPlayer(room) {
  return room.players.find((player) => !player.isBot && !player.user?.isBot) ?? null;
}

function findHistoryMove(history, moveNumber, color) {
  for (let index = (history?.length ?? 0) - 1; index >= 0; index -= 1) {
    const entry = history[index];
    if (Number(entry?.moveNumber) === moveNumber && entry?.color === color) return entry;
  }
  return null;
}

function nextSigrikaPresentationInstruction(room) {
  const duel = room.sigrikaCandyDuel;
  if (!duel) return null;
  if (duel.openingPresentationStage === "pending") {
    return { type: "sigrika-opening-dialogue", delayMs: SIGRIKA_PRESENTATION_START_DELAY_MS };
  }
  if (duel.openingPresentationStage === "dialogue") {
    return { type: "sigrika-opening-skill", delayMs: SIGRIKA_DIALOGUE_HOLD_MS };
  }
  if (duel.openingPresentationStage === "skill") {
    return { type: "sigrika-opening-finish", delayMs: SIGRIKA_SKILL_HOLD_MS };
  }
  if (duel.aiReactionPresentationStage === "pending") {
    return { type: "sigrika-ai-reaction-dialogue-1", delayMs: SIGRIKA_PRESENTATION_START_DELAY_MS };
  }
  if (duel.aiReactionPresentationStage === "dialogue-1") {
    return { type: "sigrika-ai-reaction-dialogue-2", delayMs: SIGRIKA_DIALOGUE_HOLD_MS };
  }
  if (duel.aiReactionPresentationStage === "dialogue-2") {
    return { type: "sigrika-ai-reaction-dialogue-3", delayMs: SIGRIKA_DIALOGUE_HOLD_MS };
  }
  if (duel.aiReactionPresentationStage === "dialogue-3") {
    return { type: "sigrika-ai-reaction-skill", delayMs: SIGRIKA_DIALOGUE_HOLD_MS };
  }
  if (duel.aiReactionPresentationStage === "skill") {
    return { type: "sigrika-ai-reaction-finish", delayMs: SIGRIKA_SKILL_HOLD_MS };
  }
  return null;
}

function normalizeSigrikaDuelPresentationState(room) {
  const duel = room.sigrikaCandyDuel;
  if (!duel) return;
  if (!["pending", "dialogue", "skill", "done"].includes(duel.openingPresentationStage)) {
    duel.openingPresentationStage = Number(room.game.moveNumber ?? 0) <= 1 ? "pending" : "done";
  }
  if (!["idle", "pending", "dialogue-1", "dialogue-2", "dialogue-3", "skill", "done"].includes(duel.aiReactionPresentationStage)) {
    duel.aiReactionPresentationStage = duel.aiAgreementTriggered ? "pending" : "idle";
  }
  if (!Number.isSafeInteger(duel.presentationSequence) || duel.presentationSequence < 0) {
    duel.presentationSequence = 0;
  }
}

function isSigrikaPresentationInstruction(instruction) {
  return instruction?.type?.startsWith("sigrika-") ?? false;
}

function instructionKey(room, instruction) {
  if (!instruction) return "";
  return [
    instruction.type,
    room.game.phase,
    room.game.turn,
    room.game.moveNumber,
    room.game.pendingSkill?.id ?? "",
    room.game.scoring?.confirmedBy?.join(",") ?? "",
    room.game.scoring?.resultAcceptedBy?.join(",") ?? "",
    room.sigrikaCandyDuel?.aiAgreementAudit?.lastAnalysisAttemptMoveNumber ?? "",
    room.sigrikaCandyDuel?.aiAgreementAudit?.pending?.expectedMoveNumber ?? "",
    room.sigrikaCandyDuel?.openingPresentationStage ?? "",
    room.sigrikaCandyDuel?.aiReactionPresentationStage ?? "",
    room.sigrikaCandyDuel?.presentationSequence ?? ""
  ].join(":");
}

function randomDelay([minimum, maximum], random) {
  return Math.round(minimum + random() * (maximum - minimum));
}

function isLegalPracticeAction(game, color, action) {
  if (action?.type === "pass") return true;
  if (action?.type !== "move" || typeof action.pointId !== "string") return false;
  return playMove(game, color, action.pointId, { colorIllusion: null }).ok;
}
