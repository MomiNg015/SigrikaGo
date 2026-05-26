import { COLORS, gameViewForColor } from "../src/shared/game.js";

export function buildRoomView(room, viewerId) {
  const playerColor = room.players.find((player) => player.user.id === viewerId)?.color ?? null;
  const viewerColor = playerColor ?? COLORS.black;
  const role = room.players.some((player) => player.user.id === viewerId) ? "player" : "spectator";
  const view = {
    black: gameViewForColor(room.game, COLORS.black),
    white: gameViewForColor(room.game, COLORS.white)
  };

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
      time: player.time
    })),
    spectatorCount: room.spectators.length,
    spectators: room.spectators.map((spectator) => ({
      user: spectator.user
    })),
    game: role === "spectator" ? view.black : view[viewerColor],
    gameViews: role === "spectator" ? view : null,
    chat: room.chat,
    openingEndsAt: room.openingEndsAt,
    closesAt: room.closesAt,
    countingDeadline: room.countingDeadline,
    drawDeadline: room.drawDeadline,
    resultDeadline: room.game.scoring?.resultDeadline ?? null
  };
}
