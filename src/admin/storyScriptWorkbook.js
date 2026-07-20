import {
  TUTORIAL_NODE_TYPES,
  isStoryNodeType,
  nodeTypeRequiresPoint
} from "../shared/tutorialNodeTypes.js";

export const STORY_SCRIPT_WORKBOOK_VERSION = "sigrika-story-script-xlsx-v1";

const SHEETS = Object.freeze({
  info: "脚本信息",
  draftNodes: "草稿-节点",
  draftOptions: "草稿-选项",
  draftBoards: "草稿-棋盘动作",
  publishedNodes: "发布版-节点",
  publishedOptions: "发布版-选项",
  publishedBoards: "发布版-棋盘动作",
  rawJson: "原始JSON"
});

const INFO_LABELS = Object.freeze({
  formatVersion: "格式版本",
  key: "脚本标识",
  title: "脚本标题",
  triggerType: "触发类型",
  triggerParamsJson: "触发参数JSON",
  draftStartNodeId: "草稿起始节点ID",
  publishedStartNodeId: "发布版起始节点ID",
  isPublished: "是否已发布",
  publishedAt: "发布时间",
  exportedAt: "导出时间"
});

const NODE_COLUMNS = Object.freeze([
  ["order", "顺序"],
  ["id", "节点ID"],
  ["type", "节点类型"],
  ["name", "步骤名称"],
  ["speakerName", "说话人"],
  ["characterId", "立绘角色ID"],
  ["effect", "演出效果"],
  ["text", "对白/NPC文本"],
  ["prompt", "教学提示"],
  ["wrongClickMessage", "错误点击提示"],
  ["targetHighlightEnabled", "显示目标圈"],
  ["wrongMovePointId", "特殊错误坐标"],
  ["wrongMoveNextNodeId", "错误落子目标节点ID"],
  ["applyWrongMove", "错误落子实际落盘"],
  ["boardSetupLoadingEnabled", "局面切换显示加载页"],
  ["nextNodeId", "下一主线节点ID（空=结束）"],
  ["pointId", "棋盘坐标/技能目标"],
  ["color", "执行颜色"],
  ["playerColor", "玩家执棋"],
  ["playerCharacterId", "玩家角色ID"],
  ["npcCharacterId", "NPC角色ID"],
  ["npcName", "NPC名称"],
  ["entryText", "入场文本"],
  ["actor", "执行者"],
  ["actionStartDelaySeconds", "动作前等待秒"],
  ["replyDelaySeconds", "动作后停顿秒"],
  ["autoContinueDelaySeconds", "自动推进等待秒"],
  ["manualContinueEnabled", "手动继续"],
  ["autoContinueEnabled", "自动推进"],
  ["skillCharacterId", "技能角色ID"],
  ["skillId", "技能ID"]
]);

const OPTION_COLUMNS = Object.freeze([
  ["nodeId", "所属节点ID"],
  ["optionIndex", "选项顺序"],
  ["label", "选项文案"],
  ["nextNodeId", "目标节点ID（空=结束）"],
  ["revealDelaySeconds", "出现时间秒"],
  ["transitionDelaySeconds", "选择后等待秒"]
]);

const BOARD_COLUMNS = Object.freeze([
  ["scope", "范围（script/node）"],
  ["nodeId", "节点ID（范围为node时必填）"],
  ["mode", "棋盘模式"],
  ["stonesJson", "棋子JSON"],
  ["lastMovePointId", "初始末手坐标"]
]);

const OPTIONAL_NODE_HEADERS = new Set([
  "targetHighlightEnabled",
  "wrongMovePointId",
  "wrongMoveNextNodeId",
  "applyWrongMove",
  "boardSetupLoadingEnabled"
].map((key) => fieldHeader(NODE_COLUMNS, key)));
const OPTIONAL_BOARD_HEADERS = new Set([fieldHeader(BOARD_COLUMNS, "lastMovePointId")]);

