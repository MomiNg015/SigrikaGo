import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import AssetPreloadScreen from "../app/AssetPreloadScreen.jsx";
import StoryPlayerModal from "../modals/StoryPlayerModal.jsx";
import SkillBanner from "../modals/SkillBanner.jsx";
import Board from "../room/Board.jsx";
import { findCharacter } from "../shared/characterDisplay.js";
import { TUTORIAL_NODE_TYPES, isStoryNodeType } from "../shared/tutorialNodeTypes.js";
import {
  applyTutorialSkillAction,
  applyTutorialNodeAction,
  createTutorialGameState
} from "./tutorialGameState.js";

const BOARD_SETUP_ENTRY_LOADING_TEXT = "正在激烈对局中...";

export default function TutorialSessionModal({
  script,
  characters = {},
  labels = {},
  onClose,
  onComplete,
  onEnterBattle,
  typewriterDisabled = false
}) {
  const nodesById = useMemo(() => new Map((script?.nodes ?? []).map((node) => [node.id, node])), [script]);
  const [nodeId, setNodeId] = useState(script?.startNodeId ?? "");
  const [game, setGame] = useState(() => createTutorialGameState({ initialBoard: script?.initialBoard }));
  const [feedback, setFeedback] = useState("");
  const [skillStep, setSkillStep] = useState("idle");
  const [selectedSkillTarget, setSelectedSkillTarget] = useState("");
  const [resolvedSkillState, setResolvedSkillState] = useState(null);
  const enteredBattleNodeRef = useRef("");
  const node = nodesById.get(nodeId) ?? null;

  useEffect(() => {
    setNodeId(script?.startNodeId ?? "");
    setGame(createTutorialGameState({ initialBoard: script?.initialBoard }));
    setFeedback("");
    enteredBattleNodeRef.current = "";
    resetSkillFlow();
  }, [script]);

  useLayoutEffect(() => {
    if (node?.type !== TUTORIAL_NODE_TYPES.boardSetup) return;
    if (onEnterBattle) {
      if (enteredBattleNodeRef.current === node.id) return;
      enteredBattleNodeRef.current = node.id;
      onEnterBattle({ script, startNodeId: node.id });
      return;
    }
    const result = applyTutorialNodeAction(game, node);
    if (!result.ok) {
      setFeedback(result.message || labels.boardSetupError || "教学局面切换失败。");
      return;
    }
    setGame(result.state);
    goToNode(node.nextNodeId);
  }, [game, labels.boardSetupError, node, onEnterBattle, script]);

  function finishSession() {
    onComplete?.();
    onClose?.();
  }

  function goToNode(nextId) {
    const targetId = String(nextId ?? "").trim();
    if (!targetId) {
      finishSession();
      return true;
    }
    if (!nodesById.has(targetId)) {
      onClose?.();
      return true;
    }
    setNodeId(targetId);
    setFeedback("");
    resetSkillFlow();
    return true;
  }

  function completeAction(result) {
    if (!result.ok) {
      setFeedback(result.message || labels.wrongPoint || "请按提示完成这一步。");
      return;
    }
    setGame(result.state);
    goToNode(node.nextNodeId);
  }

  function handlePoint(point) {
    if (node?.type === TUTORIAL_NODE_TYPES.playerSkill && skillStep === "targeting") {
      if (node.pointId && point.id !== node.pointId) {
        setFeedback(node.wrongClickMessage || labels.wrongPoint || "请按提示选择技能目标。");
        return;
      }
      setSelectedSkillTarget(point.id);
      setSkillStep("confirm");
      setFeedback("");
      return;
    }
    if (node?.type !== TUTORIAL_NODE_TYPES.playerMove) return;
    completeAction(applyTutorialNodeAction(game, node, { pointId: point.id }));
  }

  function handleGuidedAction() {
    if (node?.type === TUTORIAL_NODE_TYPES.npcSkill) {
      confirmSkill(node.pointId ?? "");
      return;
    }
    completeAction(applyTutorialNodeAction(game, node));
  }

  function startSkillFlow() {
    if (node.pointId) {
      setSkillStep("targeting");
      setFeedback("");
      return;
    }
    setSkillStep("confirm");
    setFeedback("");
  }

  function confirmSkill(targetId = selectedSkillTarget || node.pointId || "") {
    const result = applyTutorialSkillAction(game, node, {
      pointId: targetId || undefined,
      pendingSkillId: `${node.id || "tutorial-skill"}-preview`
    });
    if (!result.ok) {
      setFeedback(result.message || labels.wrongPoint || "技能施放失败。");
      return;
    }
    setGame(result.state);
    setResolvedSkillState(result.resolvedState);
    setSkillStep("preview");
    setFeedback("");
  }

  function showSkillResult() {
    if (!resolvedSkillState) return;
    setGame(resolvedSkillState);
    setResolvedSkillState(null);
    goToNode(node.nextNodeId);
  }

  function resetSkillFlow() {
    setSkillStep("idle");
    setSelectedSkillTarget("");
    setResolvedSkillState(null);
  }

  if (!node || isStoryNodeType(node.type)) {
    return (
      <StoryPlayerModal
        script={storyOnlyScript(script, node)}
        characters={characters}
        labels={labels}
        onClose={onClose}
        onNavigate={goToNode}
        typewriterDisabled={typewriterDisabled}
      />
    );
  }

  if (node.type === TUTORIAL_NODE_TYPES.boardSetup) {
    if (onEnterBattle) {
      return (
        <div
          className="tutorial-session-handoff-preload"
          data-tutorial-node-type={node.type}
          role="status"
          aria-live="assertive"
        >
          <AssetPreloadScreen
            character={boardSetupLoadingCharacter(node, characters)}
            characters={characters}
            label={BOARD_SETUP_ENTRY_LOADING_TEXT}
            progress={0}
            showTips={false}
          />
        </div>
      );
    }

    return (
      <div className="modal-backdrop tutorial-session-backdrop">
        <section
          className="tutorial-battle-session"
          data-tutorial-node-type={node.type}
          aria-label={labels.title ?? "对弈教学"}
        >
          <div className="tutorial-battle-npc-bubble">
            {node.prompt || "正在切换教学局面..."}
          </div>
          {feedback && <strong className="tutorial-battle-feedback">{feedback}</strong>}
        </section>
      </div>
    );
  }

  return (
    <div className="modal-backdrop tutorial-session-backdrop">
      <section
        className="tutorial-battle-session"
        data-tutorial-node-type={node.type}
        aria-label={labels.title ?? "对弈教学"}
      >
        <div className="tutorial-battle-npc-bubble">
          {node.prompt || node.text || "请按提示完成这一步。"}
        </div>
        <div className="tutorial-battle-layout">
          <div className="tutorial-battle-board-stage">
            <Board
              game={boardGameForNode(game, node, skillStep)}
              showCoords
              showMoves={false}
              pendingSkill={isBoardTargetingNode(node, skillStep)}
              skillEffectsEnabled
              stoneJitter={false}
              previewPlayer={previewPlayerForNode(game, node)}
              onPoint={handlePoint}
            />
          </div>
          <div className="tutorial-battle-actions" aria-live="polite">
            <p className="tutorial-battle-action-hint">
              {battleActionHint(node, labels)}
            </p>
            {node.pointId && <span className="tutorial-battle-target">{node.pointId}</span>}
            {node.type === TUTORIAL_NODE_TYPES.npcMove && (
              <button className="primary-action tutorial-npc-move-action" type="button" onClick={handleGuidedAction}>
                {labels.npcMove ?? "播放落子"}
              </button>
            )}
            {node.type === TUTORIAL_NODE_TYPES.playerSkill && skillStep === "idle" && (
              <button className="primary-action tutorial-skill-action" type="button" onClick={startSkillFlow}>
                {labels.skill ?? "发动技能"}
              </button>
            )}
            {node.type === TUTORIAL_NODE_TYPES.playerSkill && skillStep === "confirm" && (
              <button className="primary-action tutorial-skill-confirm-action" type="button" onClick={() => confirmSkill()}>
                {labels.confirmSkill ?? "确认施放"}
              </button>
            )}
            {node.type === TUTORIAL_NODE_TYPES.npcSkill && skillStep === "idle" && (
              <button className="primary-action tutorial-skill-action" type="button" onClick={handleGuidedAction}>
                {labels.npcSkill ?? "播放技能"}
              </button>
            )}
            {skillStep === "preview" && (
              <button className="primary-action tutorial-skill-result-action" type="button" onClick={showSkillResult}>
                {labels.skillResult ?? "显示结果"}
              </button>
            )}
            {node.type === TUTORIAL_NODE_TYPES.resign && (
              <button className="primary-action tutorial-resign-action" type="button" onClick={handleGuidedAction}>
                {labels.resign ?? "认输"}
              </button>
            )}
            {feedback && <strong className="tutorial-battle-feedback">{feedback}</strong>}
          </div>
        </div>
        {game.pendingSkill && <SkillBanner banner={game.pendingSkill} characters={characters} />}
      </section>
    </div>
  );
}

