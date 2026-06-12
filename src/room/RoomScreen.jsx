import { useEffect, useState } from "react";
import { GAME_PHASES } from "../shared/game.js";
import { ConfirmModal } from "../modals/FeedbackModals.jsx";
import { OpeningModal } from "../modals/GameLifecycleModals.jsx";
import SkillBanner from "../modals/SkillBanner.jsx";
import { useRoomPointActions } from "./actions/useRoomPointActions.js";
import { useRoomAudioEffects } from "./audio/useRoomAudioEffects.js";
import RoomBattleStage from "./RoomBattleStage.jsx";
import RoomHeader from "./header/RoomHeader.jsx";
import { DesktopRoomLayout, MOBILE_ROOM_MEDIA_QUERY, MobileRoomLayout, useMobileRoomLayout } from "./layout/RoomLayouts.jsx";
import TimedRoomRequestToast from "./requestToasts/TimedRoomRequestToast.jsx";
import { useTimedRoomRequestToast } from "./requestToasts/useTimedRoomRequestToast.js";
import {
  effectiveRoomRole,
  roomCloseCountdownText,
  roomGameInfoForPlayers,
  shouldPlayGameStartVoice,
  shouldShowRoomCloseCountdown
} from "./roomState.js";
import { useRoomBoardView } from "./view/useRoomBoardView.js";

export { MOBILE_ROOM_MEDIA_QUERY };

