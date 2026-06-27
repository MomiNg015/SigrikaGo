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

const SIGRIKA_ERASE_IMPACT_PROGRESS = 0.58;

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
  const erasedBoundaries = useMemo(
    () => erasedBoundaryGeometry(game.points, boardSize),
    [boardSize, game.points]
  );
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
  const pendingRowSlashPointIds = useMemo(() => new Set(
    skillEffectsEnabled !== false
      && game.pendingSkill?.effectsEnabled !== false
      && game.pendingSkill?.effectType === "row-slash"
      && Array.isArray(game.pendingSkill.affectedPointIds)
      ? game.pendingSkill.affectedPointIds
      : []
  ), [
    game.pendingSkill?.affectedPointIds,
    game.pendingSkill?.effectType,
    game.pendingSkill?.effectsEnabled,
    skillEffectsEnabled
  ]);
  const pendingErasePointIds = useMemo(() => {
    if (
      skillEffectsEnabled === false
      || game.pendingSkill?.effectsEnabled === false
      || game.pendingSkill?.effectType !== "erase-point"
    ) {
      return new Set();
    }
    const pointIds = Array.isArray(game.pendingSkill.affectedPointIds) && game.pendingSkill.affectedPointIds.length
      ? game.pendingSkill.affectedPointIds
      : [game.pendingSkill.targetId].filter(Boolean);
    return new Set(pointIds);
  }, [
    game.pendingSkill?.affectedPointIds,
    game.pendingSkill?.effectType,
    game.pendingSkill?.effectsEnabled,
    game.pendingSkill?.targetId,
    skillEffectsEnabled
  ]);
  const voyageStarCraterPointIds = useMemo(() => new Set(
    (game.history ?? [])
      .filter((entry) => entry?.type === "skill" && entry.effectType === "voyage-star" && entry.id)
      .map((entry) => entry.id)
  ), [game.history]);
  const voyageStarCraterMarkers = useMemo(() => {
    const pointById = new Map(game.points.map((point) => [point.id, point]));
    const markerIds = new Set([
      ...voyageStarCraterPointIds,
      ...game.points
        .filter((point) => point.skillEffect === "voyage-star-crater-point")
        .map((point) => point.id)
    ]);
    return [...markerIds].flatMap((pointIdValue) => {
      const point = pointById.get(pointIdValue) ?? pointFromId(pointIdValue);
      if (!point) return [];
      return [{
        id: pointIdValue,
        x: `${((point.x + 0.5) / boardSize) * 100}%`,
        y: `${((point.y + 0.5) / boardSize) * 100}%`
      }];
    });
  }, [boardSize, game.points, voyageStarCraterPointIds]);
  const pendingLibertyPurgeStone = useMemo(() => {
    if (
      skillEffectsEnabled === false
      || game.pendingSkill?.effectsEnabled === false
      || game.pendingSkill?.effectType !== "liberty-purge"
      || !game.pendingSkill?.targetId
      || !isPlayerColor(game.pendingSkill?.color)
    ) {
      return null;
    }
    return {
      pointId: game.pendingSkill.targetId,
      color: game.pendingSkill.color
    };
  }, [
    game.pendingSkill?.color,
    game.pendingSkill?.effectType,
    game.pendingSkill?.effectsEnabled,
    game.pendingSkill?.targetId,
    skillEffectsEnabled
  ]);
  const skillBannerDurationMs = Number(game.pendingSkill?.bannerDurationMs ?? 2000);
  const skillBoardEffectDurationMs = Number(game.pendingSkill?.boardEffectDurationMs ?? 1800);
  const rowSlashEffectsEnabled = skillEffectsEnabled !== false && game.pendingSkill?.effectsEnabled !== false;
  const eraseImpactMarkerDelayMs = Math.round(
    skillBannerDurationMs + skillBoardEffectDurationMs * SIGRIKA_ERASE_IMPACT_PROGRESS
  );
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
        "--skill-banner-duration": `${skillBannerDurationMs}ms`,
        "--skill-board-effect-duration": `${skillBoardEffectDurationMs}ms`,
        "--erase-impact-marker-delay": `${eraseImpactMarkerDelayMs}ms`
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
        <BoardErasedBoundaryOverlay geometry={erasedBoundaries} />
        <BoardSkillEffects
          boardSize={boardSize}
          pendingSkill={game.pendingSkill}
          audioSettings={audioSettings}
          prewarm={game.skillEnabled !== false && skillEffectsEnabled !== false}
          effectsEnabled={skillEffectsEnabled !== false && game.pendingSkill?.effectsEnabled !== false}
        />
        <BoardRowSlashOverlay
          boardSize={boardSize}
          rowEffects={game.rowEffects}
          pendingSkill={game.pendingSkill}
          effectsEnabled={rowSlashEffectsEnabled}
          boardEffectDurationMs={skillBoardEffectDurationMs}
        />
        {game.points.map((point) => {
          const emptyTerritoryOwner = !point.stone ? territoryOwner.get(point.id) : null;
          const deadOwner = point.stone ? deadStoneOwners[point.id] : null;
          const previewClass = canPreviewPoint(game, previewPlayer, point, pendingSkill, Boolean(onScoringPoint)) ? "previewable" : "";
          const pendingLibertyPurgeColor = pendingLibertyPurgeStone?.pointId === point.id ? pendingLibertyPurgeStone.color : "";
          const decorationColor = point.stone ?? pendingLibertyPurgeColor;
          const decorationImage = isPlayerColor(decorationColor)
            ? stoneDecorationImage(stoneDecorations[decorationColor], decorationColor)
            : null;
          const confirmClass = pointConfirmation?.pointId === point.id ? "touch-confirming" : "";
          const pendingEffectClasses = [
            pendingSprayPointIds.has(point.id) ? "spray-transform-pending" : "",
            pendingRowSlashPointIds.has(point.id) && point.stone ? "row-slash-cut-pending" : ""
          ].filter(Boolean).join(" ");
          const pendingEffectStyle = pendingRowSlashPointIds.has(point.id) && point.stone
            ? {
                "--row-slash-cut-delay": `${Math.round(
                  420 + (point.x / Math.max(1, boardSize - 1)) * 300
                )}ms`
              }
            : undefined;
          return (
            <MemoPointButton
              key={point.id}
              boardSize={boardSize}
              canMarkNeutral={game.phase === "marking-dead"}
              confirmClass={confirmClass}
              deadOwner={deadOwner}
              decorationImage={decorationImage}
              emptyTerritoryOwner={emptyTerritoryOwner}
              eraseImpactPending={point.valid && pendingErasePointIds.has(point.id)}
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
              pendingLibertyPurgeColor={pendingLibertyPurgeColor}
              pendingEffectClass={pendingEffectClasses}
              pendingEffectStyle={pendingEffectStyle}
              previewClass={previewClass}
              showMoves={showMoves}
              showScoringMarks={showScoringMarks}
              voyageStarCraterMarked={voyageStarCraterPointIds.has(point.id)}
              winningLineMarked={gomokuWinningLineIds.has(point.id)}
            />
          );
        })}
        {voyageStarCraterMarkers.map((marker) => (
          <span
            key={`voyage-star-crater-${marker.id}`}
            className="voyage-star-crater-mark"
            style={{
              "--voyage-star-crater-x": marker.x,
              "--voyage-star-crater-y": marker.y
            }}
            aria-hidden="true"
          />
        ))}
      </div>
      {showCoords && <div className="coord-col coord-right">{rows.map((label) => <span key={label}>{label}</span>)}</div>}
      {showCoords && <div className="coord-row coord-bottom">{labels.map((label) => <span key={label}>{label}</span>)}</div>}
    </div>
  );
}

