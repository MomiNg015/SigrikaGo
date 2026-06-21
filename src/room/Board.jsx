import { memo, useMemo, useRef } from "react";
import { COLORS, isPlayerColor } from "../shared/game.js";
import { lastMarkedAction } from "../shared/boardView.js";
import { stoneDecorationImage } from "../shared/stoneDecorations.js";
import BoardAmbientEffects, { hasColorIllusionFog } from "./BoardAmbientEffects.jsx";
import BoardSkillEffects from "./BoardSkillEffects.jsx";
import {
  buildBoardLines,
  canPreviewPoint,
  coordLabel,
  coordLetter,
  isStarPoint
} from "./roomView.js";

function Board({
  game,
  showCoords,
  showMoves,
  pendingSkill,
  audioSettings,
  skillEffectsEnabled = true,
  pointConfirmation,
  previewPlayer,
  stoneDecorations = {},
  onPoint,
  onScoringPoint,
  onNeutral,
  onBoardSurface
}) {
  const pointerTypeRef = useRef("");
  const handlersRef = useRef({ onPoint, onScoringPoint, onNeutral, onBoardSurface });
  handlersRef.current = { onPoint, onScoringPoint, onNeutral, onBoardSurface };
  const boardSize = game.size ?? 13;
  const colorIllusionActive = hasColorIllusionFog(game) && skillEffectsEnabled !== false;
  const markedAction = lastMarkedAction(game.history);
  const moveNumbers = useMemo(
    () => new Map(game.history.filter((entry) => entry.type === "move").map((entry) => [entry.id, entry.moveNumber])),
    [game.history]
  );
  const labels = useMemo(() => Array.from({ length: boardSize }, (_, index) => coordLetter(index)), [boardSize]);
  const rows = useMemo(() => Array.from({ length: boardSize }, (_, index) => boardSize - index), [boardSize]);
  const lines = useMemo(() => buildBoardLines(game.points), [game.points]);
  const libertyPurgeMarkIds = useMemo(() => new Set(
    (game.libertyPurgeMarks ?? []).flatMap((mark) => Array.isArray(mark.pointIds) ? mark.pointIds : [])
  ), [game.libertyPurgeMarks]);
  const gomokuWinningLineIds = useMemo(() => new Set(
    game.mode === "gomoku" && game.winner?.reason === "gomoku-five" && Array.isArray(game.winner.winningLine)
      ? game.winner.winningLine
      : []
  ), [game.mode, game.winner?.reason, game.winner?.winningLine]);
  const pendingSprayPointIds = useMemo(() => new Set(
    game.pendingSkill?.effectType === "spray-stone" && Array.isArray(game.pendingSkill.affectedPointIds)
      ? game.pendingSkill.affectedPointIds
      : []
  ), [game.pendingSkill?.affectedPointIds, game.pendingSkill?.effectType]);
  const showScoringMarks = ["marking-dead", "result-review", "finished"].includes(game.phase);
  const territoryOwner = useMemo(() => new Map([
    ...(showScoringMarks ? game.scoring?.territory?.black ?? [] : []).map((id) => [id, COLORS.black]),
    ...(showScoringMarks ? game.scoring?.territory?.white ?? [] : []).map((id) => [id, COLORS.white])
  ]), [game.scoring?.territory?.black, game.scoring?.territory?.white, showScoringMarks]);
  const deadStoneOwners = showScoringMarks ? game.scoring?.deadStoneOwners ?? {} : {};
  return (
    <div
      className={`board-wrap ${pendingSkill ? "targeting" : ""} ${colorIllusionActive ? "color-illusion-board-surface" : ""}`}
      data-board-size={boardSize}
      style={{
        "--size": boardSize,
        "--skill-banner-duration": `${game.pendingSkill?.bannerDurationMs ?? 2000}ms`,
        "--skill-board-effect-duration": `${game.pendingSkill?.boardEffectDurationMs ?? 1800}ms`
      }}
    >
      {showCoords && <div className="coord-row coord-top">{labels.map((label) => <span key={label}>{label}</span>)}</div>}
      {showCoords && <div className="coord-col coord-left">{rows.map((label) => <span key={label}>{label}</span>)}</div>}
      <div
        className="board"
        onClick={() => {
          handlersRef.current.onBoardSurface?.({ pointerType: pointerTypeRef.current });
          pointerTypeRef.current = "";
        }}
      >
        <BoardAmbientEffects active={colorIllusionActive} effectsEnabled={skillEffectsEnabled} />
        <svg className="board-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {lines.map((line) => (
            <line
              key={line.key}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              className={line.edge ? "edge-line" : undefined}
            />
          ))}
        </svg>
        <BoardSkillEffects
          boardSize={boardSize}
          pendingSkill={game.pendingSkill}
          audioSettings={audioSettings}
          prewarm={game.skillEnabled !== false && skillEffectsEnabled !== false}
          effectsEnabled={skillEffectsEnabled !== false && game.pendingSkill?.effectsEnabled !== false}
        />
        <BoardRowSlashOverlay
          boardSize={boardSize}
          pendingSkill={game.pendingSkill}
          rowEffects={game.rowEffects}
        />
        {game.points.map((point) => {
          const emptyTerritoryOwner = !point.stone ? territoryOwner.get(point.id) : null;
          const deadOwner = point.stone ? deadStoneOwners[point.id] : null;
          const previewClass = canPreviewPoint(game, previewPlayer, point, pendingSkill, Boolean(onScoringPoint)) ? "previewable" : "";
          const decorationImage = isPlayerColor(point.stone) ? stoneDecorationImage(stoneDecorations[point.stone], point.stone) : null;
          const confirmClass = pointConfirmation?.pointId === point.id ? "touch-confirming" : "";
          return (
            <MemoPointButton
              key={point.id}
              boardSize={boardSize}
              canMarkNeutral={game.phase === "marking-dead"}
              confirmClass={confirmClass}
              deadOwner={deadOwner}
              decorationImage={decorationImage}
              emptyTerritoryOwner={emptyTerritoryOwner}
              gameMode={game.mode}
              handlersRef={handlersRef}
              hasScoringPoint={Boolean(onScoringPoint)}
              isStar={isStarPoint(point.x, point.y, boardSize)}
              libertyPurgeMarked={libertyPurgeMarkIds.has(point.id)}
              markedActionId={markedAction?.id ?? ""}
              moveNumber={showMoves ? moveNumbers.get(point.id) ?? null : null}
              neutralMarked={showScoringMarks && Boolean(game.scoring?.neutralPoints?.includes(point.id))}
              point={point}
              pointerTypeRef={pointerTypeRef}
              pendingEffectClass={pendingSprayPointIds.has(point.id) ? "spray-transform-pending" : ""}
              previewClass={previewClass}
              showMoves={showMoves}
              showScoringMarks={showScoringMarks}
              winningLineMarked={gomokuWinningLineIds.has(point.id)}
            />
          );
        })}
      </div>
      {showCoords && <div className="coord-col coord-right">{rows.map((label) => <span key={label}>{label}</span>)}</div>}
      {showCoords && <div className="coord-row coord-bottom">{labels.map((label) => <span key={label}>{label}</span>)}</div>}
    </div>
  );
}

