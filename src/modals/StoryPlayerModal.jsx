import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { FastForward, X } from "lucide-react";
import { storyPortraitCatalog } from "../shared/storyPortraits.js";
import { isLongTextCompressPortraitEffect } from "../shared/storyPresentation.js";

export const STORY_PLAYER_DEFAULT_TEXT = Object.freeze({
  title: "剧情",
  continue: "继续",
  finish: "完成",
  skip: "跳过",
  fastForward: "快进并跳过剧情",
  skipTitle: "确认跳过剧情？",
  skipMessage: "跳过后不会影响已经完成的操作。",
  cancel: "取消",
  confirmSkip: "确认跳过",
  noScript: "暂无可播放的剧情内容",
  close: "关闭剧情",
  textLabel: "剧情对话文本"
});

const TYPEWRITER_INTERVAL_MS = 24;
const LONG_TEXT_COMPRESS_TYPEWRITER_SPEED_MULTIPLIER = 1.5;
const useStoryLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function StoryPlayerModal({
  script,
  characters = {},
  labels = {},
  onClose,
  onNavigate,
  typewriterDisabled = false
}) {
  const textLabels = { ...STORY_PLAYER_DEFAULT_TEXT, ...labels };
  const nodesById = useMemo(() => new Map((script?.nodes ?? []).map((node) => [node.id, node])), [script]);
  const startNodeId = String(script?.startNodeId ?? "");
  const [nodeId, setNodeId] = useState(startNodeId);
  const activeNodeId = resolveStoryRenderNodeId(nodeId, startNodeId, nodesById);
  const [visibleCount, setVisibleCount] = useState(typewriterDisabled ? currentNodeText(nodesById.get(activeNodeId)).length : 0);
  const [nodeTimer, setNodeTimer] = useState(() => ({ nodeId: activeNodeId, elapsedMs: 0 }));
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const node = nodesById.get(activeNodeId) ?? null;
  const text = currentNodeText(node);
  const typingComplete = typewriterDisabled || visibleCount >= text.length;
  const displayText = typingComplete ? text : text.slice(0, visibleCount);
  const character = resolveCharacter(node?.characterId, characters);
  const nodeElapsedMs = nodeTimer.nodeId === activeNodeId ? nodeTimer.elapsedMs : 0;
  const visibleOptions = visibleStoryOptions(node, { typingComplete, elapsedMs: nodeElapsedMs });
  const hasOptions = (node?.options?.length ?? 0) > 0;
  const compressPortrait = isLongTextCompressPortraitEffect(node?.effect);
  const typewriterIntervalMs = storyTypewriterIntervalMs(node?.effect);
  const modalClassName = `modal-panel onboarding-story-modal${compressPortrait ? " long-text-compress-portrait" : ""}`;
  const portraitKey = `${activeNodeId}:${node?.characterId || ""}:${character.portraitUrl || ""}`;

  useStoryLayoutEffect(() => {
    setNodeId((currentNodeId) => (currentNodeId === startNodeId ? currentNodeId : startNodeId));
    setSkipConfirmOpen(false);
  }, [startNodeId]);

  useStoryLayoutEffect(() => {
    setVisibleCount(typewriterDisabled ? text.length : 0);
    setNodeTimer({ nodeId: activeNodeId, elapsedMs: 0 });
  }, [activeNodeId, text.length, typewriterDisabled]);

  useEffect(() => {
    if (typewriterDisabled || !node || visibleCount >= text.length) return undefined;
    const timer = window.setTimeout(() => {
      setVisibleCount((count) => Math.min(text.length, count + 1));
    }, typewriterIntervalMs);
    return () => window.clearTimeout(timer);
  }, [node, text.length, typewriterDisabled, typewriterIntervalMs, visibleCount]);

  useEffect(() => {
    if (typewriterDisabled || typingComplete || !hasOptions) return undefined;
    const nextDelayMs = nextOptionRevealDelayMs(node, nodeElapsedMs);
    if (nextDelayMs == null) return undefined;
    const timer = window.setTimeout(() => {
      setNodeTimer((current) => (
        current.nodeId === activeNodeId
          ? { nodeId: activeNodeId, elapsedMs: Math.max(current.elapsedMs, nextDelayMs) }
          : current
      ));
    }, Math.max(0, nextDelayMs - nodeElapsedMs));
    return () => window.clearTimeout(timer);
  }, [activeNodeId, hasOptions, node, nodeElapsedMs, typewriterDisabled, typingComplete]);

  function moveTo(nextId) {
    if (onNavigate?.(nextId, { currentNode: node })) return;
    if (!nextId || !nodesById.has(nextId)) {
      onClose?.();
      return;
    }
    setNodeId(nextId);
  }

  function handleTextClick() {
    if (!typingComplete) setVisibleCount(text.length);
  }

  function handleTextKeyDown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleTextClick();
  }

  function requestCloseConfirmation() {
    setSkipConfirmOpen(true);
  }

  function renderSkipConfirm() {
    if (!skipConfirmOpen) return null;
    return (
      <div className="nested-modal-backdrop onboarding-story-skip-backdrop" onClick={() => setSkipConfirmOpen(false)}>
        <section className="nested-modal onboarding-story-skip-confirm" onClick={(event) => event.stopPropagation()}>
          <h3>{textLabels.skipTitle}</h3>
          <p>{textLabels.skipMessage}</p>
          <div className="inline-actions">
            <button className="danger-action" type="button" onClick={onClose}>{textLabels.confirmSkip}</button>
            <button className="secondary-action" type="button" onClick={() => setSkipConfirmOpen(false)}>{textLabels.cancel}</button>
          </div>
        </section>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="modal-backdrop onboarding-story-backdrop" onClick={requestCloseConfirmation}>
        <section className="modal-panel onboarding-story-modal empty" onClick={(event) => event.stopPropagation()}>
          <button className="close-button" type="button" aria-label={textLabels.close} onClick={requestCloseConfirmation}><X size={20} /></button>
          <p>{textLabels.noScript}</p>
          {renderSkipConfirm()}
        </section>
      </div>
    );
  }

  return (
    <div className="modal-backdrop onboarding-story-backdrop" onClick={requestCloseConfirmation}>
      <section className={modalClassName} data-story-effect={node.effect || undefined} onClick={(event) => event.stopPropagation()} aria-label={textLabels.title}>
        <button className="onboarding-story-fast-forward" type="button" aria-label={textLabels.fastForward} title={textLabels.skip} onClick={requestCloseConfirmation}>
          <FastForward size={22} />
        </button>

        <div
          className="onboarding-story-portrait"
          data-story-node-id={activeNodeId}
          data-story-character-id={node.characterId || ""}
          aria-label={character.name || node.speakerName || ""}
        >
          {character.portraitUrl && (
            <img
              key={portraitKey}
              src={character.portraitUrl}
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="sync"
            />
          )}
          <div>
            <span>{node.speakerName || character.name}</span>
          </div>
        </div>

        <div
          className="onboarding-story-text-button"
          role="button"
          tabIndex={0}
          aria-label={textLabels.textLabel}
          onClick={handleTextClick}
          onKeyDown={handleTextKeyDown}
        >
          <span>{displayText}</span>
          {!typingComplete && <i aria-hidden="true" />}
        </div>

        <footer className="onboarding-story-actions">
          {visibleOptions.length > 0 && (
            <div className="onboarding-story-options">
              {visibleOptions.map((option) => (
                <button key={`${node.id}:${option.label}:${option.nextNodeId}`} className="primary-action" type="button" onClick={() => moveTo(nextStoryNodeId(node, option))}>
                  {option.label}
                </button>
              ))}
            </div>
          )}
          {typingComplete && !hasOptions && (
            <button className="primary-action onboarding-story-single-action" type="button" onClick={() => moveTo(nextStoryNodeId(node))}>
              {node.nextNodeId ? textLabels.continue : textLabels.finish}
            </button>
          )}
        </footer>

        {renderSkipConfirm()}
      </section>
    </div>
  );
}

