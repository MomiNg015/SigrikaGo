import { useCallback, useState } from "react";
import { CHARACTERS, characterListFromCatalog } from "../shared/characters.js";
import { MUSIC_TRACKS } from "../shared/musicLibrary.js";
import { deploymentSocketBase } from "../shared/preloadAssets.js";
import { BackgroundMusic } from "../audio/playback.jsx";
import { ConfirmModal } from "../modals/FeedbackModals.jsx";
import AppOverlays from "./AppOverlays.jsx";
import AppRoutes from "./AppRoutes.jsx";
import InteractionFeedback from "./InteractionFeedback.jsx";
import { initialSessionState } from "./sessionState.js";
import { useAppActions } from "./useAppActions.js";
import { useAudioRuntimeState } from "./useAudioRuntimeState.js";
import { useAuthSession } from "./useAuthSession.js";
import { useBackgroundMusicTrack } from "./useBackgroundMusicTrack.js";
import { useAppShellTheme } from "./useAppShellTheme.js";
import { useCurrentUser } from "./useCurrentUser.js";
import { useGameSocketConnection } from "./useGameSocketConnection.js";
import { useHomeUserRefresh } from "./useHomeUserRefresh.js";
import { useIncomingDuelState } from "./useIncomingDuelState.js";
import { loadMusicTrackCatalog } from "./musicTrackCatalog.js";
import {
  rootBackExitGuardEnabled,
  topDismissibleModalKey,
  useModalDismissal,
  useRootBackExitGuard
} from "./modalDismissal.js";
import { dismissOverlayByKey } from "./overlayRegistry.js";
import { useReplayRecords } from "./useReplayRecords.js";
import { useMailboxSummary } from "./useMailboxSummary.js";
import { useAnnouncementSummary } from "./useAnnouncementSummary.js";
import { useOnboardingStory } from "./useOnboardingStory.js";
import { useMatchSessionState } from "./useMatchSessionState.js";
import { useOverlayState } from "./useOverlayState.js";
import { useRecruitmentReadyState } from "./useRecruitmentReadyState.js";
import { useRoomSessionState } from "./useRoomSessionState.js";
import { useRoomMemory } from "./useRoomMemory.js";
import { useSiteSettingsState } from "./useSiteSettingsState.js";
import { useStartupPreload } from "./useStartupPreload.js";
import { useSyncedRefs } from "./useSyncedRefs.js";
import { useToastQueue } from "./useToastQueue.js";

