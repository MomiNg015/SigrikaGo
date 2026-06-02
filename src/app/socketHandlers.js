export function createSocketHandlers({
  matchSuccessRef,
  roomRef,
  audioSettingsRef,
  closeAllOverlays,
  updateUser,
  setMatchStart,
  setMatchSuccess,
  setReplayStep,
  setRoom,
  setView,
  setPendingSkill,
  setDismissedResultRoom,
  setIncomingDuel,
  setToken,
  setUser,
  setLobbyStats = () => {},
  showToast,
  clearLastRoomCode,
  handleMissingRoomResumePayload,
  handleRoomResumePayload,
  mergeCurrentUserFromRoom,
  syncPendingMatchRoom,
  applyRoomClock,
  playDoorbellSound,
  now = () => Date.now()
}) {
  let shouldAudioBaselineNextLiveSnapshot = false;

  function clearRoomUiState() {
    setRoom(null);
    setReplayStep(null);
    setPendingSkill(false);
  }

  function resetToLogin(message) {
    clearLastRoomCode();
    setToken("");
    setUser(null);
    setRoom(null);
    setMatchStart(null);
    setMatchSuccess(null);
    setReplayStep(null);
    setPendingSkill(false);
    setLobbyStats({ onlineCount: 0, matchmakingCount: 0 });
    closeAllOverlays();
    setView("login");
    showToast(message);
  }

  return {
    socketReconnect: () => {
      shouldAudioBaselineNextLiveSnapshot = true;
    },
    matchWaiting: ({ startedAt }) => setMatchStart(startedAt),
    lobbyStats: (stats = {}) => {
      setLobbyStats({
        onlineCount: Number(stats.onlineCount ?? 0),
        matchmakingCount: Number(stats.matchmakingCount ?? 0)
      });
    },
    matchFound: (roomView) => {
      closeAllOverlays();
      setReplayStep(null);
      setMatchStart(null);
      updateUser((current) => mergeCurrentUserFromRoom(current, roomView));
      const transition = {
        room: roomView,
        startedAt: now()
      };
      matchSuccessRef.current = transition;
      setMatchSuccess(transition);
    },
    roomUpdate: (roomView) => {
      updateUser((current) => mergeCurrentUserFromRoom(current, roomView));
      if (syncPendingMatchRoom(matchSuccessRef, setMatchSuccess, roomView)) return;
      const nextRoomView = shouldAudioBaselineNextLiveSnapshot && shouldMarkRoomAudioBaseline(roomView)
        ? { ...roomView, __audioResumeBaseline: true }
        : roomView;
      shouldAudioBaselineNextLiveSnapshot = false;
      if (roomView?.role === "player" && roomView?.game?.phase === "finished") {
        clearLastRoomCode();
      }
      setRoom(nextRoomView);
      setView("room");
    },
    roomClock: (clock) => {
      setMatchSuccess((current) => current ? { ...current, room: applyRoomClock(current.room, clock) } : current);
      setRoom((current) => applyRoomClock(current, clock));
    },
    roomResume: (payload) => {
      shouldAudioBaselineNextLiveSnapshot = false;
      if (handleMissingRoomResumePayload(payload, roomRef.current, {
        clearLastRoomCode,
        setMatchStart,
        setMatchSuccess,
        setReplayStep,
        setPendingSkill,
        setRoom,
        setView,
        showToast
      })) return;
      handleRoomResumePayload(payload, {
        closeAllOverlays,
        setMatchStart,
        setMatchSuccess,
        setReplayStep,
        setPendingSkill,
        setDismissedResultRoom,
        setRoom: (roomView) => {
          if (payload.type === "room") {
            updateUser((current) => mergeCurrentUserFromRoom(current, roomView));
          }
          setRoom(roomView);
        },
        setView
      });
    },
    roomClosed: (payload = {}) => {
      clearLastRoomCode();
      clearRoomUiState();
      setView("home");
      showToast(payload.message || "房间已关闭");
    },
    errorToast: (message) => {
      if (String(message).includes("房间不存在")) {
        clearLastRoomCode();
        clearRoomUiState();
        setMatchSuccess(null);
        setView("home");
      }
      showToast(message);
    },
    duelIncoming: (request) => {
      setIncomingDuel(request);
      playDoorbellSound(audioSettingsRef.current);
    },
    duelClosed: ({ requestId }) => {
      setIncomingDuel((current) => current?.requestId === requestId ? null : current);
    },
    duelRejected: ({ username }) => {
      showToast(String(username) + "拒绝了你的对局申请");
    },
    duelUnavailable: ({ reason }) => {
      showToast(reason === "playing" ? "对方正在对局中。" : "对方不在线。");
    },
    connectError: (error = {}) => {
      const message = String(error.message ?? "");
      if (message !== "unauthorized" && message !== "forbidden") return;
      resetToLogin("登录已失效，请重新登录");
    },
    accountLoggedOut: ({ message } = {}) => {
      clearLastRoomCode();
      setToken("");
      setUser(null);
      setRoom(null);
      setMatchStart(null);
      setMatchSuccess(null);
      setReplayStep(null);
      setPendingSkill(false);
      setLobbyStats({ onlineCount: 0, matchmakingCount: 0 });
      closeAllOverlays();
      setView("login");
      showToast(message || "账号已在其他地方登录");
    }
  };
}

export function installSocketHandlers(socket, handlers, { buildRoomResumeRequest, onSocketReconnect = () => {} } = {}) {
  socket.on("match:waiting", handlers.matchWaiting);
  socket.on("lobby:stats", handlers.lobbyStats);
  socket.on("match:found", handlers.matchFound);
  socket.on("room:update", handlers.roomUpdate);
  socket.on("room:clock", handlers.roomClock);
  socket.on("room:resume", handlers.roomResume);
  socket.on("connect", () => {
    handlers.socketReconnect?.();
    onSocketReconnect();
    socket.emit("room:resume", buildRoomResumeRequest());
  });
  socket.on("room:closed", handlers.roomClosed);
  socket.on("error:toast", handlers.errorToast);
  socket.on("duel:incoming", handlers.duelIncoming);
  socket.on("duel:closed", handlers.duelClosed);
  socket.on("duel:rejected", handlers.duelRejected);
  socket.on("duel:unavailable", handlers.duelUnavailable);
  socket.on("connect_error", handlers.connectError);
  socket.on("account:logged-out", handlers.accountLoggedOut);
}

function shouldMarkRoomAudioBaseline(roomView) {
  return roomView?.role === "player" && roomView?.game?.phase === "playing";
}
