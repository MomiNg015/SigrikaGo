import { GAME_MODE_IDS, normalizeGameModeId } from "../src/shared/gameModes.js";

export function createRoomMatchmakingQueue({
  gameModeIds = GAME_MODE_IDS,
  normalizeModeId = normalizeGameModeId
} = {}) {
  let waitingPlayers = [];

  function list() {
    return [...waitingPlayers];
  }

  function count() {
    return waitingPlayers.length;
  }

  function countsByMode() {
    const counts = Object.fromEntries(gameModeIds.map((mode) => [mode, 0]));
    for (const player of waitingPlayers) {
      counts[normalizeModeId(player.mode)] += 1;
    }
    return counts;
  }

  function clear() {
    waitingPlayers = [];
  }

  function removeUser(userId) {
    waitingPlayers = waitingPlayers.filter((player) => player.user.id !== userId);
  }

  function removeSocket(socketId) {
    waitingPlayers = waitingPlayers.filter((player) => player.socketId !== socketId);
  }

  function join(player, { canPair = () => true } = {}) {
    const mode = normalizeModeId(player.mode);
    const queuedPlayer = { ...player, mode };
    waitingPlayers = waitingPlayers.filter((candidate) => (
      candidate.user.id !== player.user.id && candidate.socketId !== player.socketId
    ));
    const opponentIndex = waitingPlayers.findIndex((candidate) => (
      normalizeModeId(candidate.mode) === mode && canPair(candidate, queuedPlayer)
    ));
    if (opponentIndex >= 0) {
      const [opponent] = waitingPlayers.splice(opponentIndex, 1);
      return { matched: true, opponent, player: queuedPlayer, mode };
    }
    waitingPlayers.push(queuedPlayer);
    return { matched: false, player: queuedPlayer, mode };
  }

  return {
    clear,
    count,
    countsByMode,
    join,
    list,
    removeSocket,
    removeUser
  };
}
