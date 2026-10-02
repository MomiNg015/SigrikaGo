# 剧情对弈用户选项移入教学动作区

## Goal

剧情对弈引导出现 `player-choice` 时，保持棋盘完整、清晰、可判断；桌面端和竖屏移动端都将用户选项放进各自既有的教学动作区，不再用棋盘中央浮层和全屏暗幕遮挡局面。

## Requirements

- 桌面端把用户选项渲染到棋盘下方现有 `TutorialActionPanel` / `.tutorial-action-bar`。
- 移动端把用户选项渲染到现有“操作”页签面板，并保持至少 44px 的触摸目标。
- 删除用户选项出现时的全屏暗幕和棋盘中央绝对定位选项容器；NPC 对话气泡继续由现有 director 层负责。
- 用户选项出现时隐藏普通操作提示，把动作区空间让给选项，同时继续在逻辑上锁定不适用的棋盘操作。
- 单选项占满可用宽度；多选项在桌面端可换行/分栏，在移动端纵向排列并在动作面板内部安全滚动，不能覆盖或挤压棋盘。
- 选项文案允许多行换行，支持当前最长约 48 个字符的发布内容。
- 选项按钮使用内容驱动的自动高度；移动端普通动作按钮的固定 `46px` 高度合同不得命中 `.tutorial-choice-actions`，完整文案不能被按钮或文本层裁切。
- 移动端只让现有 `.mobile-tab-panel` 成为纵向滚动 owner；选项组自身不建立嵌套滚动区，并保留足够的底部内边距，使滚动到底时最后一个按钮完整可见。
- 选项组使用明确的可访问名称，选项出现后将键盘焦点移动到第一个可用选项；等待跳转时禁用重复输入。
- 保留现有浅绿色默认态、粉色按下态、Bright School hover/focus 视觉合同。
- 桌面端、竖屏移动端和短视口下棋盘几何保持不变。

## Acceptance Criteria

- [ ] 桌面端用户选项不与 `.board-wrap` 相交，并出现在棋盘下方教学动作栏。
- [ ] 390x844 竖屏下用户选项出现在“操作”面板，不与棋盘相交。
- [ ] 用户选项出现时不渲染 `.tutorial-battle-choice-scrim`。
- [ ] NPC 对话气泡、选项反馈音、错误重试和延迟跳转逻辑保持不变。
- [ ] 单个长选项、多选项、禁用态和焦点行为有自动化测试。
- [ ] 长选项按钮的高度为 `auto`，且移动端固定高度选择器明确排除选项组。
- [ ] 移动端多选项由 `.mobile-tab-panel` 单独滚动，选项组 `overflow` 可见，最后一个按钮在最大滚动位置完整可见。
- [ ] 现有 TutorialBattleScreen、主题合同、CSS 层级合同和构建检查通过。
- [ ] `docs/system-design/06-ui-theme-mobile.md` 同步新布局合同，并重新生成 `docs/system-design.html`。

## Definition of Done

- 相关组件、CSS、测试和系统设计文档已同步。
- 目标测试、lint、build、CSS 合同和系统设计生成通过。
- 未吸收或覆盖无关工作区改动。

## Technical Approach

- 将选项渲染职责从 `TutorialBattleDirector` 移入 `TutorialActionPanel`；director 只保留 NPC 气泡。
- 给 `TutorialActionPanel` 传入 `onChoice`，在 `choicesVisible && hasOptions` 分支渲染带可访问标签的选项组，而不是空动作栏。
- 用动作栏内部的布局修饰类处理单选、多选、长文案和移动端纵向排列；删除 choice overlay/scrim 的定位与动画合同。
- 通过 ref/effect 在选项首次可见时聚焦第一项，避免在重渲染或错误重试时反复抢焦点。
- 保持 `handleChoice`、反馈判定、聊天记录和 pending wait 的业务流程不变。

## Decision (ADR-lite)

**Context**: 棋盘中央选项和全屏暗幕会遮挡教学要求用户判断的局面；桌面和移动布局都已有专门动作区。

**Decision**: 统一把 `player-choice` 视为教学动作，在桌面棋盘下方动作栏和移动“操作”面板渲染。

**Consequences**: 棋盘始终可读，两个端的语义一致；动作栏需要承担多行文案和多选项布局，并在短视口中使用内部滚动保护棋盘。

## Out of Scope

- 不修改剧情脚本或 `StoryScript` 数据模型。
- 不重新设计 NPC 对话气泡、棋盘、玩家信息栏或普通对局动作栏。
- 不改变选项正确/错误判断、音效、延迟和剧情跳转逻辑。
- 不调整普通非对弈剧情窗口中的分支选项布局。

## Technical Notes

- 主要组件：`src/tutorial/TutorialBattleScreen.jsx`。
- 主要样式：`src/styles/room/tutorial-battle-screen/overlay-choice.css`、`actions-targets.css`、Bright School tutorial choice overrides。
- 主要测试：`src/tutorial/TutorialBattleScreen.test.jsx`、`src/room/RoomScreen.test.js`、`src/styles/themeContract.test.js`。
- 现有桌面实测：棋盘 `607x607`，动作栏 `654x64`；现选项横跨棋盘中央。
- 现有 390x844 竖屏实测：棋盘 `352x352`，操作面板 `376x121`；现选项位于棋盘中下部。
