export function buildAppRouteProps({
  overlayProps = {},
  routeActions = {},
  routeState = {}
}) {
  const { room, socket } = routeState;
  return {
    ...routeState,
    ...routeActions,
    ...overlayProps,
    onCountingRequest: () => socket?.emit("counting:request", { roomCode: room.code }),
    onCountingRespond: (accepted) => socket?.emit("counting:respond", { roomCode: room.code, accepted })
  };
}

export function buildAppOverlayProps({
  overlayActions = {},
  overlayProps = {},
  overlayState = {}
}) {
  const {
    activeStoryPlayer = { script: null, labels: null, onComplete: null }
  } = overlayState;
  const {
    clearStoryPlayer,
    openStoryPlayer,
    showToast
  } = overlayActions;

  return {
    ...overlayState,
    ...overlayActions,
    ...overlayProps,
    onMessageSubmitted: () => showToast("感谢您的反馈！", "success"),
    storyPlayerScript: {
      ...activeStoryPlayer,
      open: openStoryPlayer,
      clear: clearStoryPlayer
    }
  };
}
