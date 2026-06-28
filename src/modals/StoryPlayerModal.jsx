import { useEffect, useMemo, useState } from "react";
import { FastForward, X } from "lucide-react";
import { storyPortraitCatalog } from "../shared/storyPortraits.js";

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

export default function StoryPlayerModal({
  script,
  characters = {},
  labels = {},
  onClose,
  typewriterDisabled = false
}) {
  const textLabels = { ...STORY_PLAYER_DEFAULT_TEXT, ...labels };
  const nodesById = useMemo(() => new Map((script?.nodes ?? []).map((node) => [node.id, node])), [script]);
  const [nodeId, setNodeId] = useState(script?.startNodeId ?? "");
  const [visibleCount, setVisibleCount] = useState(typewriterDisabled ? currentNodeText(nodesById.get(script?.startNodeId ?? "")).length : 0);
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const node = nodesById.get(nodeId) ?? null;
  const text = currentNodeText(node);
  const typingComplete = typewriterDisabled || visibleCount >= text.length;
  const displayText = typingComplete ? text : text.slice(0, visibleCount);
  const character = resolveCharacter(node?.characterId, characters);

  useEffect(() => {
    setNodeId(script?.startNodeId ?? "");
  }, [script?.startNodeId]);

  useEffect(() => {
    setVisibleCount(typewriterDisabled ? text.length : 0);
  }, [nodeId, text.length, typewriterDisabled]);

  useEffect(() => {
    if (typewriterDisabled || !node || visibleCount >= text.length) return undefined;
    const timer = window.setTimeout(() => {
      setVisibleCount((count) => Math.min(text.length, count + 1));
    }, TYPEWRITER_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [node, text.length, typewriterDisabled, visibleCount]);

  function moveTo(nextId) {
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

  if (!node) {
    return (
      <div className="modal-backdrop onboarding-story-backdrop" onClick={onClose}>
        <section className="modal-panel onboarding-story-modal empty" onClick={(event) => event.stopPropagation()}>
          <button className="close-button" type="button" aria-label={textLabels.close} onClick={onClose}><X size={20} /></button>
          <p>{textLabels.noScript}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="modal-backdrop onboarding-story-backdrop" onClick={onClose}>
      <section className="modal-panel onboarding-story-modal" onClick={(event) => event.stopPropagation()} aria-label={textLabels.title}>
        <button className="onboarding-story-fast-forward" type="button" aria-label={textLabels.fastForward} title={textLabels.skip} onClick={() => setSkipConfirmOpen(true)}>
          <FastForward size={22} />
        </button>

        <div className="onboarding-story-portrait" aria-label={character.name || node.speakerName || ""}>
          {character.portraitUrl && <img src={character.portraitUrl} alt="" aria-hidden="true" />}
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
          {typingComplete && node.options?.length > 0 && (
            <div className="onboarding-story-options">
              {node.options.map((option) => (
                <button key={`${node.id}:${option.label}:${option.nextNodeId}`} className="primary-action" type="button" onClick={() => moveTo(nextStoryNodeId(node, option))}>
                  {option.label}
                </button>
              ))}
            </div>
          )}
          {typingComplete && !node.options?.length && (
            <button className="primary-action onboarding-story-single-action" type="button" onClick={() => moveTo(nextStoryNodeId(node))}>
              {node.nextNodeId ? textLabels.continue : textLabels.finish}
            </button>
          )}
        </footer>

        {skipConfirmOpen && (
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
        )}
      </section>
    </div>
  );
}

export function nextStoryNodeId(node, option = null) {
  return String(option?.nextNodeId ?? node?.nextNodeId ?? "").trim();
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
