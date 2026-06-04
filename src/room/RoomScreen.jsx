import { useEffect, useState } from "react";
import { GAME_PHASES } from "../shared/game.js";
import { ConfirmModal } from "../modals/FeedbackModals.jsx";
import { OpeningModal } from "../modals/GameLifecycleModals.jsx";
import SkillBanner from "../modals/SkillBanner.jsx";
import ActionBar from "./ActionBar.jsx";
import Board from "./Board.jsx";
import ChatBox from "./ChatBox.jsx";
import OperationHint from "./OperationHint.jsx";
import PlayerInfo from "./PlayerInfo.jsx";
import RoomPeopleList from "./RoomPeopleList.jsx";
import { stoneDecorationsForRoom } from "./roomView.js";
import { useRoomPointActions } from "./actions/useRoomPointActions.js";
import { useRoomAudioEffects } from "./audio/useRoomAudioEffects.js";
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

const SHOW_TEST_TOOLS = import.meta.env.DEV;
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
        onToggleCoords={() => setShowCoords(!showCoords)}
        onToggleMoves={() => setShowMoves(!showMoves)}
      />
      <section className={battleLayoutClassName}>
        <div className="opponent-side">
          <PlayerInfo
            player={opponent}
            game={displayRoom.game}
            characters={characters}
            align="opponent"
            viewColor={viewColor}
            canSwitchView={canSwitchView}
            onViewColor={setViewColor}
            isWinner={displayRoom.game.phase === "finished" && opponent?.color === winnerColor}
            isActiveTurn={displayRoom.game.phase === "playing" && opponent?.color === displayRoom.game.turn}
            isDrawResult={displayRoom.game.phase === "finished" && !winnerColor}
          />
          {!isReplay && <RoomPeopleList room={displayRoom} user={user} characters={characters} token={token} onOpenReplay={onOpenReplay} />}
          {!isReplay && role === "player" && <OperationHint room={displayRoom} user={user} scoring={scoring} drawRequest={drawRequest} />}
        </div>
        <div className="board-column">
          <div className="board-stage">
            <Board
              game={displayRoom.game}
              showCoords={showCoords}
              showMoves={showMoves}
              pendingSkill={pendingSkill}
              pointConfirmation={pointConfirmation}
              previewPlayer={role === "player" ? me : null}
              stoneDecorations={stoneDecorationsForRoom(displayRoom)}
              onPoint={handlePoint}
              onScoringPoint={displayRoom.game.phase === "marking-dead" ? handleScoringPoint : null}
              onNeutral={(id) => onScoringAction({ type: "mark-neutral", pointId: id })}
            />
          </div>
          <ActionBar
            role={role}
            phase={displayRoom.game.phase}
            me={me}
            isMyTurn={Boolean(me && displayRoom.game.turn === me.color)}
            pendingSkill={pendingSkill}
            setPendingSkill={setPendingSkill}
            skillLocked={Boolean(skillPreview)}
            skillUses={me ? displayRoom.game.skillUses[me.color] ?? 0 : 0}
            skillAvailable={skillAvailable}
            hasAnyStones={hasAnyStones}
            opponentConnected={opponentConnected}
            scoring={scoring}
            drawRequest={drawRequest}
            drawDeadline={displayRoom.drawDeadline ?? drawRequest?.deadline}
            countingDeadline={displayRoom.countingDeadline ?? scoring?.deadline}
            resultDeadline={displayRoom.resultDeadline ?? scoring?.resultDeadline}
            replayStep={boardStep ?? liveStep}
            replayMax={liveStep}
            onReplayStep={isReplay ? setReplayStep : isLiveSpectator ? setSpectatorStep : null}
            showTestTools={SHOW_TEST_TOOLS}
            onTestRandomLayout={() => onGameAction({ type: "test-random-layout" })}
            onTestRestoreSkill={() => onGameAction({ type: "test-restore-skill" })}
            onTestEnterByoYomi={() => onGameAction({ type: "test-enter-byo-yomi" })}
            onPass={() => onGameAction({ type: "pass" })}
            onCountingRequest={onCountingRequest}
            onCountingRespond={onCountingRespond}
            onDrawRequest={onDrawRequest}
            onDrawRespond={onDrawRespond}
            onConfirmScoring={() => onScoringAction({ type: "confirm-dead" })}
            onResetScoring={() => onScoringAction({ type: "reset-dead" })}
            onAcceptResult={() => onScoringAction({ type: "accept-result" })}
            onRejectResult={() => onScoringAction({ type: "reject-result" })}
            onResign={requestResignConfirm}
            onBack={requestExitConfirm}
          />
        </div>
        <div className="room-side">
          <PlayerInfo
            player={me ?? displayRoom.players[0]}
            game={displayRoom.game}
            characters={characters}
            align="self"
            viewColor={viewColor}
            canSwitchView={canSwitchView}
            onViewColor={setViewColor}
            isWinner={displayRoom.game.phase === "finished" && (me ?? displayRoom.players[0])?.color === winnerColor}
            isActiveTurn={displayRoom.game.phase === "playing" && (me ?? displayRoom.players[0])?.color === displayRoom.game.turn}
            isDrawResult={displayRoom.game.phase === "finished" && !winnerColor}
            isSkillTargeting={Boolean(pendingSkill && role === "player")}
          />
          <ChatBox room={displayRoom} onChat={onChat} readonly={isReplay} />
        </div>
      </section>
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