function BoardErasedBoundaryOverlay({ geometry }) {
  if (!geometry?.cells?.length && !geometry?.lines?.length) return null;
  return (
    <svg className="erased-boundary-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {geometry.cells.map((cell) => (
        <rect
          key={cell.key}
          className="erased-boundary-cell"
          data-erased-point-id={cell.pointId}
          x={cell.x}
          y={cell.y}
          width={cell.width}
          height={cell.height}
        />
      ))}
      {geometry.lines.map((line) => (
        <line
          key={line.key}
          className="erased-boundary-line"
          data-erased-point-id={line.pointId}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
        />
      ))}
    </svg>
  );
}

export function erasedBoundaryGeometry(points = [], boardSize = 13) {
  const size = Math.max(1, Number(boardSize) || 13);
  const cells = new Map();

  for (const point of points) {
    if (point?.valid !== false) continue;
    const x = Number(point.x);
    const y = Number(point.y);
    if (!Number.isInteger(x) || !Number.isInteger(y)) continue;

    for (const [cellX, cellY] of [
      [x - 1, y - 1],
      [x, y - 1],
      [x - 1, y],
      [x, y]
    ]) {
      if (cellX < 0 || cellY < 0 || cellX >= size - 1 || cellY >= size - 1) continue;
      const key = `cell-${cellX}-${cellY}`;
      if (!cells.has(key)) {
        const x1 = boardCoordinate(cellX, size);
        const y1 = boardCoordinate(cellY, size);
        cells.set(key, {
          key,
          pointId: point.id,
          x: x1,
          y: y1,
          width: roundBoardNumber(boardCoordinate(cellX + 1, size) - x1),
          height: roundBoardNumber(boardCoordinate(cellY + 1, size) - y1)
        });
      }
    }
  }

  return {
    cells: [...cells.values()],
    lines: erasedBoundaryOutline([...cells.values()], size)
  };
}

