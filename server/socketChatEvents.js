import { onClientEvent } from "./socketClientEvent.js";
export function registerChatSocketEvents(socket, {
  io,
  addChat,
  broadcastRoom,
  broadcastRoomPatch
}) {
  onClientEvent(socket, "chat:send", (payload) => {
    const { roomCode, text } = payload ?? {};
    const mutation = addChat(roomCode, socket.user, text, socket.id);
    if (!mutation) return;
    if (mutation.message && broadcastRoomPatch) {
      broadcastRoomPatch(io, mutation.room, { type: "chat:append", message: mutation.message }, { forcePersist: false });
      return;
    }
    broadcastRoom(io, mutation.room ?? mutation);
  });
}