export default function RoomScreen({ room, user, token, characters, replayStep, setReplayStep, pendingSkill, setPendingSkill, audioSettings, onOpenSettings, onOpenMessageBoard, onBack, onGameAction, onCountingRequest, onCountingRespond, onDrawRequest, onDrawRespond, onScoringAction, onChat, onOpenReplay }) {
  const [showCoords, setShowCoords] = useState(true);
  const [showMoves, setShowMoves] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const {
    activePlayer,
    boardStep,
    canConfirmSkillPoint,
    canSwitchView,
    displayRoom,
    drawRequest,
    hasAnyStones,
    isLiveSpectator,
    isReplay,
    liveStep,
    me,
    opponent,
    opponentConnected,
    role,
    roomGameInfo,
    scoring,
    setSpectatorStep,
    setViewColor,
    skillAvailable,
    skillUsesBoardConfirmation,
    skillPreview,
    viewColor,
    winnerColor
  } = useRoomBoardView({ room, user, replayStep });
  const [closeCountdownNow, setCloseCountdownNow] = useState(Date.now());
  const showCloseCountdown = shouldShowRoomCloseCountdown(displayRoom);
  const useMobileLayout = useMobileRoomLayout();
  const { roomRequestToast, handleTimedRequestAction, closeTimedRequestToast } = useTimedRoomRequestToast({
    room: displayRoom,
    userId: user.id,
    isReplay,
    role,
    onCountingRespond,
    onDrawRespond,
    onScoringAction
  });
  const { handlePoint, handleScoringPoint, pointConfirmation } = useRoomPointActions({
    canConfirmSkillPoint,
    displayRoom,
    isReplay,
    me,
    pendingSkill,
    role,
    setPendingSkill,
    skillUsesBoardConfirmation,
    skillPreview,
    onGameAction,
    onScoringAction
  });

  useRoomAudioEffects({
    activePlayer,
    audioSettings,
    characters,
    displayRoom,
    isReplay,
    me,
    replayStep,
    role,
    room
  });

  useEffect(() => {
    if (!showCloseCountdown) return undefined;
    setCloseCountdownNow(Date.now());
    const timerId = setInterval(() => setCloseCountdownNow(Date.now()), 1000);
    return () => clearInterval(timerId);
  }, [showCloseCountdown, displayRoom.closesAt]);

  function requestResignConfirm() {
    if (displayRoom.game.phase === "finished") return;
    setConfirmAction({
      title: "确认认输",
      message: "是否认输？",
      confirmText: "认输",
      onConfirm: () => onGameAction({ type: "resign" })
    });
  }

  function requestPassConfirm() {
    if (displayRoom.game.phase !== "playing") return;
    setConfirmAction({
      title: "确认弃手",
      message: "是否弃一手",
      confirmText: "弃手",
      onConfirm: () => onGameAction({ type: "pass" })
    });
  }

  function requestExitConfirm() {
    if (displayRoom.game.phase !== "finished" && role === "player") {
      setConfirmAction({
        title: "退出房间",
        message: "对局还没结束，是否认输并退出房间？",
        confirmText: "认输并退出",
        onConfirm: () => {
          onGameAction({ type: "resign" });
          onBack();
        }
      });
      return;
    }
    onBack();
  }

  const Layout = useMobileLayout ? MobileRoomLayout : DesktopRoomLayout;
  const battleLayoutClassName = useMobileLayout ? "mobile-battle-layout" : "battle-layout";

  return (
    <Layout>
      <RoomHeader
        closeCountdownNow={closeCountdownNow}
        isReplay={isReplay}
        room={displayRoom}
        roomGameInfo={roomGameInfo}
        showCloseCountdown={showCloseCountdown}
        showCoords={showCoords}
        showMoves={showMoves}
        onOpenMessageBoard={onOpenMessageBoard}
        onOpenSettings={onOpenSettings}
        onBack={requestExitConfirm}
        onToggleCoords={() => setShowCoords(!showCoords)}
        onToggleMoves={() => setShowMoves(!showMoves)}
      />
      <RoomBattleStage
        battleLayoutClassName={battleLayoutClassName}
        audioSettings={audioSettings}
        boardStep={boardStep}
        canSwitchView={canSwitchView}
        characters={characters}
        displayRoom={displayRoom}
        drawRequest={drawRequest}
        handlePoint={handlePoint}
        handleScoringPoint={handleScoringPoint}
        hasAnyStones={hasAnyStones}
        isLiveSpectator={isLiveSpectator}
        isReplay={isReplay}
        liveStep={liveStep}
        me={me}
        onBack={requestExitConfirm}
        onChat={onChat}
        onCountingRequest={onCountingRequest}
        onCountingRespond={onCountingRespond}
        onDrawRequest={onDrawRequest}
        onDrawRespond={onDrawRespond}
        onGameAction={onGameAction}
        onOpenReplay={onOpenReplay}
        onPass={requestPassConfirm}
        onResign={requestResignConfirm}
        onScoringAction={onScoringAction}
        opponent={opponent}
        opponentConnected={opponentConnected}
        pendingSkill={pendingSkill}
        pointConfirmation={pointConfirmation}
        role={role}
        scoring={scoring}
        setPendingSkill={setPendingSkill}
        setReplayStep={setReplayStep}
        setSpectatorStep={setSpectatorStep}
        setViewColor={setViewColor}
        showCoords={showCoords}
        showMoves={showMoves}
        skillAvailable={skillAvailable}
        skillPreview={skillPreview}
        token={token}
        user={user}
        viewColor={viewColor}
        winnerColor={winnerColor}
      />
      {roomRequestToast && (
        <TimedRoomRequestToast
          toast={roomRequestToast}
          onAction={handleTimedRequestAction}
          onClose={closeTimedRequestToast}
        />
      )}
      {confirmAction && (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmText={confirmAction.confirmText}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            const action = confirmAction.onConfirm;
            setConfirmAction(null);
            action();
          }}
        />
      )}
      {!isReplay && displayRoom.game.phase === GAME_PHASES.opening && (
        <OpeningModal room={displayRoom} player={me} />
      )}
      {skillPreview && <SkillBanner banner={skillPreview} characters={characters} audioSettings={audioSettings} />}
    </Layout>
  );
}

export {
  effectiveRoomRole,
  roomCloseCountdownText,
  roomGameInfoForPlayers,
  shouldPlayGameStartVoice,
  shouldShowRoomCloseCountdown
} from "./roomState.js";
