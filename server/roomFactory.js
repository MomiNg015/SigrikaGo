import {
  COLORS,
  GAME_PHASES,
  createGameState
} from "../src/shared/game.js";
import { normalizeGameModeId } from "../src/shared/gameModes.js";
import { DEFAULT_RANK, normalizeRank, parseRecentResults } from "../src/shared/rankProgression.js";

export const MATCH_SUCCESS_DELAY_MS = 3000;
export const OPENING_NOTICE_DELAY_MS = 3000;

export function createRoom(first, second, {
  modeInput = first.mode ?? second.mode ?? "spark",
  isCodeTaken = () => false,
  now = Date.now,
  random = Math.random
} = {}) {
  const mode = normalizeGameModeId(modeInput);
  const blackFirst = random() >= 0.5;
  const players = [
    toRoomPlayer(blackFirst ? first : second, COLORS.black, mode),
    toRoomPlayer(blackFirst ? second : first, COLORS.white, mode)
  ];
  const createdAt = now();
  const game = createGameState(players.map((p) => ({
    userId: p.user.id,
    color: p.color,
    characterId: p.characterId,
    character: p.character
  })), { mode });
  game.phase = GAME_PHASES.opening;
  return {
    code: randomRoomCode({ isCodeTaken, random }),
    mode,
    players,
    spectators: [],
    game,
    chat: [],
    revision: 0,
    createdAt,
    openingEndsAt: createdAt + MATCH_SUCCESS_DELAY_MS + OPENING_NOTICE_DELAY_MS,
    closesAt: null,
    countingDeadline: null,
    drawDeadline: null,
    timerId: null,
    timeoutIds: [],
    lastTick: now(),
    recordSaved: false
  };
}

export function toRoomPlayer(player, color, mode = "spark") {
  return {
    user: userForRoomMode(player.user, mode),
    socketId: player.socketId,
    disconnectedAt: null,
    color,
    characterId: player.user.selectedCharacter,
    character: player.user.characterConfig ?? null,
    time: {
      main: 5 * 60,
      byoYomi: 30,
      periodRemaining: 30,
      periods: 3
    }
  };
}

export function userForRoomMode(user, mode) {
  const normalizedMode = normalizeGameModeId(mode);
  const stats = modeStatsForUser(user, normalizedMode);
  return {
    ...user,
    rating: stats.rating,
    rank: stats.rank,
    wins: stats.wins,
    losses: stats.losses
  };
}

export function modeStatsForUser(user, mode) {
  const stats = user?.modeStats?.[mode] ?? (
    Array.isArray(user?.modeStats)
      ? user.modeStats.find((entry) => normalizeGameModeId(entry.mode) === mode)
      : null
  );
  return {
    rating: Number(stats?.rating ?? (mode === "spark" ? user?.rating : 1000) ?? 1000),
    rank: normalizeRank(stats?.rank ?? (mode === "spark" ? user?.rank : DEFAULT_RANK)),
    recentResults: parseRecentResults(stats?.recentResults),
    wins: Number(stats?.wins ?? (mode === "spark" ? user?.wins : 0) ?? 0),
    losses: Number(stats?.losses ?? (mode === "spark" ? user?.losses : 0) ?? 0),
    draws: Number(stats?.draws ?? 0)
  };
}

export function randomRoomCode({ isCodeTaken = () => false, random = Math.random } = {}) {
  let code = "";
  do {
    code = String(Math.floor(10000 + random() * 90000));
  } while (isCodeTaken(code));
  return code;
}
