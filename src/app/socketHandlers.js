import { applyRoomSnapshot, normalizeRoomSnapshot } from "./roomSnapshot.js";
import { applyRoomPatch, roomPatchCanUpdate, roomPatchNeedsResume } from "./roomPatch.js";
import { GAME_MODE_IDS } from "../shared/gameModes.js";
import { GAME_PHASES } from "../shared/game.js";

export const ROOM_PATCH_RESUME_DEBOUNCE_MS = 1000;
export const ROOM_RESUME_REQUEST_COOLDOWN_MS = 1500;

export function createSocketHandlers({
  matchSuccessRef,
  incomingDuelRef = { current: null },
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
  let audioBaselineSnapshotKey = "";

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
    setLobbyStats({ onlineCount: 0, matchmakingCount: 0, matchmakingCounts: emptyModeCounts() });
    closeAllOverlays();
    setView("login");
    showToast(message);
  }

  return {
    socketReconnect: () => {
      shouldAudioBaselineNextLiveSnapshot = true;
    },
    matchWaiting: (payload = {}) => {
      const nextMatchStart = normalizeMatchStart(payload);
      setMatchStart((current) => sameMatchStart(current, nextMatchStart) ? current : nextMatchStart);
    },
    lobbyStats: (stats = {}) => {
      const nextStats = normalizeLobbyStats(stats);
      setLobbyStats((current) => sameLobbyStats(current, nextStats) ? current : nextStats);
    },
    matchFound: (roomView) => {
      const normalizedRoomView = normalizeRoomSnapshot(roomView);
      closeAllOverlays();
      setReplayStep(null);
      setMatchStart(null);
      updateUser((current) => mergeCurrentUserFromRoom(current, normalizedRoomView));
      const transition = {
        room: normalizedRoomView,
        startedAt: now(),
        countdownComplete: false
      };
      matchSuccessRef.current = transition;
      setMatchSuccess(transition);
    },
    roomUpdate: (roomView) => {
      const normalizedRoomView = normalizeRoomSnapshot(roomView);
      updateUser((current) => mergeCurrentUserFromRoom(current, normalizedRoomView));
      if (shouldCompletePendingMatch(matchSuccessRef.current, normalizedRoomView)) {
        setRoom((current) => applyRoomSnapshot(current, normalizedRoomView));
        matchSuccessRef.current = null;
        setMatchSuccess(null);
        setView("room");
        return;
      }
      if (shouldRecoverPreloadingMatch(matchSuccessRef.current, normalizedRoomView)) {
        setMatchStart(null);
        setReplayStep(null);
        setPendingSkill(false);
        const transition = {
          room: normalizedRoomView,
          startedAt: now(),
          countdownComplete: true
        };
        matchSuccessRef.current = transition;
        setMatchSuccess(transition);
        setView("match-preloading");
        return;
      }
      if (syncPendingMatchRoom(matchSuccessRef, setMatchSuccess, normalizedRoomView)) return;
      const nextAudioBaselineSnapshotKey = roomAudioBaselineSnapshotKey(normalizedRoomView);
      const shouldApplyAudioBaseline = shouldMarkRoomAudioBaseline(normalizedRoomView)
        && (shouldAudioBaselineNextLiveSnapshot || nextAudioBaselineSnapshotKey === audioBaselineSnapshotKey);
      const nextRoomView = shouldApplyAudioBaseline ? { ...normalizedRoomView, __audioResumeBaseline: true } : normalizedRoomView;
      shouldAudioBaselineNextLiveSnapshot = false;
      audioBaselineSnapshotKey = shouldApplyAudioBaseline ? nextAudioBaselineSnapshotKey : "";
      if (normalizedRoomView?.role === "player" && normalizedRoomView?.game?.phase === "finished") {
        clearLastRoomCode();
      }
      setRoom((current) => applyRoomSnapshot(current, nextRoomView));
      setView("room");
    },
    roomClock: (clock) => {
      const roomCode = clock?.roomCode;
      if (!roomCode) return;
      if (matchSuccessRef.current?.room?.code === roomCode) {
        const nextPendingRoom = applyRoomClock(matchSuccessRef.current.room, clock);
        if (nextPendingRoom !== matchSuccessRef.current.room) {
          matchSuccessRef.current = { ...matchSuccessRef.current, room: nextPendingRoom };
          setMatchSuccess((current) => {
            if (!current) return current;
            const nextRoom = applyRoomClock(current.room, clock);
            return nextRoom === current.room ? current : { ...current, room: nextRoom };
          });
        }
      }
      if (roomRef.current?.code === roomCode) {
        setRoom((current) => applyRoomClock(current, clock));
      }
    },
    roomPatch: (patch, requestRoomResume = () => {}) => {
      if (roomPatchNeedsResume(roomRef.current, patch)) {
        requestRoomResume();
        return;
      }
      if (!roomPatchCanUpdate(roomRef.current, patch)) return;
      setRoom((current) => applyRoomPatch(current, patch));
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
      if (payload?.type === "room") {
        const normalizedRoomView = normalizeRoomSnapshot(payload.room);
        if (shouldRecoverPreloadingMatch(null, normalizedRoomView)) {
          closeAllOverlays();
          updateUser((current) => mergeCurrentUserFromRoom(current, normalizedRoomView));
          setMatchStart(null);
          setReplayStep(null);
          setPendingSkill(false);
          const transition = {
            room: normalizedRoomView,
            startedAt: now(),
            countdownComplete: true
          };
          matchSuccessRef.current = transition;
          setMatchSuccess(transition);
          setView("match-preloading");
          return;
        }
      }
      handleRoomResumePayload(payload, {
        closeAllOverlays,
        setMatchStart,
        setMatchSuccess,
        setReplayStep,
        setPendingSkill,
        setDismissedResultRoom,
        setRoom: (roomView) => {
          const normalizedRoomView = normalizeRoomSnapshot(roomView);
          if (payload.type === "room") {
            updateUser((current) => mergeCurrentUserFromRoom(current, normalizedRoomView));
            setRoom((current) => applyRoomSnapshot(current, normalizedRoomView));
            return;
          }
          setRoom(normalizedRoomView);
        },
        setView
      });
    },
    roomClosed: (payload = {}) => {
      const currentRoom = roomRef.current;
      const closedRoomCode = payload.roomCode || currentRoom?.code || "";
      const isFinishedPlayerRoom = currentRoom?.role === "player"
        && currentRoom?.game?.phase === "finished"
        && (!payload.roomCode || payload.roomCode === currentRoom.code);
      if (isFinishedPlayerRoom && closedRoomCode) {
        setDismissedResultRoom(closedRoomCode);
      }
      clearLastRoomCode();
      clearRoomUiState();
      setView("home");
      if (isFinishedPlayerRoom && payload.reason === "finished-room-close") return;
      showToast(payload.message || "房间已关闭");
    },
    matchPreloadTimeout: (payload = {}) => {
      clearLastRoomCode();
      clearRoomUiState();
      matchSuccessRef.current = null;
      setMatchStart(null);
      setMatchSuccess(null);
      setView("home");
      showToast(payload.message || "一方加载超时，匹配中止");
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
      if (sameDuelRequest(incomingDuelRef.current, request)) return;
      incomingDuelRef.current = request;
      setIncomingDuel(request);
      playDoorbellSound(audioSettingsRef.current);
    },
    duelClosed: ({ requestId }) => {
      if (incomingDuelRef.current?.requestId === requestId) incomingDuelRef.current = null;
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
      setLobbyStats({ onlineCount: 0, matchmakingCount: 0, matchmakingCounts: emptyModeCounts() });
      closeAllOverlays();
      setView("login");
      showToast(message || "账号已在其他地方登录");
    }
  };
}

