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
import { practiceBotEngine } from "./practiceBotEngine.js";

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
  random = Math.random,
  practiceEngine = practiceBotEngine
}) {
  const scheduled = new Map();
  const inFlight = new Map();

  function schedule(room, io) {
    if (!isPracticeRoom(room) || !room.practice) return false;
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
    const difficulty = practiceDifficulty(room.practice.difficulty) ?? PRACTICE_DIFFICULTIES.beginner;
    if (room.game.phase === GAME_PHASES.playing && room.game.turn === bot.color) {
      const human = humanPlayer(room);
      if (Number(room.game.captures?.[human.color] ?? 0) >= practiceCaptureResignThreshold(room.practice)) {
        return { type: "resign", delayMs: 120 };
      }
      return { type: "play", delayMs: randomDelay(difficulty.delayMs, random) };
    }
    if (room.game.phase === GAME_PHASES.countingRequested && room.game.scoring?.requestedBy !== bot.user.id) {
      return { type: "accept-counting", delayMs: 700 };
    }
    if (room.game.phase === GAME_PHASES.drawRequested && room.game.drawRequest?.requestedBy !== bot.user.id) {
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
    if (instruction.type === "resign") {
      result = resignForCaptureThreshold(room, bot, io);
    } else if (instruction.type === "play") {
      const view = gameViewForColor(room.game, bot.color);
      const difficulty = practiceDifficulty(room.practice.difficulty) ?? PRACTICE_DIFFICULTIES.beginner;
      const decision = await chooseBotAction(view, bot.color, difficulty);
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

  return { schedule };
}

function botPlayer(room) {
  return room.players.find((player) => player.isBot || player.user?.isBot) ?? null;
}

function humanPlayer(room) {
  return room.players.find((player) => !player.isBot && !player.user?.isBot) ?? null;
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
    room.game.scoring?.resultAcceptedBy?.join(",") ?? ""
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
