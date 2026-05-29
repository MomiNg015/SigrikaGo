export function syncPendingMatchRoom(matchSuccessRef, setMatchSuccess, roomView) {
  if (!matchSuccessRef.current) return false;
  matchSuccessRef.current = {
    ...matchSuccessRef.current,
    room: roomView
  };
  setMatchSuccess((current) => current ? { ...current, room: roomView } : current);
  return true;
}

export function completePendingMatchRoom(matchSuccessRef, fallbackRoom) {
  return matchSuccessRef.current?.room ?? fallbackRoom;
}