export function installSocketHandlers(socket, handlers, { buildRoomResumeRequest, onSocketReconnect = () => {}, now = () => Date.now() } = {}) {
  const roomResumeEmitter = createRoomResumeEmitter(socket, { buildRoomResumeRequest, now });

  function requestPatchResume() {
    roomResumeEmitter.emitRoomResume("patch-gap");
  }

  socket.on("match:waiting", handlers.matchWaiting);
  socket.on("lobby:stats", handlers.lobbyStats);
  socket.on("match:found", handlers.matchFound);
  socket.on("room:update", (roomView) => {
    roomResumeEmitter.markRoomResumeSettled(roomView?.code ?? "");
    handlers.roomUpdate(roomView);
  });
  socket.on("room:patch", (patch) => {
    handlers.roomPatch(patch, () => requestPatchResume(patch));
  });
  socket.on("room:clock", handlers.roomClock);
  socket.on("room:resume", (payload) => {
    roomResumeEmitter.markRoomResumeSettled(payload?.room?.code ?? "");
    handlers.roomResume(payload);
  });
  socket.on("connect", () => {
    handlers.socketReconnect?.();
    onSocketReconnect();
    roomResumeEmitter.emitRoomResume("socket-connect");
  });
  socket.on("room:closed", handlers.roomClosed);
  socket.on("match:preload-timeout", handlers.matchPreloadTimeout);
  socket.on("error:toast", handlers.errorToast);
  socket.on("duel:incoming", handlers.duelIncoming);
  socket.on("duel:closed", handlers.duelClosed);
  socket.on("duel:rejected", handlers.duelRejected);
  socket.on("duel:unavailable", handlers.duelUnavailable);
  socket.on("connect_error", handlers.connectError);
  socket.on("account:logged-out", handlers.accountLoggedOut);
  return roomResumeEmitter;
}