const NODE_KEYS = NODE_COLUMNS.map(([key]) => key);
const OPTION_KEYS = OPTION_COLUMNS.map(([key]) => key);
const BOARD_KEYS = BOARD_COLUMNS.map(([key]) => key);
const NODE_TYPE_VALUES = new Set(Object.values(TUTORIAL_NODE_TYPES));
const SETTLEMENT_NODE_TYPES = new Set([
  TUTORIAL_NODE_TYPES.countingStart,
  TUTORIAL_NODE_TYPES.markDead,
  TUTORIAL_NODE_TYPES.markNeutral,
  TUTORIAL_NODE_TYPES.countingConfirm,
  TUTORIAL_NODE_TYPES.resign
]);

export async function writeStoryScriptWorkbook(script, { exportedAt = new Date() } = {}) {
  const normalized = normalizeScript(script);
  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SigrikaGo";
  workbook.created = exportedAt;
  addInfoSheet(workbook, normalized, exportedAt);
  addNodeSheet(workbook, SHEETS.draftNodes, normalized.draft.nodes);
  addOptionSheet(workbook, SHEETS.draftOptions, normalized.draft.nodes);
  addBoardSheet(workbook, SHEETS.draftBoards, normalized.draft);
  addNodeSheet(workbook, SHEETS.publishedNodes, normalized.published.nodes, { locked: true });
  addOptionSheet(workbook, SHEETS.publishedOptions, normalized.published.nodes, { locked: true });
  addBoardSheet(workbook, SHEETS.publishedBoards, normalized.published, { locked: true });
  addRawJsonSheet(workbook, normalized);
  return workbook.xlsx.writeBuffer();
}

export async function parseStoryScriptWorkbook(buffer, currentScript, context = {}) {
  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const current = normalizeScript(currentScript);
  const errors = [];
  const info = readInfoSheet(workbook, errors);
  validateWorkbookIdentity(info, current, errors);
  const draft = readDraftFromWorkbook(workbook, info, errors);
  if (!errors.length) {
    validateImportedScript({
      title: info.title,
      draft,
      current,
      itemOptions: context.itemOptions ?? [],
      skillCharacters: context.skillCharacters ?? []
    }, errors);
  }
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    title: info.title,
    draft: stripImportMetadata(draft),
    summary: buildImportSummary(current, { title: info.title, draft }),
    errors: []
  };
}

export function storyScriptWorkbookFileName(script, exportedAt = new Date()) {
  const normalized = normalizeScript(script);
  const stamp = formatDateStamp(exportedAt);
  const safeName = sanitizeFileName(normalized.title || normalized.key || "story-script");
  return `${safeName}-${stamp}.xlsx`;
}

export function buildImportSummary(currentScript, imported) {
  const current = normalizeScript(currentScript);
  const currentNodeIds = new Set(current.draft.nodes.map((node) => node.id));
  const nextNodeIds = new Set(imported.draft.nodes.map((node) => node.id));
  const addedNodeIds = [...nextNodeIds].filter((id) => !currentNodeIds.has(id));
  const removedNodeIds = [...currentNodeIds].filter((id) => !nextNodeIds.has(id));
  return {
    titleChanged: (current.title ?? "") !== (imported.title ?? ""),
    previousTitle: current.title ?? "",
    nextTitle: imported.title ?? "",
    previousNodeCount: current.draft.nodes.length,
    nextNodeCount: imported.draft.nodes.length,
    previousOptionCount: countOptions(current.draft.nodes),
    nextOptionCount: countOptions(imported.draft.nodes),
    addedNodeIds,
    removedNodeIds,
    previousStartNodeId: current.draft.startNodeId || current.draft.nodes[0]?.id || "",
    nextStartNodeId: imported.draft.startNodeId || imported.draft.nodes[0]?.id || ""
  };
}

