# 修复服装与音乐按钮悬停卡顿

## Goal

消除部员手册中服装卡片“装扮”按钮和角色 BGM 播放按钮接近一秒才出现悬停反馈的问题，并把同类全屏实时模糊修复扩展到剧情引导与本地棋盘教学，同时保持现有颜色、位移、按压反馈和交互行为不变。

## Requirements

- 保留两个按钮现有的悬停位移、配色、阴影和按压视觉。
- 保留播放键、装扮键现有的按钮级悬停规则，不再叠加未经运行时证明的预绘、`will-change` 或 paint-containment 补丁。
- 角色详情与其他嵌套弹窗不再使用全屏实时 `backdrop-filter`；使用静态半透明遮罩维持前后景分离。
- 普通剧情与本地棋盘教学的全屏遮罩统一使用偏暖深梅黑静态填充，标准与 WebKit `backdrop-filter` 均为 `none`。
- 不改动服装装备请求、音乐播放逻辑或弹窗层级。
- 增加样式契约测试，禁止实时全屏模糊重新进入嵌套交互弹窗。

## Acceptance Criteria

- [x] 装扮按钮悬停保持原视觉反馈，不增加额外合成层。
- [x] 播放按钮悬停保持 `translateY(-1px)`、绿色键面和按压反馈，不增加第二个键面伪元素。
- [x] `.nested-modal-backdrop` 及其静态 `::before` 绘制层均为 `backdrop-filter: none`。
- [x] `.onboarding-story-backdrop` 与 `.tutorial-session-backdrop` 均使用 `rgba(35, 27, 31, 0.64)`，且不包含实时模糊。
- [x] 两个按钮的点击、禁用和按压行为不变。
- [x] 真实页面中播放键、装扮键的焦点反馈和服装弹窗关闭/焦点回退路径正常。
- [x] 相关样式与组件测试通过。
- [x] 若现有系统设计分篇记录了悬停性能约定，则同步更新并重新生成 `docs/system-design.html`。

## Definition of Done

- 只修改相关样式、契约测试和必要文档。
- 不覆盖或提交工作区中已有的其他未提交内容。
- 完成目标测试、lint 和适当范围的构建/文档验证。

## Technical Approach

恢复两个按钮原本的局部交互实现，删除没有改善用户体感的预绘键面、paint containment 和额外 `will-change`。根因修复位于共同祖先：`.nested-modal-backdrop` 及其绝对定位、`pointer-events: none` 的 `::before` 绘制层都显式禁用 `backdrop-filter`，后者只绘制静态半透明填充。剧情引导的普通对话与本地棋盘阶段分别由 `.onboarding-story-backdrop` 和 `.tutorial-session-backdrop` 负责，两者也显式禁用实时滤镜并使用同一深梅黑静态填充。这样 Chrome 不需要在详情页 hover/focus、逐字显示、选项悬停或教学棋盘更新时维持全屏实时背景采样。

## Decision (ADR-lite)

**Context**: 第一轮只改按钮，第二轮把 `blur(8px)` 移到静态伪元素；两轮静态测试均通过，但用户在 Chrome 中都没有感到改善。真实 Chrome 测量显示手册“设为出战”按钮从鼠标进入到样式变化约 3.8ms，详情播放键约 5.8ms，否定了事件、React 和 CSS 匹配延迟。两轮仍共同保留了全屏实时背景模糊，因此延迟位于 Chrome 栅格化/合成显示路径。

**Decision**: 完全移除嵌套弹窗的实时 `backdrop-filter`，以静态半透明填充替代；同时撤回无效的按钮级合成补丁。契约测试锁定父容器和绘制层都不得包含 `blur(...)`。

**Consequences**: 按钮动效、弹窗层级、剧情关闭确认与命中测试保持不变；背景从实时模糊改为静态半透明弱化。所有复用 `.nested-modal-backdrop` 的嵌套弹窗，以及普通剧情/本地教学两个全屏阶段，都避开相同的 Chrome 全屏实时滤镜成本。

## Out of Scope

- 重构全局按钮动效系统。
- 调整服装、音乐业务逻辑。
- 重构剧情引导之外、不使用 `.nested-modal-backdrop` 的其他弹窗。

## Technical Notes

- 全局污染来源：`src/styles/hud-components/pop-tech-terminal/interactive-motion.css`
- 服装按钮所有者：`src/styles/modals/character-opening/costume-wardrobe.css`
- 播放按钮所有者：`src/styles/modals/character-music-player/shell-title.css`
- 全屏模糊层：`src/styles/modals/terminal-system/replay-profile-surfaces.css`
- 修复前运行时确认两个按钮均继承 180ms 过渡，Bright School 下实际 `filter` 已经是 `none`；这否定了“按钮滤镜仍是主因”的判断。
- 最终实现要求 `.nested-modal-backdrop` 与 `::before` 的计算值都为 `backdrop-filter: none`；Bright School 使用静态深色半透明填充以凸显角色详情，普通主题保留原暗色半透明填充。
- 剧情引导普通对话与本地棋盘教学分别由 `.onboarding-story-backdrop`、`.tutorial-session-backdrop` 承担，两者使用 `rgba(35, 27, 31, 0.64)` 静态填充，并在 owner 与 Bright School 根覆盖层锁定无实时模糊。
