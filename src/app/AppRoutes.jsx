import { lazy, Suspense } from "react";
import AuthScreen from "../auth/AuthScreen.jsx";
import HomeScreen from "../home/HomeScreen.jsx";
import RoomScreen from "../room/RoomScreen.jsx";
import {
  playUiFriendsOpenSound,
  playUiHouseOpenSound,
  playUiLeaderboardOpenSound,
  playUiMatchOpenSound,
  playUiRecruitmentOpenSound,
  playUiResumeOpenSound,
  playUiShopOpenSound,
  playUiWarehouseOpenSound,
  playUiWatchOpenSound
} from "../audio/playback.jsx";
import { findCharacter } from "../shared/characterDisplay.js";
import AssetPreloadScreen from "./AssetPreloadScreen.jsx";
import { rememberDismissedResultRoom } from "./resumeSession.js";
import { planRoomBackNavigation } from "./roomNavigation.js";

const AdminConsole = lazy(() => import("../admin/AdminConsole.jsx"));
const BattleAssetPreloadScreen = lazy(() => import("./BattleAssetPreloadScreen.jsx"));
const TutorialBattleScreen = lazy(() => import("../tutorial/TutorialBattleScreen.jsx"));
const TUTORIAL_BATTLE_ENTRY_LOADING_TEXT = "正在激烈对局中...";

