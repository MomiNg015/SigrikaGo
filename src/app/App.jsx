import { useCallback, useState } from "react";
import { CHARACTERS } from "../shared/characters.js";
import { MUSIC_TRACKS } from "../shared/musicLibrary.js";
import { deploymentSocketBase } from "../shared/preloadAssets.js";
import { BackgroundMusic, loadAudioSettings } from "../audio/playback.jsx";
import AppOverlays from "./AppOverlays.jsx";
import AppRoutes from "./AppRoutes.jsx";
import InteractionFeedback from "./InteractionFeedback.jsx";
import { initialSessionState } from "./sessionState.js";
import { useAppActions } from "./useAppActions.js";
import { useAuthSession } from "./useAuthSession.js";
import { useAudioSettingsPersistence } from "./useAudioSettingsPersistence.js";
import { useBackgroundMusicTrack } from "./useBackgroundMusicTrack.js";
import { useAppShellTheme } from "./useAppShellTheme.js";
import { useCurrentUser } from "./useCurrentUser.js";
import { useGameSocketConnection } from "./useGameSocketConnection.js";
import { useHomeUserRefresh } from "./useHomeUserRefresh.js";
import { loadMusicTrackCatalog } from "./musicTrackCatalog.js";
import { useReplayRecords } from "./useReplayRecords.js";
import { useMatchSessionState } from "./useMatchSessionState.js";
import { useOverlayState } from "./useOverlayState.js";
import { useRoomSessionState } from "./useRoomSessionState.js";
import { useRoomMemory } from "./useRoomMemory.js";
import { useSiteSettingsState } from "./useSiteSettingsState.js";
import { useStartupPreload } from "./useStartupPreload.js";
import { useSyncedRefs } from "./useSyncedRefs.js";
import { useToastQueue } from "./useToastQueue.js";

const SOCKET_BASE = deploymentSocketBase();

export default function App() {
  const initialSession = initialSessionState();
  const [token, setToken] = useState(initialSession.token);
  const [view, setView] = useState(initialSession.view);
  const [socket, setSocket] = useState(null);
  const {
    matchStart,
    matchSuccess,
    setMatchStart,
    setMatchSuccess
  } = useMatchSessionState();
  const {
    showShop,
    showGacha,
    showHouse,
    showWarehouse,
    showResume,
    showAchievements,
    showPersonalization,
    showLeaderboard,
    showFriends,
    showWatch,
    showSettings,
    showMessageBoard,
    setShowShop,
    setShowGacha,
    setShowHouse,
    setShowWarehouse,
    setShowResume,
    setShowAchievements,
    setShowPersonalization,
    setShowLeaderboard,
    setShowFriends,
    setShowWatch,
    setShowSettings,
    setShowMessageBoard
  } = useOverlayState();
  const [audioSettings, setAudioSettings] = useState(loadAudioSettings);
  const [replayRecords, setReplayRecords] = useState([]);
  const {
    dismissedResultRoom,
    pendingSkill,
    replayStep,
    resultModalOpen,
    room,
    setDismissedResultRoom,
    setPendingSkill,
    setReplayStep,
    setRoom
  } = useRoomSessionState();
  const [characters, setCharacters] = useState(CHARACTERS);
  const [musicTracks, setMusicTracks] = useState(MUSIC_TRACKS);
  const [adminTab, setAdminTab] = useState("overview");
  const [incomingDuel, setIncomingDuel] = useState(null);
  const [lobbyStats, setLobbyStats] = useState({ onlineCount: 0, matchmakingCount: 0 });
  const [assetProgress, setAssetProgress] = useState(0);
  const [audioResumeSignal, setAudioResumeSignal] = useState(0);
  const { removeToast, showToast, toasts } = useToastQueue();
  const showAchievementUnlocks = useCallback((unlocks = []) => {
    for (const unlock of unlocks) {
      showToast(`达成成就：${unlock.name}`, "achievement");
    }
  }, [showToast]);
  const { setUser, updateUser, user } = useCurrentUser();
  const { refreshSiteSettings, setSiteSettings, siteSettings } = useSiteSettingsState();
  const { audioSettingsRef, matchSuccessRef, roomRef, viewRef } = useSyncedRefs({
    audioSettings,
    matchSuccess,
    room,
    view
  });
  const characterListView = Object.values(characters);
  const backgroundMusic = useBackgroundMusicTrack({
    view,
    room,
    user,
    matchSuccess,
    musicTracks,
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
    setMusicTracks,
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
    setMusicTracks,
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
    setShowGacha,
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

  async function refreshMusicTracks() {
    if (!token) return;
    const nextMusicTracks = await loadMusicTrackCatalog({ token });
    setMusicTracks(nextMusicTracks);
  }

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
  useHomeUserRefresh({ onAchievementUnlocks: showAchievementUnlocks, token, updateUser, user, view });

  useAudioSettingsPersistence(audioSettings);
  useRoomMemory(room);

  return (
    <div className={appShellClassName}>
      <BackgroundMusic track={backgroundMusic} audioSettings={audioSettings} resumeSignal={audioResumeSignal} />
      <InteractionFeedback audioSettings={audioSettings} />
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
        onRefreshMusicTracks={refreshMusicTracks}
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
        setShowGacha={setShowGacha}
        setShowHouse={setShowHouse}
        setShowLeaderboard={setShowLeaderboard}
        setShowMessageBoard={setShowMessageBoard}
        setShowResume={setShowResume}
        setShowAchievements={setShowAchievements}
        setShowPersonalization={setShowPersonalization}
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
        musicTracks={musicTracks}
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
        musicTracks={musicTracks}
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
        setShowGacha={setShowGacha}
        setShowHouse={setShowHouse}
        setShowLeaderboard={setShowLeaderboard}
        setShowMessageBoard={setShowMessageBoard}
        setShowResume={setShowResume}
        setShowAchievements={setShowAchievements}
        setShowPersonalization={setShowPersonalization}
        setShowSettings={setShowSettings}
        setShowShop={setShowShop}
        setShowWarehouse={setShowWarehouse}
        setShowWatch={setShowWatch}
        setVisualTheme={setVisualTheme}
        showFriends={showFriends}
        showGacha={showGacha}
        showHouse={showHouse}
        showLeaderboard={showLeaderboard}
        showMessageBoard={showMessageBoard}
        showResume={showResume}
        showAchievements={showAchievements}
        showPersonalization={showPersonalization}
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

