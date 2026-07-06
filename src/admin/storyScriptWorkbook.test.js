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
      initialBoard: { mode: "spark", stones: [{ pointId: "1,1", color: "black" }] },
      nodes: [
        {
          id: "start",
          type: "story",
          speakerName: "西格莉卡",
          characterId: "sigrika",
          effect: "none",
          text: "要开始了。",
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
    expect(result.draft.nodes).toHaveLength(2);
    expect(result.draft.nodes[1].options[0]).toMatchObject({
      label: "继续",
      nextNodeId: "",
      transitionDelaySeconds: "0.5"
    });
    expect(result.draft.nodes[0]).not.toHaveProperty("__rowNumber");
    expect(result.summary.nextNodeCount).toBe(2);
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