export default function AppRoutes({
  adminTab,
  assetProgress,
  audioSettings,
  characters,
  emitGame,
  emitScoring,
  lobbyStats,
  logout,
  matchSuccess,
  onAuth,
  onCountingRespond,
  onCountingRequest,
  onDrawRequest,
  onDrawRespond,
  onOpenAdminReplay,
  onOpenReplay,
  onRefreshCharacters,
  onRefreshMusicTracks,
  onSiteSettingsChanged,
  onToast,
  onOpenOnboardingStory,
  onPreloadPlayableReady,
  pendingSkill,
  replayStep,
  room,
  selectCharacter,
  setAdminTab,
  setDismissedResultRoom,
  setPendingSkill,
  setReplayStep,
  setRoom,
  setShowFriends,
  mailboxBadgeCount,
  recruitmentReady,
  showMatchModePicker,
  setShowMatchModePicker,
  setShowRecruitment,
  setShowHouse,
  setShowLeaderboard,
  setShowMailbox,
  setShowAnnouncements,
  setShowMessageBoard,
  setShowResume,
  setShowSettings,
  setShowShop,
  setShowWarehouse,
  setShowWatch,
  setView,
  siteSettings,
  socket,
  startMatch,
  token,
  tutorialBattleSession,
  onTutorialBattleClose,
  onTutorialBattleComplete,
  onTutorialBattleExitToStory,
  updateUser,
  user,
  view,
  musicTracks,
  announcementUnread
}) {
  const homeScreen = user && (
    <HomeScreen
      user={user}
      characters={characters}
      siteSettings={siteSettings}
      lobbyStats={lobbyStats}
      onLogout={logout}
      onSelectCharacter={selectCharacter}
      onStartMatch={startMatch}
      onPreloadPlayableReady={onPreloadPlayableReady}
      onOpenMatch={() => playUiMatchOpenSound(audioSettings)}
      matchModePickerOpen={showMatchModePicker}
      onMatchModePickerOpenChange={setShowMatchModePicker}
      onOpenHouse={() => {
        playUiHouseOpenSound(audioSettings);
        setShowHouse(true);
      }}
      onOpenResume={() => {
        playUiResumeOpenSound(audioSettings);
        setShowResume(true);
      }}
      onOpenWarehouse={() => {
        playUiWarehouseOpenSound(audioSettings);
        setShowWarehouse(true);
      }}
      onOpenLeaderboard={() => {
        playUiLeaderboardOpenSound(audioSettings);
        setShowLeaderboard(true);
      }}
      onOpenWatch={() => {
        playUiWatchOpenSound(audioSettings);
        setShowWatch(true);
      }}
      onOpenShop={() => {
        playUiShopOpenSound(audioSettings);
        setShowShop(true);
      }}
      recruitmentReady={recruitmentReady}
      mailboxBadgeCount={mailboxBadgeCount}
      announcementUnread={announcementUnread}
      onOpenRecruitment={() => {
        playUiRecruitmentOpenSound(audioSettings);
        setShowRecruitment(true);
      }}
      onOpenFriends={() => {
        playUiFriendsOpenSound(audioSettings);
        setShowFriends(true);
      }}
      onOpenSettings={() => setShowSettings(true)}
      onOpenAnnouncements={() => setShowAnnouncements(true)}
      onOpenMailbox={() => setShowMailbox(true)}
      onOpenMessageBoard={() => setShowMessageBoard(true)}
      onOpenOnboardingStory={onOpenOnboardingStory}
      onOpenAdmin={() => setView("admin")}
    />
  );
  const routeLoadingScreen = (
    <AssetPreloadScreen
      characters={characters}
      loadingLinesText={siteSettings.characterLoadingLines}
      progress={assetProgress}
      statusText="正在加载界面..."
      tipsText={siteSettings.preloadTips}
    />
  );
  const tutorialBattleRouteLoadingScreen = (
    <AssetPreloadScreen
      character={tutorialBattleLoadingCharacter(tutorialBattleSession, characters)}
      characters={characters}
      label={TUTORIAL_BATTLE_ENTRY_LOADING_TEXT}
      progress={assetProgress}
      showTips={false}
    />
  );

  return (
    <>
      {view === "login" && <AuthScreen onAuth={onAuth} />}
      {view === "preloading" && (
        <AssetPreloadScreen
          characters={characters}
          loadingLinesText={siteSettings.characterLoadingLines}
          progress={assetProgress}
          tipsText={siteSettings.preloadTips}
        />
      )}
      {view === "match-preloading" && (
        <Suspense fallback={routeLoadingScreen}>
          <BattleAssetPreloadScreen
            characters={characters}
            matchSuccess={matchSuccess}
            musicTracks={musicTracks}
            siteSettings={siteSettings}
            socket={socket}
            user={user}
          />
        </Suspense>
      )}
      {view === "home" && homeScreen}
      {view === "admin" && user?.role === "admin" && (
        <Suspense fallback={routeLoadingScreen}>
          <AdminConsole
            user={user}
            token={token}
            tab={adminTab}
            setTab={setAdminTab}
            musicTracks={musicTracks}
            onCurrentUserChange={updateUser}
            onCharactersChanged={onRefreshCharacters}
            onMusicTracksChanged={onRefreshMusicTracks}
            onSiteSettingsChanged={onSiteSettingsChanged}
            onNotice={onToast}
            onBack={() => setView("home")}
            onOpenReplay={onOpenAdminReplay}
          />
        </Suspense>
      )}
      {view === "admin" && user?.role !== "admin" && homeScreen}
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
          siteSettings={siteSettings}
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
            if (plan.dismissResultRoomCode) {
              rememberDismissedResultRoom(plan.dismissResultRoomCode);
              setDismissedResultRoom(plan.dismissResultRoomCode);
            }
            setReplayStep(plan.nextReplayStep);
            setView(plan.nextView);
          }}
          onGameAction={emitGame}
          onCountingRequest={onCountingRequest}
          onCountingRespond={onCountingRespond}
          onDrawRequest={onDrawRequest}
          onDrawRespond={onDrawRespond}
          onScoringAction={emitScoring}
          onChat={(text) => socket?.emit("chat:send", { roomCode: room.code, text })}
          onOpenReplay={onOpenReplay}
          onToast={onToast}
        />
      )}
      {view === "room" && (!room || !user) && (
        <AssetPreloadScreen
          characters={characters}
          loadingLinesText={siteSettings.characterLoadingLines}
          progress={assetProgress}
          statusText="正在恢复对局..."
          tipsText={siteSettings.preloadTips}
        />
      )}
      {view === "tutorial-battle" && tutorialBattleSession && user && (
        <Suspense fallback={tutorialBattleRouteLoadingScreen}>
          <TutorialBattleScreen
            audioSettings={audioSettings}
            characters={characters}
            musicTracks={musicTracks}
            session={tutorialBattleSession}
            siteSettings={siteSettings}
            user={user}
            onClose={onTutorialBattleClose}
            onComplete={onTutorialBattleComplete}
            onExitToStory={onTutorialBattleExitToStory}
            onOpenMessageBoard={() => setShowMessageBoard(true)}
            onOpenSettings={() => setShowSettings(true)}
            onToast={onToast}
          />
        </Suspense>
      )}
    </>
  );
}

function tutorialBattleLoadingCharacter(session, characters) {
  const startNodeId = String(session?.startNodeId ?? session?.script?.startNodeId ?? "");
  const startNode = (session?.script?.nodes ?? []).find((node) => node?.id === startNodeId);
  const characterId = startNode?.npcCharacterId || startNode?.characterId || startNode?.playerCharacterId || "";
  return characterId ? findCharacter(characters, characterId) : null;
}
