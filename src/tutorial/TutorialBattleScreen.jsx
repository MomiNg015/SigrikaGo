import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calculator, Flag, Play, Sparkles } from "lucide-react";
import "../styles/room/tutorial-battle-screen.css";
import { requestBackgroundMusicPause } from "../audio/backgroundMusicPause.js";
import { BackgroundMusic } from "../audio/playback.jsx";
import AssetPreloadScreen from "../app/AssetPreloadScreen.jsx";
import { ConfirmModal } from "../modals/FeedbackModals.jsx";
import SkillBanner from "../modals/SkillBanner.jsx";
import { useRoomAudioEffects } from "../room/audio/useRoomAudioEffects.js";
import RoomBattleStage from "../room/RoomBattleStage.jsx";
import RoomHeader from "../room/header/RoomHeader.jsx";
import { DesktopRoomLayout, MobileRoomLayout, useMobileRoomLayout } from "../room/layout/RoomLayouts.jsx";
import { roomGameInfoForPlayers } from "../room/roomState.js";
import { COLORS, GAME_PHASES, cloneState, getPoint } from "../shared/game.js";
import { findCharacter } from "../shared/characterDisplay.js";
import { latestSkillPreview, resolveBackgroundMusic } from "../shared/musicLibrary.js";
import {
  TUTORIAL_NODE_TYPES,
  isTutorialNpcNodeType
} from "../shared/tutorialNodeTypes.js";
import {
  DEFAULT_NPC_DIALOGUE_AUTO_CONTINUE_SECONDS,
  delayMs,
  nodeAdvanceControls,
  nodeAutoContinueDelayMs,
  optionTransitionDelayMs
} from "../shared/storyTiming.js";
import {
  applyTutorialNodeAction,
  applyTutorialSkillAction,
  createTutorialGameState
} from "./tutorialGameState.js";
import {
  createTutorialBattleRoom,
  tutorialPlayersForSetup
} from "./tutorialBattleRoom.js";

const ENTRY_LOADING_TEXT = "正在激烈对局中...";
const EXIT_LOADING_TEXT = "正在收拾棋盘...";
const MIN_LOADING_MS = 3000;
const DEFAULT_NPC_ACTION_DELAY_SECONDS = 1.5;
const DEFAULT_REPLY_DELAY_SECONDS = 0.4;
const BUBBLE_EXIT_MS = 220;
const PLAYER_ID = "tutorial-player";
const NPC_ID = "tutorial-npc";

function loadingForBoardSetup(node) {
  return {
    id: `setup-${node?.id || "unknown"}-${Date.now()}`,
    kind: "setup",
    text: ENTRY_LOADING_TEXT,
    node
  };
}

function initialBattleLoadingForNode(node) {
  return node?.type === TUTORIAL_NODE_TYPES.boardSetup && node.boardSetupLoadingEnabled !== false
    ? loadingForBoardSetup(node)
    : null;
}

