import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { readCssWithImports } from "../styles/cssTestUtils.js";
import { DENIA_RAINBOW_GLOW_STORY_PORTRAIT_ID, storyPortraitOptions } from "../shared/storyPortraits.js";
import { buildFlow, scriptForCurrentPreview } from "./AdminOnboardingStory.jsx";

const adminCss = readCssWithImports(new URL("../styles/admin.css", import.meta.url));
const adminSource = readFileSync(new URL("./AdminOnboardingStory.jsx", import.meta.url), "utf8");

describe("AdminOnboardingStory", () => {
  it("uses the isolated story workbench namespace instead of the old onboarding form namespace", () => {
    expect(adminSource).toContain('className="admin-story-workbench"');
    expect(adminSource).toContain("ScriptLibrary");
    expect(adminSource).toContain("FlowGraph");
    expect(adminSource).toContain("IssuePanel");
    expect(adminSource).toContain("StepEditor");
    expect(adminCss).toContain(".admin-story-workbench");
    expect(adminCss).toContain("--story-wb-bg: #f6f7fb");
    expect(adminCss).toContain("--story-wb-primary: #4f6fdf");
    expect(adminCss).toContain(".admin-story-workbench-shell");
    expect(adminCss).toContain("grid-template-rows: auto minmax(0, 1fr)");
    expect(adminCss).not.toContain("grid-template-columns: minmax(220px, 280px) minmax(520px, 1fr) minmax(320px, 420px)");
    expect(adminCss).not.toContain(".admin-onboarding-editor");
    expect(adminCss).not.toContain(".admin-onboarding-node-list");
    expect(adminCss).not.toContain(".admin-onboarding-node");
  });

  it("prioritizes a full-width flow row with the script library above it", () => {
    const contentIndex = adminSource.indexOf('className="admin-story-workbench-content"');
    const supportIndex = adminSource.indexOf('className="admin-story-workbench-support"');
    const previewIndex = adminSource.indexOf('className="admin-story-workbench-preview"');

    expect(contentIndex).toBeGreaterThan(-1);
    expect(supportIndex).toBeGreaterThan(contentIndex);
    expect(previewIndex).toBeGreaterThan(supportIndex);
    expect(adminCss).toContain(".admin-story-workbench-support");
    expect(adminCss).toContain("grid-template-areas:");
    expect(adminCss).toContain('"flow"');
    expect(adminCss).toContain('"support"');
    expect(adminCss).toContain("grid-auto-flow: column");
    expect(adminCss).toContain("grid-column: 1 / -1");
  });

  it("renders a card library, automatic flow canvas, current-step form, issues, and preview controls", () => {
    expect(adminSource).toContain("脚本库");
    expect(adminSource).toContain("自动流程图");
    expect(adminSource).toContain("实时问题");
    expect(adminSource).toContain("从当前步骤预览");
    expect(adminSource).toContain("scriptForCurrentPreview");
    expect(adminSource).toContain("replayInitialBoardToNode");
    expect(adminSource).toContain("targetMissing");
    expect(adminSource).toContain("END_TARGET");
    expect(adminCss).toContain(".admin-story-workbench-flow-canvas");
    expect(adminCss).toContain(".admin-story-workbench-flow-path");
    expect(adminCss).toContain(".admin-story-workbench-lane-title");
    expect(adminCss).toContain(".admin-story-workbench-merge-card");
    expect(adminCss).toContain(".admin-story-workbench-step-card");
    expect(adminCss).toContain(".admin-story-workbench-end-card");
    expect(adminCss).toContain(".admin-story-workbench-issues");
    expect(adminCss).toContain(".admin-story-workbench-preview-stage");
  });

  it("keeps option targets and deep branch continuations inside swimlanes", () => {
    const flow = buildFlow({
      startNodeId: "start",
      nodes: [
        { id: "start", type: "story", nextNodeId: "main-2", options: [{ label: "branch", nextNodeId: "branch-1" }] },
        { id: "main-2", type: "story", nextNodeId: "" },
        { id: "branch-1", type: "story", nextNodeId: "branch-2" },
        { id: "branch-2", type: "story", nextNodeId: "", options: [{ label: "deep", nextNodeId: "branch-3" }] },
        { id: "branch-3", type: "story", nextNodeId: "" },
        { id: "loose", type: "story", nextNodeId: "" }
      ]
    });

    expect(flow.main).toEqual(["start", "main-2"]);
    expect(flow.branches.get("start")[0]).toMatchObject({
      targetId: "branch-1",
      chain: ["branch-1", "branch-2"],
      lanes: [
        expect.objectContaining({
          label: "deep",
          targetId: "branch-3",
          chain: ["branch-3"]
        })
      ]
    });
    expect(flow.connectedExtras).toEqual([]);
    expect(flow.orphans).toEqual(["loose"]);
  });

  it("renders shared branch targets once and marks later lanes as merge links", () => {
    const flow = buildFlow({
      startNodeId: "start",
      nodes: [
        {
          id: "start",
          type: "story",
          nextNodeId: "",
          options: [
            { label: "A", nextNodeId: "a-1" },
            { label: "B", nextNodeId: "b-1" }
          ]
        },
        { id: "a-1", type: "story", nextNodeId: "shared" },
        { id: "b-1", type: "story", nextNodeId: "shared" },
        { id: "shared", type: "story", nextNodeId: "" }
      ]
    });

    const lanes = flow.branches.get("start");
    expect(lanes[0]).toMatchObject({
      label: "A",
      chain: ["a-1", "shared"],
      mergeTargetId: ""
    });
    expect(lanes[1]).toMatchObject({
      label: "B",
      chain: ["b-1"],
      mergeTargetId: "shared"
    });
    expect(flow.connectedExtras).toEqual([]);
    expect(flow.orphans).toEqual([]);
  });

  it("distinguishes valid end targets from missing option targets", () => {
    const flow = buildFlow({
      startNodeId: "start",
      nodes: [
        {
          id: "start",
          type: "story",
          nextNodeId: "",
          options: [
            { label: "End", nextNodeId: "" },
            { label: "Repair", nextNodeId: "", targetMissing: true }
          ]
        }
      ]
    });

    expect(flow.branches.get("start")).toEqual([
      expect.objectContaining({ label: "End", targetId: "__story-end__", status: "end" }),
      expect.objectContaining({ label: "Repair", targetId: "", status: "missing" })
    ]);
  });

  it("replays option-branch board setup nodes for current-step preview", () => {
    const preview = scriptForCurrentPreview({
      startNodeId: "start",
      initialBoard: {
        mode: "spark",
        stones: [{ pointId: "1,1", color: "black" }]
      },
      nodes: [
        { id: "start", type: "story", text: "Choose.", options: [{ label: "Beginner", nextNodeId: "setup-beginner" }] },
        {
          id: "setup-beginner",
          type: "board-setup",
          boardSetup: {
            mode: "spark",
            stones: [{ pointId: "5,5", color: "white" }]
          },
          nextNodeId: "branch-move"
        },
        { id: "branch-move", type: "player-move", pointId: "6,6", color: "black", nextNodeId: "" }
      ]
    }, "branch-move");

    expect(preview.startNodeId).toBe("branch-move");
    expect(preview.initialBoard).toEqual({
      mode: "spark",
      stones: [{ pointId: "5,5", color: "white" }]
    });
  });

  it("adds story-only portrait options to the node portrait selector", () => {
    expect(storyPortraitOptions([{ slug: "denia", name: "达妮娅" }])).toEqual(expect.arrayContaining([
      expect.objectContaining({
        slug: DENIA_RAINBOW_GLOW_STORY_PORTRAIT_ID,
        name: "发彩虹光的达妮娅",
        portraitUrl: "/assets/characters/denia_color.webp"
      })
    ]));
    expect(adminSource).toContain("const portraitOptions = useMemo(() => storyPortraitOptions(characters), [characters]);");
    expect(adminSource).toContain("portraitOptions.map((character)");
  });

  it("keeps node effects, options, and hidden raw graph fields behind friendly controls", () => {
    expect(adminSource).toContain("STORY_NODE_EFFECT_OPTIONS");
    expect(adminSource).toContain("STORY_NODE_EFFECTS.none");
    expect(adminSource).toContain("剧情选项");
    expect(adminSource).toContain('type="number"');
    expect(adminSource).toContain('step="0.1"');
    expect(adminSource).toContain("revealDelaySeconds");
    expect(adminSource).toContain("transitionDelaySeconds");
    expect(adminSource).toContain("步骤类型");
    expect(adminSource).toContain("下一主线步骤");
    expect(adminSource).not.toContain("节点 ID");
    expect(adminSource).not.toContain("nextNodeId 默认");
  });

  it("exposes simplified progression controls for nodes and options", () => {
    expect(adminSource).toContain("节点推进");
    expect(adminSource).toContain("推进方式");
    expect(adminSource).toContain('type="radio"');
    expect(adminSource).toContain("nodeAdvanceMode(node)");
    expect(adminSource).toContain("nodeAdvanceModePatch(NODE_ADVANCE_MODES.auto)");
    expect(adminSource).toContain("nodeAdvanceModePatch(NODE_ADVANCE_MODES.manual)");
    expect(adminSource).toContain("手动继续");
    expect(adminSource).toContain("自动推进");
    expect(adminSource).toContain("自动推进等待");
    expect(adminSource).toContain("默认自动推进");
    expect(adminSource).toContain("NPC 表现节奏");
    expect(adminSource).toContain("选择后等待");
    expect(adminSource).toContain("留空 = 0 秒");
    expect(adminSource).toContain("默认 1.5");
    expect(adminSource).toContain("动作后停顿");
    expect(adminSource).toContain("previewControlsEnabled");
    expect(adminSource).toContain("manualContinueEnabled");
    expect(adminSource).toContain("autoContinueEnabled");
    expect(adminSource).toContain("\"transitionDelaySeconds\"");
    expect(adminSource).toContain("\"actionStartDelaySeconds\", \"replyDelaySeconds\", \"autoContinueDelaySeconds\"");
    expect(adminSource).toContain("\"transitionDelaySeconds\"");
    expect(adminSource).not.toContain("nodeManualContinueEnabled");
    expect(adminSource).not.toContain("nodeAutoContinueEnabled");
    expect(adminSource).not.toContain("如果也开启自动推进");
    expect(adminSource).not.toContain("可提前点击");
  });

  it("supports unified battle tutorial controls through shared board point picking", () => {
    expect(adminSource).toContain("NODE_TYPE_GROUPS");
    expect(adminSource).toContain("初始棋盘");
    expect(adminSource).toContain("棋盘点选");
    expect(adminSource).toContain("BoardPointPickerModal");
    expect(adminSource).toContain("InitialBoardEditorModal");
    expect(adminSource).toContain("BoardSetupFields");
    expect(adminSource).toContain("nodeBoardEditorId");
    expect(adminSource).toContain("board-setup");
    expect(adminSource).toContain('import Board from "../room/Board.jsx";');
    expect(adminSource).toContain("createBoardEditorGame");
    expect(adminSource).toContain("createGameState");
    expect(adminSource).toContain("getPoint");
    expect(adminSource).toContain("stoneJitter={false}");
    expect(adminSource).toContain("onPoint={onPoint}");
    expect(adminSource).toContain("skillCharacters");
    expect(adminSource).toContain("skillHelpText");
    expect(adminCss).toContain(".admin-story-workbench-board-modal");
    expect(adminCss).toContain(".admin-story-workbench-board-stage");
    expect(adminCss).toContain(".admin-story-workbench-board-stage .board-wrap");
    expect(adminCss).not.toContain(".admin-board-editor-grid");
    expect(adminCss).not.toContain(".admin-board-editor-lines");
    expect(adminCss).not.toContain("--point-x");
  });

  it("keeps the visual direction light and avoids old black-green admin editor styling", () => {
    expect(adminCss).toContain("background: var(--story-wb-surface)");
    expect(adminCss).toContain("color: var(--story-wb-text)");
    expect(adminCss).not.toContain("#00ff");
    expect(adminCss).not.toContain("荧光");
    expect(adminCss).not.toContain("background: #000");
    expect(adminCss).not.toContain("color: #00");
  });
});