function addInfoSheet(workbook, script, exportedAt) {
  const sheet = workbook.addWorksheet(SHEETS.info);
  sheet.columns = [
    { header: "字段", key: "field", width: 22 },
    { header: "值", key: "value", width: 54 },
    { header: "说明", key: "note", width: 46 }
  ];
  styleHeader(sheet);
  const rows = [
    ["formatVersion", STORY_SCRIPT_WORKBOOK_VERSION, "导入时必须匹配。"],
    ["key", script.key, "必须和当前脚本匹配，导入不会修改。"],
    ["title", script.title, "导入时可更新当前脚本标题。"],
    ["triggerType", script.triggerType, "必须和当前脚本匹配，导入不会修改。"],
    ["triggerParamsJson", stableStringify(script.triggerParams), "必须和当前脚本匹配，导入不会修改。"],
    ["draftStartNodeId", script.draft.startNodeId, "导入草稿的起始节点。"],
    ["publishedStartNodeId", script.published.startNodeId, "只读对照，不参与导入。"],
    ["isPublished", script.isPublished ? "true" : "false", "只读对照，不参与导入。"],
    ["publishedAt", script.publishedAt || "", "只读对照，不参与导入。"],
    ["exportedAt", exportedAt.toISOString(), "只读对照，不参与导入。"]
  ];
  for (const [field, value, note] of rows) {
    sheet.addRow({ field: INFO_LABELS[field], value, note });
  }
}

function addNodeSheet(workbook, sheetName, nodes, { locked = false } = {}) {
  const sheet = workbook.addWorksheet(sheetName);
  configureColumns(sheet, NODE_COLUMNS);
  for (const [index, node] of nodes.entries()) {
    const row = { order: index + 1 };
    for (const key of NODE_KEYS) {
      if (key === "order") continue;
      row[key] = scalarCellValue(node[key]);
    }
    sheet.addRow(row);
  }
  addReadOnlyNote(sheet, locked);
}

function addOptionSheet(workbook, sheetName, nodes, { locked = false } = {}) {
  const sheet = workbook.addWorksheet(sheetName);
  configureColumns(sheet, OPTION_COLUMNS);
  for (const node of nodes) {
    for (const [optionIndex, option] of (node.options ?? []).entries()) {
      sheet.addRow({
        nodeId: node.id,
        optionIndex: optionIndex + 1,
        label: option.label ?? "",
        nextNodeId: option.nextNodeId ?? "",
        revealDelaySeconds: scalarCellValue(option.revealDelaySeconds),
        transitionDelaySeconds: scalarCellValue(option.transitionDelaySeconds)
      });
    }
  }
  addReadOnlyNote(sheet, locked);
}

function addBoardSheet(workbook, sheetName, draft, { locked = false } = {}) {
  const sheet = workbook.addWorksheet(sheetName);
  configureColumns(sheet, BOARD_COLUMNS);
  addBoardRow(sheet, "script", "", draft.initialBoard);
  for (const node of draft.nodes) {
    if (node.boardSetup) addBoardRow(sheet, "node", node.id, node.boardSetup);
  }
  addReadOnlyNote(sheet, locked);
}

function addBoardRow(sheet, scope, nodeId, board) {
  const normalized = normalizeBoard(board);
  sheet.addRow({
    scope,
    nodeId,
    mode: normalized?.mode ?? "",
    stonesJson: normalized ? JSON.stringify(normalized.stones ?? []) : "",
    lastMovePointId: normalized?.lastMovePointId ?? ""
  });
}

function addRawJsonSheet(workbook, script) {
  const sheet = workbook.addWorksheet(SHEETS.rawJson);
  sheet.columns = [
    { header: "名称", key: "name", width: 20 },
    { header: "JSON", key: "json", width: 120 },
    { header: "说明", key: "note", width: 44 }
  ];
  styleHeader(sheet);
  sheet.addRow({ name: "draft", json: JSON.stringify(script.draft, null, 2), note: "只读存档，不参与导入。" });
  sheet.addRow({ name: "published", json: JSON.stringify(script.published, null, 2), note: "只读存档，不参与导入。" });
  sheet.getColumn("json").alignment = { wrapText: true, vertical: "top" };
}

