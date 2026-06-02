import { GAME_PHASES } from "../shared/game.js";
import { latestBoardSoundAction } from "../shared/boardAudio.js";

export function shouldSeedRoomAudioBaseline(room) {
  return Boolean(room?.__audioResumeBaseline && room?.game?.phase !== GAME_PHASES.finished);
}

export function buildRoomAudioBaseline(room) {
  const history = room?.game?.history ?? [];
  const boardSoundAction = latestBoardSoundAction(history);
  const exposedIds = (room?.game?.points ?? [])
    .filter((point) => point.hiddenHand?.exposed)
    .map((point) => point.id)
    .sort();
  return {
    boardSoundKey: boardSoundAction?.key ?? null,
    hiddenRevealKey: exposedIds.join("|"),
    voiceState: buildVoiceState(room?.players ?? [], history.length),
    systemVoiceState: buildSystemVoiceState(room?.chat ?? [])
  };
}

export function applyRoomAudioBaseline(refs, baseline) {
  refs.soundMoveRef.current = baseline.boardSoundKey;
  refs.hiddenRevealSoundRef.current = baseline.hiddenRevealKey;
  refs.voiceRef.current = { ...refs.voiceRef.current, ...baseline.voiceState };
  refs.systemVoiceRef.current = { ...refs.systemVoiceRef.current, ...baseline.systemVoiceState };
}

function buildVoiceState(players, historyLength) {
  const state = {};
  for (const player of players) {
    if (!player?.color || !player.time) continue;
    state[`${player.color}-main`] = player.time.main;
    state[`${player.color}-periods`] = player.time.periods;
    if (player.time.main <= 0 && player.time.periodRemaining <= 10 && player.time.periodRemaining > 0) {
      state[`${player.color}-${historyLength}-${player.time.periods}-${player.time.periodRemaining}`] = true;
    }
  }
  return state;
}

function buildSystemVoiceState(chat) {
  const gameStartMessage = chat.findLast?.((message) => message.kind === "game-start")
    ?? [...chat].reverse().find((message) => message.kind === "game-start");
  return gameStartMessage ? { gameStart: gameStartMessage.id } : {};
}