export default function TutorialBattleScreen({
  audioSettings,
  characters = {},
  musicTracks,
  session,
  siteSettings = {},
  user,
  onClose,
  onComplete,
  onExitToStory,
  onOpenMessageBoard,
  onOpenSettings,
  onToast,
  previewControlsEnabled = false
}) {
  const script = session?.script;
  const nodesById = useMemo(() => new Map((script?.nodes ?? []).map((node) => [node.id, node])), [script]);
  const startNode = nodesById.get(session?.startNodeId) ?? nodesById.get(script?.startNodeId) ?? {};
  const [players, setPlayers] = useState(() => tutorialPlayersForSetup(startNode, user, characters));
  const [game, setGame] = useState(() => createTutorialGameState({
    initialBoard: script?.initialBoard,
    players
  }));
  const [nodeId, setNodeId] = useState(session?.startNodeId ?? script?.startNodeId ?? "");
  const [pendingSkill, setPendingSkill] = useState(false);
  const [skillPhase, setSkillPhase] = useState("");
  const [choicesVisible, setChoicesVisible] = useState(false);
  const [npcBubble, setNpcBubble] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [resolvedSkillState, setResolvedSkillState] = useState(null);
  const [loading, setLoading] = useState(() => initialBattleLoadingForNode(startNode));
  const [battleMusicActive, setBattleMusicActive] = useState(true);
  const [confirmExit, setConfirmExit] = useState(null);
  const [pendingWait, setPendingWait] = useState(null);
  const [showCoords, setShowCoords] = useState(true);
  const gameRef = useRef(game);
  const nodeRunRef = useRef(0);
  const timersRef = useRef([]);
  const pendingWaitRef = useRef(null);
  const initializedNodeKeyRef = useRef("");
  const currentNode = nodesById.get(nodeId) ?? null;
  const useMobileLayout = useMobileRoomLayout();

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const clearTimers = useCallback(() => {
    for (const timerId of timersRef.current) window.clearTimeout(timerId);
    timersRef.current = [];
    pendingWaitRef.current = null;
    setPendingWait(null);
  }, []);

  const schedule = useCallback((callback, delayMs) => {
    const timerId = window.setTimeout(callback, Math.max(0, delayMs));
    timersRef.current.push(timerId);
    return timerId;
  }, []);

  const schedulePendingWait = useCallback((callback, delayValueMs, options = {}) => {
    const manualContinue = Boolean(options.manualContinue);
    const autoContinue = options.autoContinue !== false;
    if (!manualContinue && (!autoContinue || delayValueMs <= 0)) {
      callback();
      return;
    }
    const pending = {
      id: `wait-${Date.now()}`,
      callback,
      revealsChoices: Boolean(options.revealsChoices)
    };
    const timerId = autoContinue
      ? schedule(() => {
        if (pendingWaitRef.current?.id !== pending.id) return;
        pendingWaitRef.current = null;
        setPendingWait(null);
        callback();
      }, delayValueMs)
      : null;
    pending.timerId = timerId;
    pendingWaitRef.current = pending;
    setPendingWait({ id: pending.id, manualContinue, autoContinue, revealsChoices: pending.revealsChoices });
  }, [schedule]);

  const skipPendingWait = useCallback(() => {
    const pending = pendingWaitRef.current;
    if (!pending) return;
    if (pending.timerId != null) window.clearTimeout(pending.timerId);
    pendingWaitRef.current = null;
    setPendingWait(null);
    pending.callback();
  }, []);

  const finish = useCallback(() => {
    onComplete?.();
    onClose?.();
  }, [onClose, onComplete]);

  const startExitLoading = useCallback((payload = {}) => {
    clearTimers();
    setChoicesVisible(false);
    setPendingSkill(false);
    setSkillPhase("");
    setResolvedSkillState(null);
    pendingWaitRef.current = null;
    setPendingWait(null);
    setBattleMusicActive(false);
    setLoading({
      id: `exit-${Date.now()}`,
      kind: payload.kind ?? "finish",
      text: EXIT_LOADING_TEXT,
      node: payload.node ?? currentNode,
      startNodeId: payload.startNodeId ?? ""
    });
  }, [clearTimers, currentNode]);

  const goToNode = useCallback((nextId) => {
    const targetId = String(nextId ?? "").trim();
    setChoicesVisible(false);
    setPendingSkill(false);
    setSkillPhase("");
    setResolvedSkillState(null);
    if (!targetId) {
      startExitLoading({ kind: "finish" });
      return;
    }
    if (!nodesById.has(targetId)) {
      onToast?.("剧情教学步骤不存在，已结束预览。", "warning");
      startExitLoading({ kind: "finish" });
      return;
    }
    const targetNode = nodesById.get(targetId);
    if (targetNode?.type === TUTORIAL_NODE_TYPES.boardSetup) {
      setNodeId(targetId);
      setNpcBubble(null);
      if (targetNode.boardSetupLoadingEnabled !== false) {
        setLoading(loadingForBoardSetup(targetNode));
      }
      return;
    }
    if (targetNode?.type === TUTORIAL_NODE_TYPES.story) {
      setNodeId(targetId);
      setNpcBubble(null);
      startExitLoading({ kind: "story", node: targetNode, startNodeId: targetNode.id });
      return;
    }
    setNodeId(targetId);
  }, [nodesById, onToast, startExitLoading]);

  const appendChat = useCallback(({ userId, username, text }) => {
    const messageText = String(text ?? "").trim();
    if (!messageText) return;
    setChatMessages((current) => [
      ...current,
      {
        id: `tutorial-chat-${Date.now()}-${current.length}`,
        type: "chat",
        kind: "tutorial",
        userId,
        username,
        text: messageText,
        moveNumber: gameRef.current?.moveNumber ?? 0,
        createdAt: Date.now()
      }
    ]);
  }, []);

  const hideNpcBubble = useCallback(() => {
    setNpcBubble((current) => {
      if (!current || current.closing) return current;
      schedule(() => {
        setNpcBubble((latest) => latest?.id === current.id ? null : latest);
      }, BUBBLE_EXIT_MS);
      return { ...current, closing: true };
    });
  }, [schedule]);

  const showNpcBubble = useCallback((node) => {
    const text = String(node?.text ?? node?.prompt ?? "").trim();
    if (!text) {
      hideNpcBubble();
      return;
    }
    const character = findCharacter(characters, node.characterId || playerByUserId(players, NPC_ID)?.characterId);
    const nextBubble = {
      id: `${node.id}-${nodeRunRef.current}`,
      nodeId: node.id,
      characterId: character.id,
      palette: character.palette || "#5b6ee1",
      speakerName: node.speakerName || node.npcName || character.name || "NPC",
      text,
      closing: false
    };
    setNpcBubble((current) => {
      if (!current || current.id === nextBubble.id) return nextBubble;
      schedule(() => {
        setNpcBubble((latest) => latest?.id === current.id ? nextBubble : latest);
      }, BUBBLE_EXIT_MS);
      return { ...current, closing: true };
    });
    appendChat({
      userId: NPC_ID,
      username: node.speakerName || node.npcName || character.name || "NPC",
      text
    });
  }, [appendChat, characters, hideNpcBubble, players, schedule]);

  const completeNodeFlow = useCallback((node) => {
    const options = Array.isArray(node?.options) ? node.options : [];
    const advance = options.length
      ? () => setChoicesVisible(true)
      : () => goToNode(node?.nextNodeId);
    const isNpcDialogue = node?.type === TUTORIAL_NODE_TYPES.npcDialogue;
    schedulePendingWait(
      advance,
      nodeAutoContinueDelayMs(node, isNpcDialogue ? DEFAULT_NPC_DIALOGUE_AUTO_CONTINUE_SECONDS : 0),
      {
        ...nodeAdvanceControls(node),
        revealsChoices: options.length > 0
      }
    );
  }, [goToNode, schedulePendingWait]);

  const completeAction = useCallback((node, result) => {
    if (!result?.ok) {
      const message = result?.message || "这一步没有执行成功，请检查脚本配置。";
      onToast?.(message, "warning");
      return;
    }
    setGame(result.state);
    gameRef.current = result.state;
    completeNodeFlow(node);
  }, [completeNodeFlow, onToast]);

  const runSkillAction = useCallback((node, pointId = "", afterSettled = completeNodeFlow) => {
    const result = applyTutorialSkillAction(gameForAction(node, gameRef.current), node, {
      pointId: pointId || undefined,
      pendingSkillId: `${node?.id || "tutorial-skill"}-preview`
    });
    if (!result.ok) {
      const message = result.message || "技能施放失败，请检查角色、技能和目标配置。";
      onToast?.(message, "warning");
      return;
    }
    setPendingSkill(false);
    setSkillPhase("");
    setGame(result.state);
    gameRef.current = result.state;
    setResolvedSkillState(result.resolvedState);
    const durationMs = skillPreviewDurationMs(result.pendingSkill);
    schedule(() => {
      const settled = result.resolvedState ?? result.state;
      setGame(settled);
      gameRef.current = settled;
      setResolvedSkillState(null);
      afterSettled(node);
    }, durationMs);
  }, [completeNodeFlow, onToast, schedule]);

  const applyBoardSetup = useCallback((node) => {
    const nextPlayers = tutorialPlayersForSetup(node, user, characters);
    setPlayers(nextPlayers);
    const nextGame = createTutorialGameState({
      initialBoard: node.boardSetup ?? script?.initialBoard,
      players: nextPlayers
    });
    setGame(nextGame);
    gameRef.current = nextGame;
    schedulePendingWait(
      () => goToNode(node.nextNodeId),
      nodeAutoContinueDelayMs(node, 0),
      nodeAdvanceControls(node)
    );
  }, [characters, goToNode, schedulePendingWait, script?.initialBoard, user]);

  useEffect(() => {
    const startId = session?.startNodeId ?? script?.startNodeId ?? "";
    const nextStartNode = nodesById.get(startId) ?? {};
    const nextPlayers = tutorialPlayersForSetup(nextStartNode, user, characters);
    const nextGame = createTutorialGameState({
      initialBoard: script?.initialBoard,
      players: nextPlayers
    });
    clearTimers();
    nodeRunRef.current = 0;
    initializedNodeKeyRef.current = "";
    setPlayers(nextPlayers);
    setGame(nextGame);
    gameRef.current = nextGame;
    setNodeId(startId);
    setPendingSkill(false);
    setSkillPhase("");
    setChoicesVisible(false);
    setNpcBubble(null);
    setChatMessages([]);
    setResolvedSkillState(null);
    setLoading(initialBattleLoadingForNode(nextStartNode));
    setBattleMusicActive(true);
    setConfirmExit(null);
    return clearTimers;
  }, [characters, clearTimers, nodesById, script, session?.startNodeId, user]);

  useEffect(() => {
    if (!loading) return undefined;
    const timerId = window.setTimeout(() => {
      if (loading.kind === "setup") {
        applyBoardSetup(loading.node);
        setLoading(null);
        return;
      }
      if (loading.kind === "story") {
        if (onExitToStory) {
          onExitToStory({
            script: { ...script, startNodeId: loading.startNodeId },
            labels: session?.labels,
            onComplete: session?.onComplete,
            onExit: session?.onExit
          });
        } else {
          finish();
        }
        return;
      }
      finish();
    }, MIN_LOADING_MS);
    return () => window.clearTimeout(timerId);
  }, [applyBoardSetup, finish, loading, onExitToStory, script, session?.labels, session?.onComplete, session?.onExit]);

  useEffect(() => {
    if (!loading || loading.kind === "setup") return undefined;
    return requestBackgroundMusicPause();
  }, [loading?.id, loading?.kind]);

  useEffect(() => {
    if (!currentNode || loading || pendingWait) return;
    const nodeExecutionKey = currentNode.id || nodeId;
    if (initializedNodeKeyRef.current === nodeExecutionKey) return;
    initializedNodeKeyRef.current = nodeExecutionKey;
    clearTimers();
    nodeRunRef.current += 1;
    setChoicesVisible(false);
    setPendingSkill(false);
    setSkillPhase("");
    setResolvedSkillState(null);

    if (currentNode.type === TUTORIAL_NODE_TYPES.boardSetup) {
      hideNpcBubble();
      if (currentNode.boardSetupLoadingEnabled === false) {
        applyBoardSetup(currentNode);
      } else {
        setLoading(loadingForBoardSetup(currentNode));
      }
      return;
    }

    if (currentNode.type === TUTORIAL_NODE_TYPES.story) {
      hideNpcBubble();
      startExitLoading({ kind: "story", node: currentNode, startNodeId: currentNode.id });
      return;
    }

    if (currentNode.type === TUTORIAL_NODE_TYPES.playerChoice) {
      hideNpcBubble();
      completeNodeFlow(currentNode);
      return;
    }

    if (isTutorialNpcNodeType(currentNode.type)) {
      showNpcBubble(currentNode);
      if (currentNode.type === TUTORIAL_NODE_TYPES.npcDialogue) {
        schedule(() => completeNodeFlow(currentNode), npcDialogueTypewriterDurationMs(currentNode));
        return;
      }
      schedule(() => {
        if (currentNode.type === TUTORIAL_NODE_TYPES.npcSkill) {
          runSkillAction(currentNode, currentNode.pointId ?? "", (node) => {
            schedule(() => completeNodeFlow(node), delayMs(node.replyDelaySeconds, DEFAULT_REPLY_DELAY_SECONDS));
          });
          return;
        }
        const result = applyTutorialNodeAction(gameForAction(currentNode, gameRef.current), currentNode, { pointId: currentNode.pointId });
        if (result?.ok) {
          setGame(result.state);
          gameRef.current = result.state;
          schedule(() => completeNodeFlow(currentNode), delayMs(currentNode.replyDelaySeconds, DEFAULT_REPLY_DELAY_SECONDS));
          return;
        }
        completeAction(currentNode, result);
      }, delayMs(currentNode.actionStartDelaySeconds, DEFAULT_NPC_ACTION_DELAY_SECONDS));
      return;
    }

    hideNpcBubble();
    if (currentNode.type === TUTORIAL_NODE_TYPES.playerSkill) {
      setSkillPhase("skill-button");
      return;
    }
    if (playerButtonNode(currentNode)) {
      setSkillPhase("button");
      return;
    }
    if (autoSettlementNode(currentNode)) {
      schedule(() => completeAction(currentNode, applyTutorialNodeAction(gameForAction(currentNode, gameRef.current), currentNode)), delayMs(currentNode.actionStartDelaySeconds, DEFAULT_NPC_ACTION_DELAY_SECONDS));
    }
  }, [
    applyBoardSetup,
    clearTimers,
    completeAction,
    completeNodeFlow,
    currentNode,
    hideNpcBubble,
    loading,
    pendingWait,
    runSkillAction,
    schedule,
    showNpcBubble,
    startExitLoading
  ]);

  const displayGame = useMemo(() => gameForCurrentNode(game, currentNode, players), [currentNode, game, players]);
  const displayRoom = useMemo(() => createTutorialBattleRoom({
    code: "TEACH",
    game: displayGame,
    players,
    scriptTitle: script?.title,
    chat: chatMessages
  }), [chatMessages, displayGame, players, script?.title]);
  const me = displayRoom.players.find((player) => player.user?.id === (user?.id ?? PLAYER_ID)) ?? displayRoom.players[0];
  const opponent = displayRoom.players.find((player) => player.user?.id !== me?.user?.id) ?? displayRoom.players[1];
  const activePlayer = displayRoom.players.find((player) => player.color === displayRoom.game.turn) ?? null;
  const roomGameInfo = roomGameInfoForPlayers(
    displayRoom.players.find((player) => player.color === COLORS.black),
    displayRoom.players.find((player) => player.color === COLORS.white),
    displayRoom.game.moveNumber
  );
  const hasAnyStones = displayRoom.game.points.some((point) => Boolean(point.stone));
  const skillPreview = displayRoom.game.pendingSkill;
  const tutorialTargetPointId = targetPointForNode(currentNode, skillPhase);
  const tutorialAnyBoardTarget = currentNode?.type === TUTORIAL_NODE_TYPES.playerSkill
    && skillPhase === "skill-board"
    && !currentNode.pointId;
  const tutorialMusic = useMemo(() => resolveBackgroundMusic({
    view: "room",
    skillPreview: displayRoom.game.pendingSkill,
    latestSkillPreview: latestSkillPreview(displayRoom),
    gamePhase: displayRoom.game.phase,
    selections: user?.musicSelections,
    ownedMusicIds: user?.ownedMusicIds,
    tracks: musicTracks
  }), [displayRoom, musicTracks, user?.musicSelections, user?.ownedMusicIds]);
  const Layout = useMobileLayout ? MobileRoomLayout : DesktopRoomLayout;
  const battleLayoutClassName = useMobileLayout ? "mobile-battle-layout" : "battle-layout";

  useRoomAudioEffects({
    activePlayer,
    audioSettings,
    characters,
    displayRoom,
    isReplay: false,
    me,
    replayStep: null,
    role: "player",
    room: displayRoom
  });

  function handlePoint(point) {
    if (!point || loading || pendingWait || resolvedSkillState || isNpcLocked(currentNode)) return;
    if (currentNode?.type === TUTORIAL_NODE_TYPES.playerMove) {
      const result = applyTutorialNodeAction(gameForAction(currentNode, gameRef.current), currentNode, { pointId: point.id });
      if (!result.ok) {
        warn(result.message || currentNode.wrongClickMessage || "请在提示区域落子");
        return;
      }
      if (result.wrongMove) {
        setGame(result.state);
        gameRef.current = result.state;
        goToNode(result.nextNodeId);
        return;
      }
      completeAction(currentNode, result);
      return;
    }
    if (currentNode?.type === TUTORIAL_NODE_TYPES.playerSkill) {
      if (skillPhase !== "skill-board") {
        warn("请点击提示按钮");
        return;
      }
      if (currentNode.pointId && point.id !== currentNode.pointId) {
        warn(currentNode.wrongClickMessage || "请在提示区域落子");
        return;
      }
      runSkillAction(currentNode, currentNode.pointId ? point.id : "");
      return;
    }
  }

  function handleGameAction(action) {
    if (loading || pendingWait || isNpcLocked(currentNode)) return;
    if (action?.type === "resign" && currentNode?.type === TUTORIAL_NODE_TYPES.resign && playerButtonNode(currentNode)) {
      completeAction(currentNode, applyTutorialNodeAction(gameForAction(currentNode, gameRef.current), currentNode));
      return;
    }
    warn(currentNode?.type === TUTORIAL_NODE_TYPES.playerMove ? "请在提示区域落子" : "请点击提示按钮");
  }

  function handleBoardSurface() {
    if (currentNode?.type === TUTORIAL_NODE_TYPES.playerMove) {
      warn(currentNode.wrongClickMessage || "请在提示区域落子");
      return;
    }
    if (currentNode?.type === TUTORIAL_NODE_TYPES.playerSkill && skillPhase === "skill-board" && !currentNode.pointId) {
      runSkillAction(currentNode, "");
      return;
    }
    if (currentNode?.type === TUTORIAL_NODE_TYPES.playerSkill && skillPhase !== "skill-board") {
      warn("请点击提示按钮");
    }
  }

  function handleSkillButton() {
    if (currentNode?.type !== TUTORIAL_NODE_TYPES.playerSkill) return;
    setPendingSkill(true);
    setSkillPhase("skill-board");
    if (!currentNode.pointId) onToast?.("点击棋盘区域任意位置即可", "info");
  }

  function handleContinue() {
    if (skillPhase !== "continue" || pendingWait) return;
    goToNode(currentNode?.nextNodeId);
  }

  function handleChoice(option) {
    if (pendingWait) return;
    appendChat({
      userId: me?.user?.id ?? PLAYER_ID,
      username: me?.user?.username ?? "Player",
      text: option?.label
    });
    setChoicesVisible(false);
    schedulePendingWait(() => goToNode(option?.nextNodeId), optionTransitionDelayMs(option));
  }

  function warn(message) {
    onToast?.(message, "warning");
  }

  return (
    <Layout>
      <RoomHeader
        room={displayRoom}
        roomGameInfo={roomGameInfo}
        showCloseCountdown={false}
        showCoords={showCoords}
        exitLabel="退出/跳过"
        showUtilityControls={false}
        onOpenMessageBoard={onOpenMessageBoard}
        onOpenSettings={onOpenSettings}
        onBack={() => setConfirmExit({ reason: "exit" })}
        onToggleCoords={() => setShowCoords((value) => !value)}
      />
      <div className="tutorial-battle-screen-stage">
        <RoomBattleStage
          battleLayoutClassName={battleLayoutClassName}
          actionPanelOverride={(
            <TutorialActionPanel
              node={currentNode}
              phase={skillPhase}
              pendingWait={pendingWait}
              choicesVisible={choicesVisible}
              previewControlsEnabled={previewControlsEnabled}
              skillName={skillLabel(currentNode, characters)}
              onContinue={handleContinue}
              onSkillButton={handleSkillButton}
              onPlayerButton={() => completeAction(currentNode, applyTutorialNodeAction(gameForAction(currentNode, gameRef.current), currentNode))}
              onSkipPendingWait={skipPendingWait}
            />
          )}
          audioSettings={audioSettings}
          boardStep={null}
          canSwitchView={false}
          characters={characters}
          displayRoom={displayRoom}
          drawRequest={null}
          handleBoardSurface={handleBoardSurface}
          handlePoint={handlePoint}
          handleScoringPoint={() => {}}
          hasAnyStones={hasAnyStones}
          isLiveSpectator={false}
          isReplay={false}
          liveStep={displayRoom.game.history.length}
          me={me}
          onBack={() => setConfirmExit({ reason: "exit" })}
          onCountingRequest={() => handleGameAction({ type: "counting" })}
          onCountingRespond={() => {}}
          onDrawRequest={() => handleGameAction({ type: "draw" })}
          onDrawRespond={() => {}}
          onGameAction={handleGameAction}
          onOpenReplay={() => {}}
          onPass={() => handleGameAction({ type: "pass" })}
          onResign={() => handleGameAction({ type: "resign" })}
          onScoringAction={() => handleGameAction({ type: "scoring" })}
          opponent={opponent}
          opponentConnected
          pendingSkill={pendingSkill}
          pointConfirmation={null}
          role="player"
          scoring={displayRoom.game.scoring}
          setPendingSkill={setPendingSkill}
          setReplayStep={() => {}}
          setSpectatorStep={() => {}}
          setViewColor={() => {}}
          showPeoplePanel={false}
          showTutorialLog
          showCoords={showCoords}
          showMoves={false}
          skillAvailable={currentNode?.type === TUTORIAL_NODE_TYPES.playerSkill}
          skillEffectsEnabled={siteSettings?.skillEffectsEnabled !== false}
          skillPreview={skillPreview}
          token=""
          tutorialTargetPointId={tutorialTargetPointId}
          tutorialAnyBoardTarget={tutorialAnyBoardTarget}
          user={user}
          viewColor={me?.color ?? COLORS.black}
          winnerColor={displayRoom.game.winner?.winnerColor ?? displayRoom.game.winner?.color}
        />
        <TutorialBattleDirector
          characters={characters}
          choicesVisible={choicesVisible}
          node={currentNode}
          npcBubble={npcBubble}
          onChoice={handleChoice}
        />
        {loading && <TutorialBattleLoading loading={loading} characters={characters} players={players} />}
      </div>
      {battleMusicActive && tutorialMusic && <BackgroundMusic track={tutorialMusic} audioSettings={audioSettings} />}
      {skillPreview && <SkillBanner banner={skillPreview} characters={characters} audioSettings={audioSettings} />}
      {confirmExit && (
        <ConfirmModal
          title="结束剧情教学？"
          message="退出/跳过会结束整个剧情教学。"
          confirmText="结束脚本"
          onCancel={() => setConfirmExit(null)}
          onConfirm={() => {
            setConfirmExit(null);
            startExitLoading({ kind: "finish" });
          }}
        />
      )}
    </Layout>
  );
}

