import { emitRoomMutation } from "./roomActionConnection.js";

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
    onCountingRequest: () => emitRoomMutation(socket, "counting:request", { roomCode: room?.code }, routeActions.onToast),
    onCountingRespond: (accepted) => emitRoomMutation(socket, "counting:respond", { roomCode: room?.code, accepted }, routeActions.onToast)
  };
}

export function buildAppOverlayProps({
  overlayActions = {},
  overlayProps = {},
  overlayState = {}
}) {
  const {
    activeStoryPlayer = { script: null, labels: null, onComplete: null, onNavigate: null }
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