function configureColumns(sheet, columns) {
  sheet.columns = columns.map(([key, header]) => ({
    header,
    key,
    width: widthForKey(key)
  }));
  styleHeader(sheet);
}

function styleHeader(sheet) {
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.alignment = { vertical: "middle" };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF1FF" } };
    cell.border = { bottom: { style: "thin", color: { argb: "FFB8C7E6" } } };
  });
}

function addReadOnlyNote(sheet, locked) {
  if (!locked) return;
  sheet.getCell("A1").note = "发布版工作表只用于存档对照，不参与导入。";
}

function readInfoSheet(workbook, errors) {
  const sheet = requireSheet(workbook, SHEETS.info, errors);
  const info = {};
  if (!sheet) return info;
  const header = rowValues(sheet.getRow(1));
  if (header[0] !== "字段" || header[1] !== "值") {
    errors.push(importError(SHEETS.info, 1, "字段/值", "脚本信息表头必须包含“字段”和“值”。"));
    return info;
  }
  const labelToKey = new Map(Object.entries(INFO_LABELS).map(([key, label]) => [label, key]));
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = rowValues(row);
    const key = labelToKey.get(stringValue(values[0]));
    if (!key) return;
    info[key] = stringValue(values[1]);
  });
  return info;
}

function validateWorkbookIdentity(info, current, errors) {
  const required = ["formatVersion", "key", "title", "triggerType", "triggerParamsJson", "draftStartNodeId"];
  for (const key of required) {
    if (!info[key]) errors.push(importError(SHEETS.info, "", INFO_LABELS[key], "缺少必要脚本信息。"));
  }
  if (info.formatVersion && info.formatVersion !== STORY_SCRIPT_WORKBOOK_VERSION) {
    errors.push(importError(SHEETS.info, "", INFO_LABELS.formatVersion, `格式版本不兼容：${info.formatVersion}`));
  }
  if (info.key && info.key !== current.key) {
    errors.push(importError(SHEETS.info, "", INFO_LABELS.key, "Excel 脚本标识和当前脚本不一致。"));
  }
  if (info.triggerType && info.triggerType !== current.triggerType) {
    errors.push(importError(SHEETS.info, "", INFO_LABELS.triggerType, "Excel 触发类型和当前脚本不一致。"));
  }
  if (info.triggerParamsJson) {
    const parsed = parseJsonCell(info.triggerParamsJson, SHEETS.info, "", INFO_LABELS.triggerParamsJson, errors, {});
    if (stableStringify(parsed) !== stableStringify(current.triggerParams)) {
      errors.push(importError(SHEETS.info, "", INFO_LABELS.triggerParamsJson, "Excel 触发参数和当前脚本不一致。"));
    }
  }
}

function readDraftFromWorkbook(workbook, info, errors) {
  const nodes = readNodeSheet(workbook, SHEETS.draftNodes, errors);
  const optionsByNodeId = readOptionSheet(workbook, SHEETS.draftOptions, errors);
  const boards = readBoardSheet(workbook, SHEETS.draftBoards, errors);
  const nodeIds = new Set(nodes.map((node) => node.id).filter(Boolean));
  for (const nodeId of optionsByNodeId.keys()) {
    if (!nodeIds.has(nodeId)) errors.push(importError(SHEETS.draftOptions, "", "所属节点ID", `选项所属节点不存在：${nodeId || "空"}`));
  }
  for (const node of nodes) {
    node.options = optionsByNodeId.get(node.id) ?? [];
    if (boards.nodeBoards.has(node.id)) node.boardSetup = boards.nodeBoards.get(node.id);
  }
  return {
    startNodeId: info.draftStartNodeId ?? "",
    initialBoard: boards.initialBoard,
    nodes
  };
}

