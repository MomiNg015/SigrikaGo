export function createRoomRuntime({
  prisma,
  persistRoomState,
  broadcastRoomUpdate,
  broadcastRoomPatch: broadcastRoomPatchEvent,
  broadcastRoomPresencePatch: broadcastRoomPresencePatchEvent,
  broadcastRoomToast,
  throttleMs,
  metrics = null,
  onPersistError = (error) => {
    console.error("Failed to persist room", error);
  }
}) {
  function handlePersistError(error) {
    metrics?.increment?.("roomPersistenceErrors");
    onPersistError(error);
  }

  function persistRoom(room, { force = false } = {}) {
    persistRoomState({
      prisma,
      room,
      force,
      throttleMs,
      onError: handlePersistError
    });
  }

  function broadcastRoom(io, room) {
    broadcastRoomUpdate(io, room, {
      persistRoom,
      ...(metrics ? { metrics } : {})
    });
  }

  function broadcastRoomPatch(io, room, patch, { forcePersist = true } = {}) {
    broadcastRoomPatchEvent(io, room, patch, { forcePersist, persistRoom });
  }

  function broadcastRoomPresencePatch(io, room) {
    broadcastRoomPresencePatchEvent(io, room, {
      persistRoom,
      ...(metrics ? { metrics } : {})
    });
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
