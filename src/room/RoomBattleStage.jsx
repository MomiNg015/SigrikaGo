import { useCallback, useRef, useState } from "react";
import ActionBar from "./ActionBar.jsx";
import Board from "./Board.jsx";
import ChatBox from "./ChatBox.jsx";
import OperationHint from "./OperationHint.jsx";
import PlayerInfo from "./PlayerInfo.jsx";
import RoomPeopleList from "./RoomPeopleList.jsx";
import { stoneDecorationsForRoom } from "./roomView.js";

const SHOW_TEST_TOOLS = import.meta.env.DEV && import.meta.env.VITE_ENABLE_TEST_TOOLS === "true";
const ROOM_FLOATING_LAYER_BASE_Z = 90;

export default function RoomBattleStage({
  battleLayoutClassName,
  audioSettings,
  boardStep,
  canSwitchView,
  characters,
  displayRoom,
  drawRequest,
  handleBoardSurface,
  handlePoint,
  handleScoringPoint,
  hasAnyStones,
  isLiveSpectator,
  isReplay,
  liveStep,
  me,
  onBack,
  onChat,
  onCountingRequest,
  onCountingRespond,
  onDrawRequest,
  onDrawRespond,
  onGameAction,
  onOpenReplay,
  onPass,
  onResign,
  onScoringAction,
  opponent,
  opponentConnected,
  pendingSkill,
  pointConfirmation,
  role,
  scoring,
  setPendingSkill,
  setReplayStep,
  setSpectatorStep,
  setViewColor,
  showCoords,
  showMoves,
  skillAvailable,
  skillPreview,
  token,
  user,
  viewColor,
  winnerColor
}) {
  const [activeMobilePanel, setActiveMobilePanel] = useState("actions");
  const layerCounterRef = useRef(ROOM_FLOATING_LAYER_BASE_Z);
  const [floatingLayers, setFloatingLayers] = useState({});
  const bringFloatingLayerToFront = useCallback((layerId) => {
    if (!layerId) return;
    const nextZ = layerCounterRef.current + 1;
    layerCounterRef.current = nextZ;
    setFloatingLayers((current) => ({ ...current, [layerId]: nextZ }));
  }, []);
  const selfPlayer = me ?? displayRoom.players[0];
  const isPlaying = displayRoom.game.phase === "playing";
  const isFinished = displayRoom.game.phase === "finished";
  const isMobileBattleLayout = battleLayoutClassName === "mobile-battle-layout";
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
    />
  );
  const membersPanel = !isReplay && (
    <RoomPeopleList
      room={displayRoom}
      user={user}
      characters={characters}
      token={token}
      onOpenReplay={onOpenReplay}
      floatingLayerZ={floatingLayers.members}
      onFloatingLayerRequest={() => bringFloatingLayerToFront("members")}
    />
  );
  const hintPanel = !isReplay && role === "player" && (
    <OperationHint room={displayRoom} user={user} scoring={scoring} drawRequest={drawRequest} />
  );
  const boardPanel = (
    <div className="board-stage">
      <Board
        game={displayRoom.game}
        showCoords={showCoords}
        showMoves={showMoves}
        pendingSkill={pendingSkill}
        audioSettings={audioSettings}
        pointConfirmation={pointConfirmation}
        previewPlayer={role === "player" ? me : null}
        stoneDecorations={stoneDecorationsForRoom(displayRoom)}
        onPoint={handlePoint}
        onScoringPoint={displayRoom.game.phase === "marking-dead" ? handleScoringPoint : null}
        onNeutral={(id) => onScoringAction({ type: "mark-neutral", pointId: id })}
        onBoardSurface={handleBoardSurface}
      />
    </div>
  );
  const actionPanel = (
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
      skillEnabled={displayRoom.game.skillEnabled !== false}
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
      onPass={onPass}
      onCountingRequest={onCountingRequest}
      onCountingRespond={onCountingRespond}
      onDrawRequest={onDrawRequest}
      onDrawRespond={onDrawRespond}
      onConfirmScoring={() => onScoringAction({ type: "confirm-dead" })}
      onResetScoring={() => onScoringAction({ type: "reset-dead" })}
      onAcceptResult={() => onScoringAction({ type: "accept-result" })}
      onRejectResult={() => onScoringAction({ type: "reject-result" })}
      onResign={onResign}
    />
  );
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
    />
  );
  const chatPanel = (
    <ChatBox
      room={displayRoom}
      onChat={onChat}
      readonly={isReplay}
      floatingLayerZ={floatingLayers.chat}
      onFloatingLayerRequest={() => bringFloatingLayerToFront("chat")}
    />
  );

  if (isMobileBattleLayout) {
    const panels = [
      { id: "actions", label: "操作", content: <div className="mobile-action-panel">{hintPanel}{actionPanel}</div> },
      membersPanel && { id: "members", label: "成员", content: membersPanel },
      { id: "chat", label: "聊天", content: chatPanel }
    ].filter(Boolean);
    const selectedPanel = panels.find((panel) => panel.id === activeMobilePanel) ?? panels[0];

    return (
      <section className="mobile-room-viewport mobile-battle-layout">
        <div className="mobile-player-slot mobile-opponent-slot opponent-side">{opponentInfo}</div>
        <div className="mobile-board-viewport mobile-board-slot board-column">{boardPanel}</div>
        <div className="mobile-player-slot mobile-self-slot room-side">{selfInfo}</div>
        {selectedPanel && (
          <section className="mobile-room-dock mobile-room-tabs" aria-label="对局功能">
            <div className="mobile-tab-list" role="tablist">
              {panels.map((panel) => (
                <button
                  key={panel.id}
                  type="button"
                  className={panel.id === selectedPanel.id ? "mobile-tab-button active" : "mobile-tab-button"}
                  role="tab"
                  aria-label={panel.label}
                  aria-selected={panel.id === selectedPanel.id}
                  aria-controls={`mobile-room-panel-${panel.id}`}
                  id={`mobile-room-tab-${panel.id}`}
                  onClick={() => setActiveMobilePanel(panel.id)}
                >
                  {panel.label}
                </button>
              ))}
            </div>
            <div
              className="mobile-tab-panel"
              role="tabpanel"
              id={`mobile-room-panel-${selectedPanel.id}`}
              aria-labelledby={`mobile-room-tab-${selectedPanel.id}`}
            >
              {selectedPanel.content}
            </div>
          </section>
        )}
      </section>
    );
  }

  return (
    <section className={battleLayoutClassName}>
      <div className="opponent-side">
        {opponentInfo}
        {membersPanel}
        {hintPanel}
      </div>
      <div className="board-column">
        {boardPanel}
        {actionPanel}
      </div>
      <div className="room-side">
        {selfInfo}
        {chatPanel}
      </div>
    </section>
  );
}
