import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Circle,
  Copy,
  Eraser,
  Eye,
  FileDown,
  FileUp,
  FilePlus2,
  GitBranch,
  HelpCircle,
  MousePointer2,
  PauseCircle,
  Play,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { adminApi } from "../api/client.js";
import Board from "../room/Board.jsx";
import { COLORS, createGameState, getPoint, isPlayerColor } from "../shared/game.js";
import { characterListFromCatalog, CHARACTERS } from "../shared/characters.js";
import { SKILL_EFFECT_CATALOG } from "../shared/skillEffectCatalog.js";
import { STORY_NODE_EFFECT_OPTIONS, STORY_NODE_EFFECTS } from "../shared/storyPresentation.js";
import { storyPortraitCatalog, storyPortraitOptions } from "../shared/storyPortraits.js";
import {
  NODE_ADVANCE_MODES,
  nodeAdvanceMode,
  nodeAdvanceModePatch
} from "../shared/storyTiming.js";
import {
  TUTORIAL_NODE_TYPES,
  isStoryNodeType,
  isTutorialNpcNodeType,
  nodeTypeRequiresPoint
} from "../shared/tutorialNodeTypes.js";
import { gameModeById } from "../shared/gameModes.js";
import {
  applyTutorialNodeAction,
  applyTutorialSkillAction,
  createTutorialGameState
} from "../tutorial/tutorialGameState.js";
import TutorialBattleScreen from "../tutorial/TutorialBattleScreen.jsx";
import TutorialSessionModal from "../tutorial/TutorialSessionModal.jsx";
import { AdminSectionHeader, AdminStatusPill } from "./adminComponents.jsx";
import {
  parseStoryScriptWorkbook,
  storyScriptWorkbookFileName,
  writeStoryScriptWorkbook
} from "./storyScriptWorkbook.js";

const TRIGGER_TYPES = Object.freeze({
  onboarding: "onboarding",
  itemCharacterUse: "item-character-use",
  battleTutorialStart: "battle-tutorial-start"
});

const ONBOARDING_STORY_KEY = "onboarding.default";
const END_TARGET = "__story-end__";
const ADMIN_PREVIEW_USER = Object.freeze({
  id: "admin-preview-user",
  username: "预览玩家",
  rank: "",
  rating: ""
});

const PURPOSES = Object.freeze([
  {
    id: "onboarding",
    label: "新手引导",
    group: "新手引导",
    triggerType: TRIGGER_TYPES.onboarding,
    title: "新的新手引导",
    keyPrefix: "onboarding.custom",
    initialBoard: null
  },
  {
    id: "item-interaction",
    label: "道具互动",
    group: "道具互动",
    triggerType: TRIGGER_TYPES.itemCharacterUse,
    title: "新的道具互动",
    keyPrefix: "item.story",
    initialBoard: null
  },
  {
    id: "battle-tutorial",
    label: "对弈教学",
    group: "对弈教学",
    triggerType: TRIGGER_TYPES.battleTutorialStart,
    title: "新的对弈教学",
    keyPrefix: "tutorial.battle",
    initialBoard: { mode: "spark", stones: [] }
  },
  {
    id: "mixed",
    label: "混合剧情教学",
    group: "混合剧情教学",
    triggerType: TRIGGER_TYPES.battleTutorialStart,
    title: "新的混合剧情教学",
    keyPrefix: "tutorial.mixed",
    initialBoard: { mode: "spark", stones: [] }
  }
]);

const NODE_TYPE_GROUPS = Object.freeze([
  {
    label: "剧情步骤",
    options: [
      { value: TUTORIAL_NODE_TYPES.story, label: "剧情对白" }
    ]
  },
  {
    label: "对弈步骤",
    options: [
      { value: TUTORIAL_NODE_TYPES.boardSetup, label: "设置局面" },
      { value: TUTORIAL_NODE_TYPES.npcDialogue, label: "NPC 对话" },
      { value: TUTORIAL_NODE_TYPES.playerChoice, label: "玩家选项" },
      { value: TUTORIAL_NODE_TYPES.playerMove, label: "玩家落子" },
      { value: TUTORIAL_NODE_TYPES.npcMove, label: "NPC 落子" },
      { value: TUTORIAL_NODE_TYPES.playerSkill, label: "玩家技能" },
      { value: TUTORIAL_NODE_TYPES.npcSkill, label: "NPC 技能" }
    ]
  },
  {
    label: "结算步骤",
    options: [
      { value: TUTORIAL_NODE_TYPES.countingStart, label: "开始数目" },
      { value: TUTORIAL_NODE_TYPES.markDead, label: "标死子" },
      { value: TUTORIAL_NODE_TYPES.markNeutral, label: "标中立点" },
      { value: TUTORIAL_NODE_TYPES.countingConfirm, label: "确认数目" },
      { value: TUTORIAL_NODE_TYPES.resign, label: "认输" }
    ]
  }
]);

const NODE_TYPE_LABELS = Object.freeze(Object.fromEntries(
  NODE_TYPE_GROUPS.flatMap((group) => group.options.map((option) => [option.value, option.label]))
));

const NODE_CATEGORY_LABELS = Object.freeze(Object.fromEntries(
  NODE_TYPE_GROUPS.flatMap((group) => group.options.map((option) => [option.value, group.label]))
));

const COLOR_OPTIONS = Object.freeze([
  { value: "", label: "未指定" },
  { value: "black", label: "黑棋" },
  { value: "white", label: "白棋" }
]);

const TEXT = Object.freeze({
  title: "剧情教学",
  meta: "维护新手引导、道具互动和本地对弈教学脚本",
  refresh: "刷新",
  saveDraft: "保存草稿",
  publish: "发布",
  unpublish: "停用",
  previewStart: "从开头预览",
  previewCurrent: "从当前步骤预览",
  help: "完整说明",
  issues: "实时问题",
  noIssues: "暂无需要修复的问题",
  systemScript: "系统脚本",
  draft: "草稿",
  published: "已发布",
  saved: "草稿已保存",
  publishedNotice: "脚本已发布",
  unpublishedNotice: "脚本已停用",
  deletedNotice: "脚本已删除"
});

