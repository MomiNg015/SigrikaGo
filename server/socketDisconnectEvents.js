export function registerDisconnectSocketEvents(socket, {
  io,
  unregisterOnlineSocket,
  detachSocket,
  broadcastRoom,
  broadcastLobbyStats
}) {
  socket.on("disconnect", () => {
    unregisterOnlineSocket(socket);
    for (const room of detachSocket(socket.id, io)) {
      broadcastRoom(io, room);
    }
    broadcastLobbyStats();
  });
}
