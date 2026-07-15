import { useEffect, useRef, useState } from "react";
import { COLORS, canStartSkill, gameViewForColor } from "../../shared/game.js";
import { effectiveSkillConfigForPlayer } from "../../shared/derivedSkills.js";
import { skillUsesBoardConfirmation, skillUsesBoardSurfaceConfirmation } from "../../shared/gameSkills.js";
import { canPreviewPoint, replayGameAt, replayRoomAt } from "../roomView.js";
import { effectiveRoomRole, roomGameInfoForPlayers } from "../roomState.js";

export function useRoomBoardView({ room, user, replayStep }) {
  const [spectatorStep, setSpectatorStep] = useState(null);
  const [viewColor, setViewColor] = useState(COLORS.black);
  const liveStepRef = useRef(room.game.history.length);
  const isReplay = replayStep !== null;
  const liveStep = room.game.history.length;
  const effectiveRole = effectiveRoomRole(room, isReplay);
  const isLiveSpectator = effectiveRole === "spectator" && !isReplay;
  const effectiveSpectatorStep = spectatorStep ?? liveStep;
  const boardStep = isReplay ? replayStep : isLiveSpectator ? effectiveSpectatorStep : null;
  const liveSpectatorGame = liveSpectatorGameForColor(room, viewColor);
  const hasServerSpectatorView = viewColor === COLORS.black || Boolean(room.gameViews?.[viewColor]);
  const rawBoardGame = boardStep == null || boardStep >= liveStep
    ? isLiveSpectator ? liveSpectatorGame : room.game
    : replayGameAt(room, boardStep);
  const boardGame = (isReplay || isLiveSpectator) && !(isLiveSpectator && boardStep >= liveStep && hasServerSpectatorView)
    ? gameViewForColor(rawBoardGame, viewColor)
    : rawBoardGame;
  const displayRoom = isReplay ? replayRoomAt(room, replayStep, viewColor) : isLiveSpectator ? { ...room, game: boardGame } : room;
  const role = effectiveRoomRole(displayRoom, isReplay);
  const blackPlayer = displayRoom.players.find((p) => p.color === COLORS.black);
  const whitePlayer = displayRoom.players.find((p) => p.color === COLORS.white);
  const roomGameInfo = roomGameInfoForPlayers(blackPlayer, whitePlayer, displayRoom.game.moveNumber);
  const me = role === "spectator" ? blackPlayer : displayRoom.players.find((p) => p.user.id === user.id);
  const opponent = role === "spectator" ? whitePlayer : displayRoom.players.find((p) => p.user.id !== user.id) ?? displayRoom.players[1];
  const activePlayer = displayRoom.players.find((p) => p.color === displayRoom.game.turn);
  const scoring = displayRoom.game.scoring;
  const drawRequest = displayRoom.game.drawRequest;
  const hasAnyStones = displayRoom.game.points.some((point) => Boolean(point.stone));
  const skillConfig = effectiveSkillConfigForPlayer(displayRoom.game, me);
  const skillAvailable = me ? canStartSkill(displayRoom.game, skillConfig) : true;
  const usesBoardConfirmation = me ? skillUsesBoardConfirmation(skillConfig) : false;
  const usesBoardSurfaceConfirmation = me ? skillUsesBoardSurfaceConfirmation(skillConfig) : false;
  const opponentConnected = role !== "player" || opponent?.connected !== false;
  const winnerColor = displayRoom.game.winner?.winnerColor ?? displayRoom.game.winner?.color;
  const skillPreview = displayRoom.game.pendingSkill;
  const canSwitchView = role === "spectator";
  const roomViewStatus = roomViewStatusFor({
    isReplay,
    isLiveSpectator,
    boardStep,
    liveStep,
    viewColor
  });

  useEffect(() => {
    if (!isLiveSpectator) {
      liveStepRef.current = liveStep;
      return;
    }
    setSpectatorStep((current) => {
      const wasFollowingLive = current == null || current >= liveStepRef.current;
      liveStepRef.current = liveStep;
      if (wasFollowingLive) return liveStep;
      return Math.min(current, liveStep);
    });
  }, [isLiveSpectator, liveStep, room.code]);

  return {
    activePlayer,
    blackPlayer,
    boardStep,
    canConfirmSkillPoint: (point) => canPreviewPoint(displayRoom.game, me, point, true, false),
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
    skillUsesBoardConfirmation: usesBoardConfirmation,
    skillUsesBoardSurfaceConfirmation: usesBoardSurfaceConfirmation,
    skillPreview,
    viewColor,
    whitePlayer,
    winnerColor
  };
}

export function liveSpectatorGameForColor(room, color) {
  if (color === COLORS.black) return room.game;
  return room.gameViews?.[color] ?? room.game;
}

export function roomViewStatusFor({ isReplay, isLiveSpectator, boardStep, liveStep, viewColor }) {
  const viewpoint = viewColor === COLORS.white ? "白方" : "黑方";

  if (isReplay) {
    return {
      controlMode: "replay",
      isFollowingLive: false,
      kind: "replay",
      label: `棋谱回放 · ${viewpoint}视角`
    };
  }

  if (!isLiveSpectator) return null;
  const isFollowingLive = boardStep == null || boardStep >= liveStep;
  return {
    controlMode: "spectator",
    isFollowingLive,
    kind: isFollowingLive ? "spectator-live" : "spectator-history",
    label: `${isFollowingLive ? "实时观战" : "观战回看"} · ${viewpoint}视角`
  };
}
