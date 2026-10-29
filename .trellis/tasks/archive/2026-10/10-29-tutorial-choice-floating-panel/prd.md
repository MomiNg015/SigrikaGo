# 对弈引导选项改为右侧独立浮层

## Goal

改善对弈引导用户选项的视觉和移动端可见性，避免用户经常需要滑动才能看到部分选项。已通过 grill-me 收敛需求。样板评审后，用户明确要求恢复粗轮廓和硬阴影，并授权正式实装。

## 评审与实装交付

- 第二轮反馈：桌面剧情记录入口也移至 header 退出按钮左侧，打开后向下展开；手机选项需要明显区别于底层部件，保持不压暗和透明容器。
- 后续纠正：最终反馈以“还是粗轮廓加硬阴影吧”为准；浅绿实底搭配 3px 墨色轮廓和硬阴影。剧情记录按钮除颜色和图标外，应与旁边退出按钮保持相同尺寸、圆角、边框、阴影和按压反馈，桌面/手机一致遵循。

- 入口：`docs/design-samples/tutorial-choice-floating-2026-10-29/index.html`。
- 预览直接挂载正式 TutorialBattleScreen，示例文案走真实回答、重试和继续路径。
- 支持桌面、390×844、360×640 预览，额外验证 320×568；提供普通、长文案、多选项、单回答场景和重播、隐藏/显示、选择反馈。
- 根据实际短屏空间允许紧凑至 12px 字号、27px 按钮高度；此值用于体验评审，正式接入时可按反馈调整。
- 普通三选项在 360×640 及以上目标视口完整展示；320×568 或短屏多条长文案可能需要滚动兜底，保持棋盘不被遮挡和原布局不变。

## Confirmed Requirements

- 对弈功能区保留原用途，不再切换成用户选项区。
- 用户选项作为独立浮层从窗口右侧滑入。
- 入场时从上到下逐条从右侧滑入，各行仅短暂错峰，整组约 0.3 秒内出现，配合静态阶梯排列。（用户选择 A）
- 每行一个选项，选项之间有明显间隙。
- 选项采用等宽横条，文字左对齐，整组位于右侧；各行通过水平偏移形成阶梯错落感，不采用按文案长度变化的气泡宽度。（用户选择 A 并补充阶梯错落要求）
- 阶梯方向为从上到下逐级向右偏移：顶部选项较靠内，底部选项更靠窗口右侧；错位幅度克制，手机进一步缩小，优先保证文字完整与选项可见。（用户选择 B）
- 选项容器为透明背景，绝对定位，不占据文档流，不影响其他元素布局。
- 单个选项按钮采用浅绿色实底、粗轮廓和硬阴影；透明仅指整组容器，按钮不透出底层文字，确保覆盖我方信息或功能按钮时仍可清晰阅读。（用户选择 A）
- 取消用户选项出现时的全屏压暗，棋盘和背景保持原亮度；其他落子、技能教学步骤的聚焦提示维持原规则。（用户明确要求取消选项压暗）
- 移动端以竖屏为主：浮层位于棋盘下方右侧，不遮挡棋盘。
- 选项出现时允许临时覆盖功能按钮和我方信息；底层区域仍保留原位，棋盘必须完整可见。（用户先选择 A，随后明确允许覆盖我方信息，取代原先我方信息不可遮挡的限制）
- 移动端优先一次完整展示全部选项；可以适当加宽按钮以减少换行，也可以减小选项高度、内边距和字号，以尽量避免滚动。紧凑调整仍需保留可辨读文字、可操作的点击区域和明显行间隙，不截断或省略选项文案。
- 只有极小视口、较多选项或长文案经紧凑调整仍放不下时，才允许选项浮层内部滚动兜底；具体紧凑下限结合实际画面验证，不预设原有按钮高度或字号不可调整。
- 桌面端：浮层大致位于我方信息区下方。

## 实装前基线

- `src/tutorial/TutorialBattleScreen.jsx` 通过 `actionPanelOverride` / `TutorialActionPanel`，在选项可见且没有 continuation 时以 `TutorialChoiceActions` 替换正常动作区。
- `TutorialChoiceActions` 当前按节点显示选项，自动聚焦首个可用按钮，并使用 submitted 状态和 ref 防止重复提交。
- `src/styles/room/tutorial-battle-screen/actions-targets.css` 已允许移动端选项按钮随文案增高并纵向排列；现有方案仍依赖操作面板提供空间。
- `src/styles/mobile-adaptive/tutorial-arcade-controls.css` 进一步将移动端操作面板内的选项设为单列、自动高度和 overflow visible。
- 旧任务 `.trellis/tasks/08-27-tutorial-choice-action-panel/prd.md` 的设计将选项移入教学动作区；本次明确改变该布局方向。
- `.trellis/tasks/09-14-fix-mobile-tutorial-long-reply-height/prd.md` 要求长文案换行且完整可见；新浮层仍需处理长文本和小视口空间问题。
- `src/tutorial/tutorialActionState.js` 将单个且文案为“继续 / 立即继续”的选项映射为功能区继续按钮；普通回答选项才进入选项容器。默认保留此区分，不扩大本次范围。
- `src/tutorial/TutorialInputFocus.jsx` 当前在普通选项出现时使用 20% 黑色全屏遮罩，对选项按钮挖孔；本次实现需移除选项阶段的这条压暗路径，保留其他教学阶段的聚焦。

