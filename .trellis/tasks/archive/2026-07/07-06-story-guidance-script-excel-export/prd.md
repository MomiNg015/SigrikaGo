# brainstorm: 剧情引导脚本 Excel 导出

## Goal

为后台「剧情教学」里的每个脚本提供导出成 Excel 友好文件的入口，方便管理员对单个脚本进行离线存档、人工审阅或后续修改内容。需求阶段先明确导出粒度、表格结构和是否预留导入回写，再进入实现。

## What I already know

* 用户明确要求：关于剧情引导里的脚本，给每个脚本做导出成 Excel 的选项，方便管理员导出后存档或修改内容。
* 用户要求使用 `grill-me` 完善需求，因此本任务按一问一答收敛，并把结论持续写回 PRD。
* 后台剧情教学编辑器入口是 `src/admin/AdminOnboardingStory.jsx`，脚本卡片库由 `ScriptLibrary` 渲染，当前每张脚本卡已有选择、复制和删除入口。
* 当前工作台顶部工具栏已有预览、复制、删除、停用、保存草稿、发布等动作，适合承载当前脚本级操作。
* 后台 API 已支持 `/api/admin/story-scripts` 列表、`/api/admin/story-scripts/:key` 获取单个脚本、PATCH 保存/发布/停用、DELETE 删除。
* `StoryScript` 模型同时保存 draft 与 published 两套内容：`draftStartNodeId` / `draftInitialBoardJson` / `draftNodesJson` 与 `publishedStartNodeId` / `publishedInitialBoardJson` / `publishedNodesJson`。
* 当前仓库未发现现成 `xlsx` / Excel 导出依赖，也未发现通用下载导出工具；若要真正 `.xlsx`，需要新增依赖或实现轻量生成器。
* 既有剧情教学 PRD 约束：不随意改变底层 `StoryScript` 数据结构或新增 DSL；后台编辑体验围绕现有脚本卡片库、流程图、当前步骤表单、问题面板和预览。
* 项目指令要求：若本需求影响运行行为、接口、数据模型、资源体系、主题样式、部署方式或技术债，需要更新系统设计文档并运行 `npm run docs:system-design`。
* 前端变更默认要同时考虑桌面端和移动端，除非用户明确限定单端。

## Assumptions

* 导出入口只给管理员使用，不开放玩家侧。
* 导出文件应尽量使用中文列名，面向管理员人工阅读和修改。
* 本轮已经确认要做导出 + 导入闭环，因此导出内容需要包含稳定 ID、节点类型、跳转目标、选项、棋盘/技能等机器字段，不能只导出对白文本。

## Open Questions

* 最终需求确认：等待用户确认后进入实现。

## Requirements (evolving)

* 每个剧情教学脚本都需要有单脚本导出入口。
* MVP 纳入导出 + 导入闭环：导出的 Excel 不只是存档审阅，还必须能作为导入源回写剧情教学脚本。
* 文件格式采用真正 `.xlsx` 单文件，不使用 CSV 多文件包或 Excel 兼容 HTML 表格。
* 新增 Excel 读写依赖采用 `exceljs`。
* `.xlsx` 工作簿采用规范化多表结构，至少包含 `脚本信息`、`节点`、`选项`、`棋盘/动作`、`原始JSON` 等工作表。
* 导出表格需要兼顾管理员可读性和机器可回写性，保留稳定节点 ID、节点类型、跳转目标、选项目标、棋盘/技能/教学动作等关键字段。
* 导入流程必须校验表格结构、节点引用、必填字段和脚本发布条件，并给出可定位的错误反馈。
* 导入 Excel 后只覆盖当前编辑器中的草稿内容，不自动保存草稿、不自动发布；管理员需要继续预览、保存草稿或发布。
* 导入时允许 Excel 更新当前脚本标题和草稿内容。
* 导入时不允许 Excel 修改当前脚本 key、触发类型或触发参数；这些字段必须和当前脚本匹配，不匹配则阻止导入并提示。
* 导出时同时包含当前草稿和已发布版本：草稿工作表用于修改和导入，发布版工作表用于存档对照。
* 导入只读取草稿相关工作表和脚本信息校验字段，忽略发布版工作表，避免把线上版本误导入为草稿。
* 导出入口放在每个脚本卡片上，满足每个脚本可单独导出的需求。
* 导入入口放在当前选中脚本的工具栏上；管理员必须先选中目标脚本，再导入 Excel，降低误导入风险。
* 如果当前脚本已有未保存改动，导入前弹出确认；管理员确认后，Excel 内容覆盖当前编辑器中的未保存草稿。
* Excel 导入代表完整草稿，允许新增、删除、重排节点和选项；导入成功后按工作簿重建当前脚本草稿。
* 导入校验采用整份拒绝策略：任何工作表、列、节点、选项或引用错误都会阻止导入，当前编辑器状态保持不变。
* 导入只接受本系统导出的同版本工作簿；导出的 Excel 同时也是管理员修改脚本的模板。
* 导入必须校验格式版本、必要工作表、列头、脚本 key、触发类型和触发参数；不支持从空白 Excel 手工搭表后导入。
* Excel 解析和完整校验通过后，先显示变更摘要；管理员确认后才把内容应用到当前草稿。
* 变更摘要至少展示标题变化、节点数量变化、选项数量变化、新增/删除节点数量，以及导入后起始节点。
* 草稿和发布版使用分开的工作表组织，例如 `草稿-节点`、`草稿-选项`、`草稿-棋盘动作`、`发布版-节点`、`发布版-选项`。
* 导入只读取 `草稿-*` 工作表和脚本信息校验字段，不读取 `发布版-*` 工作表。
* `原始JSON` 工作表只用于完整存档和技术排查，不参与导入，也不作为规范化草稿表损坏时的兜底来源。
* 导入失败时在页面内显示错误摘要和明细列表，明细至少包含工作表、行号、字段和原因。
* Excel 导入/导出在浏览器本地执行，不上传 Excel 文件到后端解析。
* 保存草稿或发布时仍走现有后端接口和后端 `StoryScript` 校验。
* 导出内容至少要覆盖脚本标题、key、触发器、草稿/发布状态、节点列表和节点间跳转关系。
* 导出操作应提供清晰反馈：导出成功、当前无内容或导出失败。
* 导出入口不能破坏现有脚本选择、复制、删除、保存、发布工作流。

