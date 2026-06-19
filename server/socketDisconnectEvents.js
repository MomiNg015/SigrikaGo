export function registerDisconnectSocketEvents(socket, {
  io,
  unregisterOnlineSocket,
  detachSocket,
  broadcastRoom,
  broadcastRoomPresencePatch = broadcastRoom,
  broadcastLobbyStats
}) {
  socket.on("disconnect", () => {
    unregisterOnlineSocket(socket);
    for (const room of detachSocket(socket.id, io)) {
      broadcastRoomPresencePatch(io, room);
    }
    broadcastLobbyStats();
  });
}