function BoardRowSlashOverlay({ boardSize, pendingSkill = null, rowEffects = [] }) {
  const pendingRow = pendingSkill?.effectType === "row-slash" ? rowForSlash(pendingSkill) : null;
  const effects = [
    ...(Array.isArray(rowEffects) ? rowEffects : []),
    ...(Number.isInteger(pendingRow) ? [{ effectType: "row-slash", y: pendingRow, preview: true }] : [])
  ].filter((effect) => effect?.effectType === "row-slash" && Number.isInteger(effect.y));
  if (!effects.length) return null;
  return (
    <div className="board-row-effects" aria-hidden="true">
      {effects.map((effect, index) => (
        <span
          key={`${effect.owner ?? "preview"}-${effect.y}-${index}`}
          className={`board-row-slash ${effect.preview ? "preview" : ""}`}
          style={{ "--row-y": `${((effect.y + 0.5) / boardSize) * 100}%` }}
        />
      ))}
    </div>
  );
}

function PointButton({
  boardSize,
  canMarkNeutral,
  confirmClass,
  deadOwner,
  decorationImage,
  emptyTerritoryOwner,
  gameMode,
  handlersRef,
  hasScoringPoint,
  isStar,
  libertyPurgeMarked,
  markedActionId,
  moveNumber,
  neutralMarked,
  point,
  pointerTypeRef,
  pendingEffectClass,
  previewClass,
  showMoves,
  showScoringMarks,
  winningLineMarked
}) {
  const hiddenClass = point.hiddenHand
    ? point.hiddenHand.exposed ? "hidden-hand exposed-hidden-hand" : "hidden-hand"
    : "";
  const skillEffectClass = point.skillEffect ?? "";
  const stoneOffset = point.stone ? stoneOffsetForPoint(point, gameMode) : null;
  const stoneStyle = point.stone
    ? {
        "--stone-offset-x": `${stoneOffset.x}px`,
        "--stone-offset-y": `${stoneOffset.y}px`,
        ...(decorationImage ? { "--stone-decoration-image": `url("${decorationImage}")` } : {})
      }
    : undefined;

  return (
    <button
      className={`point ${point.valid ? "" : "erased"} ${point.stone ?? ""} ${hiddenClass} ${skillEffectClass} ${pendingEffectClass} ${previewClass} ${confirmClass} ${isStar ? "star" : ""} ${winningLineMarked ? "gomoku-winning-line" : ""}`}
      style={{ gridColumn: point.x + 1, gridRow: point.y + 1 }}
      onPointerDown={(event) => {
        pointerTypeRef.current = event.pointerType;
        if (!hasScoringPoint) return;
        event.preventDefault();
        event.stopPropagation();
        handlersRef.current.onScoringPoint?.(point);
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (!hasScoringPoint) {
          handlersRef.current.onPoint(point, { pointerType: pointerTypeRef.current });
          pointerTypeRef.current = "";
        }
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        if (canMarkNeutral) handlersRef.current.onNeutral(point.id);
      }}
      title={coordLabel(point.x, point.y, boardSize)}
    >
      {point.stone && (
        <span
          className={`stone ${decorationImage ? "decorated-stone" : ""}`}
          style={stoneStyle}
        >
          {markedActionId === point.id && <i />}
          {showMoves && moveNumber !== null && <b>{moveNumber}</b>}
        </span>
      )}
      {!point.valid && <span className="void" />}
      {emptyTerritoryOwner && <span className={`territory-mark ${emptyTerritoryOwner}`} aria-label={`${emptyTerritoryOwner} territory`} />}
      {deadOwner && <span className={`dead-mark ${deadOwner}`} aria-label={`${deadOwner} dead-stone mark`} />}
      {neutralMarked && <span className="neutral-mark" aria-label="neutral point" />}
      {point.protocolBan && (
        <span
          className={`protocol-ban-mark ${point.protocolBan.bannedColor}`}
          aria-label={`${point.protocolBan.bannedColor} protocol ban`}
        />
      )}
      {point.skillEffect === "blast-marker" && <span className="skill-effect-marker blast" aria-hidden="true" />}
      {libertyPurgeMarked && <span className="liberty-purge-removal-mark" aria-label="liberty purge removal" />}
      {confirmClass && <span className="touch-confirm-marker" aria-hidden="true" />}
    </button>
  );
}

