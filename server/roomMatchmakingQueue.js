import { GAME_MODE_IDS, normalizeGameModeId } from "../src/shared/gameModes.js";
import { MATCH_EXPANSION_DELAY_MS, RATED_RANK_DISTANCE, rankDistance } from "../src/shared/matchClassification.js";
import { modeStatsForUser } from "./roomFactory.js";

export function createRoomMatchmakingQueue({
  gameModeIds = [...GAME_MODE_IDS, "team"],
  normalizeModeId = normalizeGameModeId,
  now = Date.now
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
    const previous = waitingPlayers.find((candidate) => candidate.user.id === player.user.id && candidate.mode === mode);
    const queuedPlayer = { ...player, mode, queuedAt: previous?.queuedAt ?? now() };
    waitingPlayers = waitingPlayers.filter((candidate) => (
      candidate.user.id !== player.user.id && candidate.socketId !== player.socketId
    ));
    const timestamp = now();
    const rank = modeStatsForUser(player.user, mode).rank;
    const candidates = waitingPlayers.map((candidate, index) => ({
      candidate, index,
      distance: rankDistance(rank, modeStatsForUser(candidate.user, mode).rank)
    })).filter(({ candidate, distance }) => (
      normalizeModeId(candidate.mode) === mode && canPair(candidate, queuedPlayer)
      && (mode === "team" || distance <= RATED_RANK_DISTANCE
        || (timestamp - queuedPlayer.queuedAt >= MATCH_EXPANSION_DELAY_MS
          && timestamp - candidate.queuedAt >= MATCH_EXPANSION_DELAY_MS))
    ));
    if (mode !== "team") candidates.sort((a, b) => a.distance - b.distance || a.candidate.queuedAt - b.candidate.queuedAt);
    const opponentIndex = candidates[0]?.index ?? -1;
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