function erasedBoundaryOutline(cells, size) {
  const cellSet = new Set(cells.map((cell) => cell.key));
  const horizontal = new Map();
  const vertical = new Map();

  for (const cell of cells) {
    const [, xValue, yValue] = cell.key.split("-");
    const x = Number(xValue);
    const y = Number(yValue);
    if (!Number.isInteger(x) || !Number.isInteger(y)) continue;
    if (!cellSet.has(`cell-${x}-${y - 1}`)) addOutlineSegment(horizontal, y, x, x + 1, cell.pointId);
    if (!cellSet.has(`cell-${x}-${y + 1}`)) addOutlineSegment(horizontal, y + 1, x, x + 1, cell.pointId);
    if (!cellSet.has(`cell-${x - 1}-${y}`)) addOutlineSegment(vertical, x, y, y + 1, cell.pointId);
    if (!cellSet.has(`cell-${x + 1}-${y}`)) addOutlineSegment(vertical, x + 1, y, y + 1, cell.pointId);
  }

  return [
    ...mergedOutlineSegments(horizontal, "h", size),
    ...mergedOutlineSegments(vertical, "v", size)
  ];
}

function addOutlineSegment(groups, fixed, start, end, pointIdValue) {
  const group = groups.get(fixed) ?? [];
  group.push({ start, end, pointId: pointIdValue });
  groups.set(fixed, group);
}

function mergedOutlineSegments(groups, axis, size) {
  const lines = [];
  for (const [fixed, segments] of groups.entries()) {
    const sorted = [...segments].sort((a, b) => a.start - b.start || a.end - b.end);
    let current = null;
    for (const segment of sorted) {
      if (!current) {
        current = { ...segment };
        continue;
      }
      if (segment.start <= current.end) {
        current.end = Math.max(current.end, segment.end);
        continue;
      }
      lines.push(outlineLine(axis, fixed, current, size));
      current = { ...segment };
    }
    if (current) lines.push(outlineLine(axis, fixed, current, size));
  }
  return lines.sort((a, b) => a.key.localeCompare(b.key));
}

function outlineLine(axis, fixed, segment, size) {
  const key = `line-${axis}-${fixed}-${segment.start}-${segment.end}`;
  return axis === "h"
    ? {
        key,
        pointId: segment.pointId,
        x1: boardCoordinate(segment.start, size),
        y1: boardCoordinate(fixed, size),
        x2: boardCoordinate(segment.end, size),
        y2: boardCoordinate(fixed, size)
      }
    : {
        key,
        pointId: segment.pointId,
        x1: boardCoordinate(fixed, size),
        y1: boardCoordinate(segment.start, size),
        x2: boardCoordinate(fixed, size),
        y2: boardCoordinate(segment.end, size)
      };
}

function boardCoordinate(value, size) {
  return roundBoardNumber(((value + 0.5) / size) * 100);
}

function roundBoardNumber(value) {
  return Math.round(value * 10000) / 10000;
}

function BoardRowSlashOverlay({
  boardSize,
  rowEffects = [],
  pendingSkill = null,
  effectsEnabled = true,
  boardEffectDurationMs = 1800
}) {
  const pendingRow = rowSlashPendingRow(pendingSkill);
  const castDelayMs = Math.round(Number(boardEffectDurationMs) * 0.19);
  const castDurationMs = Math.round(Number(boardEffectDurationMs) * 0.22);
  const pendingEffect = effectsEnabled !== false && Number.isInteger(pendingRow)
    ? {
        effectType: "row-slash",
        owner: pendingSkill.color,
        y: pendingRow,
        id: pendingSkill.targetId ?? pendingSkill.id ?? "pending",
        casting: true,
        castDelayMs,
        castDurationMs
      }
    : null;
  const effects = [
    ...(pendingEffect ? [pendingEffect] : []),
    ...(Array.isArray(rowEffects)
      ? rowEffects.filter((effect) => !pendingEffect || effect?.effectType !== "row-slash" || effect.y !== pendingEffect.y)
      : [])
  ].filter((effect) => effect?.effectType === "row-slash" && Number.isInteger(effect.y));
  if (!effects.length) return null;
  return (
    <div className="board-row-effects" aria-hidden="true">
      {effects.map((effect, index) => (
        <span
          key={`${effect.owner ?? "preview"}-${effect.y}-${effect.id ?? index}`}
          className={`board-row-slash ${effect.casting ? "casting" : ""}`}
          style={{
            "--row-y": `${((effect.y + 0.5) / boardSize) * 100}%`,
            ...(effect.casting
              ? {
                  "--row-slash-cast-delay": `${effect.castDelayMs}ms`,
                  "--row-slash-cast-duration": `${effect.castDurationMs}ms`
                }
              : {})
          }}
        />
      ))}
    </div>
  );
}