## Acceptance Criteria (evolving)

* [ ] 管理员能从每个脚本对应位置导出该脚本。
* [ ] 管理员能选择 Excel 文件导入回当前脚本，导入成功后只更新当前编辑器草稿并标记未保存。
* [ ] 脚本卡片上存在单脚本导出入口；当前脚本工具栏上存在导入入口。
* [ ] 当前存在未保存改动时，导入前必须确认；确认后覆盖当前未保存草稿，取消则不改变编辑器状态。
* [ ] 导入允许新增、删除、重排节点和选项；导入成功后当前草稿与 Excel 草稿工作表一致。
* [ ] 导入校验失败时整份拒绝，不改变当前编辑器状态，并展示可定位到工作表/行/字段的错误信息。
* [ ] 导入只接受本系统导出的同版本工作簿；格式版本、工作表、列头或脚本匹配信息不符合时必须拒绝。
* [ ] 导入校验通过后显示变更摘要，管理员确认后才应用到当前草稿；取消则不改变编辑器状态。
* [ ] 草稿与发布版内容在 Excel 中分表展示；导入只读取草稿相关工作表。
* [ ] `原始JSON` 工作表存在于导出文件中用于存档/排查，但导入逻辑不读取它作为回写来源。
* [ ] 导入失败时页面内展示错误摘要和可定位明细，至少包含工作表、行号、字段和原因。
* [ ] Excel 文件在浏览器本地生成和解析，不新增后端上传解析接口。
* [ ] 导入成功后不会自动调用保存草稿或发布接口；刷新前仍受现有未保存改动保护。
* [ ] 导入可更新当前脚本标题，但不能更改 key、触发类型或触发参数；不匹配的 Excel 必须被拒绝。
* [ ] 导出文件同时包含草稿与发布版内容；发布版内容在导入时不参与回写。
* [ ] 导入不会绕过现有 `StoryScript` 校验；非法节点、重复节点 ID、缺失跳转目标、无结束路径等问题必须阻止落库并提示。
* [ ] 导出文件名能识别脚本标题或 key，并包含导出时间或版本状态。
* [ ] 导出表格能看懂脚本主信息、节点内容、选项/分支和关键教学动作字段。
* [ ] 空脚本或无节点脚本有明确反馈，不产生误导性空文件。
* [ ] 桌面端和移动端后台入口都能访问或有明确一致的替代入口。

## Definition of Done

* Tests added/updated for export data shaping and UI action availability where appropriate.
* Lint / build / relevant tests pass.
* If behavior or system facts change, update `docs/system-design.md` or `docs/system-design/` and run `npm run docs:system-design`.
* Existing unrelated WIP on the current branch remains untouched.

## Out of Scope (explicit)

* 暂不做批量脚本导入、跨脚本批量覆盖或完整脚本版本管理，除非后续需求确认纳入。
* 暂不支持从空白 Excel 手工搭表导入；导入文件必须来自本系统导出的同版本工作簿。
* 暂不新增后端 Excel 上传解析接口。
* 暂不重做剧情教学编辑器整体布局或脚本数据模型。
* 暂不修改玩家侧剧情播放器。