function readNodeSheet(workbook, sheetName, errors) {
  const sheet = requireSheet(workbook, sheetName, errors);
  if (!sheet) return [];
  const headerMap = readHeaderMap(sheet, NODE_COLUMNS, errors, { optionalHeaders: OPTIONAL_NODE_HEADERS });
  const nodes = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || rowIsEmpty(row)) return;
    const node = {};
    for (const key of NODE_KEYS) {
      if (key === "order") continue;
      node[key] = valueFromRow(row, headerMap, NODE_COLUMNS, key);
    }
    node.type = node.type || TUTORIAL_NODE_TYPES.story;
    node.manualContinueEnabled = parseBooleanCell(node.manualContinueEnabled);
    node.autoContinueEnabled = parseBooleanCell(node.autoContinueEnabled, true);
    node.targetHighlightEnabled = parseBooleanCell(node.targetHighlightEnabled, true);
    node.applyWrongMove = parseBooleanCell(node.applyWrongMove);
    node.boardSetupLoadingEnabled = parseBooleanCell(node.boardSetupLoadingEnabled, true);
    node.boardSetup = null;
    node.options = [];
    node.__rowNumber = rowNumber;
    nodes.push(node);
  });
  return nodes.sort((a, b) => orderValue(a, sheet, headerMap) - orderValue(b, sheet, headerMap))
    .map(({ __rowNumber, ...node }) => ({ ...node, __rowNumber }));
}

function readOptionSheet(workbook, sheetName, errors) {
  const sheet = requireSheet(workbook, sheetName, errors);
  const byNodeId = new Map();
  if (!sheet) return byNodeId;
  const headerMap = readHeaderMap(sheet, OPTION_COLUMNS, errors);
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || rowIsEmpty(row)) return;
    const nodeId = valueFromRow(row, headerMap, OPTION_COLUMNS, "nodeId");
    const option = {
      label: valueFromRow(row, headerMap, OPTION_COLUMNS, "label"),
      nextNodeId: valueFromRow(row, headerMap, OPTION_COLUMNS, "nextNodeId"),
      revealDelaySeconds: valueFromRow(row, headerMap, OPTION_COLUMNS, "revealDelaySeconds"),
      transitionDelaySeconds: valueFromRow(row, headerMap, OPTION_COLUMNS, "transitionDelaySeconds"),
      __rowNumber: rowNumber,
      __order: Number(valueFromRow(row, headerMap, OPTION_COLUMNS, "optionIndex")) || rowNumber
    };
    if (!byNodeId.has(nodeId)) byNodeId.set(nodeId, []);
    byNodeId.get(nodeId).push(option);
  });
  for (const [nodeId, options] of byNodeId.entries()) {
    byNodeId.set(nodeId, options.sort((a, b) => a.__order - b.__order).map(({ __order, ...option }) => option));
  }
  return byNodeId;
}

function readBoardSheet(workbook, sheetName, errors) {
  const sheet = requireSheet(workbook, sheetName, errors);
  const result = { initialBoard: null, nodeBoards: new Map() };
  if (!sheet) return result;
  const headerMap = readHeaderMap(sheet, BOARD_COLUMNS, errors, { optionalHeaders: OPTIONAL_BOARD_HEADERS });
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || rowIsEmpty(row)) return;
    const scope = valueFromRow(row, headerMap, BOARD_COLUMNS, "scope");
    const nodeId = valueFromRow(row, headerMap, BOARD_COLUMNS, "nodeId");
    const mode = valueFromRow(row, headerMap, BOARD_COLUMNS, "mode");
    const stonesJson = valueFromRow(row, headerMap, BOARD_COLUMNS, "stonesJson");
    const lastMovePointId = valueFromRow(row, headerMap, BOARD_COLUMNS, "lastMovePointId");
    const stones = stonesJson
      ? parseJsonCell(stonesJson, sheetName, rowNumber, "棋子JSON", errors, [])
      : [];
    if (stonesJson && !Array.isArray(stones)) errors.push(importError(sheetName, rowNumber, "棋子JSON", "棋子JSON必须是数组。"));
    const board = mode ? { mode, stones: Array.isArray(stones) ? stones : [], lastMovePointId } : null;
    if (scope === "script") result.initialBoard = board;
    if (scope === "node") {
      if (!nodeId) errors.push(importError(sheetName, rowNumber, "节点ID", "节点棋盘快照必须填写节点ID。"));
      if (board) result.nodeBoards.set(nodeId, board);
    }
    if (scope && !["script", "node"].includes(scope)) {
      errors.push(importError(sheetName, rowNumber, "范围", "范围必须是 script 或 node。"));
    }
  });
  return result;
}

