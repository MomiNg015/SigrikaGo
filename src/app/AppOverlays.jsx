import { DuelRequestBanner, ToastStack } from "../modals/FeedbackModals.jsx";
import FriendsModal from "../modals/FriendsModal.jsx";
import { MatchModal, MatchSuccessModal, ResultModal } from "../modals/GameLifecycleModals.jsx";
import HouseModal from "../modals/HouseModal.jsx";
import LeaderboardModal from "../modals/LeaderboardModal.jsx";
import MessageBoardModal from "../modals/MessageBoardModal.jsx";
import ResumeModal from "../modals/ResumeModal.jsx";
import SettingsModal from "../modals/SettingsModal.jsx";
import ShopModal from "../modals/ShopModal.jsx";
import WarehouseModal from "../modals/WarehouseModal.jsx";
import WatchModal from "../modals/WatchModal.jsx";

export default function AppOverlays({
  applyStoneDecoration,
  audioSettings,
  characterListView,
  characters,
  incomingDuel,
  joinWatchRoom,
  matchStart,
  matchSuccess,
  onMatchCancel,
  onMatchSuccessComplete,
  onMessageSubmitted,
  onRemoveToast,
  onResultClose,
  openReplay,
  replayRecords,
  resultModalOpen,
  room,
  selectCharacter,
  selectCharacterMusic,
  setAudioSettings,
  setIncomingDuel,
  setShowFriends,
  setShowHouse,
  setShowLeaderboard,
  setShowMessageBoard,
  setShowResume,
  setShowSettings,
  setShowShop,
  setShowWarehouse,
  setShowWatch,
  setVisualTheme,
  showFriends,
  showHouse,
  showLeaderboard,
  showMessageBoard,
  showResume,
  showSettings,
  showShop,
  showToast,
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
        />
      )}
      {matchStart && (
        <MatchModal
          user={user}
          startedAt={matchStart}
          onCancel={onMatchCancel}
          characters={characters}
        />
      )}
      {matchSuccess && (
        <MatchSuccessModal
          startedAt={matchSuccess.startedAt}
          audioSettings={audioSettings}
          onComplete={onMatchSuccessComplete}
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
          onSelectCharacterMusic={selectCharacterMusic}
          onApplyDecoration={applyStoneDecoration}
        />
      )}
      {showResume && user && (
        <ResumeModal
          user={user}
          records={replayRecords}
          characterListView={characterListView}
          onClose={() => setShowResume(false)}
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
          visualTheme={visualTheme}
          setVisualTheme={setVisualTheme}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showMessageBoard && (
        <MessageBoardModal
          token={token}
          onSubmitted={onMessageSubmitted}
          onClose={() => setShowMessageBoard(false)}
        />
      )}
    </>
  );
}
