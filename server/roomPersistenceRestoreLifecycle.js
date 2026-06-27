export function createRoomPersistenceRestoreLifecycle({
  rooms,
  listPersistedRooms,
  hydratePersistedRoom,
  ensureRestoredDisconnectedNotices,
  resumeRoomTimers,
  persistRoom,
  registerRoom = () => {},
  metrics = null,
  onError = (message, error) => console.error(message, error)
}) {
  async function restorePersistedRooms(io) {
    const rows = await listPersistedRooms();
    const restored = [];

    for (const row of rows) {
      try {
        const room = hydratePersistedRoom(JSON.parse(row.snapshot));
        if (!room?.code) continue;

        ensureRestoredDisconnectedNotices(room);
        rooms.set(room.code, room);
        registerRoom(room);
        restored.push(room);

        if (resumeRoomTimers(room, io) !== false) {
          persistRoom(room, { force: true });
        }
      } catch (error) {
        metrics?.increment?.("roomRestoreErrors");
        onError(`Failed to restore room ${row.code}`, error);
      }
    }

    return restored;
  }

  return {
    restorePersistedRooms
  };
}