## Preserved Behavior

- 单个“继续 / 立即继续”仍使用功能区的继续按钮；普通回答即使只有一条也使用独立选项浮层。
- 沿用当前剧情节点对落子、技能和其他对弈动作的可用性限制，以及选项防重复提交、错误回答重试和分支跳转规则。

## Open Questions

主要产品需求已逐项确认，无阻塞问题。具体按钮宽度、字号下限、阶梯间距和位移量在实现阶段结合真实桌面与竖屏手机画面校准。

## Acceptance Criteria

- [x] 选项出现前后，棋盘、我方信息和功能区的布局位置不因选项挂载而改变。
- [x] 桌面和竖屏手机均显示独立单列、带行间隙的选项浮层。
- [x] 同组选项等宽、文字左对齐，从上到下逐级向右形成阶梯错落；手机减小错位，且任何选项不因错位越出可用视口。
- [x] 移动端浮层及其入场过程不遮挡棋盘。
- [x] 选项允许临时覆盖功能按钮和我方信息，且这些底层区域不因选项出现而卸载或改作选项容器。
- [x] 选项从窗口右侧滑入，容器无整体不透明背景。
- [x] 选项按从上到下短暂错峰的节奏滑入，整组约 0.3 秒内出现；不因选项数量增加造成长时间等待。
- [x] 选项按钮为浅绿色实底、粗轮廓和硬阴影，底层信息的文字不会透入按钮背景。
- [x] 用户选项出现时不触发全屏压暗；落子和技能等其他教学步骤的聚焦提示仍按原规则工作。
- [x] 手机常规选项优先一次完整展示；空间不足时先通过宽度、高度、内边距和字号的适当调整减少占用，仍放不下才启用浮层内部滚动。
- [x] 紧凑或滚动兜底下全部选项仍可达，完整文案可读，选项行间仍有明显间隙。
- [x] 单个“继续 / 立即继续”的功能区路径、普通单选项浮层、防重复提交、错误重试及分支跳转均保持正常。

## Technical Approach and Implementation Plan

1. 将普通回答选项从动作区替换逻辑中独立出来，挂载到对弈页面的绝对定位浮层；正常功能区持续保留，继续类按钮沿用已有规则。
2. 依据实际棋盘和我方信息区边界定位：移动端使用棋盘下方可用区域，桌面端以我方信息区下方为基准；约束选项及其进场轨迹不越入棋盘或视口外。
3. 在现有样式归属层实现浅绿实底、粗轮廓硬阴影、等宽阶梯、透明容器与错峰入场，清理依赖旧动作区结构的选项样式。优先扩大文字可用宽度、紧凑高度和字号，最后才启用浮层内部滚动；遵守减少动态效果设置。
4. 取消选项阶段的 input-focus 压暗，保留其他教学阶段和原交互状态机。
5. 完成针对性行为验证和桌面/移动端实际画面检查，覆盖 360×640 等短竖屏、常规手机、桌面、长文案与多选项；核对布局不跳动、无棋盘遮挡和紧凑兜底。
6. 实现完成后同步系统设计文档、相关契约和必要测试，运行相应质量检查及系统设计 HTML 生成。

## Definition of Done

- 需求问题逐项收敛，先完成 PRD。
- 实现阶段检查完整样式叠加后的桌面与移动端实际效果，并验证长文案、重复点击及节点切换。
- 实现影响运行行为和布局契约时，同步更新 `docs/system-design.md` / 对应分篇并运行 `npm run docs:system-design`。

## Out of Scope

- 后台剧情编辑器改版。
- 剧情内容、分支逻辑、对弈规则的变更。
- 无关工作区改动的整理或提交。

## Technical Notes

- 当前工作区在 master，存在其他未提交修改；后续变更需按本任务范围隔离。
- 前端规范入口 `.trellis/spec/frontend/index.md`；实现前重点加载 CSS architecture、quality guidelines、battle arcade controls 和 story guide layout 相关规范。

## Verification evidence

- 16 viewport/content combinations passed; 360×640 normal replies fit without scrolling.
- Wrong-answer retry, correct branch, native Continue, keyboard Enter and reduced motion passed.
- Existing 33 tutorial states and all guided-action transitions passed.
- Header log and Exit have identical geometry/feedback and vertical alignment at all four widths.
- Full suite: 474 files / 3453 tests passed; the only initial failure was stale generated system-design HTML. After regeneration, the documentation test and affected CSS/reply tests passed (27 tests). Lint, portrait validation, isolated admin snapshot, production build, built CSS and production configuration checks passed.
