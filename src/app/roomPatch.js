import { shareSnapshotValue } from "./roomSnapshot.js";

export function applyRoomPatch(currentRoom, patch) {
  if (!currentRoom || !patch) return currentRoom;
  if (patch.roomCode !== currentRoom.code) return currentRoom;
  if (!canApplyPatchRevision(currentRoom, patch)) return currentRoom;
  if (patch.type === "chat:append") return appendChatMessage(currentRoom, patch.message, patch.revision);
  if (patch.type === "presence:update") return updatePresence(currentRoom, patch);
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
  if (chat.some((candidate) => candidate?.id === message.id)) return updateRevision(room, revision);
  return {
    ...room,
    revision: nextRevision(room, revision),
    chat: [...chat, message]
  };
}

function updatePresence(room, patch) {
  return {
    ...room,
    revision: nextRevision(room, patch.revision),
    players: Array.isArray(patch.players) ? shareSnapshotValue(room.players, patch.players) : room.players,
    spectatorCount: Number.isFinite(Number(patch.spectatorCount))
      ? Number(patch.spectatorCount)
      : room.spectatorCount,
    spectators: Array.isArray(patch.spectators) ? shareSnapshotValue(room.spectators, patch.spectators) : room.spectators,
    chat: Array.isArray(patch.chat) ? shareSnapshotValue(room.chat, patch.chat) : room.chat
  };
}

function updateRevision(room, revision = 0) {
  const next = nextRevision(room, revision);
  return next === Number(room.revision ?? 0) ? room : { ...room, revision: next };
}

function nextRevision(room, revision = 0) {
  return Number(revision) || Number(room.revision ?? 0);
}
