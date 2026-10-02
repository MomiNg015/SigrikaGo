import { lazy, Suspense } from "react";
import { DuelRequestBanner, ToastStack } from "../modals/FeedbackModals.jsx";
import { MatchModal, MatchSuccessModal, ResultModal } from "../modals/GameLifecycleModals.jsx";
import OnboardingStoryModal from "../modals/OnboardingStoryModal.jsx";
import StoryPlayerModal from "../modals/StoryPlayerModal.jsx";
import TutorialSessionModal from "../tutorial/TutorialSessionModal.jsx";
import { isStoryNodeType } from "../shared/tutorialNodeTypes.js";

const AchievementModal = lazy(() => import("../modals/AchievementModal.jsx"));
const AnnouncementModal = lazy(() => import("../modals/AnnouncementModal.jsx"));
const FriendsModal = lazy(() => import("../modals/FriendsModal.jsx"));
const HouseModal = lazy(() => import("../modals/HouseModal.jsx"));
const LeaderboardModal = lazy(() => import("../modals/LeaderboardModal.jsx"));
const MailboxModal = lazy(() => import("../modals/MailboxModal.jsx"));
const MessageBoardModal = lazy(() => import("../modals/MessageBoardModal.jsx"));
const PersonalizationModal = lazy(() => import("../modals/PersonalizationModal.jsx"));
const RecruitmentModal = lazy(() => import("../modals/RecruitmentModal.jsx"));
const ResumeModal = lazy(() => import("../modals/ResumeModal.jsx"));
const SettingsModal = lazy(() => import("../modals/SettingsModal.jsx"));
const ShopModal = lazy(() => import("../modals/ShopModal.jsx"));
const WarehouseModal = lazy(() => import("../modals/WarehouseModal.jsx"));
const WatchModal = lazy(() => import("../modals/WatchModal.jsx"));