export default function AdminOnboardingStory({ token, characters = [], items = [], onNotice }) {
  const [scripts, setScripts] = useState([]);
  const [script, setScript] = useState(() => emptyStoryScript());
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [boardEditorOpen, setBoardEditorOpen] = useState(false);
  const [nodeBoardEditorId, setNodeBoardEditorId] = useState("");
  const [pointPicker, setPointPicker] = useState(null);
  const [previewMode, setPreviewMode] = useState("start");
  const [previewOverlayOpen, setPreviewOverlayOpen] = useState(false);
  const [previewBattleSession, setPreviewBattleSession] = useState(null);
  const [previewStoryStartId, setPreviewStoryStartId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [pendingImport, setPendingImport] = useState(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState("");
  const [nodeSettingsWindow, setNodeSettingsWindow] = useState({ open: false, x: 24, y: 96 });
  const importInputRef = useRef(null);
  const workbenchRef = useRef(null);
  const selectedNodeRef = useRef("");
  const flowNodeRefs = useRef(new Map());
  const characterCatalog = useMemo(() => storyPortraitCatalog(characters), [characters]);
  const gameCharacterCatalog = useMemo(() => adminCharacterCatalog(characters), [characters]);
  const portraitOptions = useMemo(() => storyPortraitOptions(characters), [characters]);
  const skillCharacters = useMemo(() => adminSkillCharacters(characters), [characters]);
  const itemOptions = useMemo(() => adminItemOptions(items), [items]);
  const issues = useMemo(() => validateWorkbench(script, { itemOptions, skillCharacters }), [script, itemOptions, skillCharacters]);
  const flow = useMemo(() => buildFlow(script.draft), [script.draft]);
  const selectedNode = useMemo(
    () => script.draft.nodes.find((node) => node.id === selectedNodeId) ?? script.draft.nodes[0] ?? null,
    [script.draft.nodes, selectedNodeId]
  );
  const previewScript = useMemo(
    () => previewMode === "current"
      ? scriptForCurrentPreview(script.draft, selectedNode?.id)
      : script.draft,
    [previewMode, script.draft, selectedNode?.id]
  );

  useEffect(() => {
    refresh();
  }, [token]);

  useEffect(() => {
    selectedNodeRef.current = selectedNodeId;
  }, [selectedNodeId]);

  useEffect(() => {
    if (!script.draft.nodes.length) {
      setSelectedNodeId("");
      closeNodeSettings();
      return;
    }
    if (!script.draft.nodes.some((node) => node.id === selectedNodeRef.current)) {
      setSelectedNodeId(script.draft.startNodeId || script.draft.nodes[0].id);
    }
  }, [script.draft.nodes, script.draft.startNodeId]);

  useEffect(() => {
    if (!nodeSettingsWindow.open) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") closeNodeSettings();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nodeSettingsWindow.open]);

  useEffect(() => {
    if (nodeSettingsWindow.open && !selectedNode) closeNodeSettings();
  }, [nodeSettingsWindow.open, selectedNode]);

  useEffect(() => {
    function beforeUnload(event) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  async function refresh(nextKey = script.key, { force = false } = {}) {
    if (!token) return;
    if (!force && dirty && !window.confirm("当前脚本有未保存改动，确定刷新并放弃这些改动吗？")) return;
    setLoading(true);
    setFieldError("");
    try {
      const data = await adminApi("/story-scripts", token);
      const nextScripts = data.scripts ?? [];
      setScripts(nextScripts);
      const selected = nextScripts.find((entry) => entry.key === nextKey) ?? nextScripts[0] ?? emptyStoryScript();
      selectLocalScript(selected, { dirty: false });
    } catch (error) {
      reportError(error);
    } finally {
      setLoading(false);
    }
  }

  function selectLocalScript(nextScript, { dirty: nextDirty = false } = {}) {
    const normalized = normalizeStoryScript(nextScript);
    setScript(normalized);
    setSelectedNodeId(normalized.draft.startNodeId || normalized.draft.nodes[0]?.id || "");
    setDirty(nextDirty);
    setCreateOpen(false);
    setBoardEditorOpen(false);
    setNodeBoardEditorId("");
    setPointPicker(null);
    closeNodeSettings();
    setFieldError("");
    setImportErrors([]);
    setPendingImport(null);
  }

  async function selectScript(key) {
    if (!key || key === script.key) return;
      if (dirty && !window.confirm("当前脚本有未保存改动，确定切换脚本吗？")) return;
    const cached = scripts.find((entry) => entry.key === key);
    if (cached) {
      selectLocalScript(cached);
      return;
    }
    setLoading(true);
    try {
      const data = await adminApi(`/story-scripts/${encodeURIComponent(key)}`, token);
      selectLocalScript(data.script);
    } catch (error) {
      reportError(error);
    } finally {
      setLoading(false);
    }
  }

  function createScript(purposeId) {
    if (dirty && !window.confirm("当前脚本有未保存改动，确定新建并放弃这些改动吗？")) return;
    const purpose = PURPOSES.find((entry) => entry.id === purposeId) ?? PURPOSES[0];
    const start = emptyStoryNode("start", characters[0]?.slug ?? "");
    selectLocalScript(emptyStoryScript({
      key: uniqueScriptKey(scripts, purpose.keyPrefix),
      title: purpose.title,
      triggerType: purpose.triggerType,
      triggerParams: purpose.triggerType === TRIGGER_TYPES.itemCharacterUse
        ? { itemId: itemOptions[0]?.id ?? "", characterId: characters[0]?.slug ?? "" }
        : {},
      draft: {
        startNodeId: start.id,
        initialBoard: purpose.initialBoard,
        nodes: [start]
      }
    }), { dirty: true });
  }

  function copyScript(source = script) {
    if (dirty && !window.confirm("当前脚本有未保存改动，确定复制并放弃这些改动吗？")) return;
    const purpose = purposeForScript(source);
    selectLocalScript({
      ...source,
      key: uniqueScriptKey(scripts, `${purpose.keyPrefix}.copy`),
      title: `${source.title || "剧情教学"} 副本`,
      isPublished: false,
      firstPublishedAt: null,
      publishedAt: null,
      published: emptyScript(),
      draft: cloneDraft(source.draft)
    }, { dirty: true });
  }

  async function submit(action) {
    setSubmitting(true);
    setFieldError("");
    try {
      const body = action === "unpublish" ? { action } : toSubmitPayload(script, action);
      const data = await adminApi(`/story-scripts/${encodeURIComponent(script.key)}`, token, {
        method: "PATCH",
        body
      });
      setDirty(false);
      selectLocalScript(data.script, { dirty: false });
      await refresh(data.script?.key ?? script.key, { force: true });
      notify(action === "publish" ? TEXT.publishedNotice : action === "unpublish" ? TEXT.unpublishedNotice : TEXT.saved, "success");
    } catch (error) {
      reportError(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteScript(target = script) {
    if (isSystemScript(target) || target.isPublished) return;
    if (!window.confirm(`确定删除“${target.title || target.key}”吗？此操作不可撤销。`)) return;
    setSubmitting(true);
    try {
      await adminApi(`/story-scripts/${encodeURIComponent(target.key)}`, token, { method: "DELETE" });
      setDirty(false);
      notify(TEXT.deletedNotice, "success");
      await refresh("", { force: true });
    } catch (error) {
      reportError(error);
    } finally {
      setSubmitting(false);
    }
  }

  function patchScript(patch) {
    setScript((current) => ({ ...current, ...patch }));
    setDirty(true);
  }

  function patchDraft(patch) {
    setScript((current) => ({ ...current, draft: { ...current.draft, ...patch } }));
    setDirty(true);
  }

  function patchNode(nodeId, patch) {
    patchDraft({
      nodes: script.draft.nodes.map((node) => node.id === nodeId ? { ...node, ...patch } : node)
    });
  }

  function patchOption(nodeId, optionIndex, patch) {
    const node = script.draft.nodes.find((entry) => entry.id === nodeId);
    if (!node) return;
    patchNode(nodeId, {
      options: (node.options ?? []).map((option, index) => index === optionIndex ? { ...option, ...patch } : option)
    });
  }

  function updateTriggerType(triggerType) {
    patchScript({
      triggerType,
      triggerParams: triggerType === TRIGGER_TYPES.itemCharacterUse
        ? { itemId: itemOptions[0]?.id ?? "", characterId: characters[0]?.slug ?? "" }
        : {}
    });
  }

  function updateInitialBoard(patch) {
    const current = script.draft.initialBoard ?? { mode: "spark", stones: [] };
    patchDraft({ initialBoard: { ...current, ...patch } });
  }

  async function exportScript(target = script) {
    const targetScript = normalizeStoryScript(target?.key === script.key ? script : target);
    if (!targetScript.draft.nodes.length && !targetScript.published.nodes.length) {
      notify("该脚本暂无可导出的节点", "danger");
      return;
    }
    setFieldError("");
    try {
      const exportedAt = new Date();
      const buffer = await writeStoryScriptWorkbook(targetScript, { exportedAt });
      downloadWorkbook(buffer, storyScriptWorkbookFileName(targetScript, exportedAt));
      notify("Excel 已导出", "success");
    } catch (error) {
      reportError(error);
    }
  }

  function requestImportWorkbook() {
    if (dirty && !window.confirm("当前脚本有未保存改动，导入 Excel 会覆盖当前未保存草稿。确定继续吗？")) return;
    setImportErrors([]);
    setPendingImport(null);
    importInputRef.current?.click();
  }

  async function handleImportWorkbook(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImporting(true);
    setImportErrors([]);
    setPendingImport(null);
    setFieldError("");
    try {
      const result = await parseStoryScriptWorkbook(await file.arrayBuffer(), script, { itemOptions, skillCharacters });
      if (!result.ok) {
        setImportErrors(result.errors);
        notify("Excel 导入校验失败", "danger");
        return;
      }
      setPendingImport(result);
      notify("Excel 校验通过，请确认变更摘要", "success");
    } catch (error) {
      reportError(error);
    } finally {
      setImporting(false);
    }
  }

  function applyPendingImport() {
    if (!pendingImport) return;
    selectLocalScript({
      ...script,
      title: pendingImport.title,
      draft: pendingImport.draft
    }, { dirty: true });
    notify("Excel 已导入当前草稿，请预览后保存或发布", "success");
  }

  function positionNodeSettingsWindow(event) {
    const margin = 12;
    const workbenchRect = workbenchRef.current?.getBoundingClientRect();
    const pointerX = typeof event?.clientX === "number" ? event.clientX : (workbenchRect?.left ?? 0) + 24;
    const pointerY = typeof event?.clientY === "number" ? event.clientY : (workbenchRect?.top ?? 0) + 96;
    const relativeX = workbenchRect ? pointerX - workbenchRect.left : pointerX;
    const relativeY = workbenchRect ? pointerY - workbenchRect.top : pointerY;
    if (typeof window === "undefined") return { x: relativeX + margin, y: Math.max(margin, relativeY + margin) };
    const viewportWidth = window.innerWidth || 1024;
    const workbenchWidth = workbenchRect?.width ?? viewportWidth;
    const windowWidth = Math.min(560, Math.max(320, workbenchWidth - margin * 2));
    return {
      x: clamp(relativeX + margin, margin, Math.max(margin, workbenchWidth - windowWidth - margin)),
      y: Math.max(margin, relativeY + margin)
    };
  }

  function openNodeSettings(nodeId, event) {
    if (!nodeId) return;
    revealNode(nodeId);
    setNodeSettingsWindow({ open: true, ...positionNodeSettingsWindow(event) });
  }

  function closeNodeSettings() {
    setNodeSettingsWindow((current) => ({ ...current, open: false }));
  }

  function addNodeAfter(type = TUTORIAL_NODE_TYPES.story) {
    const currentId = selectedNode?.id || script.draft.startNodeId || script.draft.nodes.at(-1)?.id || "";
    const nextId = uniqueNodeId(script.draft.nodes, type);
    const currentIndex = script.draft.nodes.findIndex((node) => node.id === currentId);
    const nextNode = emptyStoryNode(nextId, defaultCharacterId(characters), defaultPatchForType(type));
    const nodes = [...script.draft.nodes];
    if (currentIndex >= 0) {
      const current = nodes[currentIndex];
      nextNode.nextNodeId = current.options?.length ? "" : current.nextNodeId;
      nodes[currentIndex] = current.options?.length ? current : { ...current, nextNodeId: nextId };
      nodes.splice(currentIndex + 1, 0, nextNode);
    } else {
      nodes.push(nextNode);
    }
    patchDraft({
      startNodeId: script.draft.startNodeId || nextId,
      nodes
    });
    revealNode(nextId);
  }

  function addBranchStep(nodeId, optionIndex) {
    const nextId = uniqueNodeId(script.draft.nodes, "branch");
    const nextNode = emptyStoryNode(nextId, defaultCharacterId(characters));
    const nodes = script.draft.nodes.map((node) => {
      if (node.id !== nodeId) return node;
      return {
        ...node,
        options: (node.options ?? []).map((option, index) => (
          index === optionIndex ? { ...option, nextNodeId: nextId, targetMissing: false } : option
        ))
      };
    });
    patchDraft({ nodes: [...nodes, nextNode] });
    revealNode(nextId);
  }

  function removeNode(nodeId) {
    if (!nodeId || script.draft.nodes.length <= 1) return;
    const removed = script.draft.nodes.find((node) => node.id === nodeId);
    if (!removed) return;
    if (!window.confirm(`删除步骤“${stepName(removed, script.draft.nodes.indexOf(removed))}”？`)) return;
    const nodes = script.draft.nodes
      .filter((node) => node.id !== nodeId)
      .map((node) => {
        const nextNodeId = node.nextNodeId === nodeId ? (removed.nextNodeId ?? "") : node.nextNodeId;
        const options = (node.options ?? []).map((option) => option.nextNodeId === nodeId
          ? { ...option, nextNodeId: "", targetMissing: true }
          : option);
        return { ...node, nextNodeId, options };
      });
    patchDraft({
      startNodeId: script.draft.startNodeId === nodeId ? (removed.nextNodeId || nodes[0]?.id || "") : script.draft.startNodeId,
      nodes
    });
    revealNode(removed.nextNodeId || nodes[0]?.id || "", { scroll: false });
  }

  function registerFlowNode(nodeId, element) {
    if (!nodeId) return;
    if (element) {
      flowNodeRefs.current.set(nodeId, element);
    } else {
      flowNodeRefs.current.delete(nodeId);
    }
  }

  function revealNode(nodeId, { scroll = true } = {}) {
    if (!nodeId) return;
    setSelectedNodeId(nodeId);
    setHighlightedNodeId(nodeId);
    if (typeof window !== "undefined") {
      window.setTimeout(() => setHighlightedNodeId((current) => current === nodeId ? "" : current), 900);
      if (scroll) {
        window.setTimeout(() => {
          flowNodeRefs.current.get(nodeId)?.scrollIntoView({ block: "nearest", inline: "center" });
        }, 0);
      }
    }
  }

  function openPreview() {
    if (previewMode === "current" && selectedNode?.id) {
      const pathLabel = previewPathLabel(script.draft, selectedNode.id);
      if (pathLabel.length > 1 && !window.confirm(`将沿以下路径静默推演棋盘状态：\n${pathLabel.join(" > ")}\n\n确认进入预览？`)) {
        return;
      }
    }
    setPreviewBattleSession(null);
    setPreviewStoryStartId("");
    setPreviewOverlayOpen(true);
  }

  function notify(message, tone = "neutral") {
    setFeedback(message);
    onNotice?.(message, tone);
    window.setTimeout(() => setFeedback(""), 2400);
  }

  function reportError(error) {
    const message = error.message ?? "剧情教学请求失败";
    setFieldError(message);
    notify(message, "danger");
  }

  return (
    <section
      className="admin-story-workbench"
      ref={workbenchRef}
      style={nodeSettingsWindow.open ? { "--node-settings-scroll-reserve": "min(760px, calc(100dvh - 24px))" } : undefined}
    >
      <AdminSectionHeader title={TEXT.title} meta={TEXT.meta} actionLabel="添加步骤" onAction={() => addNodeAfter()}>
        <button className="admin-story-workbench-button secondary" type="button" onClick={() => setCreateOpen((open) => !open)}>
          <FilePlus2 size={16} />新建脚本
        </button>
        <button className="admin-story-workbench-button secondary" type="button" onClick={() => refresh(script.key)} disabled={loading}>
          <RefreshCw size={16} />{TEXT.refresh}
        </button>
      </AdminSectionHeader>

      {createOpen && (
        <section className="admin-story-workbench-create" aria-label="选择新建脚本用途">
          {PURPOSES.map((purpose) => (
            <button key={purpose.id} type="button" onClick={() => createScript(purpose.id)}>
              <strong>{purpose.label}</strong>
              <span>{purpose.group}用途 · {purpose.triggerType === TRIGGER_TYPES.itemCharacterUse ? "需要选择道具和角色" : "无需原始 JSON"}</span>
            </button>
          ))}
        </section>
      )}

      <div className="admin-story-workbench-shell">
        <ScriptLibrary
          scripts={scripts}
          selectedKey={script.key}
          onSelect={selectScript}
          onCopy={copyScript}
          onDelete={deleteScript}
          onExport={exportScript}
          onCreate={() => setCreateOpen((open) => !open)}
        />

        <main className="admin-story-workbench-main">
          <WorkbenchToolbar
            script={script}
            dirty={dirty}
            issues={issues}
            submitting={submitting}
            previewMode={previewMode}
            onPreviewMode={setPreviewMode}
            onCopy={() => copyScript()}
            onImport={requestImportWorkbook}
            importing={importing}
            onSave={() => submit("save-draft")}
            onPublish={() => submit("publish")}
            onUnpublish={() => submit("unpublish")}
            onDelete={() => deleteScript()}
          />
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="admin-story-workbench-file-input"
            aria-label="导入剧情教学 Excel"
            onChange={handleImportWorkbook}
          />

          <ImportWorkbookFeedback
            errors={importErrors}
            pendingImport={pendingImport}
            onApply={applyPendingImport}
            onCancel={() => setPendingImport(null)}
          />

          <section className="admin-story-workbench-script">
            <label>
              <span>脚本标题</span>
              <input value={script.title} onChange={(event) => patchScript({ title: event.target.value })} />
            </label>
            <label>
              <span>脚本标识</span>
              <input value={script.key} disabled={script.isPublished || isSystemScript(script)} onChange={(event) => patchScript({ key: event.target.value })} />
            </label>
            <label>
              <span>用途</span>
              <select value={script.triggerType} onChange={(event) => updateTriggerType(event.target.value)}>
                <option value={TRIGGER_TYPES.onboarding}>新手引导</option>
                <option value={TRIGGER_TYPES.itemCharacterUse}>道具互动</option>
                <option value={TRIGGER_TYPES.battleTutorialStart}>对弈教学 / 混合剧情教学</option>
              </select>
            </label>
            {script.triggerType === TRIGGER_TYPES.itemCharacterUse && (
              <>
                <label>
                  <span>触发道具</span>
                  <select value={script.triggerParams.itemId ?? ""} onChange={(event) => patchScript({ triggerParams: { ...script.triggerParams, itemId: event.target.value } })}>
                    <option value="">未选择</option>
                    {itemOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
                <label>
                  <span>目标角色</span>
                  <select value={script.triggerParams.characterId ?? ""} onChange={(event) => patchScript({ triggerParams: { ...script.triggerParams, characterId: event.target.value } })}>
                    <option value="">未选择</option>
                    {characters.map((character) => <option key={character.slug || character.id} value={character.slug || character.id}>{character.name}</option>)}
                  </select>
                </label>
              </>
            )}
            <InitialBoardSummary
              board={script.draft.initialBoard}
              onMode={(mode) => updateInitialBoard({ mode })}
              onOpen={() => setBoardEditorOpen(true)}
            />
          </section>

          <div className="admin-story-workbench-content">
            <section className="admin-story-workbench-flow" aria-label="自动流程图">
              <header>
                <div>
                  <h3>自动流程图</h3>
                  <p>主线自上而下，分支横向展开；节点不可拖拽，也不需要手动画线。</p>
                  <small>将插入到：{selectedNode ? `${stepName(selectedNode, script.draft.nodes.indexOf(selectedNode))} 之后` : "脚本末尾"}</small>
                </div>
                <button className="admin-story-workbench-button secondary" type="button" onClick={() => addNodeAfter()}>
                  <Plus size={16} />插入步骤
                </button>
              </header>
              <FlowGraph
                flow={flow}
                nodes={script.draft.nodes}
                selectedNodeId={selectedNode?.id}
                highlightedNodeId={highlightedNodeId}
                issues={issues}
                onSelect={revealNode}
                onOpenSettings={openNodeSettings}
                registerNodeRef={registerFlowNode}
              />
            </section>

            <div className="admin-story-workbench-support">
              <IssuePanel issues={issues} flow={flow} nodes={script.draft.nodes} onSelect={(nodeId) => revealNode(nodeId)} />
              <aside className="admin-story-workbench-preview">
                <header>
                  <div>
                    <h3>预览</h3>
                    <p>{previewMode === "current" ? "已从起点静默推演到当前步骤" : "从脚本起点播放"}</p>
                  </div>
                  <div className="admin-story-workbench-segmented">
                    <button type="button" className={previewMode === "start" ? "active" : ""} onClick={() => setPreviewMode("start")}><Play size={14} />开头</button>
                    <button type="button" className={previewMode === "current" ? "active" : ""} onClick={() => setPreviewMode("current")}><Eye size={14} />当前</button>
                  </div>
                </header>
                <div className="admin-story-workbench-preview-stage">
                  <div className="admin-story-workbench-preview-summary">
                    <strong>{previewMode === "current" ? "从当前步骤全屏预览" : "从脚本起点全屏预览"}</strong>
                    <span>{previewScript.nodes.length} 个步骤</span>
                    <button
                      className="admin-story-workbench-button primary"
                      type="button"
                      onClick={openPreview}
                    >
                      <Play size={16} />打开全屏预览
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>

      {nodeSettingsWindow.open && selectedNode && (
        <aside
          className="admin-story-workbench-node-settings-window"
          role="dialog"
          aria-label="节点设置"
          style={{
            "--node-settings-x": `${nodeSettingsWindow.x}px`,
            "--node-settings-y": `${nodeSettingsWindow.y}px`
          }}
        >
          <StepEditor
            node={selectedNode}
            nodes={script.draft.nodes}
            portraitOptions={portraitOptions}
            skillCharacters={skillCharacters}
            onPatch={(patch) => selectedNode && patchNode(selectedNode.id, patch)}
            onPatchOption={(optionIndex, patch) => selectedNode && patchOption(selectedNode.id, optionIndex, patch)}
            onAddOption={() => selectedNode && patchNode(selectedNode.id, { options: [...(selectedNode.options ?? []), { label: "", nextNodeId: "" }] })}
            onRemoveOption={(optionIndex) => selectedNode && patchNode(selectedNode.id, { options: selectedNode.options.filter((_, index) => index !== optionIndex) })}
            onAddBranch={addBranchStep}
            onRemove={() => selectedNode && removeNode(selectedNode.id)}
            onPickPoint={(field) => selectedNode && setPointPicker({ nodeId: selectedNode.id, field })}
            onEditBoardSetup={() => selectedNode && setNodeBoardEditorId(selectedNode.id)}
            onHelp={() => setHelpOpen(true)}
            onInsertStep={() => addNodeAfter()}
            onClose={closeNodeSettings}
          />
        </aside>
      )}

      {fieldError && <p className="admin-story-workbench-error" role="alert">{fieldError}</p>}
      {feedback && <p className="admin-story-workbench-toast" role="status">{feedback}</p>}

      {boardEditorOpen && (
        <InitialBoardEditorModal
          board={script.draft.initialBoard ?? { mode: "spark", stones: [] }}
          title="初始棋盘"
          onClose={() => setBoardEditorOpen(false)}
          onSave={(stones) => {
            updateInitialBoard({ stones });
            setBoardEditorOpen(false);
          }}
        />
      )}

      {nodeBoardEditorId && (
        <InitialBoardEditorModal
          board={boardSetupForNode(script.draft.nodes.find((node) => node.id === nodeBoardEditorId), script.draft)}
          title="设置局面"
          onClose={() => setNodeBoardEditorId("")}
          onSave={(stones) => {
            const targetNode = script.draft.nodes.find((node) => node.id === nodeBoardEditorId);
            patchNode(nodeBoardEditorId, {
              boardSetup: {
                ...boardSetupForNode(targetNode, script.draft),
                stones
              }
            });
            setNodeBoardEditorId("");
          }}
        />
      )}

      {pointPicker && (
        <BoardPointPickerModal
          board={replayInitialBoardToNode(script.draft, pointPicker.nodeId)}
          title={pointPicker.field === "pointId" ? "选择棋盘坐标" : "选择技能目标"}
          onClose={() => setPointPicker(null)}
          onPick={(pointId) => {
            patchNode(pointPicker.nodeId, { [pointPicker.field]: pointId });
            setPointPicker(null);
          }}
        />
      )}

      {previewOverlayOpen && (
        <div className="admin-story-workbench-fullscreen-preview" role="dialog" aria-modal="true" aria-label="剧情教学全屏预览">
          {previewBattleSession ? (
            <TutorialBattleScreen
              audioSettings={{ master: 0, bgm: 0, sfx: 0, voice: 0 }}
              characters={gameCharacterCatalog}
              session={previewBattleSession}
              user={ADMIN_PREVIEW_USER}
              onClose={() => {
                setPreviewBattleSession(null);
                setPreviewOverlayOpen(false);
              }}
              onComplete={() => {
                setPreviewBattleSession(null);
                setPreviewOverlayOpen(false);
              }}
              onExitToStory={({ script: nextScript }) => {
                setPreviewBattleSession(null);
                setPreviewStoryStartId(nextScript?.startNodeId ?? "");
              }}
              onOpenMessageBoard={() => {}}
              onOpenSettings={() => {}}
              onToast={onNotice}
              previewControlsEnabled
            />
          ) : (
            <TutorialSessionModal
              script={previewStoryStartId ? { ...previewScript, startNodeId: previewStoryStartId } : previewScript}
              characters={characterCatalog}
              labels={{ title: script.title || TEXT.title }}
              typewriterDisabled
              previewControlsEnabled
              onClose={() => {
                setPreviewStoryStartId("");
                setPreviewOverlayOpen(false);
              }}
              onEnterBattle={(battleSession) => setPreviewBattleSession({
                ...battleSession,
                script: previewStoryStartId ? { ...previewScript, startNodeId: previewStoryStartId } : previewScript
              })}
            />
          )}
        </div>
      )}

      {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
    </section>
  );
}

function ScriptLibrary({ scripts, selectedKey, onSelect, onCopy, onDelete, onExport, onCreate }) {
  const groups = groupScripts(scripts);
  return (
    <aside className="admin-story-workbench-library" aria-label="脚本卡片库">
      <header>
        <div>
          <h3>脚本库</h3>
          <p>{scripts.length} 个脚本</p>
        </div>
        <button className="admin-story-workbench-icon-button" type="button" aria-label="新建脚本" onClick={onCreate}>
          <FilePlus2 size={17} />
        </button>
      </header>
      <div className="admin-story-workbench-library-scroll">
        {PURPOSES.map((purpose) => (
          <section key={purpose.group} className="admin-story-workbench-library-group">
            <h4>{purpose.group}</h4>
            <div className="admin-story-workbench-library-cards">
              {(groups.get(purpose.group) ?? []).map((entry) => (
                <article key={entry.key} className={`admin-story-workbench-script-card ${selectedKey === entry.key ? "active" : ""}`}>
                  <button type="button" onClick={() => onSelect(entry.key)}>
                    <strong>{entry.title || entry.key}</strong>
                    <span>{entry.key}</span>
                    <small>{entry.isPublished ? "已发布" : "草稿"} · {entry.draft?.nodes?.length ?? 0} 步</small>
                  </button>
                  <div>
                    {isSystemScript(entry) && <AdminStatusPill tone="neutral">{TEXT.systemScript}</AdminStatusPill>}
                    <button type="button" className="admin-story-workbench-icon-button" title="导出 Excel" aria-label={`导出 ${entry.title || entry.key} Excel`} onClick={() => onExport(entry)}><FileDown size={15} /></button>
                    <button type="button" className="admin-story-workbench-icon-button" title="复制" onClick={() => onCopy(entry)}><Copy size={15} /></button>
                    {!entry.isPublished && !isSystemScript(entry) && (
                      <button type="button" className="admin-story-workbench-icon-button danger" title="删除" onClick={() => onDelete(entry)}><Trash2 size={15} /></button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}

function WorkbenchToolbar({ script, dirty, issues, submitting, importing, previewMode, onPreviewMode, onCopy, onImport, onSave, onPublish, onUnpublish, onDelete }) {
  const hasBlockingIssues = issues.some((issue) => issue.severity === "error");
  return (
    <section className="admin-story-workbench-toolbar">
      <div>
        <AdminStatusPill tone={script.isPublished ? "green" : "neutral"}>{script.isPublished ? TEXT.published : TEXT.draft}</AdminStatusPill>
        {dirty && <AdminStatusPill tone="amber">未保存</AdminStatusPill>}
        <span>{issues.length ? `${issues.length} 个问题` : "校验正常"}</span>
      </div>
      <div>
        <button className="admin-story-workbench-button secondary" type="button" onClick={() => onPreviewMode(previewMode === "current" ? "start" : "current")}>
          <Eye size={16} />{previewMode === "current" ? TEXT.previewStart : TEXT.previewCurrent}
        </button>
        <button className="admin-story-workbench-button secondary" type="button" onClick={onCopy}><Copy size={16} />复制</button>
        <button className="admin-story-workbench-button secondary" type="button" disabled={submitting || importing} onClick={onImport}><FileUp size={16} />{importing ? "导入中" : "导入 Excel"}</button>
        {!script.isPublished && !isSystemScript(script) && (
          <button className="admin-story-workbench-button danger" type="button" onClick={onDelete}><Trash2 size={16} />删除</button>
        )}
        {script.isPublished && (
          <button className="admin-story-workbench-button secondary" type="button" disabled={submitting} onClick={onUnpublish}><PauseCircle size={16} />{TEXT.unpublish}</button>
        )}
        <button className="admin-story-workbench-button secondary" type="button" disabled={submitting} onClick={onSave}><Save size={16} />{TEXT.saveDraft}</button>
        <button className="admin-story-workbench-button primary" type="button" disabled={submitting || hasBlockingIssues} onClick={onPublish}><Upload size={16} />{TEXT.publish}</button>
      </div>
    </section>
  );
}

function InitialBoardSummary({ board, onMode, onOpen }) {
  return (
    <div className="admin-story-workbench-board-summary">
      <label>
        <span>初始棋盘</span>
        <select value={board?.mode ?? "spark"} onChange={(event) => onMode(event.target.value)}>
          <option value="spark">星烁 13 路</option>
          <option value="standard">标准 19 路</option>
          <option value="gomoku">五子棋 13 路</option>
        </select>
      </label>
      <button className="admin-story-workbench-button secondary" type="button" onClick={onOpen}>
        <MousePointer2 size={16} />棋盘点选
      </button>
      <small>{board?.stones?.length ?? 0} 颗初始棋子</small>
    </div>
  );
}

function FlowGraph({ flow, nodes, selectedNodeId, highlightedNodeId, issues, onSelect, onOpenSettings, registerNodeRef }) {
  const issueNodeIds = new Set(issues.map((issue) => issue.nodeId).filter(Boolean));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  return (
    <div className="admin-story-workbench-flow-canvas">
      <FlowPathGuide
        flow={flow}
        nodeById={nodeById}
        selectedNodeId={selectedNodeId}
        nodes={nodes}
        onSelect={onSelect}
      />
      {flow.main.map((nodeId, index) => {
        const node = nodeById.get(nodeId);
        if (!node) return null;
        const branches = flow.branches.get(nodeId) ?? [];
        return (
          <div className="admin-story-workbench-flow-row" key={nodeId}>
            <StepCard
              node={node}
              index={nodes.indexOf(node)}
              active={selectedNodeId === node.id}
              highlighted={highlightedNodeId === node.id}
              hasIssue={issueNodeIds.has(node.id)}
              registerNodeRef={registerNodeRef}
              onSelect={(event) => onOpenSettings(node.id, event)}
            />
            {branches.length > 0 && (
              <div className="admin-story-workbench-flow-branches">
                {branches.map((branch) => (
                  <BranchLane
                    key={[nodeId, branch.optionIndex, branch.targetId || branch.status].join("-")}
                    branch={branch}
                    nodeById={nodeById}
                    nodes={nodes}
                    selectedNodeId={selectedNodeId}
                    highlightedNodeId={highlightedNodeId}
                    issueNodeIds={issueNodeIds}
                    onSelect={onSelect}
                    onOpenSettings={onOpenSettings}
                    registerNodeRef={registerNodeRef}
                  />
                ))}
              </div>
            )}
            {index < flow.main.length - 1 && <span className="admin-story-workbench-flow-line" />}
          </div>
        );
      })}
      {flow.main.length === 0 && <p className="admin-story-workbench-empty">还没有步骤。先添加一个剧情步骤。</p>}
      {flow.connectedExtras?.length > 0 && (
        <div className="admin-story-workbench-branch-extras">
          <h4>分支后续步骤</h4>
          {flow.connectedExtras.map((nodeId) => (
            <StepCard
              key={nodeId}
              node={nodeById.get(nodeId)}
              index={nodes.findIndex((node) => node.id === nodeId)}
              active={selectedNodeId === nodeId}
              hasIssue={issueNodeIds.has(nodeId)}
              onSelect={(event) => onOpenSettings(nodeId, event)}
            />
          ))}
        </div>
      )}
      {flow.orphans.length > 0 && (
        <div className="admin-story-workbench-orphans">
          <h4>未连接步骤</h4>
          {flow.orphans.map((nodeId) => (
            <StepCard
              key={nodeId}
              node={nodeById.get(nodeId)}
              index={nodes.findIndex((node) => node.id === nodeId)}
              active={selectedNodeId === nodeId}
              hasIssue={issueNodeIds.has(nodeId)}
              onSelect={(event) => onOpenSettings(nodeId, event)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ImportWorkbookFeedback({ errors, pendingImport, onApply, onCancel }) {
  if (pendingImport) {
    const summary = pendingImport.summary;
    return (
      <section className="admin-story-workbench-import-panel" aria-label="Excel 导入变更摘要">
        <header>
          <div>
            <strong>Excel 校验通过</strong>
            <span>确认后会覆盖当前编辑器草稿，但不会自动保存或发布。</span>
          </div>
          <div>
            <button className="admin-story-workbench-button secondary" type="button" onClick={onCancel}>取消</button>
            <button className="admin-story-workbench-button primary" type="button" onClick={onApply}>应用到草稿</button>
          </div>
        </header>
        <dl className="admin-story-workbench-import-summary">
          <div>
            <dt>标题</dt>
            <dd>{summary.titleChanged ? `${summary.previousTitle || "未命名"} → ${summary.nextTitle || "未命名"}` : "未变化"}</dd>
          </div>
          <div>
            <dt>节点数</dt>
            <dd>{summary.previousNodeCount} → {summary.nextNodeCount}</dd>
          </div>
          <div>
            <dt>选项数</dt>
            <dd>{summary.previousOptionCount} → {summary.nextOptionCount}</dd>
          </div>
          <div>
            <dt>新增节点</dt>
            <dd>{summary.addedNodeIds.length ? summary.addedNodeIds.join("、") : "无"}</dd>
          </div>
          <div>
            <dt>删除节点</dt>
            <dd>{summary.removedNodeIds.length ? summary.removedNodeIds.join("、") : "无"}</dd>
          </div>
          <div>
            <dt>起始节点</dt>
            <dd>{summary.previousStartNodeId || "未设置"} → {summary.nextStartNodeId || "未设置"}</dd>
          </div>
        </dl>
      </section>
    );
  }
  if (!errors.length) return null;
  return (
    <section className="admin-story-workbench-import-panel error" aria-label="Excel 导入错误">
      <header>
        <div>
          <strong>Excel 导入校验失败</strong>
          <span>已拒绝整份导入，当前编辑器状态未改变。</span>
        </div>
      </header>
      <ol className="admin-story-workbench-import-errors">
        {errors.slice(0, 12).map((error, index) => (
          <li key={`${error.sheet}-${error.row}-${error.field}-${index}`}>
            <b>{error.sheet}</b>
            {error.row && <span>第 {error.row} 行</span>}
            <span>{error.field}</span>
            <em>{error.message}</em>
          </li>
        ))}
      </ol>
      {errors.length > 12 && <p>还有 {errors.length - 12} 条错误，请先修复以上错误后重新导入。</p>}
    </section>
  );
}

function FlowPathGuide({ flow, nodeById, selectedNodeId, nodes, onSelect }) {
  const path = flow.pathByNodeId?.get(selectedNodeId) ?? [];
  if (!path.length) return null;
  return (
    <nav className="admin-story-workbench-flow-path" aria-label="当前流程路径">
      {path.map((entry, index) => entry.type === "option" ? (
        <span key={[entry.type, entry.label, index].join("-")}>选项：{entry.label}</span>
      ) : (
        <button key={[entry.type, entry.nodeId, index].join("-")} type="button" onClick={() => onSelect(entry.nodeId)}>
          {index === 0 ? "开始" : stepName(nodeById.get(entry.nodeId), nodes.findIndex((node) => node.id === entry.nodeId))}
        </button>
      ))}
    </nav>
  );
}

function BranchLane({ branch, nodeById, nodes, selectedNodeId, highlightedNodeId, issueNodeIds, onSelect, onOpenSettings, registerNodeRef, nested = false }) {
  const issueCount = branch.chain.filter((nodeId) => issueNodeIds.has(nodeId)).length;
  const mergeTargetNode = nodeById.get(branch.mergeTargetId);
  const mergeTargetIndex = nodes.findIndex((entry) => entry.id === branch.mergeTargetId);
  return (
    <div className={["admin-story-workbench-branch-lane", nested ? "nested" : ""].filter(Boolean).join(" ")}>
      <div className="admin-story-workbench-lane-title">
        <strong>选项：{branch.label}</strong>
        <span>{branchStatusLabel(branch, issueCount, mergeTargetNode, mergeTargetIndex)}</span>
      </div>
      <div className="admin-story-workbench-branch-chain">
        {branch.status === "end" && <EndCard label={branch.label} />}
        {branch.status === "missing" && <EndCard label="未选择目标" missing />}
        {branch.chain.map((branchNodeId, branchIndex) => (
          <Fragment key={branchNodeId}>
            <StepCard
              node={nodeById.get(branchNodeId)}
              index={nodes.findIndex((entry) => entry.id === branchNodeId)}
              active={selectedNodeId === branchNodeId}
              highlighted={highlightedNodeId === branchNodeId}
              hasIssue={issueNodeIds.has(branchNodeId)}
              registerNodeRef={registerNodeRef}
              onSelect={(event) => onOpenSettings(branchNodeId, event)}
            />
            {branchIndex < branch.chain.length - 1 && <span className="admin-story-workbench-branch-line" />}
          </Fragment>
        ))}
        {branch.mergeTargetId && (
          <MergeCard
            targetNode={mergeTargetNode}
            targetIndex={mergeTargetIndex}
            onSelect={(event) => onOpenSettings(branch.mergeTargetId, event)}
          />
        )}
      </div>
      {branch.lanes?.length > 0 && (
        <div className="admin-story-workbench-nested-lanes">
          {branch.lanes.map((nestedBranch) => (
            <BranchLane
              key={[branch.targetId, nestedBranch.optionIndex, nestedBranch.targetId || nestedBranch.status].join("-")}
              branch={nestedBranch}
              nodeById={nodeById}
              nodes={nodes}
              selectedNodeId={selectedNodeId}
              highlightedNodeId={highlightedNodeId}
              issueNodeIds={issueNodeIds}
              onSelect={onSelect}
              onOpenSettings={onOpenSettings}
              registerNodeRef={registerNodeRef}
              nested
            />
          ))}
        </div>
      )}
    </div>
  );
}

function branchStatusLabel(branch, issueCount, mergeTargetNode, mergeTargetIndex) {
  const problemText = issueCount ? ` · ${issueCount} 个问题` : "";
  if (branch.status === "missing") return `未选择目标${problemText}`;
  if (branch.status === "end") return `结束剧情${problemText}`;
  if (branch.mergeTargetId) return `汇合到 ${stepName(mergeTargetNode, mergeTargetIndex)}${problemText}`;
  return `${branch.chain.length} 个步骤${problemText}`;
}

function MergeCard({ targetNode, targetIndex, onSelect }) {
  return (
    <button className="admin-story-workbench-merge-card" type="button" onClick={onSelect}>
      <span>汇合到</span>
      <strong>{stepName(targetNode, targetIndex)}</strong>
    </button>
  );
}

function StepCard({ node, index, active, highlighted, hasIssue, onSelect, registerNodeRef }) {
  if (!node) return <EndCard label="未选择目标" missing />;
  const className = [
    "admin-story-workbench-step-card",
    active ? "active" : "",
    highlighted ? "highlighted" : "",
    hasIssue ? "has-issue" : ""
  ].filter(Boolean).join(" ");
  return (
    <button className={className} type="button" ref={(element) => registerNodeRef?.(node.id, element)} onClick={onSelect}>
      <span>{NODE_CATEGORY_LABELS[node.type] ?? "剧情步骤"}</span>
      <strong>{stepName(node, index)}</strong>
      <small>{nodeSummary(node)}</small>
    </button>
  );
}

function EndCard({ label = "", missing = false }) {
  return (
    <div className={["admin-story-workbench-end-card", missing ? "missing" : ""].filter(Boolean).join(" ")}>
      <span>{missing ? "待修复" : "结束剧情"}</span>
      {label && <small>{label}</small>}
    </div>
  );
}
function IssuePanel({ issues, flow, nodes, onSelect }) {
  const groups = groupIssuesByFlowPath(issues, flow, nodes);
  return (
    <section className="admin-story-workbench-issues">
      <header>
        <h3>{TEXT.issues}</h3>
        {issues.length ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
      </header>
      {issues.length === 0 ? (
        <p>{TEXT.noIssues}</p>
      ) : (
        <div>
          {groups.map((group) => (
            <section className="admin-story-workbench-issue-group" key={group.id}>
              <h4>{group.title}</h4>
              {group.issues.map((issue) => (
                <button key={issue.id} type="button" onClick={() => issue.nodeId && onSelect(issue.nodeId)}>
                  <span>{issue.severity === "error" ? "必须修复" : "建议检查"}</span>
                  <strong>{issue.message}</strong>
                </button>
              ))}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function groupIssuesByFlowPath(issues, flow, nodes) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const orphanIds = new Set(flow.orphans ?? []);
  const mainIds = new Set(flow.main ?? []);
  const groups = new Map();
  function ensureGroup(id, title) {
    if (!groups.has(id)) groups.set(id, { id, title, issues: [] });
    return groups.get(id);
  }
  for (const issueEntry of issues) {
    if (!issueEntry.nodeId || !nodeIds.has(issueEntry.nodeId)) {
      ensureGroup("global", "全局问题").issues.push(issueEntry);
      continue;
    }
    if (orphanIds.has(issueEntry.nodeId)) {
      ensureGroup("orphans", "未连接步骤").issues.push(issueEntry);
      continue;
    }
    if (mainIds.has(issueEntry.nodeId)) {
      ensureGroup("main", "主线").issues.push(issueEntry);
      continue;
    }
    const branchLabel = firstOptionLabelForPath(flow.pathByNodeId?.get(issueEntry.nodeId));
    ensureGroup(`branch-${branchLabel || issueEntry.nodeId}`, branchLabel ? `分支：${branchLabel}` : "分支步骤").issues.push(issueEntry);
  }
  return [...groups.values()];
}

function firstOptionLabelForPath(path = []) {
  return path.find((entry) => entry.type === "option")?.label ?? "";
}

function StepEditor({
  node,
  nodes,
  portraitOptions,
  skillCharacters,
  onPatch,
  onPatchOption,
  onAddOption,
  onRemoveOption,
  onAddBranch,
  onRemove,
  onPickPoint,
  onEditBoardSetup,
  onHelp,
  onInsertStep,
  onClose
}) {
  if (!node) {
    return (
      <section className="admin-story-workbench-step-editor">
        <p className="admin-story-workbench-empty">选择一个步骤后编辑。</p>
      </section>
    );
  }
  const skillCharacterId = node.skillCharacterId || node.skillId || node.characterId || skillCharacters[0]?.id || "";
  const selectedSkillCharacter = skillCharacters.find((character) => character.id === skillCharacterId);
  const selectedSkillId = node.skillId || selectedSkillCharacter?.id || "";
  return (
    <section className="admin-story-workbench-step-editor">
      <header>
        <div>
          <h3>{stepName(node, nodes.indexOf(node))}</h3>
          <p>{NODE_TYPE_LABELS[node.type] ?? "剧情对白"}</p>
        </div>
        <div className="admin-story-workbench-step-editor-actions">
          {onInsertStep && (
            <button className="admin-story-workbench-button secondary" type="button" onClick={onInsertStep}>
              <Plus size={16} />插入步骤
            </button>
          )}
          <button className="admin-story-workbench-icon-button" type="button" aria-label={TEXT.help} onClick={onHelp}>
            <HelpCircle size={17} />
          </button>
          {onClose && (
            <button className="admin-story-workbench-icon-button" type="button" aria-label="关闭节点设置" onClick={onClose}>
              <X size={17} />
            </button>
          )}
        </div>
      </header>

      <label>
        <span>步骤名称</span>
        <input value={node.name ?? ""} placeholder={autoStepName(node, nodes.indexOf(node))} onChange={(event) => onPatch({ name: event.target.value })} />
        <small>留空时会按类型和内容自动生成。</small>
      </label>

      <label>
        <span>步骤类型</span>
        <select value={node.type ?? TUTORIAL_NODE_TYPES.story} onChange={(event) => onPatch(defaultPatchForType(event.target.value))}>
          {NODE_TYPE_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </optgroup>
          ))}
        </select>
      </label>

      {isStoryNodeType(node.type) ? (
        <StoryStepFields node={node} nodes={nodes} portraitOptions={portraitOptions} onPatch={onPatch} onPatchOption={onPatchOption} onAddOption={onAddOption} onRemoveOption={onRemoveOption} onAddBranch={onAddBranch} />
      ) : (
        <BattleStepFields
          node={node}
          nodes={nodes}
          portraitOptions={portraitOptions}
          skillCharacters={skillCharacters}
          skillCharacterId={skillCharacterId}
          selectedSkillId={selectedSkillId}
          onPatch={onPatch}
          onPatchOption={onPatchOption}
          onAddOption={onAddOption}
          onRemoveOption={onRemoveOption}
          onAddBranch={onAddBranch}
          onPickPoint={onPickPoint}
          onEditBoardSetup={onEditBoardSetup}
        />
      )}

      <label>
        <span>下一主线步骤</span>
        <select value={node.nextNodeId || END_TARGET} onChange={(event) => onPatch({ nextNodeId: event.target.value === END_TARGET ? "" : event.target.value })}>
          <option value={END_TARGET}>结束剧情</option>
          {nodes.filter((entry) => entry.id !== node.id).map((entry) => <option key={entry.id} value={entry.id}>{stepName(entry, nodes.indexOf(entry))}</option>)}
        </select>
        <small>这里是主线连接，不需要手动画线。</small>
      </label>

      <button className="admin-story-workbench-button danger" type="button" onClick={onRemove}>
        <Trash2 size={16} />删除当前步骤
      </button>
    </section>
  );
}

function StoryStepFields({ node, nodes, portraitOptions, onPatch, onPatchOption, onAddOption, onRemoveOption, onAddBranch }) {
  return (
    <>
      <label>
        <span>立绘角色</span>
        <select value={node.characterId ?? ""} onChange={(event) => onPatch({ characterId: event.target.value })}>
          <option value="">无</option>
          {portraitOptions.map((character) => <option key={character.slug} value={character.slug}>{character.name}</option>)}
        </select>
      </label>
      <label>
        <span>说话人</span>
        <input value={node.speakerName ?? ""} onChange={(event) => onPatch({ speakerName: event.target.value })} />
      </label>
      <label>
        <span>演出效果</span>
        <select value={node.effect ?? STORY_NODE_EFFECTS.none} onChange={(event) => onPatch({ effect: event.target.value })}>
          {STORY_NODE_EFFECT_OPTIONS.map((effect) => <option key={effect.value || "none"} value={effect.value}>{effect.label}</option>)}
        </select>
      </label>
      <label>
        <span>对白正文</span>
        <textarea rows={6} value={node.text ?? ""} onChange={(event) => onPatch({ text: event.target.value })} />
      </label>
      <div className="admin-story-workbench-options">
        <div>
          <strong>剧情选项</strong>
          <button className="admin-story-workbench-button secondary" type="button" onClick={onAddOption}><GitBranch size={16} />添加选项</button>
        </div>
        {(node.options ?? []).map((option, optionIndex) => (
          <div className="admin-story-workbench-option-row" key={optionIndex}>
            <label>
              <span>文案</span>
              <input value={option.label ?? ""} onChange={(event) => onPatchOption(optionIndex, { label: event.target.value })} />
            </label>
            <label>
              <span>目标</span>
              <select value={option.nextNodeId || END_TARGET} onChange={(event) => onPatchOption(optionIndex, { nextNodeId: event.target.value === END_TARGET ? "" : event.target.value, targetMissing: false })}>
                <option value={END_TARGET}>结束剧情</option>
                {nodes.filter((entry) => entry.id !== node.id).map((entry) => <option key={entry.id} value={entry.id}>{stepName(entry, nodes.indexOf(entry))}</option>)}
              </select>
            </label>
            <label>
              <span>出现时间</span>
              <input type="number" min="0" step="0.1" value={option.revealDelaySeconds ?? ""} onChange={(event) => onPatchOption(optionIndex, { revealDelaySeconds: event.target.value })} />
            </label>
            <label>
              <span>选择后等待</span>
              <input type="number" min="0" step="0.1" placeholder="留空 = 0 秒" value={option.transitionDelaySeconds ?? ""} onChange={(event) => onPatchOption(optionIndex, { transitionDelaySeconds: event.target.value })} />
            </label>
            <div className="admin-story-workbench-option-actions">
              <button className="admin-story-workbench-button secondary" type="button" onClick={() => onAddBranch(node.id, optionIndex)}><Plus size={15} />分支步骤</button>
              <button className="admin-story-workbench-icon-button danger" type="button" aria-label="删除选项" onClick={() => onRemoveOption(optionIndex)}><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function BattleStepFields({
  node,
  nodes,
  portraitOptions,
  skillCharacters,
  skillCharacterId,
  selectedSkillId,
  onPatch,
  onPatchOption,
  onAddOption,
  onRemoveOption,
  onAddBranch,
  onPickPoint,
  onEditBoardSetup
}) {
  const isBoardSetup = node.type === TUTORIAL_NODE_TYPES.boardSetup;
  const isSkill = node.type === TUTORIAL_NODE_TYPES.playerSkill || node.type === TUTORIAL_NODE_TYPES.npcSkill;
  const needsPoint = nodeTypeRequiresPoint(node.type) || isSkill;
  const isNpcStep = isTutorialNpcNodeType(node.type);
  const advanceMode = nodeAdvanceMode(node);
  const supportsOptions = !isBoardSetup && [
    TUTORIAL_NODE_TYPES.npcDialogue,
    TUTORIAL_NODE_TYPES.playerChoice,
    TUTORIAL_NODE_TYPES.playerMove,
    TUTORIAL_NODE_TYPES.npcMove,
    TUTORIAL_NODE_TYPES.playerSkill,
    TUTORIAL_NODE_TYPES.npcSkill
  ].includes(node.type);
  const isSettlement = [
    TUTORIAL_NODE_TYPES.countingStart,
    TUTORIAL_NODE_TYPES.markDead,
    TUTORIAL_NODE_TYPES.markNeutral,
    TUTORIAL_NODE_TYPES.countingConfirm,
    TUTORIAL_NODE_TYPES.resign
  ].includes(node.type);
  return (
    <>
      <label>
        <span>教学提示</span>
        <textarea rows={3} value={node.prompt ?? ""} onChange={(event) => onPatch({ prompt: event.target.value })} />
      </label>
      {isNpcStep && (
        <>
          <label>
            <span>NPC 立绘</span>
            <select value={node.characterId ?? ""} onChange={(event) => onPatch({ characterId: event.target.value })}>
              <option value="">使用局面 NPC</option>
              {portraitOptions.map((character) => <option key={character.slug} value={character.slug}>{character.name}</option>)}
            </select>
          </label>
          <label>
            <span>NPC 显示名</span>
            <input value={node.speakerName ?? ""} onChange={(event) => onPatch({ speakerName: event.target.value })} />
          </label>
          <label>
            <span>NPC 对话</span>
            <textarea rows={4} value={node.text ?? ""} onChange={(event) => onPatch({ text: event.target.value })} />
          </label>
        </>
      )}
      <div className="admin-story-workbench-progression-grid" aria-label="节点推进">
        <strong>节点推进</strong>
        <span>推进方式</span>
        <label className="admin-story-workbench-checkbox">
          <input
            type="radio"
            name={`node-advance-mode-${node.id}`}
            checked={advanceMode === NODE_ADVANCE_MODES.auto}
            onChange={() => onPatch(nodeAdvanceModePatch(NODE_ADVANCE_MODES.auto))}
          />
          <span>自动推进</span>
          <small>{node.type === TUTORIAL_NODE_TYPES.npcDialogue ? "默认自动推进：NPC 打字结束后再等 1.5 秒进入下一节点或显示选项。" : "默认自动推进：节点完成后按等待时间进入下一节点或显示选项。"}</small>
        </label>
        <label className="admin-story-workbench-checkbox">
          <input
            type="radio"
            name={`node-advance-mode-${node.id}`}
            checked={advanceMode === NODE_ADVANCE_MODES.manual}
            onChange={() => onPatch(nodeAdvanceModePatch(NODE_ADVANCE_MODES.manual))}
          />
          <span>手动继续</span>
          <small>节点完成后给玩家“继续”按钮，点击后再进入下一节点或显示选项。</small>
        </label>
        {advanceMode === NODE_ADVANCE_MODES.auto && (
          <label>
            <span>自动推进等待</span>
            <input type="number" min="0" step="0.1" placeholder={node.type === TUTORIAL_NODE_TYPES.npcDialogue ? "默认 1.5" : "留空 = 0 秒"} value={node.autoContinueDelaySeconds ?? ""} onChange={(event) => onPatch({ autoContinueDelaySeconds: event.target.value })} />
          </label>
        )}
      </div>
      {isNpcStep && (
        <div className="admin-story-workbench-delay-grid" aria-label="NPC 表现节奏">
          <strong>NPC 表现节奏</strong>
          <label>
            <span>NPC 操作前等待</span>
            <input type="number" min="0" step="0.1" placeholder="默认 1.5" value={node.actionStartDelaySeconds ?? ""} onChange={(event) => onPatch({ actionStartDelaySeconds: event.target.value })} />
          </label>
          {node.type !== TUTORIAL_NODE_TYPES.npcDialogue && (
            <label>
              <span>动作后停顿</span>
              <input type="number" min="0" step="0.1" placeholder="默认 0.4" value={node.replyDelaySeconds ?? ""} onChange={(event) => onPatch({ replyDelaySeconds: event.target.value })} />
            </label>
          )}
        </div>
      )}
      {isBoardSetup ? (
        <BoardSetupFields node={node} skillCharacters={skillCharacters} onPatch={onPatch} onEditBoardSetup={onEditBoardSetup} />
      ) : (
        <label>
          <span>执行颜色</span>
          <select value={node.color ?? ""} onChange={(event) => onPatch({ color: event.target.value })}>
            {COLOR_OPTIONS.map((color) => <option key={color.value || "none"} value={color.value}>{color.label}</option>)}
          </select>
        </label>
      )}
      {isSettlement && (
        <label>
          <span>执行者</span>
          <select value={node.actor ?? ""} onChange={(event) => onPatch({ actor: event.target.value })}>
            <option value="">未指定</option>
            <option value="player">玩家点击</option>
            <option value="npc">NPC 自动</option>
            <option value="system">系统自动</option>
          </select>
          <small>玩家点击会在对弈功能区高亮指定按钮；NPC/系统会按延迟自动推进。</small>
        </label>
      )}
      {needsPoint && (
        <div className="admin-story-workbench-point-field">
          <label>
            <span>{isSkill ? "技能目标" : "棋盘坐标"}</span>
            <input value={node.pointId ?? ""} readOnly placeholder="点击右侧按钮选择棋盘交叉点" />
          </label>
          <button className="admin-story-workbench-button secondary" type="button" onClick={() => onPickPoint("pointId")}>
            <MousePointer2 size={16} />棋盘点选
          </button>
        </div>
      )}
      {isSkill && (
        <>
          <label>
            <span>角色</span>
            <select value={skillCharacterId} onChange={(event) => onPatch({ skillCharacterId: event.target.value, skillId: event.target.value, characterId: event.target.value })}>
              <option value="">未选择</option>
              {skillCharacters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}
            </select>
          </label>
          <label>
            <span>技能</span>
            <select value={selectedSkillId} onChange={(event) => onPatch({ skillId: event.target.value })}>
              <option value="">未选择</option>
              {skillCharacters.map((character) => (
                <option key={character.id} value={character.id}>{character.skillName}</option>
              ))}
            </select>
            <small>{skillHelpText(selectedSkillId)}</small>
          </label>
        </>
      )}
      {supportsOptions && (
        <BattleOptionsFields
          node={node}
          nodes={nodes}
          onPatchOption={onPatchOption}
          onAddOption={onAddOption}
          onRemoveOption={onRemoveOption}
          onAddBranch={onAddBranch}
        />
      )}
    </>
  );
}

function BattleOptionsFields({ node, nodes, onPatchOption, onAddOption, onRemoveOption, onAddBranch }) {
  return (
    <div className="admin-story-workbench-options">
      <div>
        <strong>对弈内回复选项</strong>
        <button className="admin-story-workbench-button secondary" type="button" onClick={onAddOption}><GitBranch size={16} />添加选项</button>
      </div>
      {(node.options ?? []).map((option, optionIndex) => (
        <div className="admin-story-workbench-option-row" key={optionIndex}>
          <label>
            <span>文案</span>
            <input value={option.label ?? ""} onChange={(event) => onPatchOption(optionIndex, { label: event.target.value })} />
          </label>
          <label>
            <span>目标</span>
            <select value={option.nextNodeId || END_TARGET} onChange={(event) => onPatchOption(optionIndex, { nextNodeId: event.target.value === END_TARGET ? "" : event.target.value, targetMissing: false })}>
              <option value={END_TARGET}>结束剧情</option>
              {nodes.filter((entry) => entry.id !== node.id).map((entry) => <option key={entry.id} value={entry.id}>{stepName(entry, nodes.indexOf(entry))}</option>)}
            </select>
          </label>
          <label>
            <span>选择后等待</span>
            <input type="number" min="0" step="0.1" placeholder="留空 = 0 秒" value={option.transitionDelaySeconds ?? ""} onChange={(event) => onPatchOption(optionIndex, { transitionDelaySeconds: event.target.value })} />
          </label>
          <div className="admin-story-workbench-option-actions">
            <button className="admin-story-workbench-button secondary" type="button" onClick={() => onAddBranch(node.id, optionIndex)}><Plus size={15} />分支步骤</button>
            <button className="admin-story-workbench-icon-button danger" type="button" aria-label="删除选项" onClick={() => onRemoveOption(optionIndex)}><Trash2 size={15} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function BoardSetupFields({ node, skillCharacters, onPatch, onEditBoardSetup }) {
  const board = boardSetupForNode(node);
  return (
    <div className="admin-story-workbench-board-summary">
      <label>
        <span>玩家执棋</span>
        <select value={node.playerColor || "black"} onChange={(event) => onPatch({ playerColor: event.target.value })}>
          <option value="black">黑棋</option>
          <option value="white">白棋</option>
        </select>
      </label>
      <label>
        <span>玩家角色</span>
        <select value={node.playerCharacterId ?? ""} onChange={(event) => onPatch({ playerCharacterId: event.target.value })}>
          <option value="">无角色</option>
          {skillCharacters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}
        </select>
        <small>选择无角色时，教学对弈内玩家侧不显示立绘，技能也会置空。</small>
      </label>
      <label>
        <span>NPC 角色</span>
        <select value={node.npcCharacterId || "denia"} onChange={(event) => onPatch({ npcCharacterId: event.target.value })}>
          {skillCharacters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}
        </select>
      </label>
      <label>
        <span>NPC 名称</span>
        <input value={node.npcName ?? ""} onChange={(event) => onPatch({ npcName: event.target.value })} placeholder="留空使用角色名" />
      </label>
      <label>
        <span>入场提示</span>
        <textarea rows={2} value={node.entryText ?? ""} onChange={(event) => onPatch({ entryText: event.target.value })} />
      </label>
      <label>
        <span>切换到局面</span>
        <select
          value={board.mode}
          onChange={(event) => onPatch({ boardSetup: { ...board, mode: event.target.value } })}
        >
          <option value="spark">星烁 13 路</option>
          <option value="standard">标准 19 路</option>
          <option value="gomoku">五子棋 13 路</option>
        </select>
      </label>
      <button className="admin-story-workbench-button secondary" type="button" onClick={onEditBoardSetup}>
        <MousePointer2 size={16} />编辑局面
      </button>
      <small>{board.stones.length} 颗棋子；运行到此步骤会替换当前教学棋盘。</small>
    </div>
  );
}

function InitialBoardEditorModal({ board, title = "初始棋盘", onClose, onSave }) {
  const [tool, setTool] = useState("black");
  const [stones, setStones] = useState(() => normalizeEditorStones(board.stones, boardSizeForMode(board.mode)));
  const boardSize = boardSizeForMode(board.mode);
  const editorGame = useMemo(() => createBoardEditorGame({ mode: board.mode, stones }), [board.mode, stones]);
  function updatePoint(point) {
    setStones((current) => updateStoneSet(current, point?.id, tool, boardSize));
  }
  return (
    <div className="admin-story-workbench-modal-backdrop" role="dialog" aria-modal="true" aria-label="初始棋盘点选">
      <section className="admin-story-workbench-board-modal">
        <header>
          <div>
            <h3>{title}</h3>
            <p>{boardSize} 路 · {stones.length} 颗棋子</p>
          </div>
          <button className="admin-story-workbench-icon-button" type="button" aria-label="关闭" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="admin-story-workbench-board-tools" role="toolbar" aria-label="摆棋工具">
          <button className={tool === "black" ? "active" : ""} type="button" onClick={() => setTool("black")}><span className="stone black" />黑棋</button>
          <button className={tool === "white" ? "active" : ""} type="button" onClick={() => setTool("white")}><span className="stone white" />白棋</button>
          <button className={tool === "erase" ? "active" : ""} type="button" onClick={() => setTool("erase")}><Eraser size={16} />擦除</button>
          <button className="danger" type="button" onClick={() => setStones([])}><Trash2 size={16} />清空</button>
        </div>
        <BoardPickerStage game={editorGame} onPoint={updatePoint} />
        <footer>
          <button className="admin-story-workbench-button secondary" type="button" onClick={onClose}>取消</button>
          <button className="admin-story-workbench-button primary" type="button" onClick={() => onSave(stones)}><Save size={16} />保存棋盘</button>
        </footer>
      </section>
    </div>
  );
}

function BoardPointPickerModal({ board, title, onClose, onPick }) {
  const game = useMemo(() => createBoardEditorGame({ mode: board.mode, stones: board.stones }), [board.mode, board.stones]);
  return (
    <div className="admin-story-workbench-modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <section className="admin-story-workbench-board-modal compact">
        <header>
          <div>
            <h3>{title}</h3>
            <p>点击棋盘交叉点写入当前步骤。</p>
          </div>
          <button className="admin-story-workbench-icon-button" type="button" aria-label="关闭" onClick={onClose}><X size={18} /></button>
        </header>
        <BoardPickerStage game={game} onPoint={(point) => onPick(point.id)} />
      </section>
    </div>
  );
}

function BoardPickerStage({ game, onPoint }) {
  return (
    <div className="admin-story-workbench-board-scroll">
      <div className="admin-story-workbench-board-stage">
        <Board game={game} showCoords showMoves={false} skillEffectsEnabled={false} stoneJitter={false} onPoint={onPoint} />
      </div>
    </div>
  );
}

function HelpDialog({ onClose }) {
  return (
    <div className="admin-story-workbench-modal-backdrop" role="dialog" aria-modal="true" aria-label="剧情教学编辑说明">
      <section className="admin-story-workbench-help">
        <header>
          <h3>剧情教学编辑说明</h3>
          <button className="admin-story-workbench-icon-button" type="button" aria-label="关闭" onClick={onClose}><X size={18} /></button>
        </header>
        <div>
          <p><BookOpen size={16} />脚本仍保存为 StoryScript。界面隐藏底层字段，只通过步骤卡、步骤类型和目标选择维护流程关系。</p>
          <p><GitBranch size={16} />剧情选项目标留空时表示结束剧情；流程图会显示虚拟“结束剧情”节点。</p>
          <p><MousePointer2 size={16} />初始棋盘、落子和技能目标优先通过棋盘点选维护，减少坐标输入错误。</p>
          <p><AlertCircle size={16} />问题面板会实时列出发布前需要修复的内容，点击问题可定位到对应步骤。</p>
        </div>
      </section>
    </div>
  );
}

function groupScripts(scripts) {
  const groups = new Map(PURPOSES.map((purpose) => [purpose.group, []]));
  for (const script of scripts) {
    const group = purposeForScript(script).group;
    groups.set(group, [...(groups.get(group) ?? []), normalizeStoryScript(script)]);
  }
  return groups;
}

function purposeForScript(script) {
  if (script.triggerType === TRIGGER_TYPES.itemCharacterUse) return PURPOSES[1];
  if (script.triggerType === TRIGGER_TYPES.battleTutorialStart && hasBattleNodes(script.draft?.nodes)) return PURPOSES[3];
  if (script.triggerType === TRIGGER_TYPES.battleTutorialStart) return PURPOSES[2];
  return PURPOSES[0];
}

function hasBattleNodes(nodes = []) {
  return nodes.some((node) => !isStoryNodeType(node.type));
}

export function buildFlow(draft = emptyScript()) {
  const nodeById = new Map(draft.nodes.map((node) => [node.id, node]));
  const main = [];
  const mainIds = new Set();
  let currentId = draft.startNodeId || draft.nodes[0]?.id || "";
  while (currentId && nodeById.has(currentId) && !mainIds.has(currentId)) {
    main.push(currentId);
    mainIds.add(currentId);
    currentId = nodeById.get(currentId).nextNodeId;
  }
  const reachable = collectReachableNodeIds(draft, nodeById);
  const renderedNodeIds = new Set(mainIds);
  const branches = new Map();
  for (const nodeId of main) {
    const node = nodeById.get(nodeId);
    const nodeBranches = buildOptionLanes(node.options ?? [], nodeById, renderedNodeIds);
    if (nodeBranches.length) branches.set(nodeId, nodeBranches);
  }
  const connectedExtras = draft.nodes
    .map((node) => node.id)
    .filter((nodeId) => reachable.has(nodeId) && !renderedNodeIds.has(nodeId));
  const orphans = draft.nodes.map((node) => node.id).filter((nodeId) => !reachable.has(nodeId));
  return { main, branches, connectedExtras, orphans, pathByNodeId: buildFlowPathIndex(draft, nodeById) };
}

function collectReachableNodeIds(draft, nodeById) {
  const reachable = new Set();
  const stack = [draft.startNodeId || draft.nodes[0]?.id || ""];
  while (stack.length) {
    const nodeId = stack.pop();
    if (!nodeId || reachable.has(nodeId) || !nodeById.has(nodeId)) continue;
    reachable.add(nodeId);
    const node = nodeById.get(nodeId);
    if (node.nextNodeId) stack.push(node.nextNodeId);
    for (const option of node.options ?? []) {
      if (option.nextNodeId) stack.push(option.nextNodeId);
    }
  }
  return reachable;
}

function buildOptionLanes(options, nodeById, renderedNodeIds) {
  return options.map((option, optionIndex) => buildOptionLane(option, optionIndex, nodeById, renderedNodeIds));
}

function buildOptionLane(option, optionIndex, nodeById, renderedNodeIds) {
  const missing = Boolean(option.targetMissing && !option.nextNodeId);
  const lane = {
    optionIndex,
    label: option.label || "选项 " + (optionIndex + 1),
    targetId: missing ? "" : option.nextNodeId || END_TARGET,
    status: missing ? "missing" : option.nextNodeId ? "linked" : "end",
    chain: [],
    lanes: [],
    mergeTargetId: ""
  };
  if (lane.status !== "linked") return lane;
  const localSeen = new Set();
  let currentId = option.nextNodeId;
  while (currentId && nodeById.has(currentId) && !localSeen.has(currentId)) {
    if (renderedNodeIds.has(currentId)) {
      lane.mergeTargetId = currentId;
      break;
    }
    lane.chain.push(currentId);
    renderedNodeIds.add(currentId);
    localSeen.add(currentId);
    const node = nodeById.get(currentId);
    if ((node.options ?? []).length) {
      lane.lanes = buildOptionLanes(node.options, nodeById, renderedNodeIds);
      break;
    }
    const nextId = node.nextNodeId;
    if (!nextId) break;
    if (renderedNodeIds.has(nextId)) {
      lane.mergeTargetId = nextId;
      break;
    }
    currentId = nextId;
  }
  return lane;
}

function buildFlowPathIndex(draft, nodeById) {
  const startId = draft.startNodeId || draft.nodes[0]?.id || "";
  const pathByNodeId = new Map();
  if (!startId || !nodeById.has(startId)) return pathByNodeId;
  const queue = [[startId, [{ type: "node", nodeId: startId }]]];
  const seen = new Set();
  while (queue.length) {
    const [nodeId, path] = queue.shift();
    if (!nodeId || seen.has(nodeId) || !nodeById.has(nodeId)) continue;
    seen.add(nodeId);
    pathByNodeId.set(nodeId, path);
    const node = nodeById.get(nodeId);
    if (node.nextNodeId) {
      queue.push([node.nextNodeId, [...path, { type: "node", nodeId: node.nextNodeId }]]);
    }
    for (const [optionIndex, option] of (node.options ?? []).entries()) {
      if (!option.nextNodeId) continue;
      queue.push([
        option.nextNodeId,
        [
          ...path,
          { type: "option", label: option.label || "选项 " + (optionIndex + 1) },
          { type: "node", nodeId: option.nextNodeId }
        ]
      ]);
    }
  }
  return pathByNodeId;
}

function validateWorkbench(script, { itemOptions, skillCharacters }) {
  const issues = [];
  const draft = script.draft;
  const nodeIds = new Set();
  const duplicates = new Set();
  if (!script.title.trim()) issues.push(issue("script-title", "error", "脚本标题不能为空"));
  if (!script.key.trim()) issues.push(issue("script-key", "error", "脚本标识不能为空"));
  if (script.triggerType === TRIGGER_TYPES.itemCharacterUse) {
    if (!script.triggerParams.itemId || !itemOptions.some((item) => item.id === script.triggerParams.itemId)) {
      issues.push(issue("trigger-item", "error", "道具互动需要选择真实道具"));
    }
    if (!script.triggerParams.characterId) issues.push(issue("trigger-character", "error", "道具互动需要选择目标角色"));
  }
  if (!draft.nodes.length) issues.push(issue("nodes", "error", "至少需要一个步骤"));
  for (const node of draft.nodes) {
    if (!node.id) issues.push(issue(`node-id-${nodeIds.size}`, "error", "步骤内部 ID 为空", node.id));
    if (nodeIds.has(node.id)) duplicates.add(node.id);
    nodeIds.add(node.id);
  }
  for (const duplicate of duplicates) issues.push(issue(`duplicate-${duplicate}`, "error", "存在重复步骤 ID", duplicate));
  if (draft.startNodeId && !nodeIds.has(draft.startNodeId)) issues.push(issue("start", "error", "起始步骤不存在"));
  for (const node of draft.nodes) {
    const name = stepName(node, draft.nodes.indexOf(node));
    if (isStoryNodeType(node.type) && !String(node.text ?? "").trim()) {
      issues.push(issue(`text-${node.id}`, "error", `${name} 缺少对白正文`, node.id));
    }
    if (node.type === TUTORIAL_NODE_TYPES.npcDialogue && !String(node.text ?? "").trim() && !(node.options ?? []).length) {
      issues.push(issue(`npc-dialogue-${node.id}`, "error", `${name} 需要 NPC 文本或回复选项`, node.id));
    }
    if (node.type === TUTORIAL_NODE_TYPES.playerChoice && !(node.options ?? []).length) {
      issues.push(issue(`player-choice-${node.id}`, "error", `${name} 至少需要一个玩家回复选项`, node.id));
    }
    if (nodeTypeRequiresPoint(node.type) && !node.pointId) {
      issues.push(issue(`point-${node.id}`, "error", `${name} 需要选择棋盘坐标`, node.id));
    }
    if (node.type === TUTORIAL_NODE_TYPES.boardSetup && !node.boardSetup) {
      issues.push(issue(`board-setup-${node.id}`, "error", `${name} 需要配置局面快照`, node.id));
    }
    if ((node.type === TUTORIAL_NODE_TYPES.playerSkill || node.type === TUTORIAL_NODE_TYPES.npcSkill) && !skillCharacters.some((character) => character.id === (node.skillId || node.skillCharacterId))) {
      issues.push(issue(`skill-${node.id}`, "error", `${name} 需要选择角色技能`, node.id));
    }
    if (settlementNodeType(node.type) && !["player", "npc", "system"].includes(node.actor ?? "")) {
      issues.push(issue(`actor-${node.id}`, "error", `${name} 需要选择执行者`, node.id));
    }
    for (const field of ["actionStartDelaySeconds", "replyDelaySeconds", "autoContinueDelaySeconds"]) {
      if (!validOptionalDelay(node[field])) {
        issues.push(issue(`delay-${field}-${node.id}`, "error", `${name} 的延迟字段必须是非负数字`, node.id));
      }
    }
    if (node.nextNodeId && !nodeIds.has(node.nextNodeId)) {
      issues.push(issue(`next-${node.id}`, "error", `${name} 的下一步骤不存在`, node.id));
    }
    for (const [optionIndex, option] of (node.options ?? []).entries()) {
      if (!String(option.label ?? "").trim()) {
        issues.push(issue(`option-label-${node.id}-${optionIndex}`, "error", `${name} 有选项缺少文案`, node.id));
      }
      if (option.targetMissing) {
        issues.push(issue(`option-missing-${node.id}-${optionIndex}`, "error", `${name} 有选项目标已被删除，需要重新选择或改为结束剧情`, node.id));
      }
      if (option.nextNodeId && !nodeIds.has(option.nextNodeId)) {
        issues.push(issue(`option-target-${node.id}-${optionIndex}`, "error", `${name} 有选项目标不存在`, node.id));
      }
      for (const field of ["transitionDelaySeconds"]) {
        if (!validOptionalDelay(option[field])) {
          issues.push(issue(`delay-${field}-${node.id}-${optionIndex}`, "error", `${name} 的选项选择后等待必须是非负数字`, node.id));
        }
      }
    }
  }
  return issues;
}

function issue(id, severity, message, nodeId = "") {
  return { id, severity, message, nodeId };
}

function settlementNodeType(type) {
  return [
    TUTORIAL_NODE_TYPES.countingStart,
    TUTORIAL_NODE_TYPES.markDead,
    TUTORIAL_NODE_TYPES.markNeutral,
    TUTORIAL_NODE_TYPES.countingConfirm,
    TUTORIAL_NODE_TYPES.resign
  ].includes(type);
}

function validOptionalDelay(value) {
  if (value == null || value === "") return true;
  const delay = Number(value);
  return Number.isFinite(delay) && delay >= 0;
}

function downloadWorkbook(buffer, fileName) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function scriptForCurrentPreview(draft, selectedNodeId) {
  if (!selectedNodeId) return draft;
  const initialBoard = replayInitialBoardToNode(draft, selectedNodeId);
  return {
    ...draft,
    startNodeId: selectedNodeId,
    initialBoard
  };
}

function replayInitialBoardToNode(draft, selectedNodeId) {
  let state = createTutorialGameState({ initialBoard: draft.initialBoard });
  const nodeById = new Map(draft.nodes.map((node) => [node.id, node]));
  const replayPath = pathToNode(draft, selectedNodeId, nodeById);
  for (const nodeId of replayPath.slice(0, -1)) {
    const node = nodeById.get(nodeId);
    if (!node) continue;
    if (node.type === TUTORIAL_NODE_TYPES.playerSkill || node.type === TUTORIAL_NODE_TYPES.npcSkill) {
      const result = applyTutorialSkillAction(state, node, { pendingSkillId: `preview-${node.id}`, resolvesAt: null });
      state = result.resolvedState ?? result.state ?? state;
    } else if (!isStoryNodeType(node.type)) {
      const result = applyTutorialNodeAction(state, node, { pointId: node.pointId });
      state = result.state ?? state;
    }
  }
  return {
    mode: state.mode ?? draft.initialBoard?.mode ?? "spark",
    stones: state.points
      .filter((point) => point.stone && isPlayerColor(point.stone))
      .map((point) => ({ pointId: point.id, color: point.stone }))
  };
}

function pathToNode(draft, selectedNodeId, nodeById = new Map(draft.nodes.map((node) => [node.id, node]))) {
  const startId = draft.startNodeId || draft.nodes[0]?.id || "";
  if (!startId || !selectedNodeId) return [];
  const queue = [[startId]];
  const seen = new Set();
  while (queue.length) {
    const path = queue.shift();
    const nodeId = path.at(-1);
    if (!nodeId || seen.has(nodeId) || !nodeById.has(nodeId)) continue;
    if (nodeId === selectedNodeId) return path;
    seen.add(nodeId);
    const node = nodeById.get(nodeId);
    const nextIds = [
      node.nextNodeId,
      ...(node.options ?? []).map((option) => option.nextNodeId)
    ].filter(Boolean);
    for (const nextId of nextIds) {
      if (!seen.has(nextId)) queue.push([...path, nextId]);
    }
  }
  return nodeById.has(selectedNodeId) ? [selectedNodeId] : [];
}

function previewPathLabel(draft, selectedNodeId) {
  const nodeById = new Map(draft.nodes.map((node) => [node.id, node]));
  const path = pathToNode(draft, selectedNodeId, nodeById);
  const labels = [];
  for (const [index, nodeId] of path.entries()) {
    const node = nodeById.get(nodeId);
    if (!node) continue;
    if (index > 0) {
      const previous = nodeById.get(path[index - 1]);
      const option = (previous?.options ?? []).find((entry) => entry.nextNodeId === nodeId);
      if (option) labels.push(`选项：${option.label || "未命名选项"}`);
    }
    labels.push(index === 0 ? "开始" : stepName(node, draft.nodes.indexOf(node)));
  }
  return labels;
}

function normalizeStoryScript(value = {}) {
  const normalized = {
    ...emptyStoryScript(),
    ...value,
    triggerParams: value.triggerParams ?? {},
    draft: normalizeDraftScript(value.draft),
    publishedAt: value.publishedAt ?? value.firstPublishedAt ?? null
  };
  return normalized;
}

function normalizeDraftScript(value = {}) {
  return {
    ...emptyScript(),
    ...value,
    initialBoard: value?.initialBoard ?? null,
    nodes: (value?.nodes ?? []).map(normalizeDraftNode)
  };
}

function normalizeDraftNode(node = {}) {
  return {
    ...emptyStoryNode(),
    ...node,
    type: node.type || TUTORIAL_NODE_TYPES.story,
    boardSetup: node.boardSetup ?? null,
    options: node.options ?? []
  };
}

function emptyStoryScript(overrides = {}) {
  return {
    key: ONBOARDING_STORY_KEY,
    title: "新手引导",
    triggerType: TRIGGER_TYPES.onboarding,
    triggerParams: {},
    draft: emptyScript(),
    published: emptyScript(),
    isPublished: false,
    publishedAt: null,
    ...overrides
  };
}

function emptyScript() {
  return { startNodeId: "", initialBoard: null, nodes: [] };
}

function emptyStoryNode(id = "", characterId = "", overrides = {}) {
  return {
    id,
    name: "",
    type: TUTORIAL_NODE_TYPES.story,
    speakerName: "",
    characterId,
    skillCharacterId: "",
    skillId: "",
    effect: STORY_NODE_EFFECTS.none,
    prompt: "",
    wrongClickMessage: "",
    pointId: "",
    color: "",
    playerColor: "black",
    playerCharacterId: "",
    npcCharacterId: "denia",
    npcName: "",
    entryText: "",
    actor: "",
    actionStartDelaySeconds: "",
    replyDelaySeconds: "",
    autoContinueDelaySeconds: "",
    manualContinueEnabled: false,
    autoContinueEnabled: true,
    boardSetup: null,
    text: "",
    nextNodeId: "",
    options: [],
    ...overrides
  };
}

function defaultPatchForType(type) {
  if (isStoryNodeType(type)) return { type, boardSetup: null };
  if (type === TUTORIAL_NODE_TYPES.boardSetup) {
    return {
      type,
      effect: STORY_NODE_EFFECTS.none,
      options: [],
      pointId: "",
      color: "",
      playerColor: "black",
      playerCharacterId: "",
      npcCharacterId: "denia",
      npcName: "",
      entryText: "",
      skillCharacterId: "",
      skillId: "",
      manualContinueEnabled: false,
      autoContinueEnabled: true,
      boardSetup: { mode: "spark", stones: [] }
    };
  }
  return {
    type,
    effect: STORY_NODE_EFFECTS.none,
    options: [],
    boardSetup: null,
    manualContinueEnabled: false,
    autoContinueEnabled: true
  };
}

function boardSetupForNode(node, draft = emptyScript()) {
  const fallbackMode = draft.initialBoard?.mode ?? "spark";
  if (node?.boardSetup && typeof node.boardSetup === "object") {
    return {
      mode: node.boardSetup.mode ?? fallbackMode,
      stones: Array.isArray(node.boardSetup.stones) ? node.boardSetup.stones : []
    };
  }
  return { mode: fallbackMode, stones: [] };
}

function toSubmitPayload(script, action) {
  return {
    action,
    title: script.title,
    triggerType: script.triggerType,
    triggerParams: script.triggerParams,
    draft: stripUiOnlyDraft(script.draft)
  };
}

function stripUiOnlyDraft(draft) {
  return {
    ...draft,
    nodes: draft.nodes.map((node) => ({
      ...node,
      options: (node.options ?? []).map(({ targetMissing, ...option }) => option)
    }))
  };
}

function cloneDraft(draft) {
  return JSON.parse(JSON.stringify(draft ?? emptyScript()));
}

function isSystemScript(script) {
  return script?.key === ONBOARDING_STORY_KEY;
}

function uniqueScriptKey(scripts, prefix = "story.custom") {
  let index = scripts.length + 1;
  let key = `${prefix}.${index}`;
  const existing = new Set(scripts.map((entry) => entry.key));
  while (existing.has(key)) {
    index += 1;
    key = `${prefix}.${index}`;
  }
  return key;
}

function uniqueNodeId(nodes, hint = "step") {
  const safeHint = String(hint || "step").replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "step";
  let index = nodes.length + 1;
  let id = `${safeHint}-${index}`;
  const existing = new Set(nodes.map((node) => node.id));
  while (existing.has(id)) {
    index += 1;
    id = `${safeHint}-${index}`;
  }
  return id;
}

function stepName(node, index = 0) {
  return String(node?.name ?? "").trim() || autoStepName(node, index);
}

function autoStepName(node, index = 0) {
  const label = NODE_TYPE_LABELS[node?.type] ?? "剧情";
  const summary = nodeSummary(node);
  return summary ? `${label} · ${summary}` : `${label} ${index + 1}`;
}

function nodeSummary(node) {
  if (!node) return "";
  if (isStoryNodeType(node.type)) return compactText(node.text || node.prompt || node.speakerName || "空对白");
  if (node.type === TUTORIAL_NODE_TYPES.boardSetup) {
    const board = boardSetupForNode(node);
    return `${board.mode} · ${board.stones.length} 颗棋子`;
  }
  if (node.type === TUTORIAL_NODE_TYPES.playerMove || node.type === TUTORIAL_NODE_TYPES.npcMove) return `${node.color || "未指定"} ${node.pointId || "未选点"}`;
  if (node.type === TUTORIAL_NODE_TYPES.playerSkill || node.type === TUTORIAL_NODE_TYPES.npcSkill) return `${node.skillId || node.characterId || "未选技能"} ${node.pointId || ""}`.trim();
  if (node.type === TUTORIAL_NODE_TYPES.resign) return `${node.color || "未指定"}认输`;
  return node.prompt || "结算动作";
}

function compactText(value) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > 26 ? `${text.slice(0, 26)}...` : text;
}

function defaultCharacterId(characters) {
  return characters[0]?.slug || characters[0]?.id || "sigrika";
}

function adminItemOptions(items) {
  const realItems = (Array.isArray(items) ? items : [])
    .filter((item) => item?.category === "item" && item.enabled !== false)
    .map((item) => ({
      id: item.targetId,
      sourceId: item.id,
      name: item.name || item.targetId || item.id
    }))
    .filter((item) => item.id);
  if (realItems.length) return realItems;
  return [{ id: "rainbow-bean-candy", sourceId: "rainbow-bean-candy", name: "彩虹豆豆跳跳糖" }];
}

function adminSkillCharacters(characters) {
  const source = Array.isArray(characters) && characters.length
    ? characters.map((character) => ({
        id: character.slug || character.id,
        name: character.name || character.slug || character.id,
        skill: character.skill
      }))
    : characterListFromCatalog(CHARACTERS).map((character) => ({
        id: character.id,
        name: character.name,
        skill: character.skill
      }));
  return source
    .filter((character) => character.id && character.skill)
    .map((character) => ({
      id: character.id,
      name: character.name,
      skillName: character.skill?.name || SKILL_EFFECT_CATALOG[character.skill?.id]?.label || character.id
    }));
}

function adminCharacterCatalog(characters) {
  const catalog = { ...CHARACTERS };
  if (!Array.isArray(characters)) return catalog;
  for (const character of characters) {
    const id = character?.slug || character?.id;
    if (!id) continue;
    catalog[id] = {
      ...(catalog[id] ?? {}),
      ...character,
      id,
      skill: {
        ...(catalog[id]?.skill ?? {}),
        ...(character.skill ?? {})
      }
    };
  }
  return catalog;
}

function skillHelpText(skillId) {
  const effect = CHARACTERS[skillId]?.skill?.id;
  if (!effect) return "发布时会校验技能是否可解析。";
  const rule = SKILL_EFFECT_CATALOG[effect]?.targetRule ?? "none";
  if (rule === "none") return "该技能通常不需要精确目标点。";
  if (rule === "stone") return "该技能目标应选择已有棋子。";
  return "该技能目标优先通过棋盘点选。";
}

function boardSizeForMode(mode) {
  return gameModeById(mode ?? "spark").boardSize;
}

const BOARD_EDITOR_PLAYERS = Object.freeze([
  { color: COLORS.black, name: "Black", characterId: "sigrika" },
  { color: COLORS.white, name: "White", characterId: "denia" }
]);

function createBoardEditorGame({ mode = "spark", stones = [] } = {}) {
  const game = createGameState(BOARD_EDITOR_PLAYERS, { mode });
  for (const stone of stones ?? []) {
    if (!isPlayerColor(stone?.color)) continue;
    const point = getPoint(game, stone.pointId);
    if (point?.valid) point.stone = stone.color;
  }
  return game;
}

function normalizeEditorStones(stones = [], boardSize = 13) {
  return stonesFromMap(new Map((Array.isArray(stones) ? stones : [])
    .filter((stone) => stone?.pointId && isPlayerColor(stone.color))
    .map((stone) => [stone.pointId, stone.color])), boardSize);
}

function updateStoneSet(current, pointId, tool, boardSize) {
  const next = new Map(current.map((stone) => [stone.pointId, stone.color]));
  if (!pointId) return current;
  if (tool === "erase") next.delete(pointId);
  else next.set(pointId, tool);
  return stonesFromMap(next, boardSize);
}

function stonesFromMap(stoneMap, boardSize = 13) {
  return [...stoneMap.entries()]
    .map(([pointId, color]) => ({ pointId, color }))
    .filter((stone) => isPointInBoard(stone.pointId, boardSize) && isPlayerColor(stone.color))
    .sort((left, right) => pointSortValue(left.pointId) - pointSortValue(right.pointId));
}

function isPointInBoard(pointId, boardSize) {
  const [x, y] = String(pointId ?? "").split(",").map(Number);
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < boardSize && y < boardSize;
}

function pointSortValue(pointId) {
  const [x, y] = String(pointId ?? "").split(",").map(Number);
  return (Number.isInteger(y) ? y : 0) * 1000 + (Number.isInteger(x) ? x : 0);
}
