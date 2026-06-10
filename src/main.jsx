import { useState } from "react";
import { createRoot } from "react-dom/client";
import { CHARACTERS } from "./shared/characters.js";
import { deploymentSocketBase } from "./shared/preloadAssets.js";
import { BackgroundMusic, loadAudioSettings } from "./audio/playback.jsx";
import AppOverlays from "./app/AppOverlays.jsx";
import AppRoutes from "./app/AppRoutes.jsx";
import { shouldShowResultModal } from "./app/resumeSession.js";
import { initialSessionState } from "./app/sessionState.js";
import { useAppActions } from "./app/useAppActions.js";
import { useAuthSession } from "./app/useAuthSession.js";
import { useAudioSettingsPersistence } from "./app/useAudioSettingsPersistence.js";
import { useBackgroundMusicTrack } from "./app/useBackgroundMusicTrack.js";
import { useAppShellTheme } from "./app/useAppShellTheme.js";
import { useCurrentUser } from "./app/useCurrentUser.js";
import { useGameSocketConnection } from "./app/useGameSocketConnection.js";
import { useReplayRecords } from "./app/useReplayRecords.js";
import { useRoomMemory } from "./app/useRoomMemory.js";
import { useSiteSettingsState } from "./app/useSiteSettingsState.js";
import { useStartupPreload } from "./app/useStartupPreload.js";
import { useSyncedRefs } from "./app/useSyncedRefs.js";
import { useToastQueue } from "./app/useToastQueue.js";
import "./styles.css";

const SOCKET_BASE = deploymentSocketBase();

function App() {
  const initialSession = initialSessionState();
  const [token, setToken] = useState(initialSession.token);
  const [view, setView] = useState(initialSession.view);
  const [room, setRoom] = useState(null);
  const [socket, setSocket] = useState(null);
  const [matchStart, setMatchStart] = useState(null);
  const [matchSuccess, setMatchSuccess] = useState(null);
  const [showShop, setShowShop] = useState(false);
  const [showHouse, setShowHouse] = useState(false);
  const [showWarehouse, setShowWarehouse] = useState(false);
  const [showResume, setShowResume] = useState(false);
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
  const [adminTab, setAdminTab] = useState("overview");
  const [incomingDuel, setIncomingDuel] = useState(null);
  const [lobbyStats, setLobbyStats] = useState({ onlineCount: 0, matchmakingCount: 0 });
  const [assetProgress, setAssetProgress] = useState(0);
  const [audioResumeSignal, setAudioResumeSignal] = useState(0);
  const { removeToast, showToast, toasts } = useToastQueue();
  const { setUser, updateUser, user } = useCurrentUser(showToast);
  const { refreshSiteSettings, setSiteSettings, siteSettings } = useSiteSettingsState();
  const { audioSettingsRef, matchSuccessRef, roomRef, viewRef } = useSyncedRefs({
    audioSettings,
    matchSuccess,
    room,
    view
  });
  const characterListView = Object.values(characters);
  const resultModalOpen = shouldShowResultModal(room, dismissedResultRoom, replayStep);
  const backgroundMusic = useBackgroundMusicTrack({
    view,
    room,
    user,
    matchSuccess,
    resultModalOpen,
  });
  const { appShellClassName, setVisualTheme, visualTheme } = useAppShellTheme({
    user,
    view
  });

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

  const {
    applyStoneDecoration,
    cancelMatch,
    closeAllOverlays,
    closeResultModal,
    completeMatchSuccess,
    emitGame,
    emitScoring,
    handleAuth,
    joinWatchRoom,
    logout,
    openAdminReplay,
    openReplay,
    refreshPublicCharacters,
    requestDraw,
    respondDraw,
    selectCharacter,
    selectCharacterMusic,
    startMatch
  } = useAppActions({
    matchSuccess,
    matchSuccessRef,
    room,
    socket,
    token,
    updateUser,
    view,
    setAssetProgress,
    setCharacters,
    setDismissedResultRoom,
    setLobbyStats,
    setMatchStart,
    setMatchSuccess,
    setPendingSkill,
    setReplayStep,
    setRoom,
    setShowFriends,
    setShowHouse,
    setShowLeaderboard,
    setShowMessageBoard,
    setShowResume,
    setShowSettings,
    setShowShop,
    setShowWarehouse,
    setShowWatch,
    setToken,
    setUser,
    setView
  });

  useGameSocketConnection({
    audioSettingsRef,
    closeAllOverlays,
    matchSuccessRef,
    roomRef,
    setAudioResumeSignal,
    setDismissedResultRoom,
    setIncomingDuel,
    setLobbyStats,
    setMatchStart,
    setMatchSuccess,
    setPendingSkill,
    setReplayStep,
    setRoom,
    setSocket,
    setToken,
    setUser,
    setView,
    showToast,
    socketBase: SOCKET_BASE,
    token,
    updateUser,
    userId: user?.id
  });

  useReplayRecords({ enabled: showHouse || showResume, showToast, token, setReplayRecords });

  useAudioSettingsPersistence(audioSettings);
  useRoomMemory(room);

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
        setShowResume={setShowResume}
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
        onMatchCancel={cancelMatch}
        onMatchSuccessComplete={completeMatchSuccess}
        onMessageSubmitted={() => showToast("感谢您的反馈！", "success")}
        onRemoveToast={removeToast}
        onResultClose={closeResultModal}
        openReplay={openReplay}
        replayRecords={replayRecords}
        resultModalOpen={resultModalOpen}
        room={room}
        selectCharacter={selectCharacter}
        selectCharacterMusic={selectCharacterMusic}
        setAudioSettings={setAudioSettings}
        setIncomingDuel={setIncomingDuel}
        setShowFriends={setShowFriends}
        setShowHouse={setShowHouse}
        setShowLeaderboard={setShowLeaderboard}
        setShowMessageBoard={setShowMessageBoard}
        setShowResume={setShowResume}
        setShowSettings={setShowSettings}
        setShowShop={setShowShop}
        setShowWarehouse={setShowWarehouse}
        setShowWatch={setShowWatch}
        setVisualTheme={setVisualTheme}
        showFriends={showFriends}
        showHouse={showHouse}
        showLeaderboard={showLeaderboard}
        showMessageBoard={showMessageBoard}
        showResume={showResume}
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
        visualTheme={visualTheme}
      />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
