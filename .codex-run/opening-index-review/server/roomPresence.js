export function roomParticipants(room) {
  return [...(room?.players ?? []), ...(room?.spectators ?? [])];
}

export function onlineParticipantCount(room) {
  return roomParticipants(room).filter((participant) => participant.socketId).length;
}

export function hasConnectedRoomParticipant(room) {
  return roomParticipants(room).some((participant) => participant.socketId);
}

export function arePlayersDisconnected(room) {
  return (room?.players?.length ?? 0) > 0 && room.players.every((player) => !player.socketId);
}

export function watchPlayerSummary(room, color) {
  const player = room?.players?.find((candidate) => candidate.color === color);
  if (!player) return null;
  return {
    user: player.user,
    characterId: player.characterId,
    character: player.character,
    connected: Boolean(player.socketId),
    disconnectedAt: player.disconnectedAt ?? null
  };
}
