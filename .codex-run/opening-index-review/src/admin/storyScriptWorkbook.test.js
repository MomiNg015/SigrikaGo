import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import {
  parseStoryScriptWorkbook,
  storyScriptWorkbookFileName,
  writeStoryScriptWorkbook
} from "./storyScriptWorkbook.js";

function sampleScript() {
  return {
    key: "item.story.sigrika",
    title: "西格莉卡测试剧情",
    triggerType: "item-character-use",
    triggerParams: { itemId: "rainbow-bean-candy", characterId: "sigrika" },
    isPublished: true,
    publishedAt: "2026-07-06T10:00:00.000Z",
    draft: {
      startNodeId: "start",
      initialBoard: { mode: "spark", stones: [{ pointId: "1,1", color: "black" }], lastMovePointId: "1,1" },
      nodes: [
        {
          id: "start",
          type: "story",
          speakerName: "西格莉卡",
          characterId: "sigrika",
          effect: "none",
          text: "要开始了。",
          nextNodeId: "setup"
        },
        {
          id: "setup",
          type: "board-setup",
          boardSetupLoadingEnabled: false,
          boardSetup: { mode: "spark", stones: [{ pointId: "2,2", color: "white" }], lastMovePointId: "2,2" },
          nextNodeId: "move"
        },
        {
          id: "move",
          type: "player-move",
          pointId: "3,3",
          color: "black",
          targetHighlightEnabled: false,
          wrongMovePointId: "4,4",
          wrongMoveNextNodeId: "start",
          applyWrongMove: true,
          nextNodeId: "choice"
        },
        {
          id: "choice",
          type: "player-choice",
          prompt: "怎么回答？",
          color: "black",
          nextNodeId: "",
          options: [
            { label: "继续", nextNodeId: "", transitionDelaySeconds: "0.5" }
          ]
        }
      ]
    },
    published: {
      startNodeId: "start",
      initialBoard: null,
      nodes: [
        { id: "start", type: "story", speakerName: "西格莉卡", text: "线上版本。", nextNodeId: "" }
      ]
    }
  };
}

async function workbookFromBuffer(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
}

async function bufferFromWorkbook(workbook) {
  return workbook.xlsx.writeBuffer();
}

function setInfoValue(workbook, label, value) {
  const sheet = workbook.getWorksheet("脚本信息");
  sheet.eachRow((row) => {
    if (row.getCell(1).value === label) row.getCell(2).value = value;
  });
}

describe("storyScriptWorkbook", () => {
  it("round-trips an exported workbook back into a draft import", async () => {
    const script = sampleScript();
    const buffer = await writeStoryScriptWorkbook(script, { exportedAt: new Date("2026-07-06T12:00:00Z") });

    const result = await parseStoryScriptWorkbook(buffer, script, {
      itemOptions: [{ id: "rainbow-bean-candy", name: "彩虹豆豆跳跳糖" }],
      skillCharacters: []
    });

    expect(result.ok).toBe(true);
    expect(result.title).toBe(script.title);
    expect(result.draft.startNodeId).toBe("start");
    expect(result.draft.nodes).toHaveLength(4);
    expect(result.draft.initialBoard).toMatchObject({ lastMovePointId: "1,1" });
    expect(result.draft.nodes[1]).toMatchObject({
      boardSetupLoadingEnabled: false,
      boardSetup: { lastMovePointId: "2,2" }
    });
    expect(result.draft.nodes[2]).toMatchObject({
      targetHighlightEnabled: false,
      wrongMovePointId: "4,4",
      wrongMoveNextNodeId: "start",
      applyWrongMove: true
    });
    expect(result.draft.nodes[3].options[0]).toMatchObject({
      label: "继续",
      nextNodeId: "",
      transitionDelaySeconds: "0.5"
    });
    expect(result.draft.nodes[0]).not.toHaveProperty("__rowNumber");
    expect(result.summary.nextNodeCount).toBe(4);
  });

  it("imports legacy v1 sheets that do not contain the newly optional columns", async () => {
    const script = sampleScript();
    const workbook = await workbookFromBuffer(await writeStoryScriptWorkbook(script));
    const optionalNodeHeaders = ["显示目标圈", "特殊错误坐标", "错误落子目标节点ID", "错误落子实际落盘", "局面切换显示加载页"];
    for (const sheetName of ["草稿-节点", "发布版-节点"]) {
      const sheet = workbook.getWorksheet(sheetName);
      const indexes = optionalNodeHeaders
        .map((header) => sheet.getRow(1).values.indexOf(header))
        .filter((index) => index > 0)
        .sort((left, right) => right - left);
      for (const index of indexes) sheet.spliceColumns(index, 1);
    }
    for (const sheetName of ["草稿-棋盘动作", "发布版-棋盘动作"]) {
      const sheet = workbook.getWorksheet(sheetName);
      const index = sheet.getRow(1).values.indexOf("初始末手坐标");
      if (index > 0) sheet.spliceColumns(index, 1);
    }

    const result = await parseStoryScriptWorkbook(await bufferFromWorkbook(workbook), script);
    expect(result.ok).toBe(true);
    expect(result.draft.nodes[2]).toMatchObject({
      targetHighlightEnabled: true,
      wrongMovePointId: "",
      wrongMoveNextNodeId: "",
      applyWrongMove: false
    });
    expect(result.draft.nodes[1]).toMatchObject({ boardSetupLoadingEnabled: true });
    expect(result.draft.initialBoard).toMatchObject({ mode: "spark", stones: [{ pointId: "1,1", color: "black" }] });
  });

  it("allows the workbook title to update while rejecting script identity changes", async () => {
    const script = sampleScript();
    const workbook = await workbookFromBuffer(await writeStoryScriptWorkbook(script));
    setInfoValue(workbook, "脚本标题", "离线修改后的标题");
    const titleResult = await parseStoryScriptWorkbook(await bufferFromWorkbook(workbook), script);

    expect(titleResult.ok).toBe(true);
    expect(titleResult.title).toBe("离线修改后的标题");
    expect(titleResult.summary.titleChanged).toBe(true);

    setInfoValue(workbook, "脚本标识", "other.script");
    const keyResult = await parseStoryScriptWorkbook(await bufferFromWorkbook(workbook), script);
    expect(keyResult.ok).toBe(false);
    expect(keyResult.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ sheet: "脚本信息", field: "脚本标识" })
    ]));
  });

  it("rejects invalid draft references without returning a partial import", async () => {
    const script = sampleScript();
    const workbook = await workbookFromBuffer(await writeStoryScriptWorkbook(script));
    const nodes = workbook.getWorksheet("草稿-节点");
    const nextHeaderIndex = nodes.getRow(1).values.indexOf("下一主线节点ID（空=结束）");
    nodes.getRow(2).getCell(nextHeaderIndex).value = "missing-node";

    const result = await parseStoryScriptWorkbook(await bufferFromWorkbook(workbook), script);

    expect(result.ok).toBe(false);
    expect(result.draft).toBeUndefined();
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        sheet: "草稿-节点",
        row: 2,
        field: "下一主线节点ID（空=结束）"
      })
    ]));
  });

  it("builds safe timestamped workbook file names", () => {
    expect(storyScriptWorkbookFileName({
      key: "item.story.sigrika",
      title: "西格莉卡/测试:剧情",
      draft: { nodes: [] },
      published: { nodes: [] }
    }, new Date("2026-07-06T12:34:00"))).toBe("西格莉卡-测试-剧情-20260706-1234.xlsx");
  });
});
