import { Children, isValidElement, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Hash, MessageSquareText, PanelRight, Settings } from "lucide-react";
import { COLORS, GAME_PHASES, canStartSkill, gameViewForColor } from "../shared/game.js";
import { BOARD_SOUND_TYPES, boardSoundActionAtStep, latestBoardSoundAction } from "../shared/boardAudio.js";
import { nextCountdownAnnouncement, nextTimeAnnouncement } from "../shared/timeAnnouncements.js";
import { SYSTEM_VOICE_EVENTS, resolveSystemVoice } from "../shared/systemVoices.js";
import { playBoardSound, preloadVoiceSound } from "../audio/playback.jsx";
import { playSystemVoice } from "../audio/systemVoicePlayback.js";
import { ConfirmModal } from "../modals/FeedbackModals.jsx";
import { OpeningModal } from "../modals/GameLifecycleModals.jsx";
import SkillBanner from "../modals/SkillBanner.jsx";
import { nextPointConfirmation, shouldUsePointConfirmation } from "./mobilePointConfirmation.js";
import { applyRoomAudioBaseline, buildRoomAudioBaseline, shouldSeedRoomAudioBaseline } from "./roomAudioBaseline.js";
import ActionBar from "./ActionBar.jsx";
import Board from "./Board.jsx";
import ChatBox from "./ChatBox.jsx";
import OperationHint from "./OperationHint.jsx";
import PlayerInfo from "./PlayerInfo.jsx";
import RoomPeopleList from "./RoomPeopleList.jsx";
import { canPreviewPoint, replayGameAt, replayRoomAt, stoneDecorationsForRoom, voiceCharacterForPlayer } from "./roomView.js";

const SHOW_TEST_TOOLS = import.meta.env.DEV;
export const MOBILE_ROOM_MEDIA_QUERY = "(max-width: 900px), (pointer: coarse)";

