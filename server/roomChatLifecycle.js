export function createRoomChatLifecycle({
  rooms,
  validateRoomCode,
  normalizeChatText,
  randomUUID = () => crypto.randomUUID(),
  now = () => Date.now()
}) {
  function addChat(roomCode, user, text) {
    const validatedRoomCode = validateRoomCode(roomCode);
    if (!validatedRoomCode.ok) return null;

    const normalizedText = normalizeChatText(text);
    if (!normalizedText.ok) return null;

    const room = rooms.get(validatedRoomCode.value);
    if (!room) return null;

    const message = {
      id: randomUUID(),
      type: "chat",
      userId: user.id,
      username: user.username,
      moveNumber: room.game.moveNumber,
      text: normalizedText.value,
      createdAt: now()
    };
    room.chat.push(message);
    return { room, message };
  }

  return {
    addChat
  };
}
