export function applyRoomPatch(currentRoom, patch) {
  if (!currentRoom || !patch) return currentRoom;
  if (patch.roomCode !== currentRoom.code) return currentRoom;
  if (!canApplyPatchRevision(currentRoom, patch)) return currentRoom;
  if (patch.type === "chat:append") return appendChatMessage(currentRoom, patch.message, patch.revision);
  return currentRoom;
}

export function roomPatchNeedsResume(currentRoom, patch) {
  if (!currentRoom || !patch || patch.roomCode !== currentRoom.code) return false;
  const patchRevision = Number(patch.revision ?? 0);
  if (!patchRevision) return false;
  const currentRevision = Number(currentRoom.revision ?? 0);
  if (patchRevision <= currentRevision) return false;
  return Number(patch.baseRevision ?? 0) !== currentRevision;
}

function canApplyPatchRevision(room, patch) {
  const patchRevision = Number(patch.revision ?? 0);
  if (!patchRevision) return true;
  const currentRevision = Number(room.revision ?? 0);
  return patchRevision > currentRevision && Number(patch.baseRevision ?? 0) === currentRevision;
}

function appendChatMessage(room, message, revision = 0) {
  if (!message?.id) return room;
  const chat = room.chat ?? [];
  if (chat.some((candidate) => candidate?.id === message.id)) return room;
  return {
    ...room,
    revision: Number(revision) || Number(room.revision ?? 0),
    chat: [...chat, message]
  };
}
