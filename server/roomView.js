import { COLORS, GAME_PHASES, gameViewForColor } from "../src/shared/game.js";

export function buildRoomView(room, viewerId, options = {}) {
  const gameView = options.gameView ?? gameViewForColor;
  const playerColor = room.players.find((player) => player.user.id === viewerId)?.color ?? null;
  const viewerColor = playerColor ?? COLORS.black;
  const isFinished = room.game.phase === GAME_PHASES.finished;
  const role = !isFinished && room.players.some((player) => player.user.id === viewerId) ? "player" : "spectator";
  const views = role === "spectator"
    ? {
        black: gameView(room.game, COLORS.black),
        white: gameView(room.game, COLORS.white)
      }
    : null;

  return {
    code: room.code,
    viewerId,
    role,
    players: room.players.map((player) => ({
      user: player.user,
      color: player.color,
      characterId: player.characterId,
      character: player.character,
      captures: room.game.captures[player.color],
      skillRemovals: room.game.skillRemovals?.[player.color] ?? 0,
      time: player.time,
      connected: Boolean(player.socketId),
      disconnectedAt: player.disconnectedAt ?? null
    })),
    spectatorCount: room.spectators.length,
    spectators: room.spectators.map((spectator) => ({
      user: spectator.user
    })),
    game: role === "spectator" ? views.black : gameView(room.game, viewerColor),
    gameViews: views,
    chat: room.chat,
    openingEndsAt: room.openingEndsAt,
    closesAt: room.closesAt,
    countingDeadline: room.countingDeadline,
    drawDeadline: room.drawDeadline,
    resultDeadline: room.game.scoring?.resultDeadline ?? null
  };
}