## Decision Log

### 2026-07-06: 导出定位

**Context**: 用户希望管理员导出脚本后能存档或修改内容。
**Decision**: 选择「导出 + 导入闭环」，本轮不仅提供 Excel 导出，还要支持从导出的表格导入并回写脚本。
**Consequences**: 表格结构需要保持机器可解析，导入必须走现有脚本校验和清晰错误反馈；实现范围扩大到文件解析、UI 导入入口、数据映射、保存策略和测试。

### 2026-07-06: 导入落库策略

**Context**: Excel 导入可能误改大量剧情节点，直接保存或发布会扩大风险。
**Decision**: 导入后只覆盖当前编辑器中的草稿内容，并进入未保存状态；管理员继续使用现有预览、保存草稿、发布流程。
**Consequences**: 导入实现应复用现有 dirty / beforeunload 保护，不直接调用 PATCH 接口；验收需要确认导入后刷新仍会触发现有未保存确认。

### 2026-07-06: 文件格式

**Context**: 用户已确认本轮要做导出 + 导入闭环，表格格式需要既符合管理员预期又稳定可解析。
**Decision**: 使用真正 `.xlsx` 单文件，内部用多个工作表表达脚本元信息、节点、选项/分支、棋盘/动作和必要的机器字段。
**Consequences**: 实现大概率需要新增 Excel 读写依赖；导入解析应校验工作表和列头版本，避免把兼容表格或手写错误文件误当作合法脚本。

### 2026-07-06: Excel 依赖

**Context**: 真正 `.xlsx` 导出 + 导入闭环需要可靠的工作簿读写库；调研比较了 `xlsx` 与 `exceljs`。
**Decision**: 使用 `exceljs`。
**Consequences**: 依赖体积比 `xlsx` 更重，但可以获得更完整的 workbook 管理能力，后续可做冻结表头、列宽、样式和更清晰的可编辑表格体验；实现应把 Excel 读写隔离在工具模块中，避免组件直接绑定库 API。

### 2026-07-06: 工作簿结构

**Context**: 剧情脚本由脚本元信息、节点、选项/分支、棋盘和教学动作共同组成，单表会让分支和动作字段拥挤且难以导入校验。
**Decision**: 采用规范化多表工作簿结构，拆分 `脚本信息`、`节点`、`选项`、`棋盘/动作`、`原始JSON` 等工作表。
**Consequences**: 管理员需要理解多个工作表，但导入映射更稳定；每张表都应有清楚列名、冻结表头和必要说明。

### 2026-07-06: 脚本级字段导入权限

**Context**: Excel 导入回当前脚本时，需要防止把其他脚本或其他触发点的文件误导入当前编辑器。
**Decision**: Excel 可更新当前脚本标题和草稿内容；key、触发类型、触发参数只能用于匹配校验，不能通过导入修改。
**Consequences**: 导入解析必须比较 Excel 中的 key / triggerType / triggerParams 与当前脚本，发现不一致时拒绝导入；标题更新仍进入未保存状态，由管理员后续保存草稿或发布。

### 2026-07-06: 导出版本范围

**Context**: 用户希望导出后既能存档又能修改内容，系统本身同时保存草稿和已发布版。
**Decision**: 导出文件同时包含草稿和已发布版；导入只读取草稿相关工作表，发布版仅用于存档和对照。
**Consequences**: 工作簿需要清晰区分草稿表与发布版表，发布版表应在命名和说明中标记为只读对照；导入解析必须忽略发布版表，防止误回写线上版本。

### 2026-07-06: 导入导出入口

**Context**: 用户要求每个脚本都有导出选项，而导入是高风险覆盖操作。
**Decision**: 每个脚本卡片提供导出入口；导入入口放在当前选中脚本的工具栏上。
**Consequences**: 卡片区满足单脚本导出的快速操作，导入则绑定当前选中脚本并复用 key / trigger 校验，减少把 Excel 导入错误脚本的风险；移动端需要保证卡片导出和工具栏导入都可触达。

### 2026-07-06: 未保存改动与导入覆盖

**Context**: 导入会替换当前编辑器草稿；如果编辑器里已有未保存改动，直接导入会造成数据丢失。
**Decision**: 当前存在未保存改动时，导入前弹确认；确认后覆盖当前编辑器草稿，取消则不改变状态。
**Consequences**: 导入流程应复用现有确认风格；导入成功后仍标记为未保存，不自动保存或发布。

### 2026-07-06: 导入变更范围

**Context**: 用户选择了导出 + 导入闭环和规范化多表，Excel 文件应能作为完整草稿编辑载体。
**Decision**: 导入允许新增、删除、重排节点和选项；导入成功后按 Excel 草稿工作表重建当前脚本草稿。
**Consequences**: 导入校验必须覆盖完整脚本结构，包括重复 ID、缺失 startNodeId、跳转目标、选项目标、结束路径、节点类型字段和教学动作字段，避免半结构化表格破坏编辑器。

