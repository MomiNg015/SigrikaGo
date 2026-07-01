# 扩大剧情教学自动流程图布局

## Goal

调整后台管理的剧情教学编辑器桌面布局，让自动流程图获得尽可能大的横向空间，减少分支泳道被右侧表单和预览栏挤压的问题。

## What I already know

- 用户希望“重排一下布局”，目标是尽可能扩大自动流程图宽度。
- 当前 `.admin-story-workbench-shell` 是三列：脚本库、主编辑、预览；主编辑里的 `.admin-story-workbench-content` 又是两列：流程图、问题/表单侧栏。
- 这个结构让流程图实际只占中间主编辑区的一部分宽度，复杂分支泳道仍容易需要横向滚动。
- 前一轮已经把流程图改为分支泳道，因此现在的主要瓶颈是页面布局分配，而不是图模型。
- 用户进一步确认：脚本库也可以挪到上面，优先让下方流程图拥有完整横向工作台宽度。

## Recommended Approach

采用“顶部脚本带 + 流程图优先工作区”：

- 外层工作台从三列改为上下分区：顶部是横向脚本库/脚本切换带，下方是主工作区。
- 顶部脚本库显示分组与脚本卡片，允许横向滚动或紧凑网格换行，不再占用左侧常驻列。
- 原右侧预览栏不再常驻占宽，改为主工作区下方/次级区域中的预览摘要与全屏预览入口。
- 主工作区内，脚本元信息在顶部，自动流程图独占一整行并尽量吃满剩余横向空间。
- 问题面板、当前步骤表单、预览摘要放在流程图下方的次级编辑区；它们可以按列排列，但不再压缩流程图。
- 桌面端优先；小屏断点沿用现有单列兜底，不专门做移动端重排。

## Alternative Approaches

### A. Top script strip + full-width flow (recommended)

- How: 调整 JSX 顺序和 CSS 布局，不改 React 状态和数据流；脚本库移到顶部横向带，预览迁入主工作区次级区，流程图独占主工作区上半区宽度。
- Pros: 最大化默认流程图宽度，复杂分支泳道可读性最好；脚本切换仍在第一屏可见。
- Cons: 脚本库从纵向列表变成横向/紧凑列表，一屏展示脚本数量可能变化。

### B. Flow-first stacked layout with left script library

- How: 仅把预览从外层右栏移走，保留左侧脚本库，流程图独占右侧主工作区宽度。
- Pros: 脚本库浏览体验变化小。
- Cons: 左侧脚本库仍固定占宽，流程图不如方案 A 宽。

### C. Add flow focus mode

- How: 增加“放大流程图”按钮，临时隐藏脚本库、表单和预览。
- Pros: 最大化查看能力。
- Cons: 需要新增模式状态和返回路径；编辑/看图之间来回切换，工作流更断裂。

## Requirements

- 默认桌面布局必须显著扩大自动流程图可用宽度。
- 脚本库从左侧常驻列改为顶部横向/紧凑脚本选择区，不再占用流程图左侧宽度。
- 自动流程图不再与当前步骤表单并排竞争同一行宽度。
- 全屏预览入口仍保留，且不应占用流程图右侧常驻列。
- 问题面板和当前步骤表单仍可点击定位/编辑，不改变已有数据流。
- 不引入拖拽、手动画线或新的图编辑模式。
- 不做移动端专门重排；现有窄屏兜底不能被破坏。

## Acceptance Criteria

- [ ] `.admin-story-workbench-shell` 桌面默认不再保留独立左侧脚本库列或右侧预览列。
- [ ] `.admin-story-workbench-library` 在桌面默认布局中位于顶部，脚本卡片可横向扫描/滚动或紧凑换行。
- [ ] `.admin-story-workbench-flow` 在主工作区内独占一整行，宽度接近“视口 - 工作台 padding”。
- [ ] 问题面板、步骤表单、预览摘要位于流程图下方的次级编辑区。
- [ ] 现有剧情教学编辑器测试仍通过。
- [ ] CSS 契约测试仍通过，不能新增 oversized CSS debt。
- [ ] `docs/system-design.md` 同步记录布局事实，并重新生成 `docs/system-design.html`。

## Out of Scope

- 不新增流程图 focus mode。
- 不新增可折叠侧栏。
- 不调整底层 `StoryScript` 数据模型。
- 不为移动端做新的专门布局设计。

## Technical Notes

- Relevant component: `src/admin/AdminOnboardingStory.jsx`
- Relevant styles: `src/styles/admin/story-workbench/shell.css`, `layout.css`, `forms-preview.css`, `flow/*`
- Existing flow graph derive logic can remain unchanged; this task is layout-first.
