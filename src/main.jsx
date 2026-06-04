import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { CHARACTERS } from "./shared/characters.js";
import { latestSkillCharacterId, resolveBackgroundMusic } from "./shared/musicLibrary.js";
import { deploymentSocketBase } from "./shared/preloadAssets.js";
import { DEFAULT_SITE_SETTINGS } from "./shared/siteSettings.js";
import { BackgroundMusic, loadAudioSettings, playDoorbellSound } from "./audio/playback.jsx";
import { limitToastQueue } from "./modals/FeedbackModals.jsx";
import { adminApi, api } from "./api/client.js";
import AppOverlays from "./app/AppOverlays.jsx";
import AppRoutes from "./app/AppRoutes.jsx";
import { loadPublicCharacterCatalog } from "./app/characterCatalog.js";
import {
  buildRoomResumeRequest,
  clearLastRoomCode,
  handleMissingRoomResumePayload,
  handleRoomResumePayload,
  rememberPlayerRoom,
  shouldShowResultModal
} from "./app/resumeSession.js";
import { completePendingMatchRoom, syncPendingMatchRoom } from "./app/matchTransition.js";
import { connectGameSocket } from "./app/gameSocket.js";
import { replayOpeningState } from "./app/replayOpening.js";
import { createSiteSettingsLoader } from "./app/siteSettingsCatalog.js";
import { applyRoomClock } from "./app/roomClock.js";
import { mergeCurrentUserFromRoom } from "./app/roomUserSync.js";
import { initialSessionState } from "./app/sessionState.js";
import { createSocketHandlers } from "./app/socketHandlers.js";
import { buildStatChangeToasts } from "./app/statChangeToast.js";
import { useAuthSession } from "./app/useAuthSession.js";
import { useStartupPreload } from "./app/useStartupPreload.js";
import {
  loadVisualEffect,
  loadVisualTheme,
  saveVisualEffect,
  saveVisualTheme,
  visualThemeClassName
} from "./app/visualTheme.js";
import "./styles.css";

const SOCKET_BASE = deploymentSocketBase();

