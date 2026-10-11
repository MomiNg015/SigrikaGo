import { useCallback, useState } from "react";
import ActionBar from "./ActionBar.jsx";
import { isCaptureChallenge } from "../shared/captureChallenge.js";
import Board from "./Board.jsx";
import ChatBox from "./ChatBox.jsx";
import PlayerInfo from "./PlayerInfo.jsx";
import SpectatorGallery, { useSpectatorPresence } from "./SpectatorGallery.jsx";
import { useRoomProfiles } from "./useRoomProfiles.jsx";
import { useMobileDockBaseline } from "./layout/useMobileDockBaseline.js";
import { aemeathRainbowMoveEffectForRoom, stoneDecorationsForRoom } from "./roomView.js";
import { effectiveSkillDisplayForPlayer, effectiveSkillUsesForColor } from "../shared/derivedSkills.js";

const ROOM_FLOATING_LAYER_BASE_Z = 140;

export default function RoomBattleStage({
  battleLayoutClassName,
  audioSettings,
  actionPanelOverride,
  boardStep,
  canSwitchView,
  characters,
  displayRoom,
  handleBoardSurface,
  handlePoint,
  handleScoringPoint,
  hasAnyStones,
  isLiveSpectator,
  isReplay,
  liveStep,
  me,
  onCountingRequest,
  onDrawRequest,
  onOpenReplay,
  onPass,
  onResign,
  onScoringAction,
  opponent,
  opponentConnected,
  pendingSkill,
  pointConfirmation,
  role,
  roomViewStatus,
  scoring,
  setPendingSkill,
  setReplayStep,
  setSpectatorStep,
  setViewColor,
  showCoords,
  showMoves,
  skillAvailable,
  skillEffectsEnabled = true,
  skillPreview,
  showPeoplePanel = true,
  showTutorialLog = false,
  tutorialTargetPointId = "",
  tutorialAnyBoardTarget = false,
  token,
  user,
  viewColor,
  winnerColor,
  sigrikaCandyDuel = false
}) {
  const { viewportRef, dockRef, tabsRef, actionsRef } = useMobileDockBaseline(battleLayoutClassName === "mobile-battle-layout");
  const presenceEnabled = showPeoplePanel && !isReplay;
  const spectators = useSpectatorPresence(displayRoom);
  const { openProfile, profileLayer } = useRoomProfiles({ roomKey: displayRoom.code, user, token, characters, onOpenReplay });
  const openUser = presenceEnabled && token ? openProfile : undefined;
  const gallery = presenceEnabled && <SpectatorGallery key={displayRoom.code} entries={spectators} characters={characters} onOpenUser={openProfile} />;
  const [floatingLayers, setFloatingLayers] = useState({});
  const bringFloatingLayerToFront = useCallback((layerId) => {
    if (!layerId) return;
    setFloatingLayers({ [layerId]: ROOM_FLOATING_LAYER_BASE_Z + 1 });
  }, []);
  const handleNeutralPoint = useCallback((id) => {
    onScoringAction({ type: "mark-neutral", pointId: id });
  }, [onScoringAction]);
  const handleStoryLogFloatingLayer = useCallback(() => {
    bringFloatingLayerToFront("story-log");
  }, [bringFloatingLayerToFront]);
  const handleConfirmScoring = useCallback(() => {
    onScoringAction({ type: "confirm-dead" });
  }, [onScoringAction]);
  const handleResetScoring = useCallback(() => {
    onScoringAction({ type: "reset-dead" });
  }, [onScoringAction]);
  const selfPlayer = me ?? displayRoom.players[0];
  const selfSkill = effectiveSkillDisplayForPlayer(displayRoom.game, selfPlayer);
  const selfSkillEnabled = displayRoom.game.skillEnabled !== false && Boolean(selfSkill);
  const isPlaying = displayRoom.game.phase === "playing";
  const isFinished = displayRoom.game.phase === "finished";
  const isMobileBattleLayout = battleLayoutClassName === "mobile-battle-layout";
  const aemeathRainbowMoveEffect = aemeathRainbowMoveEffectForRoom(displayRoom);
  const opponentInfo = (
    <PlayerInfo
      player={opponent}
      game={displayRoom.game}
      characters={characters}
      align="opponent"
      viewColor={viewColor}
      canSwitchView={canSwitchView}
      onViewColor={setViewColor}
      isWinner={isFinished && opponent?.color === winnerColor}
      isActiveTurn={isPlaying && opponent?.color === displayRoom.game.turn}
      isDrawResult={isFinished && !winnerColor}
      floatingLayerId={`skill-${opponent?.color ?? "opponent"}`}
      floatingLayerZ={floatingLayers[`skill-${opponent?.color ?? "opponent"}`]}
      onFloatingLayerRequest={bringFloatingLayerToFront}
      onOpenUser={openUser}
      sigrikaCandyDuel={sigrikaCandyDuel}
    />
  );
  const boardPanel = (
    <div className="board-stage">
      <Board
        game={displayRoom.game}
        showCoords={showCoords}
        showMoves={showMoves}
        pendingSkill={pendingSkill}
        audioSettings={audioSettings}
        skillEffectsEnabled={skillEffectsEnabled}
        pointConfirmation={pointConfirmation}
        previewPlayer={role === "player" ? me : null}
        stoneDecorations={stoneDecorationsForRoom(displayRoom)}
        aemeathRainbowMoveEffect={aemeathRainbowMoveEffect}
        tutorialTargetPointId={tutorialTargetPointId}
        tutorialAnyBoardTarget={tutorialAnyBoardTarget}
        onPoint={handlePoint}
        onScoringPoint={displayRoom.game.phase === "marking-dead" ? handleScoringPoint : null}
        onNeutral={handleNeutralPoint}
        onBoardSurface={handleBoardSurface}
      />
    </div>
  );
  const defaultActionPanel = (
    <ActionBar
      role={role}
      mode={displayRoom.game.mode}
      phase={displayRoom.game.phase}
      me={me}
      isMyTurn={Boolean(me && displayRoom.game.turn === me.color)}
      pendingSkill={pendingSkill}
      setPendingSkill={setPendingSkill}
      skillLocked={Boolean(skillPreview)}
      skillActionLocked={Boolean(skillPreview || displayRoom.game.extraTurn)}
      decisionLocked={Boolean(skillPreview || displayRoom.game.extraTurn)}
      skillEnabled={!sigrikaCandyDuel && selfSkillEnabled}
      skillName={selfSkill?.name}
      skillUses={selfPlayer ? effectiveSkillUsesForColor(displayRoom.game, selfPlayer.color) : 0}
      skillAvailable={skillAvailable}
      countingEnabled={!sigrikaCandyDuel && !isCaptureChallenge(displayRoom)}
      hasAnyStones={hasAnyStones}
      opponentConnected={opponentConnected}
      scoring={scoring}
      replayStep={boardStep ?? liveStep}
      replayMax={liveStep}
      replayMode={roomViewStatus?.controlMode ?? (isReplay ? "replay" : "spectator")}
      onReplayStep={isReplay ? setReplayStep : isLiveSpectator ? setSpectatorStep : null}
            drawEnabled={!sigrikaCandyDuel && !isCaptureChallenge(displayRoom)}
      onPass={onPass}
      onCountingRequest={onCountingRequest}
      onDrawRequest={onDrawRequest}
      onConfirmScoring={handleConfirmScoring}
      onResetScoring={handleResetScoring}
      onResign={onResign}
    />
  );
  const actionPanel = actionPanelOverride ?? defaultActionPanel;
  const selfInfo = (
    <PlayerInfo
      player={selfPlayer}
      game={displayRoom.game}
      characters={characters}
      align="self"
      viewColor={viewColor}
      canSwitchView={canSwitchView}
      onViewColor={setViewColor}
      isWinner={isFinished && selfPlayer?.color === winnerColor}
      isActiveTurn={isPlaying && selfPlayer?.color === displayRoom.game.turn}
      isDrawResult={isFinished && !winnerColor}
      isSkillTargeting={Boolean(pendingSkill && role === "player")}
      floatingLayerId={`skill-${selfPlayer?.color ?? "self"}`}
      floatingLayerZ={floatingLayers[`skill-${selfPlayer?.color ?? "self"}`]}
      onFloatingLayerRequest={bringFloatingLayerToFront}
      onOpenUser={openUser}
      sigrikaCandyDuel={sigrikaCandyDuel}
    />
  );
  const storyLogPanel = (showTutorialLog || sigrikaCandyDuel) && (
    <ChatBox
      room={displayRoom}
      readonly
      disabledInputMessage={sigrikaCandyDuel ? "特殊对局仅显示系统记录" : "剧情教学记录仅供查看"}
      compactMessages
      label={sigrikaCandyDuel ? "系统记录" : "剧情记录"}
      mobileDockPopup={isMobileBattleLayout}
      floatingLayerZ={floatingLayers["story-log"]}
      onFloatingLayerRequest={handleStoryLogFloatingLayer}
    />
  );

  if (isMobileBattleLayout) {
    return (
      <section ref={viewportRef} className="mobile-room-viewport mobile-battle-layout" data-action-anchored data-spectator-layout={presenceEnabled ? "" : undefined}>
        <div className="mobile-player-slot mobile-opponent-slot opponent-side">{opponentInfo}</div>
        <div className="mobile-board-viewport mobile-board-slot board-column">{boardPanel}</div>
        <div className="mobile-player-slot mobile-self-slot room-side">{selfInfo}</div>
        {gallery}
        <section ref={dockRef} className="mobile-room-dock room-direct-actions" aria-label="对局功能">
          {storyLogPanel && <div ref={tabsRef} className="room-story-log-entry">{storyLogPanel}</div>}
          <div ref={actionsRef} id="mobile-room-panel-actions" className="mobile-tab-panel"><div className="mobile-action-panel">{actionPanel}</div></div>
        </section>
        {profileLayer}
      </section>
    );
  }

  return (
    <section className={`${battleLayoutClassName} room-presence-layout`}>
      <div className="opponent-side">
        {opponentInfo}
      </div>
      <div className="board-column">
        {boardPanel}
        {actionPanel}
      </div>
      <div className="room-side">
        {selfInfo}
        {storyLogPanel}
      </div>
      {gallery}
      {profileLayer}
    </section>
  );
}