export function createRoomResumeEmitter(socket, {
  buildRoomResumeRequest = () => ({ roomCode: "" }),
  cooldownMs = ROOM_RESUME_REQUEST_COOLDOWN_MS,
  now = () => Date.now()
} = {}) {
  let pendingRoomResume = null;

  function emitRoomResume(reason = "manual") {
    const request = buildRoomResumeRequest() ?? {};
    const key = roomResumeRequestKey(request);
    const requestedAt = now();
    if (
      pendingRoomResume?.key === key
      && requestedAt - pendingRoomResume.requestedAt < cooldownMs
    ) {
      return false;
    }
    pendingRoomResume = { key, requestedAt, reason };
    socket.emit("room:resume", { ...request, resumeReason: reason });
    return true;
  }

  function markRoomResumeSettled(roomCode = "") {
    if (!pendingRoomResume) return;
    const key = String(roomCode ?? "");
    if (!key || pendingRoomResume.key === key) pendingRoomResume = null;
  }

  return {
    emitRoomResume,
    markRoomResumeSettled
  };
}

export function roomPatchResumeKey(request = {}, patch = {}) {
  return [
    request.roomCode ?? "",
    patch.roomCode ?? "",
    patch.baseRevision ?? "",
    patch.revision ?? "",
    patch.type ?? ""
  ].join(":");
}

function roomResumeRequestKey(request = {}) {
  return String(request.roomCode ?? "");
}

function shouldMarkRoomAudioBaseline(roomView) {
  return roomView?.role === "player" && roomView?.game?.phase === "playing";
}

function shouldCompletePendingMatch(matchSuccess, roomView) {
  return Boolean(
    matchSuccess?.room?.code
      && roomView?.code === matchSuccess.room.code
      && roomView?.game?.phase
      && roomView.game.phase !== GAME_PHASES.preloading
      && matchSuccess.countdownComplete
  );
}

function shouldRecoverPreloadingMatch(matchSuccess, roomView) {
  return Boolean(
    !matchSuccess
      && roomView?.role === "player"
      && roomView?.game?.phase === GAME_PHASES.preloading
  );
}

function roomAudioBaselineSnapshotKey(roomView) {
  if (!roomView?.code) return "";
  return [
    roomView.code,
    roomView.game?.history?.length ?? 0,
    roomView.chat?.length ?? 0
  ].join(":");
}

function emptyModeCounts() {
  return Object.fromEntries(GAME_MODE_IDS.map((mode) => [mode, 0]));
}

export function normalizeLobbyStats(stats = {}) {
  return {
    onlineCount: Number(stats.onlineCount ?? 0),
    matchmakingCount: Number(stats.matchmakingCount ?? 0),
    matchmakingCounts: modeCountsFromLobbyStats(stats)
  };
}

export function sameLobbyStats(current = {}, next = {}) {
  if (Number(current.onlineCount ?? 0) !== Number(next.onlineCount ?? 0)) return false;
  if (Number(current.matchmakingCount ?? 0) !== Number(next.matchmakingCount ?? 0)) return false;
  return GAME_MODE_IDS.every((mode) => Object.prototype.hasOwnProperty.call(current.matchmakingCounts ?? {}, mode)
    && Number(current.matchmakingCounts?.[mode] ?? 0) === Number(next.matchmakingCounts?.[mode] ?? 0));
}

export function normalizeMatchStart({ startedAt, mode = "spark" } = {}) {
  return { startedAt, mode };
}

export function sameMatchStart(current, next) {
  if (!current || !next) return current === next;
  return current.startedAt === next.startedAt && (current.mode ?? "spark") === (next.mode ?? "spark");
}

export function sameDuelRequest(current, next) {
  if (!current || !next) return current === next;
  return current.requestId === next.requestId;
}

function modeCountsFromLobbyStats(stats = {}) {
  return Object.fromEntries(GAME_MODE_IDS.map((mode) => [
    mode,
    Number(stats.matchmakingCounts?.[mode] ?? (mode === "spark" ? stats.matchmakingCount : 0) ?? 0)
  ]));
}