export default function AppOverlays({
  applyStoneDecoration,
  audioSettings,
  characterListView,
  characters,
  incomingDuel,
  joinWatchRoom,
  matchStart,
  matchSuccess,
  musicTracks,
  onMatchCancel,
  onMatchSuccessComplete,
  onMessageSubmitted,
  onAnnouncementSummaryChange,
  onMailboxSummaryChange,
  onEnterTutorialBattle,
  onStoryPlayerClose,
  onStoryNodeEnter,
  onboardingStoryScript,
  storyPlayerScript,
  onRemoveToast,
  onRecruitmentInteractionLockChange,
  onRecruitmentStatusChange,
  onResultClose,
  onSpecialResultContinue,
  openReplay,
  resultModalOpen,
  room,
  selectCharacter,
  selectCharacterMusic,
  setAudioSettings,
  setIncomingDuel,
  setShowAchievements,
  setShowFriends,
  setShowRecruitment,
  setShowHouse,
  setShowLeaderboard,
  setShowMailbox,
  setShowAnnouncements,
  setShowOnboardingStory,
  setShowStoryPlayer,
  setShowMessageBoard,
  setShowPersonalization,
  setShowResume,
  setShowSettings,
  setShowShop,
  setShowWarehouse,
  setShowWatch,
  setVisualTheme,
  showFriends,
  showRecruitment,
  showAchievements,
  showHouse,
  showLeaderboard,
  showMailbox,
  showAnnouncements,
  showOnboardingStory,
  showStoryPlayer,
  showMessageBoard,
  showPersonalization,
  showResume,
  showSettings,
  showShop,
  showToast,
  announcementUnreadByKind,
  showWarehouse,
  showWatch,
  siteSettings,
  socket,
  token,
  toasts,
  updateUser,
  user,
  visualTheme
}) {
  function closeStoryPlayer() {
    if (onStoryPlayerClose) {
      onStoryPlayerClose();
      return;
    }
    setShowOnboardingStory(false);
    setShowStoryPlayer(false);
    storyPlayerScript?.clear?.();
  }

  return (
    <>
      <ToastStack toasts={toasts} onClose={onRemoveToast} />
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
      {resultModalOpen && (
        <ResultModal
          room={room}
          user={user}
          characters={characters}
          audioSettings={audioSettings}
          onClose={onResultClose}
          onSpecialContinue={onSpecialResultContinue}
        />
      )}
      {matchStart && (
        <MatchModal
          user={user}
          startedAt={matchStart.startedAt ?? matchStart}
          mode={matchStart.mode ?? "spark"}
          specialDuel={Boolean(matchStart.specialDuel)}
          onCancel={onMatchCancel}
          characters={characters}
        />
      )}
      {matchSuccess && !matchSuccess.countdownComplete && (
        <MatchSuccessModal
          startedAt={matchSuccess.startedAt}
          specialDuel={Boolean(matchSuccess.room?.sigrikaCandyDuel)}
          audioSettings={audioSettings}
          onComplete={onMatchSuccessComplete}
        />
      )}
      {/* Each lazy window loads independently so existing windows stay visible. */}
      <Suspense fallback={null}>
        {showHouse && user && (
          <HouseModal
            token={token}
            user={user}
            characterListView={characterListView}
            audioSettings={audioSettings}
            musicTracks={musicTracks}
            onClose={() => setShowHouse(false)}
            onSelectCharacter={selectCharacter}
            onSelectCharacterMusic={selectCharacterMusic}
            onApplyDecoration={applyStoneDecoration}
            onUserChange={updateUser}
            onNotice={showToast}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {showResume && user && (
          <ResumeModal
            user={user}
            token={token}
            characterListView={characterListView}
            onClose={() => setShowResume(false)}
            onOpenAchievements={() => setShowAchievements(true)}
            onOpenPersonalization={() => setShowPersonalization(true)}
            onOpenReplay={openReplay}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {showAchievements && user && (
          <AchievementModal
            token={token}
            onClose={() => setShowAchievements(false)}
            onNotice={showToast}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {showPersonalization && user && (
          <PersonalizationModal
            token={token}
            user={user}
            onClose={() => setShowPersonalization(false)}
            onNotice={showToast}
            onUserChange={updateUser}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {showWarehouse && user && (
          <WarehouseModal
            token={token}
            user={user}
            characters={characters}
            onUserChange={updateUser}
            onNotice={showToast}
            onStoryScript={storyPlayerScript?.open}
            onClose={() => setShowWarehouse(false)}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {showLeaderboard && (
          <LeaderboardModal
            token={token}
            user={user}
            characters={characters}
            onClose={() => setShowLeaderboard(false)}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {showWatch && (
          <WatchModal
            token={token}
            characters={characters}
            onClose={() => setShowWatch(false)}
            onJoinRoom={joinWatchRoom}
            onNotice={showToast}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
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
      </Suspense>
      <Suspense fallback={null}>
        {showShop && (
          <ShopModal
            token={token}
            user={user}
            siteSettings={siteSettings}
            onPurchased={updateUser}
            onNotice={showToast}
            onClose={() => setShowShop(false)}
            musicTracks={musicTracks}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {showRecruitment && (
          <RecruitmentModal
            audioSettings={audioSettings}
            characters={characters}
            token={token}
            user={user}
            onUserChange={updateUser}
            onNotice={showToast}
            onInteractionLockChange={onRecruitmentInteractionLockChange}
            onStatusChange={onRecruitmentStatusChange}
            onClose={() => setShowRecruitment(false)}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {showSettings && (
          <SettingsModal
            siteSettings={siteSettings}
            audioSettings={audioSettings}
            setAudioSettings={setAudioSettings}
            visualTheme={visualTheme}
            setVisualTheme={setVisualTheme}
            onNotice={showToast}
            onClose={() => setShowSettings(false)}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {showAnnouncements && (
          <AnnouncementModal
            token={token}
            unreadByKind={announcementUnreadByKind}
            onClose={() => setShowAnnouncements(false)}
            onNotice={showToast}
            onSummaryChange={onAnnouncementSummaryChange}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {showMailbox && (
          <MailboxModal
            token={token}
            onClose={() => setShowMailbox(false)}
            onNotice={showToast}
            onSummaryChange={onMailboxSummaryChange}
            onUserChange={updateUser}
          />
        )}
      </Suspense>
      {showOnboardingStory && (
        <OnboardingStoryModal
          script={onboardingStoryScript}
          characters={characters}
          onClose={closeStoryPlayer}
        />
      )}
      {showStoryPlayer && (
        isUnifiedTutorialScript(storyPlayerScript?.script) ? (
          <TutorialSessionModal
            script={storyPlayerScript?.script}
            characters={characters}
            user={user}
            labels={storyPlayerScript?.labels}
            onComplete={storyPlayerScript?.onComplete}
            onClose={closeStoryPlayer}
            onEnterBattle={(battleSession) => {
              onEnterTutorialBattle?.({
                ...battleSession,
                labels: storyPlayerScript?.labels,
                onComplete: storyPlayerScript?.onComplete,
                onExit: storyPlayerScript?.onExit
              });
            }}
          />
        ) : (
          <StoryPlayerModal
            script={storyPlayerScript?.script}
            characters={characters}
            user={user}
            labels={storyPlayerScript?.labels}
            dismissible={storyPlayerScript?.dismissible !== false}
            onNodeEnter={onStoryNodeEnter}
            onNavigate={storyPlayerScript?.onNavigate}
            onClose={closeStoryPlayer}
          />
        )
      )}
      <Suspense fallback={null}>
        {showMessageBoard && (
          <MessageBoardModal
            token={token}
            onSubmitted={onMessageSubmitted}
            onClose={() => setShowMessageBoard(false)}
          />
        )}
      </Suspense>
    </>
  );
}

function isUnifiedTutorialScript(script) {
  if (script?.triggerType === "item-character-use") return false;
  return (script?.nodes ?? []).some((node) => !isStoryNodeType(node?.type));
}
