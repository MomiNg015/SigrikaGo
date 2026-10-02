import { createHash, randomUUID } from "node:crypto";
import { GAME_PHASES } from "../src/shared/game.js";
import { practiceBotView } from "./practiceBotView.js";
import { isCaptureChallenge } from "../src/shared/captureChallenge.js";
import { practiceDifficulty, practiceCaptureResignThreshold } from "../src/shared/practiceMode.js";
import { isLocalPractice, LOCAL_PRACTICE_VERSION, LOCAL_PRACTICE_LEASE_MS } from "../src/shared/localPractice.js";
import { serializePracticePositionToSgf, legalPracticeGtpVertices, pointIdToGtpVertex } from "../src/shared/practiceBotPosition.js";

const failure = (code) => ({ ok: false, code });

export function createLocalPracticeEngine({ getRoom, handleGameAction, broadcastRoom, now = Date.now, id = randomUUID }) {
  // Jobs and receipts are connection leases, never restored from disk.
  const states = new WeakMap();

  function ownedRoom(socket, roomCode) {
    if (typeof roomCode !== "string") return null;
    const room = getRoom(roomCode);
    if (!isLocalPractice(room)) return null;
    const human = room.players.find((p) => !p.isBot && !p.user?.isBot);
    return human?.user.id === socket.user?.id && human.socketId === socket.id ? room : null;
  }

  function eligible(room) {
    if (room.game.phase !== GAME_PHASES.playing || room.game.pendingSkill || room.game.turn !== room.practice.botColor) return false;
    return isCaptureChallenge(room)
      || Number(room.game.captures?.[room.practice.humanColor] ?? 0) < practiceCaptureResignThreshold(room.practice);
  }

  function positionVersion(room) {
    // Skills can mutate the board without incrementing moveNumber.
    return createHash("sha256").update(JSON.stringify(room.game)).digest("hex");
  }

  function request(socket, payload = {}) {
    const room = ownedRoom(socket, payload?.roomCode);
    if (!room) return failure("local_practice_forbidden");
    if (payload.version !== LOCAL_PRACTICE_VERSION) return failure("local_practice_version");
    if (payload.active === false) {
      room.localPracticePausedAt ??= now();
      const state = states.get(room);
      if (state) state.job = null;
      return { ok: true, job: null };
    }
    delete room.localPracticePausedAt;
    room.localPracticeSeenAt = now();
    if (!eligible(room)) {
      const state = states.get(room);
      if (state) state.job = null;
      return { ok: true, job: null };
    }
    const version = positionVersion(room);
    const previous = states.get(room);
    if (previous?.job && previous.version === version && previous.socketId === socket.id && previous.expiresAt > now()) {
      return { ok: true, job: previous.job };
    }
    const view = practiceBotView(room.game, room.practice.botColor);
    const difficulty = practiceDifficulty(room.practice.difficulty);
    const legalVertices = legalPracticeGtpVertices(view, room.practice.botColor);
    const job = {
      id: id(), roomCode: room.code, positionVersion: version,
      version: LOCAL_PRACTICE_VERSION, difficulty: difficulty.id, botColor: room.practice.botColor,
      size: view.size, legalVertices,
      ...(difficulty.strategy === "heuristic" ? { view } : { sgf: serializePracticePositionToSgf(view, room.practice.botColor) })
    };
    states.set(room, { job, version, socketId: socket.id, expiresAt: now() + LOCAL_PRACTICE_LEASE_MS,
      notBefore: now() + difficulty.delayMs[0], receipt: previous?.receipt });
    return { ok: true, job };
  }

  function submit(socket, payload = {}, io) {
    const room = ownedRoom(socket, payload?.roomCode);
    if (!room) return failure("local_practice_forbidden");
    const state = states.get(room);
    if (state?.receipt?.id === payload.jobId && state.receipt.socketId === socket.id) return { ok: true, duplicate: true };
    if (!state?.job || state.socketId !== socket.id || state.job.id !== payload.jobId
      || state.job.positionVersion !== payload.positionVersion || state.expiresAt <= now()
      || !eligible(room) || positionVersion(room) !== state.version) return failure("local_practice_stale");
    if (now() < state.notBefore) return failure("local_practice_wait");
    const action = payload.action;
    if (action?.type !== "pass" && (action?.type !== "move" || typeof action.pointId !== "string"
      || !state.job.legalVertices.includes(pointIdToGtpVertex(action.pointId, room.game.size)))) return failure("local_practice_invalid");
    const bot = room.players.find((p) => p.isBot || p.user?.isBot);
    const result = handleGameAction(room.code, bot.user.id,
      action.type === "pass" ? { type: "pass" } : { type: "move", pointId: action.pointId }, io);
    // Consume before broadcasting, which may schedule another bot action.
    state.job = null;
    if (!result?.ok) return failure("local_practice_invalid");
    state.receipt = { id: payload.jobId, socketId: socket.id };
    room.localPracticeSeenAt = now();
    broadcastRoom(io, result.room);
    return { ok: true };
  }

  return { request, submit };
}
