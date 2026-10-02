export function exitSigrikaCandySpectatorResult({
  roomCode,
  socket,
  closeResultModal,
  setRoom,
  setView
}) {
  if (roomCode) socket?.emit("room:leave", { roomCode });
  closeResultModal();
  setRoom(null);
  setView("home");
}