function validateImportedScript({ title, draft, current, itemOptions, skillCharacters }, errors) {
  if (!String(title ?? "").trim()) errors.push(importError(SHEETS.info, "", INFO_LABELS.title, "脚本标题不能为空。"));
  if (current.triggerType === "item-character-use") {
    const itemId = current.triggerParams?.itemId;
    if (itemOptions.length && !itemOptions.some((item) => item.id === itemId)) {
      errors.push(importError(SHEETS.info, "", INFO_LABELS.triggerParamsJson, "当前脚本道具触发参数不是有效道具。"));
    }
    if (!current.triggerParams?.characterId) {
      errors.push(importError(SHEETS.info, "", INFO_LABELS.triggerParamsJson, "当前脚本道具互动缺少目标角色。"));
    }
  }
  if (!draft.nodes.length) errors.push(importError(SHEETS.draftNodes, "", "节点", "至少需要一个节点。"));
  const nodeRows = new Map(draft.nodes.map((node) => [node.id, node.__rowNumber]));
  const nodeIds = new Set();
  for (const node of draft.nodes) {
    const row = node.__rowNumber;
    if (!node.id) errors.push(importError(SHEETS.draftNodes, row, "节点ID", "节点ID不能为空。"));
    if (node.id && nodeIds.has(node.id)) errors.push(importError(SHEETS.draftNodes, row, "节点ID", `节点ID重复：${node.id}`));
    nodeIds.add(node.id);
    if (!NODE_TYPE_VALUES.has(node.type)) errors.push(importError(SHEETS.draftNodes, row, "节点类型", `未知节点类型：${node.type}`));
  }
  if (!draft.startNodeId || !nodeIds.has(draft.startNodeId)) {
    errors.push(importError(SHEETS.info, "", INFO_LABELS.draftStartNodeId, "草稿起始节点不存在。"));
  }
  let hasEnding = false;
  for (const node of draft.nodes) {
    const row = node.__rowNumber;
    if (isStoryNodeType(node.type) && !String(node.text ?? "").trim()) {
      errors.push(importError(SHEETS.draftNodes, row, "对白/NPC文本", "剧情对白节点缺少正文。"));
    }
    if (node.type === TUTORIAL_NODE_TYPES.npcDialogue && !String(node.text ?? "").trim() && !(node.options ?? []).length) {
      errors.push(importError(SHEETS.draftNodes, row, "对白/NPC文本", "NPC 对话节点需要文本或回复选项。"));
    }
    if (node.type === TUTORIAL_NODE_TYPES.playerChoice && !(node.options ?? []).length) {
      errors.push(importError(SHEETS.draftOptions, "", "选项", `玩家选项节点 ${node.id} 至少需要一个回复选项。`));
    }
    if (nodeTypeRequiresPoint(node.type) && !node.pointId) {
      errors.push(importError(SHEETS.draftNodes, row, "棋盘坐标/技能目标", "该节点类型必须填写棋盘坐标或技能目标。"));
    }
    if (node.type === TUTORIAL_NODE_TYPES.boardSetup && !node.boardSetup) {
      errors.push(importError(SHEETS.draftBoards, "", "棋盘快照", `设置局面节点 ${node.id} 必须在草稿-棋盘动作中配置快照。`));
    }
    if ((node.type === TUTORIAL_NODE_TYPES.playerSkill || node.type === TUTORIAL_NODE_TYPES.npcSkill) && !validSkill(node, skillCharacters)) {
      errors.push(importError(SHEETS.draftNodes, row, "技能ID", "技能节点需要有效角色技能。"));
    }
    if (SETTLEMENT_NODE_TYPES.has(node.type) && !["player", "npc", "system"].includes(node.actor ?? "")) {
      errors.push(importError(SHEETS.draftNodes, row, "执行者", "结算节点执行者必须是 player、npc 或 system。"));
    }
    for (const field of ["actionStartDelaySeconds", "replyDelaySeconds", "autoContinueDelaySeconds"]) {
      if (!validOptionalDelay(node[field])) errors.push(importError(SHEETS.draftNodes, row, fieldHeader(NODE_COLUMNS, field), "延迟字段必须是非负数字。"));
    }
    if (node.nextNodeId) {
      if (!nodeIds.has(node.nextNodeId)) errors.push(importError(SHEETS.draftNodes, row, "下一主线节点ID（空=结束）", `下一节点不存在：${node.nextNodeId}`));
    } else if (!(node.options ?? []).length) {
      hasEnding = true;
    }
    if (node.wrongMoveNextNodeId && !nodeIds.has(node.wrongMoveNextNodeId)) {
      errors.push(importError(SHEETS.draftNodes, row, fieldHeader(NODE_COLUMNS, "wrongMoveNextNodeId"), `错误落子目标不存在：${node.wrongMoveNextNodeId}`));
    }
    for (const [optionIndex, option] of (node.options ?? []).entries()) {
      const optionRow = option.__rowNumber;
      if (!String(option.label ?? "").trim()) errors.push(importError(SHEETS.draftOptions, optionRow, "选项文案", "选项文案不能为空。"));
      if (option.nextNodeId) {
        if (!nodeIds.has(option.nextNodeId)) errors.push(importError(SHEETS.draftOptions, optionRow, "目标节点ID（空=结束）", `选项目标不存在：${option.nextNodeId}`));
      } else {
        hasEnding = true;
      }
      if (!validOptionalDelay(option.revealDelaySeconds)) errors.push(importError(SHEETS.draftOptions, optionRow, "出现时间秒", "出现时间必须是非负数字。"));
      if (!validOptionalDelay(option.transitionDelaySeconds)) errors.push(importError(SHEETS.draftOptions, optionRow, "选择后等待秒", "选择后等待必须是非负数字。"));
    }
  }
  if (!hasEnding && draft.nodes.length) errors.push(importError(SHEETS.draftNodes, "", "结束路径", "脚本至少需要一个结束节点或结束选项。"));
  for (const [nodeId, rowNumber] of nodeRows.entries()) {
    if (!nodeId) errors.push(importError(SHEETS.draftNodes, rowNumber, "节点ID", "节点ID不能为空。"));
  }
}

