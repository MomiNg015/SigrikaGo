export function registerChatSocketEvents(socket, {
  io,
  addChat,
  broadcastRoom,
  broadcastRoomPatch
}) {
  socket.on("chat:send", ({ roomCode, text } = {}) => {
    const mutation = addChat(roomCode, socket.user, text);
    if (!mutation) return;
    if (mutation.message && broadcastRoomPatch) {
      broadcastRoomPatch(io, mutation.room, { type: "chat:append", message: mutation.message });
      return;
    }
    broadcastRoom(io, mutation.room ?? mutation);
  });
}