export function nextStoryNodeId(node, option = null) {
  return String(option?.nextNodeId ?? node?.nextNodeId ?? "").trim();
}

export function resolveStoryRenderNodeId(currentNodeId, startNodeId, nodesById) {
  const nodeId = String(currentNodeId ?? "");
  if (nodeId && nodesById?.has(nodeId)) return nodeId;
  return String(startNodeId ?? "");
}

export function visibleStoryOptions(node, { typingComplete = false, elapsedMs = 0 } = {}) {
  const options = Array.isArray(node?.options) ? node.options : [];
  if (typingComplete) return options;
  return options.filter((option) => {
    const delayMs = optionRevealDelayMs(option);
    return delayMs != null && elapsedMs >= delayMs;
  });
}

export function optionRevealDelayMs(option) {
  const value = typeof option?.revealDelaySeconds === "string"
    ? option.revealDelaySeconds.trim()
    : option?.revealDelaySeconds;
  if (value == null || value === "") return null;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : null;
}

export function storyTypewriterIntervalMs(effect) {
  return isLongTextCompressPortraitEffect(effect)
    ? Math.round(TYPEWRITER_INTERVAL_MS / LONG_TEXT_COMPRESS_TYPEWRITER_SPEED_MULTIPLIER)
    : TYPEWRITER_INTERVAL_MS;
}

function nextOptionRevealDelayMs(node, elapsedMs) {
  const delays = (node?.options ?? [])
    .map(optionRevealDelayMs)
    .filter((delayMs) => delayMs != null && delayMs > elapsedMs);
  return delays.length ? Math.min(...delays) : null;
}

function currentNodeText(node) {
  return String(node?.text ?? "");
}

function resolveCharacter(characterId, characters) {
  const id = String(characterId ?? "").trim();
  const catalog = storyPortraitCatalog(characters);
  const direct = catalog[id] ?? {};
  const byName = Object.values(catalog).find((character) => {
    const names = [
      character?.name,
      character?.displayName,
      character?.id,
      character?.slug
    ].map((value) => String(value ?? "").trim()).filter(Boolean);
    return names.includes(id);
  }) ?? {};
  const character = direct.name || direct.portraitUrl || direct.portrait ? direct : byName;
  const portraitUrl = character.portraitUrl || character.portrait || character.imageUrl || "";
  return {
    ...character,
    portraitUrl
  };
}