function validSkill(node, skillCharacters) {
  if (!skillCharacters.length) return Boolean(node.skillId || node.skillCharacterId || node.characterId);
  const id = node.skillId || node.skillCharacterId || node.characterId;
  return skillCharacters.some((character) => character.id === id);
}

function requireSheet(workbook, name, errors) {
  const sheet = workbook.getWorksheet(name);
  if (!sheet) errors.push(importError(name, "", "工作表", `缺少工作表：${name}`));
  return sheet;
}

function readHeaderMap(sheet, columns, errors, { optionalHeaders = new Set() } = {}) {
  const expected = columns.map(([, header]) => header);
  const actual = rowValues(sheet.getRow(1));
  const headerMap = new Map();
  for (const [index, header] of actual.entries()) {
    if (header) headerMap.set(header, index + 1);
  }
  for (const header of expected) {
    if (!headerMap.has(header) && !optionalHeaders.has(header)) errors.push(importError(sheet.name, 1, header, `缺少必要列：${header}`));
  }
  return headerMap;
}

function valueFromRow(row, headerMap, columns, key) {
  const header = fieldHeader(columns, key);
  const index = headerMap.get(header);
  return index ? stringValue(row.getCell(index).value) : "";
}

function orderValue(node, sheet, headerMap) {
  const row = sheet.getRow(node.__rowNumber);
  return Number(valueFromRow(row, headerMap, NODE_COLUMNS, "order")) || node.__rowNumber;
}

