import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { CHARACTERS } from "./shared/characters.js";
import { latestSkillCharacterId, resolveBackgroundMusic } from "./shared/musicLibrary.js";
import { deploymentSocketBase, loginPreloadAssets, preloadLoginAssets } from "./shared/preloadAssets.js";
import { DEFAULT_SITE_SETTINGS } from "./shared/siteSettings.js";
import { BackgroundMusic, DEFAULT_AUDIO_SETTINGS, loadAudioSettings, playDoorbellSound } from "./audio/playback.jsx";
import AdminConsole from "./admin/AdminConsole.jsx";
import AuthScreen from "./auth/AuthScreen.jsx";
import HomeScreen from "./home/HomeScreen.jsx";
import { DuelRequestBanner, ToastStack, limitToastQueue } from "./modals/FeedbackModals.jsx";
import FriendsModal from "./modals/FriendsModal.jsx";
import { MatchModal, MatchSuccessModal, ResultModal } from "./modals/GameLifecycleModals.jsx";
import HouseModal from "./modals/HouseModal.jsx";
import LeaderboardModal from "./modals/LeaderboardModal.jsx";
import MessageBoardModal from "./modals/MessageBoardModal.jsx";
import ShopModal from "./modals/ShopModal.jsx";
import SettingsModal from "./modals/SettingsModal.jsx";
import WarehouseModal from "./modals/WarehouseModal.jsx";
import WatchModal from "./modals/WatchModal.jsx";
import RoomScreen from "./room/RoomScreen.jsx";
import { adminApi, api, configureAuthRefresh } from "./api/client.js";
import AssetPreloadScreen from "./app/AssetPreloadScreen.jsx";
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
import { planRoomBackNavigation } from "./app/roomNavigation.js";
import { replayOpeningState } from "./app/replayOpening.js";
import { loadPublicSiteSettings } from "./app/siteSettingsCatalog.js";
import { applyRoomClock } from "./app/roomClock.js";
import { mergeCurrentUserFromRoom } from "./app/roomUserSync.js";
import { initialSessionState, shouldFinishPreloadAsHome } from "./app/sessionState.js";
import { createSocketHandlers } from "./app/socketHandlers.js";
import { buildStatChangeToasts } from "./app/statChangeToast.js";
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
  const matchSuccessRef = useRef(matchSuccess);
  const roomRef = useRef(room);
  const viewRef = useRef(view);
  const audioSettingsRef = useRef(audioSettings);
  const toastIdRef = useRef(0);
  const refreshPromiseRef = useRef(null);
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

  const removeToast = useCallback((toastId) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  const showToast = useCallback((message, tone = "danger") => {
    if (!message) return;
    const id = ++toastIdRef.current;
    setToasts((current) => limitToastQueue([{ id, text: message, tone }, ...current]));
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

  useEffect(() => {
    refreshSiteSettings();
  }, []);

  useEffect(() => {
    let cancelled = false;
    refreshAuthSession({ silent: true })
      .catch(() => {
        if (!cancelled) setView("login");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    configureAuthRefresh(() => refreshAuthSession({ silent: true }));
    return () => configureAuthRefresh(null);
  }, [updateUser]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api("/api/me", { token })
      .then(async (data) => {
        if (cancelled) return;
        setUser(data.user);
        setView("preloading");
        setAssetProgress(0);
        const nextCharacters = await loadPublicCharacters(token);
        if (cancelled) return;
        setCharacters(nextCharacters);
        const startedAt = Date.now();
        await preloadLoginAssets(loginPreloadAssets({
          characters: nextCharacters,
          ownedCharacters: data.user.ownedCharacters,
          itemEffects: data.user.itemEffects,
          musicSelections: data.user.musicSelections
        }), {
          onProgress: (progress) => {
            if (!cancelled) setAssetProgress(progress);
          }
        });
        const elapsed = Date.now() - startedAt;
        if (elapsed < 900) await new Promise((resolve) => setTimeout(resolve, 900 - elapsed));
        if (!cancelled && shouldFinishPreloadAsHome({
          view: viewRef.current,
          room: roomRef.current,
          matchSuccess: matchSuccessRef.current
        })) {
          setView("home");
        }
      })
      .catch(() => {
        if (cancelled) return;
        socket?.close();
        setToken("");
        setUser(null);
        setRoom(null);
        setMatchStart(null);
        setMatchSuccess(null);
        setShowShop(false);
        setShowHouse(false);
        setShowWarehouse(false);
        setShowLeaderboard(false);
        setShowWatch(false);
        setLobbyStats({ onlineCount: 0, matchmakingCount: 0 });
        setView("login");
        setCharacters(CHARACTERS);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

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
      buildRoomResumeRequest
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

  async function loadPublicCharacters(authToken) {
    return loadPublicCharacterCatalog({ token: authToken });
  }

  async function refreshSiteSettings() {
    setSiteSettings(await loadPublicSiteSettings());
  }

  async function refreshAuthSession({ silent = false } = {}) {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = api("/api/auth/refresh", {
        method: "POST",
        skipAuthRefresh: true
      })
        .then((data) => {
          setToken(data.token);
          updateUser(data.user, { notifyStats: false });
          return data;
        })
        .catch((error) => {
          if (!silent) showToast(error.message);
          setToken("");
          setUser(null);
          setRoom(null);
          setMatchStart(null);
          setMatchSuccess(null);
          setLobbyStats({ onlineCount: 0, matchmakingCount: 0 });
          setCharacters(CHARACTERS);
          setView("login");
          return null;
        })
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }
    return refreshPromiseRef.current;
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
    <div className="app-shell">
      <BackgroundMusic track={backgroundMusic} audioSettings={audioSettings} />
      <ToastStack toasts={toasts} onClose={removeToast} />
      {incomingDuel && (
        <DuelRequestBanner
          request={incomingDuel}
          onAccept={() => {
            socket?.emit("duel:respond", { requestId: incomingDuel.requestId, accepted: true });
            setIncomingDuel(null);
          }}
          onReject={() => {
            socket?.emit("duel:respond", { requestId: incomingDuel.requestId, accepted: false });
            setIncomingDuel(null);
          }}
          onTimeout={() => {
            socket?.emit("duel:respond", { requestId: incomingDuel.requestId, accepted: false });
            setIncomingDuel(null);
          }}
        />
      )}
      {view === "login" && <AuthScreen onAuth={handleAuth} />}
      {view === "preloading" && <AssetPreloadScreen progress={assetProgress} />}
      {view === "home" && user && (
        <HomeScreen
          user={user}
          characters={characters}
          siteSettings={siteSettings}
          lobbyStats={lobbyStats}
          onLogout={logout}
          onSelectCharacter={selectCharacter}
          onStartMatch={startMatch}
          onOpenHouse={() => setShowHouse(true)}
          onOpenWarehouse={() => setShowWarehouse(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenWatch={() => setShowWatch(true)}
          onOpenShop={() => setShowShop(true)}
          onOpenFriends={() => setShowFriends(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenMessageBoard={() => setShowMessageBoard(true)}
          onOpenAdmin={() => setView("admin")}
        />
      )}
      {view === "admin" && user?.role === "admin" && (
        <AdminConsole
          user={user}
          token={token}
          tab={adminTab}
          setTab={setAdminTab}
          onCurrentUserChange={updateUser}
          onCharactersChanged={refreshPublicCharacters}
          onSiteSettingsChanged={setSiteSettings}
          onNotice={showToast}
          onBack={() => setView("home")}
          onOpenReplay={openAdminReplay}
        />
      )}
      {view === "admin" && user?.role !== "admin" && (
        <HomeScreen
          user={user}
          characters={characters}
          siteSettings={siteSettings}
          lobbyStats={lobbyStats}
          onLogout={logout}
          onSelectCharacter={selectCharacter}
          onStartMatch={startMatch}
          onOpenHouse={() => setShowHouse(true)}
          onOpenWarehouse={() => setShowWarehouse(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenWatch={() => setShowWatch(true)}
          onOpenShop={() => setShowShop(true)}
          onOpenFriends={() => setShowFriends(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenMessageBoard={() => setShowMessageBoard(true)}
          onOpenAdmin={() => setView("admin")}
        />
      )}
      {view === "room" && room && user && (
        <RoomScreen
          room={room}
          user={user}
          token={token}
          characters={characters}
          replayStep={replayStep}
          setReplayStep={setReplayStep}
          pendingSkill={pendingSkill}
          setPendingSkill={setPendingSkill}
          audioSettings={audioSettings}
          onOpenSettings={() => setShowSettings(true)}
          onOpenMessageBoard={() => setShowMessageBoard(true)}
          onBack={() => {
            const plan = planRoomBackNavigation({ room, replayStep });
            if (plan.leaveRoomCode) {
              socket?.emit("room:leave", { roomCode: plan.leaveRoomCode });
            }
            if (plan.clearRoom) {
              setRoom(null);
            }
            setReplayStep(plan.nextReplayStep);
            setView(plan.nextView);
          }}
          onGameAction={emitGame}
          onCountingRequest={() => socket?.emit("counting:request", { roomCode: room.code })}
          onCountingRespond={(accepted) => socket?.emit("counting:respond", { roomCode: room.code, accepted })}
          onDrawRequest={requestDraw}
          onDrawRespond={respondDraw}
          onScoringAction={emitScoring}
          onChat={(text) => socket?.emit("chat:send", { roomCode: room.code, text })}
          onOpenReplay={openReplay}
        />
      )}
      {resultModalOpen && (
        <ResultModal
          room={room}
          user={user}
          characters={characters}
          audioSettings={audioSettings}
          onClose={() => {
            clearLastRoomCode();
            setDismissedResultRoom(room.code);
            if (view !== "room") setRoom(null);
          }}
        />
      )}
      {matchStart && <MatchModal user={user} startedAt={matchStart} onCancel={() => {
        socket?.emit("match:leave");
        setMatchStart(null);
      }} characters={characters} />}
      {matchSuccess && (
        <MatchSuccessModal
          startedAt={matchSuccess.startedAt}
          audioSettings={audioSettings}
          onComplete={() => {
            setRoom(completePendingMatchRoom(matchSuccessRef, matchSuccess.room));
            matchSuccessRef.current = null;
            setMatchSuccess(null);
            setView("room");
          }}
        />
      )}
      {showHouse && user && (
        <HouseModal
          user={user}
          records={replayRecords}
          characterListView={characterListView}
          audioSettings={audioSettings}
          onClose={() => setShowHouse(false)}
          onSelectCharacter={selectCharacter}
          onApplyDecoration={applyStoneDecoration}
          onOpenReplay={openReplay}
        />
      )}
      {showWarehouse && user && (
        <WarehouseModal
          token={token}
          user={user}
          characters={characters}
          onUserChange={updateUser}
          onNotice={showToast}
          onClose={() => setShowWarehouse(false)}
        />
      )}
      {showLeaderboard && (
        <LeaderboardModal
          token={token}
          user={user}
          characters={characters}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
      {showWatch && (
        <WatchModal
          token={token}
          characters={characters}
          onClose={() => setShowWatch(false)}
          onJoinRoom={joinWatchRoom}
          onNotice={showToast}
        />
      )}
      {showFriends && (
        <FriendsModal
          token={token}
          socket={socket}
          characters={characters}
          onNotice={showToast}
          onClose={() => setShowFriends(false)}
          onOpenReplay={openReplay}
        />
      )}
      {showShop && (
        <ShopModal
          token={token}
          user={user}
          onPurchased={updateUser}
          onNotice={showToast}
          onClose={() => setShowShop(false)}
        />
      )}
      {showSettings && (
        <SettingsModal
          siteSettings={siteSettings}
          audioSettings={audioSettings}
          setAudioSettings={setAudioSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showMessageBoard && (
        <MessageBoardModal
          token={token}
          onSubmitted={() => showToast("\u611f\u8c22\u60a8\u7684\u53cd\u9988\uff01", "success")}
          onClose={() => setShowMessageBoard(false)}
        />
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
