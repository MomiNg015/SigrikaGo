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
import { buildAppOverlayProps, buildAppRouteProps } from "./appShellProps.js";
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
import { dismissOverlayByKey, overlayPropsFromState } from "./overlayRegistry.js";
import { preloadPlayableReady } from "./playableReadyPreload.js";
import { useMailboxSummary } from "./useMailboxSummary.js";
import { useAnnouncementSummary } from "./useAnnouncementSummary.js";
import { useOnboardingStory } from "./useOnboardingStory.js";
import { useMatchSessionState } from "./useMatchSessionState.js";
import { useOverlayState } from "./useOverlayState.js";
import { useRecruitmentReadyState } from "./useRecruitmentReadyState.js";
import { useRoomSessionState } from "./useRoomSessionState.js";
import { useRoomMemory } from "./useRoomMemory.js";
import { useSiteSettingsState } from "./useSiteSettingsState.js";
import { usePlayableReadyPreload } from "./usePlayableReadyPreload.js";
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
  const { overlayState, overlaySetters } = useOverlayState();
  const {
    audioResumeSignal,
    audioSettings,
    resumeAudioPlayback,
    setAudioSettings
  } = useAudioRuntimeState();
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
  const [roomBackRequestId, setRoomBackRequestId] = useState(0);
  const [lobbyStats, setLobbyStats] = useState({ onlineCount: 0, matchmakingCount: 0 });
  const [assetProgress, setAssetProgress] = useState(0);
  const { removeToast, showToast, toasts } = useToastQueue();
  const [recruitmentInteractionLocked, setRecruitmentInteractionLocked] = useState(false);
  const [activeStoryPlayer, setActiveStoryPlayer] = useState({
    script: null,
    labels: null,
    onComplete: null,
    onExit: null
  });
  const [tutorialBattleSession, setTutorialBattleSession] = useState(null);
  const openStoryPlayer = useCallback((script, labels = null, options = {}) => {
    overlaySetters.setShowOnboardingStory(false);
    setActiveStoryPlayer({
      script,
      labels,
      onComplete: options.onComplete ?? null,
      onExit: options.onExit ?? null
    });
    overlaySetters.setShowStoryPlayer(true);
  }, [overlaySetters]);
  const clearStoryPlayer = useCallback(() => {
    setActiveStoryPlayer({ script: null, labels: null, onComplete: null, onExit: null });
  }, []);
  const closeStoryPlayerOverlay = useCallback(() => {
    const onExit = activeStoryPlayer.onExit;
    overlaySetters.setShowOnboardingStory(false);
    overlaySetters.setShowStoryPlayer(false);
    clearStoryPlayer();
    onExit?.();
  }, [activeStoryPlayer.onExit, clearStoryPlayer, overlaySetters]);
  const openTutorialBattleSession = useCallback((session) => {
    overlaySetters.setShowOnboardingStory(false);
    overlaySetters.setShowStoryPlayer(false);
    setTutorialBattleSession({
      ...session,
      returnView: view === "tutorial-battle" ? "home" : view
    });
    setView("tutorial-battle");
  }, [overlaySetters, view]);
  const closeTutorialBattleSession = useCallback(() => {
    const nextView = tutorialBattleSession?.returnView && tutorialBattleSession.returnView !== "tutorial-battle"
      ? tutorialBattleSession.returnView
      : "home";
    setTutorialBattleSession(null);
    setView(nextView);
    clearStoryPlayer();
    tutorialBattleSession?.onExit?.();
  }, [clearStoryPlayer, tutorialBattleSession]);
  const exitTutorialBattleToStory = useCallback(({
    script: nextScript,
    labels = null,
    onComplete: nextOnComplete = null,
    onExit: nextOnExit = null
  } = {}) => {
    const nextView = tutorialBattleSession?.returnView && tutorialBattleSession.returnView !== "tutorial-battle"
      ? tutorialBattleSession.returnView
      : "home";
    setTutorialBattleSession(null);
    setView(nextView);
    if (nextScript) {
      openStoryPlayer(nextScript, labels, { onComplete: nextOnComplete, onExit: nextOnExit });
    }
  }, [openStoryPlayer, tutorialBattleSession]);
  const showAchievementUnlocks = useCallback((unlocks = []) => {
    for (const unlock of unlocks) {
      showToast(`达成成就：${unlock.name}`, "achievement");
    }
  }, [showToast]);
  const { setUser, updateUser, user } = useCurrentUser();
  const { mailboxSummary, refreshMailboxSummary } = useMailboxSummary({
    mailboxOpen: overlayState.mailbox,
    token,
    user
  });
  const { announcementSummary, refreshAnnouncementSummary } = useAnnouncementSummary({
    announcementOpen: overlayState.announcements,
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
    setShowHouse: overlaySetters.setShowHouse,
    setShowLeaderboard: overlaySetters.setShowLeaderboard,
    setShowShop: overlaySetters.setShowShop,
    setShowWarehouse: overlaySetters.setShowWarehouse,
    setShowWatch: overlaySetters.setShowWatch,
    setToken,
    setUser,
    setView,
    token,
    viewRef
  });

  const preloadPlayableIntent = useCallback((mode) => {
    void preloadPlayableReady({
      includePixi: Boolean(mode),
      mode,
      reason: mode ? "match-mode-intent" : "match-intent"
    });
  }, []);

  usePlayableReadyPreload({
    view,
    user
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
    startMatch,
    startPractice
  } = useAppActions({
    matchSuccess,
    matchSuccessRef,
    overlaySetters,
    room,
    socket,
    showToast,
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
    if (recruitmentInteractionLocked) return;
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
    recruitmentInteractionLocked,
    topModalKey
  ]);
  useModalDismissal({ activeId: topModalKey, onDismiss: dismissTopModal });
  const requestRootBack = useCallback(() => {
    if (view === "room" && room) {
      setRoomBackRequestId((current) => current + 1);
      return;
    }
    setShowExitConfirm(true);
  }, [room, view]);
  const exitThroughBack = useRootBackExitGuard({
    confirmationOpen: showExitConfirm,
    enabled: rootBackExitGuardEnabled({ activeId: topModalKey, view }),
    onCancelExit: () => setShowExitConfirm(false),
    onRequestExit: requestRootBack
  });

  useHomeUserRefresh({ onAchievementUnlocks: showAchievementUnlocks, token, updateUser, user, view });

  useRoomMemory(room, matchSuccess?.room);

  const overlayProps = overlayPropsFromState(overlayState, overlaySetters);
  const routeProps = buildAppRouteProps({
    overlayProps,
    routeActions: {
      emitGame,
      emitScoring,
      logout,
      onAuth: handleAuth,
      onDrawRequest: requestDraw,
      onDrawRespond: respondDraw,
      onOpenAdminReplay: openAdminReplay,
      onOpenOnboardingStory: openOnboardingStory,
      onOpenReplay: openReplay,
      onPreloadPlayableReady: preloadPlayableIntent,
      onRefreshCharacters: refreshPublicCharacters,
      onRefreshMusicTracks: refreshMusicTracks,
      onSiteSettingsChanged: setSiteSettings,
      onToast: showToast,
      onTutorialBattleClose: closeTutorialBattleSession,
      onTutorialBattleComplete: tutorialBattleSession?.onComplete,
      onTutorialBattleExitToStory: exitTutorialBattleToStory,
      selectCharacter,
      setAdminTab,
      setDismissedResultRoom,
      setPendingSkill,
      setReplayStep,
      setRoom,
      setView,
      startMatch,
      startPractice,
      updateUser
    },
    routeState: {
      adminTab,
      announcementUnread: announcementSummary.hasUnread,
      assetProgress,
      audioSettings,
      characters,
      lobbyStats,
      mailboxBadgeCount: mailboxSummary.badgeCount,
      matchSuccess,
      musicTracks,
      pendingSkill,
      recruitmentReady,
      replayStep,
      room,
      roomBackRequestId,
      siteSettings,
      socket,
      token,
      tutorialBattleSession,
      user,
      view
    }
  });
  const appOverlayProps = buildAppOverlayProps({
    overlayActions: {
      applyStoneDecoration,
      clearStoryPlayer,
      joinWatchRoom,
      onAnnouncementSummaryChange: refreshAnnouncementSummary,
      onEnterTutorialBattle: openTutorialBattleSession,
      onMailboxSummaryChange: refreshMailboxSummary,
      onMatchCancel: cancelMatch,
      onMatchSuccessComplete: completeMatchSuccess,
      onRecruitmentInteractionLockChange: setRecruitmentInteractionLocked,
      onRecruitmentStatusChange: handleRecruitmentStatusChange,
      onRemoveToast: removeToast,
      onResultClose: closeResultModal,
      onStoryPlayerClose: closeStoryPlayerOverlay,
      openReplay,
      openStoryPlayer,
      selectCharacter,
      selectCharacterMusic,
      setAudioSettings,
      setIncomingDuel,
      setVisualTheme,
      showToast,
      updateUser
    },
    overlayProps,
    overlayState: {
      activeStoryPlayer,
      announcementUnreadByKind: announcementSummary.unreadByKind,
      audioSettings,
      characterListView,
      characters,
      incomingDuel,
      matchStart,
      matchSuccess,
      musicTracks,
      onboardingStoryScript: activeStoryPlayer.script,
      resultModalOpen,
      room,
      siteSettings,
      socket,
      token,
      toasts,
      user,
      visualTheme
    }
  });

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
      <AppRoutes {...routeProps} />
      <AppOverlays {...appOverlayProps} />
    </div>
  );
}