function rowSlashPendingRow(pendingSkill) {
  if (pendingSkill?.effectType !== "row-slash") return null;
  if (Number.isInteger(pendingSkill.row)) return pendingSkill.row;
  const row = Number(String(pendingSkill.targetId ?? "").split(",")[1]);
  return Number.isInteger(row) ? row : null;
}

function PointButton({
  boardSize,
  canMarkNeutral,
  confirmClass,
  deadOwner,
  decorationImage,
  emptyTerritoryOwner,
  eraseImpactPending,
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
  pendingLibertyPurgeColor,
  pendingEffectClass,
  pendingEffectStyle,
  previewClass,
  showMoves,
  showScoringMarks,
  voyageStarCraterMarked,
  winningLineMarked
}) {
  const hiddenClass = point.hiddenHand
    ? point.hiddenHand.exposed ? "hidden-hand exposed-hidden-hand" : "hidden-hand"
    : "";
  const displayStone = point.stone ?? pendingLibertyPurgeColor;
  const isVoyageStarErasedPoint = point.skillEffect === "voyage-star-erased-point" || point.skillEffect === "voyage-star-crater-point";
  const isVoyageStarCraterPoint = point.skillEffect === "voyage-star-crater-point" || voyageStarCraterMarked;
  const pendingLibertyPurgeClass = pendingLibertyPurgeColor ? "liberty-purge-stone liberty-purge-pending" : "";
  const skillEffectClass = [point.skillEffect ?? "", pendingLibertyPurgeClass].filter(Boolean).join(" ");
  const offsetPoint = pendingEffectClass === "spray-transform-pending"
    ? { ...point, stone: "spray" }
    : displayStone ? { ...point, stone: displayStone } : point;
  const stoneOffset = displayStone ? stoneOffsetForPoint(offsetPoint, gameMode) : null;
  const stoneStyle = displayStone
    ? {
        "--stone-offset-x": `${stoneOffset.x}px`,
        "--stone-offset-y": `${stoneOffset.y}px`,
        ...(pendingEffectStyle ?? {}),
        ...(decorationImage ? { "--stone-decoration-image": `url("${decorationImage}")` } : {})
      }
    : undefined;

  return (
    <button
      className={`point ${point.valid ? "" : "erased"} ${displayStone ?? ""} ${hiddenClass} ${skillEffectClass} ${pendingEffectClass} ${previewClass} ${confirmClass} ${isStar ? "star" : ""} ${winningLineMarked ? "gomoku-winning-line" : ""}`}
      data-point-id={point.id}
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
      {displayStone && (
        <span
          className={`stone ${decorationImage ? "decorated-stone" : ""} ${pendingLibertyPurgeColor ? "liberty-purge-pending-stone" : ""}`}
          style={stoneStyle}
        >
          {markedActionId === point.id && <i />}
          {showMoves && moveNumber !== null && <b>{moveNumber}</b>}
        </span>
      )}
      {!point.valid && !isVoyageStarErasedPoint && <span className="void" />}
      {eraseImpactPending && <span className="void erase-impact-pending" aria-hidden="true" />}
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

const MemoPointButton = memo(PointButton, arePointButtonPropsEqual);

export function arePointButtonPropsEqual(previous, next) {
  return previous.boardSize === next.boardSize
    && previous.canMarkNeutral === next.canMarkNeutral
    && previous.confirmClass === next.confirmClass
    && previous.deadOwner === next.deadOwner
    && previous.decorationImage === next.decorationImage
    && previous.emptyTerritoryOwner === next.emptyTerritoryOwner
    && previous.eraseImpactPending === next.eraseImpactPending
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
    && previous.pendingLibertyPurgeColor === next.pendingLibertyPurgeColor
    && previous.pendingEffectClass === next.pendingEffectClass
    && samePendingEffectStyle(previous.pendingEffectStyle, next.pendingEffectStyle)
    && previous.previewClass === next.previewClass
    && previous.showMoves === next.showMoves
    && previous.showScoringMarks === next.showScoringMarks
    && previous.voyageStarCraterMarked === next.voyageStarCraterMarked
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

function samePendingEffectStyle(previous, next) {
  return (previous?.["--row-slash-cut-delay"] ?? "") === (next?.["--row-slash-cut-delay"] ?? "");
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

function pointFromId(pointIdValue) {
  const [x, y] = String(pointIdValue ?? "").split(",").map(Number);
  if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
  return { id: pointIdValue, x, y };
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