function TutorialBattleDirector({
  characters,
  choicesVisible,
  node,
  npcBubble,
  onChoice
}) {
  const options = Array.isArray(node?.options) ? node.options : [];
  return (
    <div className="tutorial-battle-director" aria-live="polite">
      {choicesVisible && options.length > 0 && <div className="tutorial-battle-choice-scrim" aria-hidden="true" />}
      {npcBubble && (
        <section
          className={`tutorial-battle-dialogue ${npcBubble.closing ? "closing" : ""}`}
          style={npcBubble.palette ? { "--tutorial-npc-color": npcBubble.palette } : undefined}
        >
          {npcBubble.characterId && <img src={findCharacter(characters, npcBubble.characterId).portrait} alt="" aria-hidden="true" />}
          <div>
            <strong>{npcBubble.speakerName}</strong>
            <p><TypewriterText key={npcBubble.id} text={npcBubble.text} /></p>
          </div>
        </section>
      )}
      {choicesVisible && options.length > 0 && (
        <section className="tutorial-battle-choice">
          {options.map((option, index) => (
            <button key={`${node.id}-${index}`} type="button" onClick={() => onChoice(option)}>
              <span>{option.label || "继续"}</span>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}

function TypewriterText({ text }) {
  const fullText = String(text ?? "");
  const [visibleText, setVisibleText] = useState(() => (
    canAnimateTypewriter() && !prefersReducedMotion() ? "" : fullText
  ));

  useEffect(() => {
    if (!fullText || !canAnimateTypewriter() || prefersReducedMotion()) {
      setVisibleText(fullText);
      return undefined;
    }

    let index = 0;
    let timeoutId = null;
    setVisibleText("");

    const reveal = () => {
      index += 1;
      setVisibleText(fullText.slice(0, index));
      if (index < fullText.length) {
        timeoutId = window.setTimeout(reveal, 28);
      }
    };

    timeoutId = window.setTimeout(reveal, 80);
    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [fullText]);

  return visibleText;
}

function npcDialogueTypewriterDurationMs(node) {
  const text = String(node?.text ?? node?.prompt ?? "");
  if (!text || !canAnimateTypewriter() || prefersReducedMotion()) return 0;
  return 80 + (text.length * 28);
}

function canAnimateTypewriter() {
  return typeof window !== "undefined" && typeof window.setTimeout === "function";
}

function prefersReducedMotion() {
  return canAnimateTypewriter() && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

function TutorialActionPanel({
  node,
  phase,
  pendingWait,
  choicesVisible,
  previewControlsEnabled,
  skillName,
  onContinue,
  onSkillButton,
  onPlayerButton,
  onSkipPendingWait
}) {
  if (!node) return <nav className="action-bar tutorial-action-bar" aria-hidden="true" />;
  const hasOptions = Array.isArray(node.options) && node.options.length > 0;
  if (choicesVisible && hasOptions) {
    return <nav className="action-bar tutorial-action-bar" aria-hidden="true" />;
  }
  if (pendingWait) {
    const buttonText = pendingWait.manualContinue ? "继续" : "立即继续";
    return (
      <nav className="action-bar tutorial-action-bar">
        {(pendingWait.manualContinue || previewControlsEnabled) && (
          <button className="tutorial-highlight-action" type="button" onClick={onSkipPendingWait}>
            <Play size={18} />
            <span>{buttonText}</span>
          </button>
        )}
      </nav>
    );
  }
  if (phase === "continue") {
    return (
      <nav className="action-bar tutorial-action-bar">
        <button className="tutorial-highlight-action" type="button" onClick={onContinue}>
          <Play size={18} />
          <span>继续</span>
        </button>
      </nav>
    );
  }
  if (phase === "skill-button") {
    return (
      <nav className="action-bar tutorial-action-bar">
        <button className="skill-action tutorial-highlight-action" type="button" onClick={onSkillButton}>
          <Sparkles size={20} />
          <span>{skillName}</span>
        </button>
      </nav>
    );
  }
  if (phase === "skill-board") {
    return <nav className="action-bar tutorial-action-bar" aria-hidden="true" />;
  }
  if (phase === "button") {
    return (
      <nav className="action-bar tutorial-action-bar">
        <button className="tutorial-highlight-action" type="button" onClick={onPlayerButton}>
          {node.type === TUTORIAL_NODE_TYPES.resign ? <Flag size={18} /> : <Calculator size={18} />}
          <span>{playerButtonText(node)}</span>
        </button>
      </nav>
    );
  }
  if (node.type === TUTORIAL_NODE_TYPES.playerMove) {
    return <nav className="action-bar tutorial-action-bar" aria-hidden="true" />;
  }
  if (isTutorialNpcNodeType(node.type) || autoSettlementNode(node)) {
    return <nav className="action-bar tutorial-action-bar" aria-hidden="true" />;
  }
  return <nav className="action-bar tutorial-action-bar" aria-hidden="true" />;
}

function TutorialBattleLoading({ loading, characters, players }) {
  const characterId = loading.node?.npcCharacterId || loading.node?.characterId || playerByUserId(players, NPC_ID)?.characterId;
  const character = findCharacter(characters, characterId);
  const progress = useTimedLoadingProgress(loading.id);
  return (
    <div className="tutorial-battle-preload-overlay" role="status" aria-live="assertive">
      <AssetPreloadScreen
        character={character}
        characters={characters}
        label={loading.text}
        progress={progress}
        showTips={false}
      />
    </div>
  );
}

function useTimedLoadingProgress(loadingId) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    let frameId = null;
    let timeoutId = null;
    setProgress(0);

    function scheduleFrame(callback) {
      if (typeof window.requestAnimationFrame === "function") {
        frameId = window.requestAnimationFrame(callback);
        return;
      }
      timeoutId = window.setTimeout(callback, 16);
    }

    function tick() {
      const nextProgress = Math.min(1, (Date.now() - start) / MIN_LOADING_MS);
      setProgress(nextProgress);
      if (nextProgress < 1) scheduleFrame(tick);
    }

    scheduleFrame(tick);
    return () => {
      if (frameId != null && typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(frameId);
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [loadingId]);

  return progress;
}

function gameForCurrentNode(game, node, players) {
  const next = cloneState(game);
  next.players = players;
  if ([TUTORIAL_NODE_TYPES.playerMove, TUTORIAL_NODE_TYPES.playerSkill].includes(node?.type)) {
    next.turn = node.color || players[0]?.color || COLORS.black;
  }
  return next;
}

function gameForAction(node, game) {
  const next = cloneState(game);
  if (node?.color) next.turn = node.color;
  if (node?.type === TUTORIAL_NODE_TYPES.playerSkill || node?.type === TUTORIAL_NODE_TYPES.npcSkill) {
    next.phase = GAME_PHASES.playing;
    next.pendingSkill = null;
  }
  return next;
}

function targetPointForNode(node, phase) {
  if (node?.type === TUTORIAL_NODE_TYPES.playerMove && node.targetHighlightEnabled !== false) return node.pointId || "";
  if (node?.type === TUTORIAL_NODE_TYPES.playerSkill && phase === "skill-board") return node.pointId || "";
  return "";
}

function skillLabel(node, characters) {
  const character = findCharacter(characters, node?.skillId || node?.skillCharacterId || node?.characterId);
  return character?.skill?.name || "技能";
}

function playerButtonNode(node) {
  return Boolean(node && node.actor === "player" && [
    TUTORIAL_NODE_TYPES.countingStart,
    TUTORIAL_NODE_TYPES.countingConfirm,
    TUTORIAL_NODE_TYPES.resign
  ].includes(node.type));
}

function autoSettlementNode(node) {
  return Boolean(node && !playerButtonNode(node) && [
    TUTORIAL_NODE_TYPES.countingStart,
    TUTORIAL_NODE_TYPES.markDead,
    TUTORIAL_NODE_TYPES.markNeutral,
    TUTORIAL_NODE_TYPES.countingConfirm,
    TUTORIAL_NODE_TYPES.resign
  ].includes(node.type));
}

function playerButtonText(node) {
  if (node?.type === TUTORIAL_NODE_TYPES.resign) return "认输";
  if (node?.type === TUTORIAL_NODE_TYPES.countingConfirm) return "确认数目";
  return "数目";
}

function isNpcLocked(node) {
  return isTutorialNpcNodeType(node?.type) || autoSettlementNode(node);
}

function skillPreviewDurationMs(pendingSkill) {
  const banner = Number(pendingSkill?.bannerDurationMs ?? 1200);
  const board = Number(pendingSkill?.boardEffectDurationMs ?? 900);
  return Math.max(300, banner + board);
}

function playerByUserId(players = [], userId) {
  return players.find((player) => player.user?.id === userId);
}