function rowForSlash(pendingSkill) {
  if (Number.isInteger(pendingSkill?.row)) return pendingSkill.row;
  const [, y] = String(pendingSkill?.targetId ?? "").split(",").map(Number);
  return Number.isInteger(y) ? y : null;
}

const MemoPointButton = memo(PointButton, arePointButtonPropsEqual);

export function arePointButtonPropsEqual(previous, next) {
  return previous.boardSize === next.boardSize
    && previous.canMarkNeutral === next.canMarkNeutral
    && previous.confirmClass === next.confirmClass
    && previous.deadOwner === next.deadOwner
    && previous.decorationImage === next.decorationImage
    && previous.emptyTerritoryOwner === next.emptyTerritoryOwner
    && previous.gameMode === next.gameMode
    && previous.handlersRef === next.handlersRef
    && previous.hasScoringPoint === next.hasScoringPoint
    && previous.isStar === next.isStar
    && previous.libertyPurgeMarked === next.libertyPurgeMarked
    && previous.markedActionId === next.markedActionId
    && previous.moveNumber === next.moveNumber
    && previous.neutralMarked === next.neutralMarked
    && previous.point === next.point
    && previous.pointerTypeRef === next.pointerTypeRef
    && previous.pendingEffectClass === next.pendingEffectClass
    && previous.previewClass === next.previewClass
    && previous.showMoves === next.showMoves
    && previous.showScoringMarks === next.showScoringMarks
    && previous.winningLineMarked === next.winningLineMarked;
}

export function areBoardPropsEqual(previous, next) {
  return previous.game === next.game
    && previous.showCoords === next.showCoords
    && previous.showMoves === next.showMoves
    && previous.pendingSkill === next.pendingSkill
    && previous.audioSettings === next.audioSettings
    && previous.skillEffectsEnabled === next.skillEffectsEnabled
    && samePointConfirmation(previous.pointConfirmation, next.pointConfirmation)
    && samePreviewPlayer(previous.previewPlayer, next.previewPlayer)
    && previous.onPoint === next.onPoint
    && previous.onScoringPoint === next.onScoringPoint
    && previous.onNeutral === next.onNeutral
    && previous.onBoardSurface === next.onBoardSurface
    && Boolean(previous.onScoringPoint) === Boolean(next.onScoringPoint)
    && Boolean(previous.onBoardSurface) === Boolean(next.onBoardSurface)
    && sameStoneDecorations(previous.stoneDecorations, next.stoneDecorations);
}

export function stoneOffsetForPoint(point, mode = "spark") {
  const maxOffset = mode === "standard" ? 0.5 : 1;
  const directions = [
    { x: -1, y: -1 },
    { x: 0, y: -1 },
    { x: 1, y: -1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: -1, y: 1 },
    { x: 0, y: 1 },
    { x: 1, y: 1 }
  ];
  const index = stableHash(`${point.id}:${point.stone ?? ""}`) % directions.length;
  return {
    x: directions[index].x * maxOffset,
    y: directions[index].y * maxOffset
  };
}

function stableHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function samePointConfirmation(previous, next) {
  if (!previous || !next) return previous === next;
  return previous.pointId === next.pointId && previous.actionType === next.actionType;
}

function sameStoneDecorations(previous = {}, next = {}) {
  return previous.black === next.black && previous.white === next.white;
}

function samePreviewPlayer(previous, next) {
  if (!previous || !next) return previous === next;
  return previous.color === next.color
    && previous.characterId === next.characterId
    && previous.character?.skill === next.character?.skill;
}

export default memo(Board, areBoardPropsEqual);
