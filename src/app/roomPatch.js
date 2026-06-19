export function applyRoomPatch(currentRoom, patch) {
  if (!currentRoom || !patch) return currentRoom;
  if (patch.roomCode !== currentRoom.code) return currentRoom;
  if (patch.type === "chat:append") return appendChatMessage(currentRoom, patch.message);
  return currentRoom;
}

function appendChatMessage(room, message) {
  if (!message?.id) return room;
  const chat = room.chat ?? [];
  if (chat.some((candidate) => candidate?.id === message.id)) return room;
  return {
    ...room,
    chat: [...chat, message]
  };
}
