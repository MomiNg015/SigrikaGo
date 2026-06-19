export function createRoomRuntime({
  prisma,
  persistRoomState,
  broadcastRoomUpdate,
  broadcastRoomPatch: broadcastRoomPatchEvent,
  broadcastRoomPresencePatch: broadcastRoomPresencePatchEvent,
  broadcastRoomToast,
  throttleMs,
  onPersistError = (error) => {
    console.error("Failed to persist room", error);
  }
}) {
  function persistRoom(room, { force = false } = {}) {
    persistRoomState({
      prisma,
      room,
      force,
      throttleMs,
      onError: onPersistError
    });
  }

  function broadcastRoom(io, room) {
    broadcastRoomUpdate(io, room, { persistRoom });
  }

  function broadcastRoomPatch(io, room, patch) {
    broadcastRoomPatchEvent(io, room, patch, { persistRoom });
  }

  function broadcastRoomPresencePatch(io, room) {
    broadcastRoomPresencePatchEvent(io, room, { persistRoom });
  }

  function broadcastToast(io, room, text) {
    broadcastRoomToast(io, room, text);
  }

  return {
    persistRoom,
    broadcastRoom,
    broadcastRoomPatch,
    broadcastRoomPresencePatch,
    broadcastToast
  };
}