const SOCKET_BASE = deploymentSocketBase();
const EXIT_CONFIRM_TITLE = "\u786e\u5b9a\u8981\u9000\u51fa\u6e38\u620f\u5417\uff1f";
const EXIT_CONFIRM_MESSAGE = "\u518d\u6b21\u786e\u8ba4\u540e\u5c06\u79bb\u5f00\u5f53\u524d\u6e38\u620f\u9875\u9762\u3002";
const EXIT_CONFIRM_TEXT = "\u9000\u51fa\u6e38\u620f";

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
    showRecruitment,
    showMatchModePicker,
    showHouse,
    showWarehouse,
    showResume,
    showAchievements,
    showPersonalization,
    showLeaderboard,
    showFriends,
    showWatch,
    showSettings,
    showAnnouncements,
    showMailbox,
    showMessageBoard,
    showOnboardingStory,
    showStoryPlayer,
    overlayState,
    overlaySetters,
    setShowShop,
    setShowRecruitment,
    setShowMatchModePicker,
    setShowHouse,
    setShowWarehouse,
    setShowResume,
    setShowAchievements,
    setShowPersonalization,
    setShowLeaderboard,
    setShowFriends,
    setShowWatch,
    setShowSettings,
    setShowAnnouncements,
    setShowMailbox,
    setShowMessageBoard,
    setShowOnboardingStory,
    setShowStoryPlayer
  } = useOverlayState();
  const {
    audioResumeSignal,
    audioSettings,
    resumeAudioPlayback,
    setAudioSettings
  } = useAudioRuntimeState();
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
  const { incomingDuel, setIncomingDuel } = useIncomingDuelState();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [lobbyStats, setLobbyStats] = useState({ onlineCount: 0, matchmakingCount: 0 });
  const [assetProgress, setAssetProgress] = useState(0);
  const { removeToast, showToast, toasts } = useToastQueue();
  const [activeStoryPlayer, setActiveStoryPlayer] = useState({ script: null, labels: null });
  const openStoryPlayer = useCallback((script, labels = null) => {
    setShowOnboardingStory(false);
    setActiveStoryPlayer({ script, labels });
    setShowStoryPlayer(true);
  }, [setShowOnboardingStory, setShowStoryPlayer]);
  const clearStoryPlayer = useCallback(() => {
    setActiveStoryPlayer({ script: null, labels: null });
  }, []);
  const closeStoryPlayerOverlay = useCallback(() => {
    setShowOnboardingStory(false);
    setShowStoryPlayer(false);
    clearStoryPlayer();
  }, [clearStoryPlayer, setShowOnboardingStory, setShowStoryPlayer]);
  const showAchievementUnlocks = useCallback((unlocks = []) => {
    for (const unlock of unlocks) {
      showToast(`达成成就：${unlock.name}`, "achievement");
    }
  }, [showToast]);
  const { setUser, updateUser, user } = useCurrentUser();
  const { mailboxSummary, refreshMailboxSummary } = useMailboxSummary({
    mailboxOpen: showMailbox,
    token,
    user
  });
  const { announcementSummary, refreshAnnouncementSummary } = useAnnouncementSummary({
    announcementOpen: showAnnouncements,
    token,
    user,
    view
  });
  const { openOnboardingStory } = useOnboardingStory({
    openStoryPlayer,
    overlaySetters,
    showToast,
    token,
    user,
    view
  });
  const { handleRecruitmentStatusChange, recruitmentReady } = useRecruitmentReadyState({ token, user });
  const { refreshSiteSettings, setSiteSettings, siteSettings } = useSiteSettingsState();
  const { audioSettingsRef, incomingDuelRef, matchSuccessRef, roomRef, viewRef } = useSyncedRefs({
    audioSettings,
    incomingDuel,
    matchSuccess,
    room,
    view
  });
  const characterListView = characterListFromCatalog(characters);
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
    overlaySetters,
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
    incomingDuelRef,
    matchSuccessRef,
    onSocketReconnect: resumeAudioPlayback,
    roomRef,
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

  const topModalKey = topDismissibleModalKey({
    result: resultModalOpen,
    matchStart: Boolean(matchStart),
    ...overlayState
  });
  const dismissTopModal = useCallback(() => {
    switch (topModalKey) {
      case "result":
        closeResultModal();
        break;
      case "matchStart":
        cancelMatch();
        break;
      case "onboardingStory":
      case "storyPlayer":
        closeStoryPlayerOverlay();
        break;
      default:
        dismissOverlayByKey(topModalKey, overlaySetters);
        break;
    }
  }, [
    cancelMatch,
    closeStoryPlayerOverlay,
    closeResultModal,
    overlaySetters,
    topModalKey
  ]);
  useModalDismissal({ activeId: topModalKey, onDismiss: dismissTopModal });
  const exitThroughBack = useRootBackExitGuard({
    confirmationOpen: showExitConfirm,
    enabled: rootBackExitGuardEnabled({ activeId: topModalKey, view }),
    onCancelExit: () => setShowExitConfirm(false),
    onRequestExit: () => setShowExitConfirm(true)
  });

  useReplayRecords({ enabled: showHouse || showResume, showToast, token, setReplayRecords });
  useHomeUserRefresh({ onAchievementUnlocks: showAchievementUnlocks, token, updateUser, user, view });

  useRoomMemory(room, matchSuccess?.room);

  return (
    <div className={appShellClassName}>
      <BackgroundMusic track={backgroundMusic} audioSettings={audioSettings} resumeSignal={audioResumeSignal} />
      <InteractionFeedback audioSettings={audioSettings} />
      {showExitConfirm && (
        <ConfirmModal
          title={EXIT_CONFIRM_TITLE}
          message={EXIT_CONFIRM_MESSAGE}
          confirmText={EXIT_CONFIRM_TEXT}
          onCancel={() => setShowExitConfirm(false)}
          onConfirm={() => {
            setShowExitConfirm(false);
            exitThroughBack();
          }}
        />
      )}
      <AppRoutes
        adminTab={adminTab}
        assetProgress={assetProgress}
        audioSettings={audioSettings}
        characters={characters}
        emitGame={emitGame}
        emitScoring={emitScoring}
        lobbyStats={lobbyStats}
        logout={logout}
        matchSuccess={matchSuccess}
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
        onOpenOnboardingStory={openOnboardingStory}
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
        mailboxBadgeCount={mailboxSummary.badgeCount}
        announcementUnread={announcementSummary.hasUnread}
        recruitmentReady={recruitmentReady}
        showMatchModePicker={showMatchModePicker}
        setShowMatchModePicker={setShowMatchModePicker}
        setShowRecruitment={setShowRecruitment}
        setShowHouse={setShowHouse}
        setShowLeaderboard={setShowLeaderboard}
        setShowMailbox={setShowMailbox}
        setShowAnnouncements={setShowAnnouncements}
        setShowOnboardingStory={setShowOnboardingStory}
        setShowStoryPlayer={setShowStoryPlayer}
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
        onAnnouncementSummaryChange={refreshAnnouncementSummary}
        onStoryPlayerClose={closeStoryPlayerOverlay}
        onRemoveToast={removeToast}
        onRecruitmentStatusChange={handleRecruitmentStatusChange}
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
        setShowRecruitment={setShowRecruitment}
        setShowHouse={setShowHouse}
        setShowLeaderboard={setShowLeaderboard}
        setShowMailbox={setShowMailbox}
        setShowAnnouncements={setShowAnnouncements}
        setShowOnboardingStory={setShowOnboardingStory}
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
        showRecruitment={showRecruitment}
        showHouse={showHouse}
        showLeaderboard={showLeaderboard}
        showMailbox={showMailbox}
        showAnnouncements={showAnnouncements}
        showOnboardingStory={showOnboardingStory}
        showStoryPlayer={showStoryPlayer}
        showMessageBoard={showMessageBoard}
        showResume={showResume}
        showAchievements={showAchievements}
        showPersonalization={showPersonalization}
        showSettings={showSettings}
        showShop={showShop}
        showToast={showToast}
        announcementUnreadByKind={announcementSummary.unreadByKind}
        onMailboxSummaryChange={refreshMailboxSummary}
        onboardingStoryScript={activeStoryPlayer.script}
        storyPlayerScript={{
          ...activeStoryPlayer,
          open: openStoryPlayer,
          clear: clearStoryPlayer
        }}
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

