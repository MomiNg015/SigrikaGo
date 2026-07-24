import { useCallback, useEffect, useRef, useState } from "react";
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

export default function RoomScreen({ room, user, token, characters, replayStep, setReplayStep, pendingSkill, setPendingSkill, mobileBackRequestId = 0, audioSettings, siteSettings, onOpenSettings, onOpenMessageBoard, onBack, onGameAction, onCountingRequest, onCountingRespond, onDrawRequest, onDrawRespond, onScoringAction, onOpenReplay, onToast }) {
  const [showCoords, setShowCoords] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);
  const handledMobileBackRequestIdRef = useRef(mobileBackRequestId);
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
    roomViewStatus,
    scoring,
    setSpectatorStep,
    setViewColor,
    skillAvailable,
    skillUsesBoardConfirmation,
    skillUsesBoardSurfaceConfirmation,
    skillPreview,
    viewColor,
    winnerColor
  } = useRoomBoardView({ room, user, replayStep });
  const showCloseCountdown = shouldShowRoomCloseCountdown(displayRoom);
  const skillBanner = skillPreview
    ? {
        ...skillPreview,
        costumeSnapshot: skillPreview.costumeSnapshot
          ?? displayRoom.players.find((player) => player.color === skillPreview.color)?.costumeSnapshot
          ?? null
      }
    : null;
  const useMobileLayout = useMobileRoomLayout();
  const { roomRequestToast, handleTimedRequestAction } = useTimedRoomRequestToast({
    room: displayRoom,
    userId: user.id,
    isReplay,
    role,
    onCountingRespond,
    onDrawRespond,
    onScoringAction
  });
  const { handleBoardSurface, handlePoint, handleScoringPoint, pointConfirmation } = useRoomPointActions({
    canConfirmSkillPoint,
    displayRoom,
    isReplay,
    me,
    pendingSkill,
    role,
    setPendingSkill,
    skillUsesBoardConfirmation,
    skillUsesBoardSurfaceConfirmation,
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
  useDoubleMoveToast({ room: displayRoom, showToast: onToast, isReplay });

  const requestResignConfirm = useCallback(() => {
    if (displayRoom.game.phase === "finished") return;
    setConfirmAction({
      title: "确认认输",
      message: "是否认输？",
      confirmText: "认输",
      onConfirm: () => onGameAction({ type: "resign" })
    });
  }, [displayRoom.game.phase, onGameAction]);

  const requestPassConfirm = useCallback(() => {
    if (displayRoom.game.phase !== "playing") return;
    setConfirmAction({
      title: "确认弃手",
      message: "是否弃一手",
      confirmText: "弃手",
      onConfirm: () => onGameAction({ type: "pass" })
    });
  }, [displayRoom.game.phase, onGameAction]);

  const requestExitConfirm = useCallback(() => {
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
  }, [displayRoom.game.phase, onBack, onGameAction, role]);
  useEffect(() => {
    if (mobileBackRequestId === handledMobileBackRequestIdRef.current) return;
    handledMobileBackRequestIdRef.current = mobileBackRequestId;
    requestExitConfirm();
  }, [mobileBackRequestId, requestExitConfirm]);
  const toggleCoords = useCallback(() => {
    setShowCoords((current) => !current);
  }, []);

  const Layout = useMobileLayout ? MobileRoomLayout : DesktopRoomLayout;
  const battleLayoutClassName = useMobileLayout ? "mobile-battle-layout" : "battle-layout";

  return (
    <Layout>
      <RoomHeader
        room={displayRoom}
        roomGameInfo={roomGameInfo}
        showCloseCountdown={showCloseCountdown}
        showCoords={showCoords}
        onOpenMessageBoard={onOpenMessageBoard}
        onOpenSettings={onOpenSettings}
        onBack={requestExitConfirm}
        onToggleCoords={toggleCoords}
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
        handleBoardSurface={handleBoardSurface}
        handleScoringPoint={handleScoringPoint}
        hasAnyStones={hasAnyStones}
        isLiveSpectator={isLiveSpectator}
        isReplay={isReplay}
        liveStep={liveStep}
        me={me}
        onBack={requestExitConfirm}
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
        roomViewStatus={roomViewStatus}
        scoring={scoring}
        setPendingSkill={setPendingSkill}
        setReplayStep={setReplayStep}
        setSpectatorStep={setSpectatorStep}
        setViewColor={setViewColor}
        showCoords={showCoords}
        showMoves={false}
        skillAvailable={skillAvailable}
        skillPreview={skillPreview}
        skillEffectsEnabled={siteSettings?.skillEffectsEnabled !== false}
        token={token}
        user={user}
        viewColor={viewColor}
        winnerColor={winnerColor}
      />
      {roomRequestToast && (
        <TimedRoomRequestToast
          toast={roomRequestToast}
          onAction={handleTimedRequestAction}
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
      {skillBanner && <SkillBanner banner={skillBanner} characters={characters} audioSettings={audioSettings} />}
    </Layout>
  );
}

function useDoubleMoveToast({ room, showToast, isReplay }) {
  const lastToastKeyRef = useRef("");
  useEffect(() => {
    if (isReplay || typeof showToast !== "function") return;
    const extraTurn = room.game.extraTurn;
    if (extraTurn?.effectType !== "double-move") {
      lastToastKeyRef.current = "";
      return;
    }
    const total = Number(extraTurn.remaining ?? 0) + Number(extraTurn.used ?? 0);
    const current = Number(extraTurn.used ?? 0) + 1;
    const key = `${room.code}:${extraTurn.owner}:${extraTurn.used}:${extraTurn.remaining}:${room.game.moveNumber}`;
    if (lastToastKeyRef.current === key) return;
    lastToastKeyRef.current = key;
    showToast(`长离·谋定后动：第 ${current}/${total} 手`, "info");
  }, [isReplay, room.code, room.game.extraTurn, room.game.moveNumber, showToast]);
}

export {
  effectiveRoomRole,
  roomCloseCountdownText,
  roomGameInfoForPlayers,
  shouldPlayGameStartVoice,
  shouldShowRoomCloseCountdown
} from "./roomState.js";
