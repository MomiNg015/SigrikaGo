import {
  COLORS,
  GAME_PHASES,
  createGameState
} from "../src/shared/game.js";
import { normalizeGameModeId } from "../src/shared/gameModes.js";
import { DEFAULT_RANK, normalizeRank, parseRecentResults } from "../src/shared/rankProgression.js";
import {
  PRACTICE_BOT_ID,
  PRACTICE_BOT_NAME,
  PRACTICE_MATCH_SOURCE,
  PRACTICE_RECORD_POLICY,
  practiceDifficulty
} from "../src/shared/practiceMode.js";

export const MATCH_SUCCESS_DELAY_MS = 3000;
export const OPENING_NOTICE_DELAY_MS = 3000;
export const MATCH_PRELOAD_TIMEOUT_MS = 90000;

export function createRoom(first, second, {
  modeInput = first.mode ?? second.mode ?? "spark",
  rated = true,
  matchSource = "matchmaking",
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
  game.phase = GAME_PHASES.preloading;
  const preloadDeadlineAt = createdAt + MATCH_PRELOAD_TIMEOUT_MS;
  return {
    code: randomRoomCode({ isCodeTaken, random }),
    mode,
    rated: rated !== false,
    matchSource,
    players,
    spectators: [],
    game,
    chat: [],
    actionReceipts: {},
    revision: 0,
    clockSeq: 0,
    createdAt,
    openingEndsAt: null,
    preload: {
      startedAt: createdAt,
      deadlineAt: preloadDeadlineAt,
      readyUserIds: [],
      readyCount: 0,
      requiredCount: players.length
    },
    closesAt: null,
    countingDeadline: null,
    drawDeadline: null,
    timerId: null,
    timeoutIds: [],
    lastTick: now(),
    recordSaved: false
  };
}

export function createPracticeRoom(player, {
  difficulty: difficultyInput = "beginner",
  playerColor = "random",
  isCodeTaken = () => false,
  now = Date.now,
  random = Math.random
} = {}) {
  const difficulty = practiceDifficulty(difficultyInput) ?? practiceDifficulty("beginner");
  const humanColor = playerColor === "random"
    ? (random() >= 0.5 ? COLORS.black : COLORS.white)
    : playerColor;
  const botColor = humanColor === COLORS.black ? COLORS.white : COLORS.black;
  const human = toRoomPlayer(player, humanColor, "spark");
  const botActorId = `bot:${PRACTICE_BOT_ID}:${player.user.id}`;
  const bot = {
    user: {
      id: botActorId,
      username: PRACTICE_BOT_NAME,
      rank: `${difficulty.label}陪练`,
      rating: null,
      selectedCharacter: null,
      isBot: true
    },
    socketId: null,
    disconnectedAt: null,
    color: botColor,
    characterId: null,
    character: null,
    isBot: true,
    botProfile: {
      id: PRACTICE_BOT_ID,
      name: PRACTICE_BOT_NAME,
      portraitUrl: ""
    },
    time: createPlayerClock()
  };
  const createdAt = now();
  const players = humanColor === COLORS.black ? [human, bot] : [bot, human];
  const game = createGameState(players.map((entry) => ({
    userId: entry.user.id,
    color: entry.color,
    characterId: entry.characterId,
    character: entry.character
  })), { mode: "spark" });
  game.phase = GAME_PHASES.preloading;
  game.skillUses[botColor] = 0;
  delete game.passives?.[botColor];
  const preloadDeadlineAt = createdAt + MATCH_PRELOAD_TIMEOUT_MS;
  return {
    code: randomRoomCode({ isCodeTaken, random }),
    mode: "spark",
    rated: false,
    matchSource: PRACTICE_MATCH_SOURCE,
    recordPolicy: PRACTICE_RECORD_POLICY,
    practice: {
      botId: PRACTICE_BOT_ID,
      botActorId,
      botColor,
      humanUserId: player.user.id,
      humanColor,
      difficulty: difficulty.id,
      deadAnalysisRequestId: null
    },
    players,
    spectators: [],
    game,
    chat: [],
    actionReceipts: {},
    revision: 0,
    clockSeq: 0,
    createdAt,
    openingEndsAt: null,
    preload: {
      startedAt: createdAt,
      deadlineAt: preloadDeadlineAt,
      readyUserIds: [botActorId],
      readyCount: 1,
      requiredCount: players.length
    },
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
    time: createPlayerClock()
  };
}

function createPlayerClock() {
  return {
    main: 5 * 60,
    byoYomi: 30,
    periodRemaining: 30,
    periods: 3
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
