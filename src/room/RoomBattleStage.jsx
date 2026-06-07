import ActionBar from "./ActionBar.jsx";
import Board from "./Board.jsx";
import ChatBox from "./ChatBox.jsx";
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
  const selfPlayer = me ?? displayRoom.players[0];
  const isPlaying = displayRoom.game.phase === "playing";
  const isFinished = displayRoom.game.phase === "finished";

  return (
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
          isWinner={isFinished && opponent?.color === winnerColor}
          isActiveTurn={isPlaying && opponent?.color === displayRoom.game.turn}
          isDrawResult={isFinished && !winnerColor}
        />
        {!isReplay && (
          <RoomPeopleList
            room={displayRoom}
            user={user}
            characters={characters}
            token={token}
            onOpenReplay={onOpenReplay}
          />
        )}
        {!isReplay && role === "player" && (
          <OperationHint room={displayRoom} user={user} scoring={scoring} drawRequest={drawRequest} />
        )}
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
          onResign={onResign}
          onBack={onBack}
        />
      </div>
      <div className="room-side">
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
        <ChatBox room={displayRoom} onChat={onChat} readonly={isReplay} />
      </div>
    </section>
  );
}
