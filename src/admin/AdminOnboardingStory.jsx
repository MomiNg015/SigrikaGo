import { useEffect, useMemo, useState } from "react";
import { FilePlus2, Plus, RefreshCw, Save, Trash2, Upload } from "lucide-react";
import { adminApi } from "../api/client.js";
import StoryPlayerModal from "../modals/StoryPlayerModal.jsx";
import { storyPortraitCatalog, storyPortraitOptions } from "../shared/storyPortraits.js";
import { AdminSectionHeader, AdminStatusPill } from "./adminComponents.jsx";

const TRIGGER_TYPES = Object.freeze({
  onboarding: "onboarding",
  itemCharacterUse: "item-character-use",
  battleTutorialStart: "battle-tutorial-start"
});

const ITEM_OPTIONS = Object.freeze([
  { id: "rainbow-bean-candy", name: "彩虹豆豆跳跳糖" }
]);

const TEXT = Object.freeze({
  title: "剧情脚本",
  meta: "维护新手引导、道具互动和后续教学演出的通用剧情脚本",
  refresh: "刷新",
  newScript: "新建脚本",
  addNode: "添加节点",
  saveDraft: "保存草稿",
  publish: "发布",
  script: "脚本",
  key: "Key",
  scriptTitle: "标题",
  triggerType: "触发器",
  item: "道具",
  characterTarget: "目标角色",
  startNode: "起始节点",
  nodeId: "节点 ID",
  speakerName: "说话人",
  character: "立绘角色",
  text: "正文",
  nextNodeId: "下一节点",
  options: "选项",
  addOption: "添加选项",
  label: "选项文案",
  target: "目标节点",
  preview: "预览",
  draft: "草稿",
  published: "已发布",
  saved: "已保存",
  publishedNotice: "已发布"
});