### 2026-07-06: 导入失败策略

**Context**: 剧情脚本是带跳转关系的图结构，部分导入会产生断裂分支或隐藏错误。
**Decision**: 导入校验失败时整份拒绝，不改变当前编辑器状态。
**Consequences**: 导入器应先完整解析和校验 workbook，再一次性替换草稿；错误反馈需要包含工作表、行号和字段，便于管理员回到 Excel 修复。

### 2026-07-06: 导入来源边界

**Context**: 本轮目标是可靠的导出 + 导入闭环，而不是支持任意 Excel 模板设计器。
**Decision**: 只接受本系统导出的同版本工作簿；导出文件本身作为管理员离线修改模板。
**Consequences**: 工作簿需要包含格式版本和脚本匹配元信息；导入器可严格校验工作表和列头，不支持从空白 Excel 手工创建结构后导入。

### 2026-07-06: 导入应用确认

**Context**: 导入会完整替换当前编辑器草稿，即使校验通过，也可能覆盖大量节点和选项。
**Decision**: 校验通过后显示变更摘要，管理员二次确认后才应用到当前草稿。
**Consequences**: 导入流程需要解析/校验阶段和应用阶段分离；摘要需要覆盖标题、节点数、选项数、新增/删除节点数和起始节点，取消确认时不得改变当前编辑器状态。

### 2026-07-06: 草稿与发布版工作表组织

**Context**: 导出文件需要同时服务草稿修改和发布版存档，但导入不能误读发布版内容。
**Decision**: 草稿和发布版使用分开的工作表，导入只读取 `草稿-*` 工作表。
**Consequences**: 工作表命名要明确表达草稿/发布版边界；发布版表作为只读对照展示，导入解析不应依赖或回写发布版表。

### 2026-07-06: 原始 JSON 工作表

**Context**: 原始 JSON 有助于完整存档和技术排查，但如果参与导入，会产生规范化表与 JSON 冲突时听谁的问题。
**Decision**: `原始JSON` 工作表只用于存档和排查，不参与导入。
**Consequences**: 导入规则保持单一来源：只读取规范化草稿工作表；JSON 表可以包含草稿和发布版原始结构，但应标注为只读参考。

### 2026-07-06: 导入失败反馈

**Context**: Excel 导入失败后，管理员需要快速回到具体工作表和行修复错误。
**Decision**: 页面内展示错误摘要和明细列表，明细包含工作表、行号、字段和原因。
**Consequences**: 不能只用 toast 承载错误；导入 UI 需要一个可阅读的错误区域或弹层，错误列表可限制首屏数量但应保留足够定位信息。

### 2026-07-06: Excel 执行位置

**Context**: 导入成功后只更新当前编辑器草稿，不自动保存或发布；后端已经在保存/发布路径做最终校验。
**Decision**: Excel 导入/导出在浏览器本地执行，不上传 Excel 文件给后端解析。
**Consequences**: 不新增文件上传接口；前端导入器需要自行做完整结构校验和错误反馈，保存/发布时继续走现有后端接口作为最终校验。

## Technical Notes

* Relevant files inspected: `src/admin/AdminOnboardingStory.jsx`, `server/storyScripts.js`, `server/adminRoutes.js`, `src/api/client.js`, `prisma/schema.prisma`, `src/admin/AdminOnboardingStory.test.jsx`。
* Existing admin route payload already exposes draft and published content, so client-side export is feasible without adding a new backend endpoint if no server-side audit/download stream is required.
* If choosing true `.xlsx`, evaluate whether adding a dependency is acceptable; if avoiding dependencies, a CSV/HTML-table-with-Excel-extension path may be simpler but less semantically precise.
* UI guidance applied: admin tool surfaces should be dense, predictable, accessible, and use icon+text or icon buttons with labels/tooltips; async export needs disabled/loading/success/error states.
* Research artifact: `research/excel-library-choice.md`.

## Technical Approach

* Add `exceljs` as the `.xlsx` workbook dependency.
* Create a focused workbook utility module for converting `StoryScript` admin payloads to/from the versioned workbook schema.
* Keep `AdminOnboardingStory.jsx` responsible for UI orchestration only: export selected card script, trigger file input for current script import, render import errors, render change-summary confirmation, and apply parsed draft after confirmation.
* Use browser APIs for download and file reading; do not add an upload endpoint.
* Reuse or mirror existing admin workbench validation for imported drafts before applying them; final save/publish remains protected by current backend validation.
* Update tests around workbook mapping, import validation errors, and UI source-contract checks for export/import entry availability.