function App() {
  const initialSession = initialSessionState();
  const [token, setToken] = useState(initialSession.token);
  const [user, setUser] = useState(null);
  const [view, setView] = useState(initialSession.view);
  const [room, setRoom] = useState(null);
  const [socket, setSocket] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [matchStart, setMatchStart] = useState(null);
  const [matchSuccess, setMatchSuccess] = useState(null);
  const [showShop, setShowShop] = useState(false);
  const [showHouse, setShowHouse] = useState(false);
  const [showWarehouse, setShowWarehouse] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showWatch, setShowWatch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMessageBoard, setShowMessageBoard] = useState(false);
  const [audioSettings, setAudioSettings] = useState(loadAudioSettings);
  const [visualTheme, setVisualThemeState] = useState(loadVisualTheme);
  const [visualEffect, setVisualEffectState] = useState(loadVisualEffect);
  const [pendingSkill, setPendingSkill] = useState(false);
  const [replayRecords, setReplayRecords] = useState([]);
  const [replayStep, setReplayStep] = useState(null);
  const [dismissedResultRoom, setDismissedResultRoom] = useState("");
  const [characters, setCharacters] = useState(CHARACTERS);
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [adminTab, setAdminTab] = useState("overview");
  const [incomingDuel, setIncomingDuel] = useState(null);
  const [lobbyStats, setLobbyStats] = useState({ onlineCount: 0, matchmakingCount: 0 });
  const [assetProgress, setAssetProgress] = useState(0);
  const [audioResumeSignal, setAudioResumeSignal] = useState(0);
  const matchSuccessRef = useRef(matchSuccess);
  const roomRef = useRef(room);
  const viewRef = useRef(view);
  const audioSettingsRef = useRef(audioSettings);
  const toastIdRef = useRef(0);
  const siteSettingsLoaderRef = useRef(createSiteSettingsLoader());
  const characterListView = Object.values(characters);
  const resultModalOpen = shouldShowResultModal(room, dismissedResultRoom, replayStep);
  const backgroundMusic = resolveBackgroundMusic({
    view,
    skillPreview: room?.game?.pendingSkill,
    latestSkillCharacterId: latestSkillCharacterId(room),
    gamePhase: room?.game?.phase,
    matchSuccess: Boolean(matchSuccess),
    resultModalOpen,
    selections: user?.musicSelections,
    ownedMusicIds: user?.ownedMusicIds
  });
  const adminViewActive = view === "admin" && user?.role === "admin";
  const appShellClassName = adminViewActive
    ? "app-shell admin-theme-isolated"
    : `app-shell player-theme-enabled ${visualThemeClassName(visualTheme, visualEffect)}`;

  const removeToast = useCallback((toastId) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  const showToast = useCallback((message, tone = "danger") => {
    if (!message) return;
    const id = ++toastIdRef.current;
    setToasts((current) => limitToastQueue([{ id, text: message, tone }, ...current]));
  }, []);

  const setVisualTheme = useCallback((nextTheme) => {
    setVisualThemeState(saveVisualTheme(nextTheme));
  }, []);

  const setVisualEffect = useCallback((nextEffect) => {
    setVisualEffectState(saveVisualEffect(nextEffect));
  }, []);

  const updateUser = useCallback((nextUserOrUpdater, { notifyStats = true } = {}) => {
    setUser((current) => {
      const nextUser = typeof nextUserOrUpdater === "function" ? nextUserOrUpdater(current) : nextUserOrUpdater;
      const notices = notifyStats ? buildStatChangeToasts(current, nextUser) : [];
      for (const notice of notices) {
        setTimeout(() => showToast(notice.text, notice.tone), 0);
      }
      return nextUser;
    });
  }, [showToast]);

  useEffect(() => {
    matchSuccessRef.current = matchSuccess;
  }, [matchSuccess]);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    audioSettingsRef.current = audioSettings;
  }, [audioSettings]);

  const refreshSiteSettings = useCallback(async () => {
    const nextSettings = await siteSettingsLoaderRef.current();
    setSiteSettings(nextSettings);
    return nextSettings;
  }, []);

  useEffect(() => {
    refreshSiteSettings();
  }, [refreshSiteSettings]);

  useAuthSession({
    fallbackCharacters: CHARACTERS,
    setCharacters,
    setLobbyStats,
    setMatchStart,
    setMatchSuccess,
    setRoom,
    setToken,
    setUser,
    setView,
    showToast,
    updateUser
  });

  useStartupPreload({
    fallbackCharacters: CHARACTERS,
    matchSuccessRef,
    refreshSiteSettings,
    roomRef,
    setAssetProgress,
    setCharacters,
    setLobbyStats,
    setMatchStart,
    setMatchSuccess,
    setRoom,
    setShowHouse,
    setShowLeaderboard,
    setShowShop,
    setShowWarehouse,
    setShowWatch,
    setToken,
    setUser,
    setView,
    socket,
    token,
    viewRef
  });

  useEffect(() => {
    if (!token || !user) return;
    const nextSocket = connectGameSocket({
      socketBase: SOCKET_BASE,
      token,
      handlers: createSocketHandlers({
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
        setLobbyStats,
        showToast,
        clearLastRoomCode,
        handleMissingRoomResumePayload,
        handleRoomResumePayload,
        mergeCurrentUserFromRoom,
        syncPendingMatchRoom,
        applyRoomClock,
        playDoorbellSound
      }),
      buildRoomResumeRequest,
      onSocketReconnect: () => setAudioResumeSignal((value) => value + 1)
    });
    setSocket(nextSocket);
    return () => nextSocket.close();
  }, [token, user?.id]);

  useEffect(() => {
    if (!showHouse || !token) return;
    api("/api/replays", { token })
      .then((data) => setReplayRecords(data.records))
      .catch((error) => showToast(error.message));
  }, [showHouse, token]);

  useEffect(() => {
    localStorage.setItem("sigrika-audio-settings", JSON.stringify(audioSettings));
  }, [audioSettings]);

  useEffect(() => {
    rememberPlayerRoom(room);
  }, [room?.code, room?.role]);

  function handleAuth(nextToken, nextUser) {
    setView("preloading");
    setAssetProgress(0);
    setToken(nextToken);
    setUser(nextUser);
  }

  async function refreshPublicCharacters() {
    setCharacters(await loadPublicCharacterCatalog({ token }));
  }

  function logout() {
    api("/api/auth/logout", {
      method: "POST",
      token,
      skipAuthRefresh: true
    }).catch(() => {});
    socket?.close();
    setToken("");
    setUser(null);
    setRoom(null);
    setMatchSuccess(null);
    setLobbyStats({ onlineCount: 0, matchmakingCount: 0 });
    setCharacters(CHARACTERS);
    setView("login");
  }

  async function selectCharacter(characterId) {
    const data = await api("/api/me/character", {
      method: "POST",
      token,
      body: { characterId }
    });
    updateUser(data.user);
  }

  async function applyStoneDecoration(decorationId) {
    const data = await api("/api/me/decoration", {
      method: "POST",
      token,
      body: { decorationId }
    });
    updateUser(data.user);
  }

  function startMatch() {
    setMatchSuccess(null);
    setMatchStart(Date.now());
    socket?.emit("match:join");
  }

  function joinWatchRoom(roomCode) {
    if (!roomCode) return;
    socket?.emit("room:join", { roomCode });
  }

  function emitGame(action) {
    if (!room) return;
    socket?.emit("game:action", { roomCode: room.code, action });
  }

  function emitScoring(action) {
    if (!room) return;
    socket?.emit("scoring:action", { roomCode: room.code, action });
  }

  function requestDraw() {
    if (!room) return;
    socket?.emit("draw:request", { roomCode: room.code });
  }

  function respondDraw(accepted) {
    if (!room) return;
    socket?.emit("draw:respond", { roomCode: room.code, accepted });
  }

  async function openReplay(recordId) {
    const data = await api(`/api/replays/${recordId}`, { token });
    const replayState = replayOpeningState(data);
    closeAllOverlays();
    setRoom(replayState.room);
    setReplayStep(replayState.replayStep);
    setPendingSkill(replayState.pendingSkill);
    setView(replayState.view);
  }

  async function openAdminReplay(recordId) {
    const data = await adminApi(`/replays/${recordId}`, token);
    const replayState = replayOpeningState(data);
    setRoom(replayState.room);
    setReplayStep(replayState.replayStep);
    setPendingSkill(replayState.pendingSkill);
    setView(replayState.view);
  }

  function closeAllOverlays() {
    setShowShop(false);
    setShowHouse(false);
    setShowWarehouse(false);
    setShowLeaderboard(false);
    setShowWatch(false);
    setShowFriends(false);
    setShowSettings(false);
    setShowMessageBoard(false);
  }

  return (
    <div className={appShellClassName}>
      <BackgroundMusic track={backgroundMusic} audioSettings={audioSettings} resumeSignal={audioResumeSignal} />
      <AppRoutes
        adminTab={adminTab}
        assetProgress={assetProgress}
        audioSettings={audioSettings}
        characters={characters}
        emitGame={emitGame}
        emitScoring={emitScoring}
        lobbyStats={lobbyStats}
        logout={logout}
        onAuth={handleAuth}
        onCountingRequest={() => socket?.emit("counting:request", { roomCode: room.code })}
        onCountingRespond={(accepted) => socket?.emit("counting:respond", { roomCode: room.code, accepted })}
        onDrawRequest={requestDraw}
        onDrawRespond={respondDraw}
        onOpenAdminReplay={openAdminReplay}
        onOpenReplay={openReplay}
        onRefreshCharacters={refreshPublicCharacters}
        onSiteSettingsChanged={setSiteSettings}
        onToast={showToast}
        pendingSkill={pendingSkill}
        replayStep={replayStep}
        room={room}
        selectCharacter={selectCharacter}
        setAdminTab={setAdminTab}
        setDismissedResultRoom={setDismissedResultRoom}
        setPendingSkill={setPendingSkill}
        setReplayStep={setReplayStep}
        setRoom={setRoom}
        setShowFriends={setShowFriends}
        setShowHouse={setShowHouse}
        setShowLeaderboard={setShowLeaderboard}
        setShowMessageBoard={setShowMessageBoard}
        setShowSettings={setShowSettings}
        setShowShop={setShowShop}
        setShowWarehouse={setShowWarehouse}
        setShowWatch={setShowWatch}
        setView={setView}
        siteSettings={siteSettings}
        socket={socket}
        startMatch={startMatch}
        token={token}
        updateUser={updateUser}
        user={user}
        view={view}
      />
      <AppOverlays
        applyStoneDecoration={applyStoneDecoration}
        audioSettings={audioSettings}
        characterListView={characterListView}
        characters={characters}
        incomingDuel={incomingDuel}
        joinWatchRoom={joinWatchRoom}
        matchStart={matchStart}
        matchSuccess={matchSuccess}
        onMatchCancel={() => {
          socket?.emit("match:leave");
          setMatchStart(null);
        }}
        onMatchSuccessComplete={() => {
          setRoom(completePendingMatchRoom(matchSuccessRef, matchSuccess.room));
          matchSuccessRef.current = null;
          setMatchSuccess(null);
          setView("room");
        }}
        onMessageSubmitted={() => showToast("感谢您的反馈！", "success")}
        onRemoveToast={removeToast}
        onResultClose={() => {
          clearLastRoomCode();
          setDismissedResultRoom(room.code);
          if (view !== "room") setRoom(null);
        }}
        openReplay={openReplay}
        replayRecords={replayRecords}
        resultModalOpen={resultModalOpen}
        room={room}
        selectCharacter={selectCharacter}
        setAudioSettings={setAudioSettings}
        setIncomingDuel={setIncomingDuel}
        setShowFriends={setShowFriends}
        setShowHouse={setShowHouse}
        setShowLeaderboard={setShowLeaderboard}
        setShowMessageBoard={setShowMessageBoard}
        setShowSettings={setShowSettings}
        setShowShop={setShowShop}
        setShowWarehouse={setShowWarehouse}
        setShowWatch={setShowWatch}
        setVisualEffect={setVisualEffect}
        setVisualTheme={setVisualTheme}
        showFriends={showFriends}
        showHouse={showHouse}
        showLeaderboard={showLeaderboard}
        showMessageBoard={showMessageBoard}
        showSettings={showSettings}
        showShop={showShop}
        showToast={showToast}
        showWarehouse={showWarehouse}
        showWatch={showWatch}
        siteSettings={siteSettings}
        socket={socket}
        token={token}
        toasts={toasts}
        updateUser={updateUser}
        user={user}
        visualEffect={visualEffect}
        visualTheme={visualTheme}
      />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