function storyOnlyScript(script, node) {
  if (!node) return script;
  return {
    ...script,
    startNodeId: node.id,
    nodes: [node]
  };
}

function boardSetupLoadingCharacter(node, characters) {
  const characterId = node?.npcCharacterId || node?.characterId || node?.playerCharacterId || "";
  return characterId ? findCharacter(characters, characterId) : null;
}

function previewPlayerForNode(game, node) {
  if (![TUTORIAL_NODE_TYPES.playerMove, TUTORIAL_NODE_TYPES.playerSkill].includes(node?.type)) return null;
  return game.players.find((player) => player.color === node.color) ?? null;
}

function battleActionHint(node, labels) {
  if (node?.type === TUTORIAL_NODE_TYPES.playerMove) {
    return labels.playerMoveHint ?? "在棋盘上点击提示位置。";
  }
  if (node?.type === TUTORIAL_NODE_TYPES.npcMove) {
    return labels.npcMoveHint ?? "观看 NPC 的下一手。";
  }
  if (node?.type === TUTORIAL_NODE_TYPES.playerSkill) {
    return labels.playerSkillHint ?? "按引导完成技能施放。";
  }
  if (node?.type === TUTORIAL_NODE_TYPES.npcSkill) {
    return labels.npcSkillHint ?? "观看 NPC 的技能。";
  }
  if (node?.type === TUTORIAL_NODE_TYPES.resign) {
    return labels.resignHint ?? "按引导执行认输。";
  }
  return labels.continue ?? "继续";
}

function isBoardTargetingNode(node, skillStep) {
  return node?.type === TUTORIAL_NODE_TYPES.playerSkill && skillStep === "targeting";
}

function boardGameForNode(game, node, skillStep) {
  if (!isBoardTargetingNode(node, skillStep) || !node.color) return game;
  return { ...game, turn: node.color };
}
