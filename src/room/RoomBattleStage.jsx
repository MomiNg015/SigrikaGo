import { useState } from "react";
import ActionBar from "./ActionBar.jsx";
import Board from "./Board.jsx";
import ChatBox from "./ChatBox.jsx";
import { DoorOpen } from "lucide-react";
import OperationHint from "./OperationHint.jsx";
import PlayerInfo from "./PlayerInfo.jsx";
import RoomPeopleList from "./RoomPeopleList.jsx";
import { stoneDecorationsForRoom } from "./roomView.js";

const SHOW_TEST_TOOLS = import.meta.env.DEV && import.meta.env.VITE_ENABLE_TEST_TOOLS === "true";

export default function RoomBattleStage({
  battleLayoutClassName,
  boardStep,
  canSwitchView,
  characters,
  displayRoom,
  drawRequest,
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
    />
  );
  const membersPanel = !isReplay && (
    <RoomPeopleList
      room={displayRoom}
      user={user}
      characters={characters}
      token={token}
      onOpenReplay={onOpenReplay}
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
        pointConfirmation={pointConfirmation}
        previewPlayer={role === "player" ? me : null}
        stoneDecorations={stoneDecorationsForRoom(displayRoom)}
        onPoint={handlePoint}
        onScoringPoint={displayRoom.game.phase === "marking-dead" ? handleScoringPoint : null}
        onNeutral={(id) => onScoringAction({ type: "mark-neutral", pointId: id })}
      />
    </div>
  );
  const actionPanel = (
    <ActionBar
      role={role}
      phase={displayRoom.game.phase}
      me={me}
      isMyTurn={Boolean(me && displayRoom.game.turn === me.color)}
      pendingSkill={pendingSkill}
      setPendingSkill={setPendingSkill}
      skillLocked={Boolean(skillPreview)}
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
      onBack={onBack}
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
    />
  );
  const chatPanel = (
    <ChatBox
      room={displayRoom}
      onChat={onChat}
      readonly={isReplay}
      trailingAction={isMobileBattleLayout ? null : (
        <button type="button" className="chat-exit-action exit-action" onClick={onBack}>
          <DoorOpen size={18} />
          <span>退出房间</span>
        </button>
      )}
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