export default function RoomScreen({ room, user, token, characters, replayStep, setReplayStep, pendingSkill, setPendingSkill, audioSettings, onOpenSettings, onOpenMessageBoard, onBack, onGameAction, onCountingRequest, onCountingRespond, onDrawRequest, onDrawRespond, onScoringAction, onChat, onOpenReplay }) {
  const [showCoords, setShowCoords] = useState(true);
  const [showMoves, setShowMoves] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [pointConfirmation, setPointConfirmation] = useState(null);
  const [spectatorStep, setSpectatorStep] = useState(null);
  const [viewColor, setViewColor] = useState(COLORS.black);
  const liveStepRef = useRef(room.game.history.length);
  const isReplay = replayStep !== null;
  const liveStep = room.game.history.length;
  const effectiveRole = effectiveRoomRole(room, isReplay);
  const isLiveSpectator = effectiveRole === "spectator" && !isReplay;
  const effectiveSpectatorStep = spectatorStep ?? liveStep;
  const boardStep = isReplay ? replayStep : isLiveSpectator ? effectiveSpectatorStep : null;
  const rawBoardGame = boardStep == null || boardStep >= liveStep
    ? isLiveSpectator && room.gameViews?.[viewColor] ? room.gameViews[viewColor] : room.game
    : replayGameAt(room, boardStep);
  const boardGame = (isReplay || isLiveSpectator) && !(isLiveSpectator && boardStep >= liveStep && room.gameViews?.[viewColor])
    ? gameViewForColor(rawBoardGame, viewColor)
    : rawBoardGame;
  const displayRoom = isReplay ? replayRoomAt(room, replayStep, viewColor) : isLiveSpectator ? { ...room, game: boardGame } : room;
  const role = effectiveRoomRole(displayRoom, isReplay);
  const blackPlayer = displayRoom.players.find((p) => p.color === COLORS.black);
  const whitePlayer = displayRoom.players.find((p) => p.color === COLORS.white);
  const roomGameInfo = blackPlayer && whitePlayer
    ? {
        black: `${blackPlayer.user.username} ${blackPlayer.user.rank}`,
        white: `${whitePlayer.user.username} ${whitePlayer.user.rank}`,
        moves: `${displayRoom.game.moveNumber}手`
      }
    : null;
  const me = role === "spectator" ? blackPlayer : displayRoom.players.find((p) => p.user.id === user.id);
  const opponent = role === "spectator" ? whitePlayer : displayRoom.players.find((p) => p.user.id !== user.id) ?? displayRoom.players[1];
  const activePlayer = displayRoom.players.find((p) => p.color === displayRoom.game.turn);
  const scoring = displayRoom.game.scoring;
  const drawRequest = displayRoom.game.drawRequest;
  const hasAnyStones = displayRoom.game.points.some((point) => Boolean(point.stone));
  const skillAvailable = me ? canStartSkill(displayRoom.game, me.character?.skill ?? me.characterId) : true;
  const opponentConnected = role !== "player" || opponent?.connected !== false;
  const soundMoveRef = useRef(null);
  const hiddenRevealSoundRef = useRef(null);
  const replayStepSoundRef = useRef(replayStep);
  const voiceRef = useRef({});
  const preloadedCountdownRef = useRef("");
  const systemVoiceRef = useRef({});
  const seededAudioBaselineRef = useRef("");
  const winnerColor = displayRoom.game.winner?.winnerColor ?? displayRoom.game.winner?.color;
  const skillPreview = displayRoom.game.pendingSkill;
  const canSwitchView = role === "spectator";
  const [closeCountdownNow, setCloseCountdownNow] = useState(Date.now());
  const showCloseCountdown = shouldShowRoomCloseCountdown(displayRoom);
  const useMobileLayout = useMobileRoomLayout();

  useEffect(() => {
    setPointConfirmation(null);
  }, [room.code, displayRoom.game.turn, displayRoom.game.phase, pendingSkill, skillPreview, isReplay]);

  useLayoutEffect(() => {
    if (!shouldSeedRoomAudioBaseline(room)) return;
    const baselineKey = `${room.code}:${room.game.history.length}:${room.chat?.length ?? 0}`;
    if (seededAudioBaselineRef.current === baselineKey) return;
    seededAudioBaselineRef.current = baselineKey;
    applyRoomAudioBaseline({
      soundMoveRef,
      hiddenRevealSoundRef,
      voiceRef,
      systemVoiceRef
    }, buildRoomAudioBaseline(room));
  }, [room]);

  useEffect(() => {
    if (!showCloseCountdown) return undefined;
    setCloseCountdownNow(Date.now());
    const timerId = setInterval(() => setCloseCountdownNow(Date.now()), 1000);
    return () => clearInterval(timerId);
  }, [showCloseCountdown, displayRoom.closesAt]);

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

  useEffect(() => {
    const boardSoundAction = latestBoardSoundAction(displayRoom.game.history);
    if (isReplay) {
      const previousReplayStep = replayStepSoundRef.current;
      replayStepSoundRef.current = replayStep;
      if (typeof previousReplayStep !== "number" || replayStep !== previousReplayStep + 1) return;
      playBoardSound(boardSoundActionAtStep(room.game.history, replayStep), audioSettings);
      return;
    }
    replayStepSoundRef.current = replayStep;
    if (!boardSoundAction || soundMoveRef.current === boardSoundAction.key) return;
    soundMoveRef.current = boardSoundAction.key;
    playBoardSound(boardSoundAction, audioSettings);
  }, [displayRoom.game.history, isReplay, replayStep, audioSettings]);

  useEffect(() => {
    if (isReplay) return;
    const exposedIds = displayRoom.game.points
      .filter((point) => point.hiddenHand?.exposed)
      .map((point) => point.id)
      .sort();
    const exposedKey = exposedIds.join("|");
    if (hiddenRevealSoundRef.current == null) {
      hiddenRevealSoundRef.current = exposedKey;
      return;
    }
    if (hiddenRevealSoundRef.current === exposedKey) return;
    const previous = new Set(hiddenRevealSoundRef.current.split("|").filter(Boolean));
    hiddenRevealSoundRef.current = exposedKey;
    const hasNewExposure = exposedIds.some((id) => !previous.has(id));
    const latestAction = latestBoardSoundAction(displayRoom.game.history);
    if (hasNewExposure && latestAction?.sound !== BOARD_SOUND_TYPES.hiddenReveal) {
      playBoardSound({ key: `hidden-reveal-${exposedKey}`, sound: BOARD_SOUND_TYPES.hiddenReveal }, audioSettings);
    }
  }, [displayRoom.game.points, displayRoom.game.history, isReplay, audioSettings]);

  useEffect(() => {
    if (isReplay || !activePlayer) return;
    const timer = activePlayer.time;
    const periodKey = `${activePlayer.color}-periods`;
    const mainKey = `${activePlayer.color}-main`;
    const previousPeriods = voiceRef.current[periodKey];
    const previousMain = voiceRef.current[mainKey];
    const announcement = nextTimeAnnouncement({
      previous: { main: previousMain, periods: previousPeriods },
      current: timer
    });
    if (announcement?.type === "voice") {
      playSystemVoice(announcement.event, {
        character: voiceCharacterForPlayer(activePlayer, characters),
        params: announcement.params,
        fallbackText: announcement.text,
        audioSettings
      });
    }
    if (timer.main <= 0 && timer.periodRemaining <= 10 && timer.periodRemaining > 0) {
      const countdownKey = `${activePlayer.color}-${displayRoom.game.history.length}-${timer.periods}-${timer.periodRemaining}`;
      if (!voiceRef.current[countdownKey]) {
        voiceRef.current[countdownKey] = true;
        const countdownAnnouncement = nextCountdownAnnouncement({ seconds: timer.periodRemaining });
        if (countdownAnnouncement?.type === "voice") {
          playSystemVoice(countdownAnnouncement.event, {
            character: voiceCharacterForPlayer(activePlayer, characters),
            params: countdownAnnouncement.params,
            fallbackText: countdownAnnouncement.text,
            audioSettings
          });
        }
      }
    }
    voiceRef.current[mainKey] = timer.main;
    voiceRef.current[periodKey] = timer.periods;
  }, [activePlayer, characters, isReplay, audioSettings]);

  useEffect(() => {
    if (isReplay || !activePlayer || !(activePlayer.time?.main <= 0)) return;
    const preloadSources = [];
    for (let seconds = 10; seconds >= 1; seconds -= 1) {
      const voice = resolveSystemVoice(SYSTEM_VOICE_EVENTS.countdown(seconds), {
        character: voiceCharacterForPlayer(activePlayer, characters),
        params: { seconds }
      });
      if (voice.type === "audio" && voice.src) preloadSources.push(voice.src);
    }
    const preloadKey = `${activePlayer.color}:${preloadSources.join("|")}`;
    if (!preloadSources.length || preloadedCountdownRef.current === preloadKey) return;
    preloadedCountdownRef.current = preloadKey;
    for (const src of preloadSources) {
      preloadVoiceSound(src);
    }
  }, [activePlayer, characters, isReplay]);

  useEffect(() => {
    if (!shouldPlayGameStartVoice({ isReplay, role, phase: displayRoom.game.phase })) return;
    const gameStartMessage = displayRoom.chat.findLast?.((message) => message.kind === "game-start");
    if (!gameStartMessage || systemVoiceRef.current.gameStart === gameStartMessage.id) return;
    systemVoiceRef.current.gameStart = gameStartMessage.id;
    playSystemVoice(SYSTEM_VOICE_EVENTS.gameStart, {
      character: voiceCharacterForPlayer(me, characters),
      audioSettings
    });
  }, [displayRoom.chat, isReplay, me, characters, audioSettings]);

  function handlePoint(point, eventMeta = {}) {
    if (isReplay) return;
    if (skillPreview) return;
    if (displayRoom.game.phase === "marking-dead") return handleScoringPoint(point);
    if (displayRoom.game.phase !== GAME_PHASES.playing) return;
    if (role !== "player") return;
    const actionType = pendingSkill ? "skill" : "move";
    if (!canConfirmPointAction({ point, actionType })) {
      setPointConfirmation(null);
      return;
    }
    if (shouldUsePointConfirmation(eventMeta)) {
      const confirmation = nextPointConfirmation(pointConfirmation, { pointId: point.id, actionType });
      setPointConfirmation(confirmation.next);
      if (!confirmation.confirmed) return;
    } else {
      setPointConfirmation(null);
    }
    if (pendingSkill) {
      setPendingSkill(false);
      onGameAction({ type: "skill", pointId: point.id });
      return;
    }
    onGameAction({ type: "move", pointId: point.id });
  }

  function canConfirmPointAction({ point, actionType }) {
    if (actionType === "skill") return canPreviewPoint(displayRoom.game, me, point, true, false);
    return Boolean(point?.valid && !point.stone);
  }

  function handleScoringPoint(point) {
    if (point.stone) onScoringAction({ type: "mark-dead", pointId: point.id });
    else if (point.valid) onScoringAction({ type: "mark-neutral", pointId: point.id });
  }

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
      <header className="room-header">
        <div className="room-title-stack">
          <p className="room-title-line">
            <span className="room-code-label">房间号 {room.code}</span>
            {roomGameInfo && (
              <>
                <span className="room-info-tag black-side">黑方：{roomGameInfo.black}</span>
                <span className="room-info-tag white-side">白方：{roomGameInfo.white}</span>
                <span className="room-info-tag move-count">{roomGameInfo.moves}</span>
              </>
            )}
          </p>
          {showCloseCountdown && (
            <span className="room-info-tag close-countdown">
              {roomCloseCountdownText(displayRoom.closesAt, closeCountdownNow)}
            </span>
          )}
          {isReplay && <h1>棋谱回放</h1>}
        </div>
        <div className="room-toggles">
          <button className="toggle" onClick={onOpenMessageBoard} title="留言板"><MessageSquareText size={16} /></button>
          <button className="toggle" onClick={onOpenSettings} title="设置"><Settings size={16} /></button>
          <button className={showMoves ? "toggle active" : "toggle"} onClick={() => setShowMoves(!showMoves)} title="显示手数"><Hash size={16} /></button>
          <button className={showCoords ? "toggle active" : "toggle"} onClick={() => setShowCoords(!showCoords)} title="显示坐标"><PanelRight size={16} /></button>
        </div>
      </header>
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

function DesktopRoomLayout({ children }) {
  return <main className="room-screen desktop-room-screen">{children}</main>;
}

function MobileRoomLayout({ children }) {
  const [activeMobilePanel, setActiveMobilePanel] = useState("actions");
  const childList = Children.toArray(children);
  const header = childList.find((child) => isElementWithClass(child, "room-header"));
  const battle = childList.find((child) => isElementWithClass(child, "mobile-battle-layout"));
  const overlays = childList.filter((child) => child !== header && child !== battle);
  const battleChildren = Children.toArray(battle?.props?.children);
  const opponentSide = battleChildren.find((child) => isElementWithClass(child, "opponent-side"));
  const boardColumn = battleChildren.find((child) => isElementWithClass(child, "board-column"));
  const roomSide = battleChildren.find((child) => isElementWithClass(child, "room-side"));
  const opponentChildren = Children.toArray(opponentSide?.props?.children).filter(Boolean);
  const boardChildren = Children.toArray(boardColumn?.props?.children).filter(Boolean);
  const roomChildren = Children.toArray(roomSide?.props?.children).filter(Boolean);
  const opponentInfo = opponentChildren.find((child) => isComponentElement(child, PlayerInfo));
  const membersPanel = opponentChildren.find((child) => isComponentElement(child, RoomPeopleList));
  const boardPanel = boardChildren.filter((child) => !isComponentElement(child, ActionBar));
  const actionPanel = boardChildren.find((child) => isComponentElement(child, ActionBar));
  const selfInfo = roomChildren.find((child) => isComponentElement(child, PlayerInfo));
  const chatPanel = roomChildren.find((child) => isComponentElement(child, ChatBox));
  const panels = [
    actionPanel && { id: "actions", label: "操作", content: <div className="mobile-action-panel">{actionPanel}</div> },
    membersPanel && { id: "members", label: "成员", content: membersPanel },
    chatPanel && { id: "chat", label: "聊天", content: chatPanel }
  ].filter(Boolean);
  const selectedPanel = panels.find((panel) => panel.id === activeMobilePanel) ?? panels[0];

  return (
    <main className="room-screen mobile-room-screen">
      {header}
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
      {overlays}
    </main>
  );
}

function isElementWithClass(element, className) {
  return isValidElement(element) && String(element.props?.className ?? "").split(/\s+/).includes(className);
}

function isComponentElement(element, component) {
  return isValidElement(element) && element.type === component;
}

export function useMobileRoomLayout() {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia(MOBILE_ROOM_MEDIA_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const media = window.matchMedia(MOBILE_ROOM_MEDIA_QUERY);
    const update = () => setMatches(media.matches);
    update();
    if (typeof media.addEventListener === "function") media.addEventListener("change", update);
    else media.addListener?.(update);
    return () => {
      if (typeof media.removeEventListener === "function") media.removeEventListener("change", update);
      else media.removeListener?.(update);
    };
  }, []);

  return matches;
}

export function shouldShowRoomCloseCountdown(room) {
  return room?.game?.phase === GAME_PHASES.finished && Boolean(room.closesAt);
}

export function effectiveRoomRole(room, isReplay = false) {
  if (isReplay || room?.game?.phase === GAME_PHASES.finished) return "spectator";
  return room?.role ?? "spectator";
}

export function shouldPlayGameStartVoice({ isReplay = false, role = "spectator", phase = "" } = {}) {
  return !isReplay && role === "player" && phase === GAME_PHASES.playing;
}

export function roomCloseCountdownText(closesAt, now = Date.now()) {
  const seconds = Math.max(0, Math.ceil((Number(closesAt) - now) / 1000));
  const minutes = Math.floor(seconds / 60);
  const restSeconds = String(seconds % 60).padStart(2, "0");
  return `关闭倒计时 ${minutes}:${restSeconds}`;
}

export function roomGameInfoForPlayers(blackPlayer, whitePlayer, moveNumber) {
  if (!blackPlayer || !whitePlayer) return null;
  return {
    black: `${blackPlayer.user.username} ${blackPlayer.user.rank}`,
    white: `${whitePlayer.user.username} ${whitePlayer.user.rank}`,
    moves: `${moveNumber}手`
  };
}
