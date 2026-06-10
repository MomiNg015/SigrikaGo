import AdminConsole from "../admin/AdminConsole.jsx";
import AuthScreen from "../auth/AuthScreen.jsx";
import HomeScreen from "../home/HomeScreen.jsx";
import RoomScreen from "../room/RoomScreen.jsx";
import AssetPreloadScreen from "./AssetPreloadScreen.jsx";
import { planRoomBackNavigation } from "./roomNavigation.js";

export default function AppRoutes({
  adminTab,
  assetProgress,
  audioSettings,
  characters,
  emitGame,
  emitScoring,
  lobbyStats,
  logout,
  onAuth,
  onCountingRespond,
  onCountingRequest,
  onDrawRequest,
  onDrawRespond,
  onOpenAdminReplay,
  onOpenReplay,
  onRefreshCharacters,
  onSiteSettingsChanged,
  onToast,
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
  setShowHouse,
  setShowLeaderboard,
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
  updateUser,
  user,
  view
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
      onOpenHouse={() => setShowHouse(true)}
      onOpenResume={() => setShowResume(true)}
      onOpenWarehouse={() => setShowWarehouse(true)}
      onOpenLeaderboard={() => setShowLeaderboard(true)}
      onOpenWatch={() => setShowWatch(true)}
      onOpenShop={() => setShowShop(true)}
      onOpenFriends={() => setShowFriends(true)}
      onOpenSettings={() => setShowSettings(true)}
      onOpenMessageBoard={() => setShowMessageBoard(true)}
      onOpenAdmin={() => setView("admin")}
    />
  );

  return (
    <>
      {view === "login" && <AuthScreen onAuth={onAuth} />}
      {view === "preloading" && <AssetPreloadScreen progress={assetProgress} />}
      {view === "home" && homeScreen}
      {view === "admin" && user?.role === "admin" && (
        <AdminConsole
          user={user}
          token={token}
          tab={adminTab}
          setTab={setAdminTab}
          onCurrentUserChange={updateUser}
          onCharactersChanged={onRefreshCharacters}
          onSiteSettingsChanged={onSiteSettingsChanged}
          onNotice={onToast}
          onBack={() => setView("home")}
          onOpenReplay={onOpenAdminReplay}
        />
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
        />
      )}
    </>
  );
}