export default function AdminOnboardingStory({ token, characters = [], onNotice }) {
  const [scripts, setScripts] = useState([]);
  const [script, setScript] = useState(() => emptyStoryScript());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const characterCatalog = useMemo(() => storyPortraitCatalog(characters), [characters]);
  const portraitOptions = useMemo(() => storyPortraitOptions(characters), [characters]);

  useEffect(() => {
    refresh();
  }, [token]);

  async function refresh(nextKey = script.key) {
    if (!token) return;
    setLoading(true);
    setFieldError("");
    try {
      const data = await adminApi("/story-scripts", token);
      const nextScripts = data.scripts ?? [];
      setScripts(nextScripts);
      const selected = nextScripts.find((entry) => entry.key === nextKey) ?? nextScripts[0] ?? emptyStoryScript();
      setScript(normalizeStoryScript(selected));
    } catch (error) {
      setFieldError(error.message);
      onNotice?.(error.message);
    } finally {
      setLoading(false);
    }
  }

  function createScript() {
    const key = uniqueScriptKey(scripts);
    setScript(emptyStoryScript({
      key,
      title: "新的剧情脚本",
      triggerType: TRIGGER_TYPES.itemCharacterUse,
      triggerParams: {
        itemId: ITEM_OPTIONS[0].id,
        characterId: characters[0]?.slug ?? ""
      }
    }));
  }

  async function selectScript(key) {
    const cached = scripts.find((entry) => entry.key === key);
    if (cached) {
      setScript(normalizeStoryScript(cached));
      return;
    }
    if (!token || !key) return;
    setLoading(true);
    try {
      const data = await adminApi(`/story-scripts/${encodeURIComponent(key)}`, token);
      setScript(normalizeStoryScript(data.script));
    } catch (error) {
      setFieldError(error.message);
      onNotice?.(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function submit(action) {
    setSubmitting(true);
    setFieldError("");
    try {
      const payload = toSubmitPayload(script, action);
      const data = await adminApi(`/story-scripts/${encodeURIComponent(script.key)}`, token, {
        method: "PATCH",
        body: payload
      });
      setScript(normalizeStoryScript(data.script));
      await refresh(data.script?.key ?? script.key);
      onNotice?.(action === "publish" ? TEXT.publishedNotice : TEXT.saved, "success");
    } catch (error) {
      setFieldError(error.message);
      onNotice?.(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  function updateDraft(patch) {
    setScript((current) => ({ ...current, draft: { ...current.draft, ...patch } }));
  }

  function updateNode(index, patch) {
    updateDraft({
      nodes: script.draft.nodes.map((node, nodeIndex) => nodeIndex === index ? { ...node, ...patch } : node)
    });
  }

  function addNode() {
    setScript((current) => {
      const nextId = uniqueNodeId(current.draft.nodes);
      const draft = {
        startNodeId: current.draft.startNodeId || nextId,
        nodes: [
          ...current.draft.nodes,
          { id: nextId, speakerName: "", characterId: characters[0]?.slug ?? "", text: "", nextNodeId: "", options: [] }
        ]
      };
      return { ...current, draft };
    });
  }

  function removeNode(index) {
    const removedId = script.draft.nodes[index]?.id;
    const nodes = script.draft.nodes.filter((_, nodeIndex) => nodeIndex !== index);
    updateDraft({
      startNodeId: script.draft.startNodeId === removedId ? (nodes[0]?.id ?? "") : script.draft.startNodeId,
      nodes
    });
  }

  return (
    <section className="admin-onboarding-story">
      <AdminSectionHeader title={TEXT.title} meta={TEXT.meta} actionLabel={TEXT.addNode} onAction={addNode}>
        <button className="secondary-action" type="button" onClick={createScript}>
          <FilePlus2 size={16} />{TEXT.newScript}
        </button>
        <button className="secondary-action" type="button" onClick={() => refresh()} disabled={loading}>
          <RefreshCw size={16} />{TEXT.refresh}
        </button>
      </AdminSectionHeader>

      <div className="admin-onboarding-layout">
        <section className="admin-card admin-onboarding-editor">
          <div className="admin-onboarding-editor-head">
            <label>
              {TEXT.script}
              <select value={scripts.some((entry) => entry.key === script.key) ? script.key : ""} onChange={(event) => selectScript(event.target.value)}>
                {!scripts.some((entry) => entry.key === script.key) && <option value="">未保存的新脚本</option>}
                {scripts.map((entry) => <option key={entry.key} value={entry.key}>{entry.title || entry.key}</option>)}
              </select>
            </label>
            <AdminStatusPill tone={script.isPublished ? "green" : "neutral"}>
              {script.isPublished ? TEXT.published : TEXT.draft}
            </AdminStatusPill>
          </div>

          <div className="admin-onboarding-node-grid">
            <label>{TEXT.key}<input value={script.key} onChange={(event) => setScript((current) => ({ ...current, key: event.target.value }))} /></label>
            <label>{TEXT.scriptTitle}<input value={script.title} onChange={(event) => setScript((current) => ({ ...current, title: event.target.value }))} /></label>
            <label>
              {TEXT.triggerType}
              <select value={script.triggerType} onChange={(event) => setScript((current) => nextTriggerScript(current, event.target.value, characters))}>
                <option value={TRIGGER_TYPES.onboarding}>新手引导</option>
                <option value={TRIGGER_TYPES.itemCharacterUse}>道具作用到角色</option>
                <option value={TRIGGER_TYPES.battleTutorialStart}>对弈教学预留</option>
              </select>
            </label>
            {script.triggerType === TRIGGER_TYPES.itemCharacterUse && (
              <>
                <label>
                  {TEXT.item}
                  <select value={script.triggerParams.itemId ?? ""} onChange={(event) => updateTriggerParams(script, setScript, { itemId: event.target.value })}>
                    {ITEM_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
                <label>
                  {TEXT.characterTarget}
                  <select value={script.triggerParams.characterId ?? ""} onChange={(event) => updateTriggerParams(script, setScript, { characterId: event.target.value })}>
                    <option value="">未选择</option>
                    {characters.map((character) => <option key={character.slug} value={character.slug}>{character.name}</option>)}
                  </select>
                </label>
              </>
            )}
            <label>
              {TEXT.startNode}
              <select value={script.draft.startNodeId} onChange={(event) => updateDraft({ startNodeId: event.target.value })}>
                <option value="">未选择</option>
                {script.draft.nodes.map((node) => <option key={node.id} value={node.id}>{node.id || "(空 ID)"}</option>)}
              </select>
            </label>
          </div>

          <div className="admin-onboarding-node-list">
            {script.draft.nodes.map((node, index) => (
              <article className="admin-onboarding-node" key={`${index}:${node.id}`}>
                <header>
                  <strong>{node.id || `${TEXT.nodeId} ${index + 1}`}</strong>
                  <button className="danger-action icon-only" type="button" aria-label="删除节点" onClick={() => removeNode(index)}>
                    <Trash2 size={16} />
                  </button>
                </header>
                <div className="admin-onboarding-node-grid">
                  <label>{TEXT.nodeId}<input value={node.id} onChange={(event) => updateNode(index, { id: event.target.value })} /></label>
                  <label>{TEXT.speakerName}<input value={node.speakerName} onChange={(event) => updateNode(index, { speakerName: event.target.value })} /></label>
                  <label>
                    {TEXT.character}
                    <select value={node.characterId} onChange={(event) => updateNode(index, { characterId: event.target.value })}>
                      <option value="">无</option>
                      {portraitOptions.map((character) => <option key={character.slug} value={character.slug}>{character.name}</option>)}
                    </select>
                  </label>
                  <label>{TEXT.nextNodeId}<input value={node.nextNodeId} onChange={(event) => updateNode(index, { nextNodeId: event.target.value })} /></label>
                </div>
                <label className="admin-onboarding-textarea">{TEXT.text}<textarea rows={4} value={node.text} onChange={(event) => updateNode(index, { text: event.target.value })} /></label>
                <div className="admin-onboarding-options">
                  <div className="admin-onboarding-options-title">
                    <span>{TEXT.options}</span>
                    <button className="secondary-action" type="button" onClick={() => updateNode(index, { options: [...(node.options ?? []), { label: "", nextNodeId: "" }] })}>
                      <Plus size={16} />{TEXT.addOption}
                    </button>
                  </div>
                  {(node.options ?? []).map((option, optionIndex) => (
                    <div className="admin-onboarding-option-row" key={optionIndex}>
                      <input aria-label={TEXT.label} placeholder={TEXT.label} value={option.label} onChange={(event) => updateOption(node, index, optionIndex, { label: event.target.value }, updateNode)} />
                      <input aria-label={TEXT.target} placeholder={TEXT.target} value={option.nextNodeId} onChange={(event) => updateOption(node, index, optionIndex, { nextNodeId: event.target.value }, updateNode)} />
                      <button className="danger-action icon-only" type="button" aria-label="删除选项" onClick={() => updateNode(index, { options: node.options.filter((_, i) => i !== optionIndex) })}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          {fieldError && <p className="form-error">{fieldError}</p>}
          <div className="inline-actions admin-onboarding-actions">
            <button className="secondary-action" type="button" disabled={submitting} onClick={() => submit("save-draft")}><Save size={16} />{TEXT.saveDraft}</button>
            <button className="primary-action" type="button" disabled={submitting} onClick={() => submit("publish")}><Upload size={16} />{TEXT.publish}</button>
            {script.publishedAt && <small>{TEXT.published}: {formatDateTime(script.publishedAt)}</small>}
          </div>
        </section>

        <aside className="admin-card admin-onboarding-preview">
          <h3>{TEXT.preview}</h3>
          <StoryPlayerModal script={script.draft} characters={characterCatalog} labels={{ title: script.title || TEXT.preview }} typewriterDisabled onClose={() => {}} />
        </aside>
      </div>
    </section>
  );
}

function updateTriggerParams(script, setScript, patch) {
  setScript({
    ...script,
    triggerParams: {
      ...script.triggerParams,
      ...patch
    }
  });
}

function nextTriggerScript(script, triggerType, characters) {
  const triggerParams = triggerType === TRIGGER_TYPES.itemCharacterUse
    ? { itemId: ITEM_OPTIONS[0].id, characterId: characters[0]?.slug ?? "" }
    : {};
  return { ...script, triggerType, triggerParams };
}

function toSubmitPayload(script, action) {
  return {
    action,
    title: script.title,
    triggerType: script.triggerType,
    triggerParams: script.triggerParams,
    draft: script.draft
  };
}

function updateOption(node, nodeIndex, optionIndex, patch, updateNode) {
  updateNode(nodeIndex, {
    options: node.options.map((option, index) => index === optionIndex ? { ...option, ...patch } : option)
  });
}

function normalizeStoryScript(value = {}) {
  return {
    ...emptyStoryScript(),
    ...value,
    triggerParams: value.triggerParams ?? {},
    draft: value.draft ?? emptyScript(),
    publishedAt: value.publishedAt ?? value.firstPublishedAt ?? null
  };
}

function uniqueScriptKey(scripts) {
  let index = scripts.length + 1;
  let key = `story.custom.${index}`;
  const existing = new Set(scripts.map((entry) => entry.key));
  while (existing.has(key)) {
    index += 1;
    key = `story.custom.${index}`;
  }
  return key;
}

function uniqueNodeId(nodes) {
  let index = nodes.length + 1;
  let id = `node-${index}`;
  const existing = new Set(nodes.map((node) => node.id));
  while (existing.has(id)) {
    index += 1;
    id = `node-${index}`;
  }
  return id;
}

function emptyStoryScript(overrides = {}) {
  return {
    key: "onboarding.default",
    title: "新手引导",
    triggerType: TRIGGER_TYPES.onboarding,
    triggerParams: {},
    draft: emptyScript(),
    isPublished: false,
    publishedAt: null,
    ...overrides
  };
}

function emptyScript() {
  return { startNodeId: "", nodes: [] };
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