function rowValues(row) {
  return row.values.slice(1).map(stringValue);
}

function rowIsEmpty(row) {
  return row.values.slice(1).every((value) => !stringValue(value));
}

function fieldHeader(columns, key) {
  return columns.find(([entryKey]) => entryKey === key)?.[1] ?? key;
}

function importError(sheet, row, field, message) {
  return { sheet, row, field, message };
}

function scalarCellValue(value) {
  if (value == null) return "";
  if (typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function stringValue(value) {
  if (value == null) return "";
  if (typeof value === "object" && "text" in value) return String(value.text ?? "");
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

function parseBooleanCell(value, fallback = false) {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return fallback;
  return ["true", "1", "yes", "y", "是"].includes(normalized);
}

function parseJsonCell(value, sheet, row, field, errors, fallback) {
  if (!String(value ?? "").trim()) return fallback;
  try {
    return JSON.parse(String(value));
  } catch {
    errors.push(importError(sheet, row, field, "JSON 格式无效。"));
    return fallback;
  }
}

function validOptionalDelay(value) {
  if (value == null || value === "") return true;
  const delay = Number(value);
  return Number.isFinite(delay) && delay >= 0;
}

function normalizeScript(script = {}) {
  return {
    key: script.key ?? "",
    title: script.title ?? "",
    triggerType: script.triggerType ?? "onboarding",
    triggerParams: script.triggerParams ?? {},
    isPublished: Boolean(script.isPublished),
    publishedAt: script.publishedAt ?? script.firstPublishedAt ?? "",
    draft: normalizeDraft(script.draft),
    published: normalizeDraft(script.published)
  };
}

function normalizeDraft(draft = {}) {
  return {
    startNodeId: draft?.startNodeId ?? "",
    initialBoard: normalizeBoard(draft?.initialBoard),
    nodes: (draft?.nodes ?? []).map((node) => ({
      ...node,
      type: node.type || TUTORIAL_NODE_TYPES.story,
      boardSetup: normalizeBoard(node.boardSetup),
      options: (node.options ?? []).map((option) => ({ ...option }))
    }))
  };
}

function normalizeBoard(board) {
  if (!board || typeof board !== "object") return null;
  return {
    mode: board.mode ?? "spark",
    stones: Array.isArray(board.stones) ? board.stones : [],
    lastMovePointId: board.lastMovePointId ?? ""
  };
}

function countOptions(nodes = []) {
  return nodes.reduce((total, node) => total + (node.options?.length ?? 0), 0);
}

function stripImportMetadata(draft) {
  return {
    ...draft,
    nodes: draft.nodes.map(({ __rowNumber, ...node }) => ({
      ...node,
      options: (node.options ?? []).map(({ __rowNumber: _rowNumber, ...option }) => option)
    }))
  };
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

function sanitizeFileName(value) {
  return String(value)
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "story-script";
}

function formatDateStamp(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("") + "-" + [pad(date.getHours()), pad(date.getMinutes())].join("");
}

function widthForKey(key) {
  if (["text", "prompt", "wrongClickMessage", "stonesJson"].includes(key)) return 46;
  if (["id", "nodeId", "nextNodeId", "characterId", "skillId", "skillCharacterId"].includes(key)) return 24;
  return 18;
}

async function loadExcelJS() {
  const module = await import("exceljs");
  return module.default ?? module;
}
