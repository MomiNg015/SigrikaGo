export function registerChatSocketEvents(socket, {
  io,
  addChat,
  broadcastRoom
}) {
  socket.on("chat:send", ({ roomCode, text } = {}) => {
    const room = addChat(roomCode, socket.user, text);
    if (room) broadcastRoom(io, room);
  });
}
