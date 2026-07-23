import { COLORS, GAME_PHASES, gameViewForColor } from "../src/shared/game.js";

export function buildRoomView(room, viewerId, options = {}) {
  const gameView = options.gameView ?? gameViewForColor;
  const playerColor = room.players.find((player) => player.user.id === viewerId)?.color ?? null;
  const viewerColor = playerColor ?? COLORS.black;
  const isFinished = room.game.phase === GAME_PHASES.finished;
  const role = !isFinished && room.players.some((player) => player.user.id === viewerId) ? "player" : "spectator";
  const spectatorBlackView = role === "spectator" ? gameView(room.game, COLORS.black) : null;
  const views = role === "spectator" ? { white: gameView(room.game, COLORS.white) } : null;

  return {
    code: room.code,
    revision: Number(room.revision ?? 0),
    clockSeq: Number(room.clockSeq ?? 0),
    mode: room.mode ?? room.game?.mode ?? "spark",
    rated: room.rated !== false,
    matchSource: room.matchSource ?? (room.rated === false ? "private" : "matchmaking"),
    recordPolicy: room.recordPolicy ?? "full",
    practice: room.practice
      ? {
          botId: room.practice.botId,
          difficulty: room.practice.difficulty,
          humanColor: room.practice.humanColor,
          botColor: room.practice.botColor
        }
      : null,
    viewerId,
    role,
    players: room.players.map((player) => ({
      user: player.user,
      completedItemEffects: player.completedItemEffects ?? null,
      color: player.color,
      characterId: player.characterId,
      character: player.character,
      isBot: Boolean(player.isBot || player.user?.isBot),
      botProfile: player.botProfile ?? null,
      captures: room.game.captures[player.color],
      skillRemovals: room.game.skillRemovals?.[player.color] ?? 0,
      time: player.time,
      connected: Boolean(player.socketId || player.isBot || player.user?.isBot),
      disconnectedAt: player.disconnectedAt ?? null
    })),
    spectatorCount: room.spectators.length,
    spectators: room.spectators.map((spectator) => ({
      user: spectator.user
    })),
    game: role === "spectator" ? spectatorBlackView : gameView(room.game, viewerColor),
    gameViews: views,
    chat: room.chat,
    openingEndsAt: room.openingEndsAt,
    preload: room.preload
      ? {
          startedAt: room.preload.startedAt ?? null,
          deadlineAt: room.preload.deadlineAt ?? null,
          readyCount: Number(room.preload.readyCount ?? room.preload.readyUserIds?.length ?? 0),
          requiredCount: Number(room.preload.requiredCount ?? room.players.length)
        }
      : null,
    closesAt: room.closesAt,
    countingDeadline: room.countingDeadline,
    drawDeadline: room.drawDeadline,
    resultDeadline: room.game.scoring?.resultDeadline ?? null
  };
}
