export function createRoomRuntime({
  prisma,
  persistRoomState,
  broadcastRoomUpdate,
  broadcastRoomPatch: broadcastRoomPatchEvent,
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

  function broadcastToast(io, room, text) {
    broadcastRoomToast(io, room, text);
  }

  return {
    persistRoom,
    broadcastRoom,
    broadcastRoomPatch,
    broadcastToast
  };
}
